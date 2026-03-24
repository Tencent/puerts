/**
 * Agent Core Module
 * Uses Vercel AI SDK to interact with LLM APIs.
 */
import { streamText, stepCountIs, type ModelMessage } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

import { createEvalTools } from '../tools/eval-tool.mjs';
import { createSkillTools } from '../tools/skill-tool.mjs';
import { buildSystemPrompt } from './prompt.mjs';
import { imageStore, stripOldUserImages, createRetrieveImageTool } from './image-store.mjs';
import {
    ENABLE_SLIDING_WINDOW, MAX_INPUT_TOKENS, MIN_KEEP_MESSAGES,
    estimateTokens, pruneOldToolOutputs, trimMessagesByTokenBudget,
    getHistorySummary, resetHistorySummary,
} from './compaction.mjs';



/**
 * AbortController for the current generation.
 * Created at the start of each runGeneration() call;
 * calling abortGeneration() triggers the signal so
 * streamText stops as soon as possible.
 */
let currentAbortController: AbortController | null = null;



/**
 * Maximum number of tool-call steps allowed per streamText invocation.
 * When this limit is reached, the agent is forced to produce a text-only
 * summary via an injected assistant message (à la opencode).
 * A value of 0 or negative means unlimited (capped at 9999 internally).
 */
let MAX_STEPS = 25;

const UNLIMITED_STEPS = 9999;

/**
 * Injected as a fake assistant message on the last step to force the model
 * to stop calling tools and produce a text summary instead.
 */
const MAX_STEPS_MESSAGE = `CRITICAL - MAXIMUM STEPS REACHED

The maximum number of steps allowed for this task has been reached. Tools are disabled. Respond with text only.

STRICT REQUIREMENTS:
1. Do NOT make any tool calls
2. MUST provide a text response summarizing work done so far

Response must include:
- Statement that maximum steps have been reached
- Summary of what has been accomplished so far
- List of any remaining tasks that were not completed
- Recommendations for what should be done next`;

// Agent configuration interface
export interface AgentConfig {
    apiKey: string;
    baseURL?: string;
    model?: string;
    /** Optional: a cheaper / faster model ID used for summarizing trimmed history.
     *  If not set, the main model is used. */
    summaryModel?: string;
    /** Maximum number of tool-call steps per generation.
     *  0 or negative means unlimited. Default: 25. */
    maxSteps?: number;
}



// Default configuration (system prompt is NOT part of the config — it is managed by TS only)
const DEFAULT_CONFIG: AgentConfig = {
    apiKey: '',
    model: 'gpt-4o-mini',
};

// Conversation history
let conversationHistory: ModelMessage[] = [];
let currentConfig: AgentConfig = { ...DEFAULT_CONFIG };
let isConfigured = false;



/**
 * Check whether a tool result output indicates success.
 * - If output is an object with a `success` boolean field, use it directly.
 * - If output is a string containing failure keywords, treat as failure.
 * - Otherwise assume success.
 */
function isToolResultSuccess(output: unknown): boolean {
    if (output != null && typeof output === 'object' && 'success' in (output as any)) {
        return !!(output as any).success;
    }
    if (typeof output === 'string') {
        const lower = output.toLowerCase();
        if (lower.includes('failed') || lower.includes('error')) {
            return false;
        }
    }
    return true;
}

/**
 * Extract an error message from a tool result output.
 */
function extractToolErrorMessage(output: unknown): string {
    if (output != null && typeof output === 'object') {
        const obj = output as any;
        if (obj.error) return String(obj.error);
        if (obj.message) return String(obj.message);
    }
    if (typeof output === 'string') {
        return output.length > 200 ? output.substring(0, 200) + '...' : output;
    }
    return 'Unknown error';
}







// ============================================================
// Agent API
// ============================================================

/**
 * Configure the agent with API credentials and settings.
 */
export function configure(config: Partial<AgentConfig>): string {
    currentConfig = { ...DEFAULT_CONFIG, ...config };

    if (!currentConfig.apiKey) {
        isConfigured = false;
        return '[Agent] Error: API key is required. Call configure({ apiKey: "your-key" }) first.';
    }

    // Apply maxSteps configuration
    if (config.maxSteps !== undefined) {
        if (config.maxSteps <= 0) {
            MAX_STEPS = UNLIMITED_STEPS;
            console.log(`[Agent] maxSteps set to unlimited (${UNLIMITED_STEPS})`);
        } else {
            MAX_STEPS = config.maxSteps;
            console.log(`[Agent] maxSteps set to ${MAX_STEPS}`);
        }
    }

    isConfigured = true;
    console.log(`[Agent] Configured with model: ${currentConfig.model}, baseURL: ${currentConfig.baseURL || 'default'}`);
    return `[Agent] Configured successfully. Model: ${currentConfig.model}, maxSteps: ${MAX_STEPS === UNLIMITED_STEPS ? 'unlimited' : MAX_STEPS}`;
}



// ============================================================
// Shared helpers for sendMessage
// ============================================================

/**
 * Create the full tool set used by the agent.
 */
function createToolSet() {
    return {
        ...createEvalTools(),
        ...createRetrieveImageTool(),
        ...createSkillTools(),
    };
}

/**
 * Create an OpenAI provider and chat model from the current config.
 */
function createModel() {
    const isGemini = currentConfig.model?.toLowerCase().includes('gemini');
    const provider = createOpenAICompatible({
        // When using Gemini, the provider name MUST be 'google' so that
        // thought_signature round-trips correctly. The SDK stores it under
        // providerMetadata[providerOptionsName] but the message converter
        // reads it back from providerOptions.google — they must match.
        name: isGemini ? 'google' : 'llm-provider',
        apiKey: currentConfig.apiKey,
        baseURL: currentConfig.baseURL || 'https://api.openai.com/v1',
        transformRequestBody: (body) => {
            if (!isGemini) return body;
            // Gemini (via proxy) rejects the $schema field in tool parameters
            if (body.tools && Array.isArray(body.tools)) {
                body.tools.forEach((tool: any) => {
                    if (tool.function?.parameters?.$schema) {
                        delete tool.function.parameters.$schema;
                    }
                });
            }

            return body;
        }
    });
    return provider.chatModel(currentConfig.model || 'gpt-4o-mini');
}

/**
 * onStepFinish callback for streamText.
 * Reports tool call results, reasoning/thinking content, and intermediate text to the UI via onProgress.
 */
function handleStepFinish(onProgress: ((text: string) => void) | undefined, stepResult: any): void {
    if (!onProgress) return;

    const { stepNumber, text, toolCalls, toolResults, finishReason } = stepResult;

    console.log(`[Agent] Step ${stepNumber} finished: finishReason=${finishReason}, text=${text?.length ?? 0} chars, toolCalls=${toolCalls?.length ?? 0}`);

    // Warn if the model output was truncated due to token limit
    if (finishReason === 'length') {
        console.warn(`[Agent] Step ${stepNumber} output was truncated (finishReason=length). The model hit max_tokens limit.`);
        onProgress(`\n<color=#FF9800>⚠ Output truncated — model reached token limit.</color>\n`);
    }

    const hasToolResults = toolResults && toolResults.length > 0;
    const hasToolCalls = toolCalls && toolCalls.length > 0;

    // Extract reasoning/thinking content if available
    // AI SDK may expose it via reasoning, reasoningText, or providerMetadata
    const rawReasoning = stepResult.reasoning || stepResult.reasoningText;
    if (rawReasoning) {
        // reasoning may be a string, an array of {type,text} parts, or an object — normalize to string
        let reasoningStr: string;
        if (typeof rawReasoning === 'string') {
            reasoningStr = rawReasoning;
        } else if (Array.isArray(rawReasoning)) {
            reasoningStr = rawReasoning.map((part: any) => (typeof part === 'string' ? part : part?.text ?? '')).join('');
        } else if (typeof rawReasoning === 'object' && rawReasoning.text) {
            reasoningStr = rawReasoning.text;
        } else {
            reasoningStr = JSON.stringify(rawReasoning);
        }
        if (reasoningStr) {
            const truncated = reasoningStr.length > 800 ? reasoningStr.substring(0, 800) + '...' : reasoningStr;
            onProgress(`\n<color=#B39DDB>[THINKING]</color>\n${truncated}\n`);
        }
    }

    let progressText = '';
    if (hasToolResults) {
        for (const tr of toolResults) {
            const ok = isToolResultSuccess(tr.output);
            if (ok) {
                progressText += `\n<color=#FFA726>[CALL]</color>  ${tr.toolName} <color=#4CAF50>[OK]</color>\n`;
            } else {
                const errMsg = extractToolErrorMessage(tr.output);
                progressText += `\n<color=#FFA726>[CALL]</color>  ${tr.toolName} <color=#F44336>[FAIL]</color>: ${errMsg}\n`;
            }
        }
    } else if (hasToolCalls) {
        for (const tc of toolCalls) {
            progressText += `\n<color=#FFA726>[CALL]</color> ${tc.toolName}\n`;
        }
    }

    if (progressText) {
        onProgress(progressText);
    }
}

/**
 * prepareStep callback for streamText.
 * Handles big-string compression, sliding-window trimming,
 * and screenshot image extraction.
 */
function handlePrepareStep({ messages, stepNumber, steps }: any): any {
    if (stepNumber === 0) return undefined;

    // ---- Max steps: inject assistant message and remove tools on last step ----
    // stepNumber is 0-indexed and prepareStep runs at the *start* of each step,
    // so the maximum stepNumber we ever see is MAX_STEPS.
    // We fire on that step to inject the stop message and disable tools; the model
    // will then produce a pure-text response, and the do-while loop exits naturally
    // because there are no further tool calls.
    const isLastStep = stepNumber >= MAX_STEPS;

    // ---- Diagnostic: log message identities to check if AI SDK rebuilds them ----
    const lastFew = messages.slice(-3).map((m: any, i: number) => {
        const role = m.role || '?';
        const contentPreview = typeof m.content === 'string'
            ? m.content.substring(0, 40)
            : (Array.isArray(m.content) ? `[${m.content.length} parts]` : '?');
        return `${role}:${contentPreview}`;
    });
    console.log(`[Agent] prepareStep(${stepNumber}): ${messages.length} msgs, last3=[${lastFew.join(' | ')}]`);

    let newMessages = messages;
    let disableTools = false;

    // ---- (1) Extract screenshot images from the last tool message ----
    const lastMsg = newMessages[newMessages.length - 1];
    if (lastMsg && lastMsg.role === 'tool') {
        const imageParts: Array<any> = [];
        const patchedContent: any[] = [];

        for (const part of lastMsg.content as any[]) {
            if (
                part.type === 'tool-result' &&
                part.output?.type === 'content' &&
                Array.isArray(part.output.value)
            ) {
                const textItems: any[] = [];
                for (const item of part.output.value) {
                    if (item.type === 'file-data' && item.mediaType?.startsWith('image/')) {
                        imageParts.push({
                            type: 'image' as const,
                            image: item.data,
                            mediaType: item.mediaType,
                        });
                    } else {
                        textItems.push(item);
                    }
                }

                if (imageParts.length > 0) {
                    patchedContent.push({
                        ...part,
                        output: textItems.length > 0
                            ? { type: 'content' as const, value: textItems }
                            : { type: 'text' as const, value: textItems.map((t: any) => t.text || '').join('\n') || 'Screenshot captured.' },
                    });
                } else {
                    patchedContent.push(part);
                }
            } else {
                patchedContent.push(part);
            }
        }

        if (imageParts.length > 0) {
            console.log(`[Agent] prepareStep(${stepNumber}): injecting ${imageParts.length} screenshot image(s) as user message`);
            // Mutate the tool message in-place so the AI SDK's internal reference
            // is also updated, preventing the same base64 from reappearing in later steps.
            lastMsg.content = patchedContent; // 删除了原有的工具里的base64
            newMessages.push({
                role: 'user',
                content: [
                    ...imageParts,
                    {
                        type: 'text' as const,
                        text: 'Above is the screenshot I just captured. Please analyze it and respond to my earlier request.',
                    },
                ],
            } as any);// 由于handlePrepareStep传入下消息是由const stepInputMessages = [...initialMessages, ...responseMessages];拼接出来的，所有这里并不会影响到initialMessages，responseMessages
            // 发完就没有了
            // 所以截图工具的base64不会被压缩
        }
    }

    // ---- (2) If last step, inject max-steps message and mark tools for disabling ----
    if (isLastStep) {
        console.log(`[Agent] prepareStep(${stepNumber}): MAX_STEPS reached, injecting stop message and disabling tools.`);
        newMessages = newMessages === messages ? [...messages] : newMessages;
        newMessages.push({
            role: 'user' as const,
            content: MAX_STEPS_MESSAGE,
        });
        disableTools = true;
    }

    // ---- (3) Sliding window: check token budget AFTER all message injections ----
    // This ensures that any messages added above (screenshots, max-steps) are
    // included in the token budget check.
    if (ENABLE_SLIDING_WINDOW) {
        // 工具的调用过程中也可能产生token超标的情况，如果超了，会prune，还超就emergency trim，而prepareHistory是prune+compaction
        const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
        const lastInputTokens = lastStep?.usage?.inputTokens;
        const overBudget = lastInputTokens
            ? lastInputTokens > MAX_INPUT_TOKENS
            : estimateTokens(newMessages) > MAX_INPUT_TOKENS;

        if (overBudget) {
            const source = lastInputTokens ? `actual ${lastInputTokens}` : `estimated ${estimateTokens(newMessages)}`;
            console.log(`[Agent] prepareStep(${stepNumber}): ${source} tokens exceeds ${MAX_INPUT_TOKENS}`);

            // Phase 1: prune old tool outputs (synchronous, no LLM call)
            const prunedTokens = pruneOldToolOutputs(newMessages);
            if (prunedTokens > 0) {
                console.log(`[Agent] prepareStep(${stepNumber}): pruned ~${prunedTokens} tokens from old tool outputs`);
            }

            // Re-check after pruning
            const afterPrune = estimateTokens(newMessages);
            if (afterPrune > MAX_INPUT_TOKENS) {
                // Phase 2: emergency trim (synchronous — cannot call async compaction here)
                console.log(`[Agent] prepareStep(${stepNumber}): still ${afterPrune} tokens after pruning, emergency trim...`);
                const keep = Math.min(MIN_KEEP_MESSAGES, newMessages.length);
                const trimmedMsgs = newMessages.slice(newMessages.length - keep);
                const summary = getHistorySummary();
                if (summary) {
                    trimmedMsgs.unshift({
                        role: 'user' as const,
                        content: `[Compacted Context — this is a structured summary of earlier conversation that was compacted to save context space]:\n${summary}`,
                    } as any);
                }
                newMessages = trimmedMsgs;
                console.log(`[Agent] prepareStep(${stepNumber}): trimmed to ${newMessages.length} messages`);
            }
        }
    }

    // ---- Return result ----
    const modified = newMessages !== messages;
    if (disableTools) {
        return { messages: newMessages, tools: {} };
    }
    return modified ? { messages: newMessages } : undefined;
}



/**
 * Compress history and apply sliding-window trimming.
 * Shared pre-processing for sendMessage.
 */
async function prepareHistory(): Promise<void> {
    stripOldUserImages(conversationHistory);

    if (ENABLE_SLIDING_WINDOW) {
        const estimated = estimateTokens(conversationHistory);
        if (estimated > MAX_INPUT_TOKENS) {
            const { messages: trimmed, trimmed: didTrim } = await trimMessagesByTokenBudget(
                conversationHistory, MAX_INPUT_TOKENS, currentConfig,
            );
            if (didTrim) {
                conversationHistory = trimmed as ModelMessage[];
            }
        }
    }
}

/**
 * Core generation logic shared by sendMessage.
 * Calls streamText, appends response messages to history, handles errors.
 *
 * @param onProgress  Optional progress callback for the UI.
 * @returns The assistant's text response.
 */
async function runGeneration(onProgress?: (text: string) => void): Promise<string> {
    // Create a fresh AbortController for this generation
    currentAbortController = new AbortController();
    const abortSignal = currentAbortController.signal;

    try {
        const model = createModel();
        const tools = createToolSet();

        const result = streamText({
            model,
            system: buildSystemPrompt(imageStore.imagePrefix),
            messages: conversationHistory,
            tools,
            abortSignal,
            maxOutputTokens: 32768,
            // Use MAX_STEPS + 1 so the SDK does not exit the loop before our
            // prepareStep hook has a chance to inject the stop message on the
            // last allowed tool-call step.  The actual limit is enforced by
            // disabling tools in prepareStep when stepNumber >= MAX_STEPS - 1.
            stopWhen: stepCountIs(MAX_STEPS + 1),
            onStepFinish: (stepResult) => handleStepFinish(onProgress, stepResult),
            prepareStep: handlePrepareStep,
        });

        let fullText = '';
        for await (const textPart of result.textStream) {
            fullText += textPart;
            if (onProgress) {
                onProgress(textPart);
            }
        }

        console.log(`[Agent] textStream ended. fullText length: ${fullText.length}`);

        // Append all response messages (assistant + tool) to conversation history
        const response = await result.response;
        for (const msg of response.messages) {
            conversationHistory.push(msg as ModelMessage);
        }

        return fullText;
    } catch (error: any) {
        // Check if the error is an abort
        if (abortSignal.aborted) {
            console.log('[Agent] Generation was aborted by user.');
            // Keep the user message in history (don't pop) so context is preserved
            return '[Agent] Generation stopped by user.';
        }

        const errorMsg = `[Agent] Error: ${error.message || String(error)}`;
        console.error(errorMsg);

        // Remove the last user message from history on failure
        conversationHistory.pop();

        return errorMsg;
    } finally {
        currentAbortController = null;
    }
}

/**
 * Send a message to the LLM and get a response.
 * This is the main async function called from C#.
 *
 * Uses maxSteps for automatic tool-call looping. A prepareStep hook
 * intercepts screenshot images from tool results and re-injects them
 * as user-message image parts, because the Chat Completions API
 * converter only JSON.stringifies tool-result content (no image_url).
 */
export async function sendMessage(userMessage: string, imageBase64?: string, imageMimeType?: string, onProgress?: (text: string) => void): Promise<string> {
    if (!isConfigured || !currentConfig.apiKey) {
        return '[Agent] Not configured. Please set API key first via the Settings panel.';
    }

    // Add user message to history FIRST (so that prepareHistory can see the
    // latest user message when deciding which images to strip).
    if (imageBase64 && imageMimeType) {
        console.log(`[Agent] Message includes attached image (${imageMimeType}, ${imageBase64.length} base64 chars)`);
        conversationHistory.push({
            role: 'user',
            content: [
                {
                    type: 'image' as const,
                    image: imageBase64,
                    mediaType: imageMimeType,
                } as any,
                {
                    type: 'text' as const,
                    text: userMessage,
                },
            ],
        });
    } else {
        conversationHistory.push({
            role: 'user',
            content: userMessage,
        });
    }

    // Compress & trim history (after push so stripOldUserImages sees the new user msg)
    await prepareHistory();

    return runGeneration(onProgress);
}

/**
 * Abort the current in-flight generation, if any.
 * Safe to call even when no generation is running.
 */
export function abortGeneration(): void {
    if (currentAbortController) {
        console.log('[Agent] Aborting current generation...');
        currentAbortController.abort();
    } else {
        console.log('[Agent] No generation in progress to abort.');
    }
}

/**
 * Clear conversation history.
 */
export function clearHistory(): void {
    conversationHistory = [];
    imageStore.clear();
    resetHistorySummary();
    console.log('[Agent] Conversation history cleared.');
}

/**
 * Get the current conversation history length.
 */
export function getHistoryLength(): number {
    return conversationHistory.length;
}

/**
 * Check if the agent is configured.
 */
export function getIsConfigured(): boolean {
    return isConfigured;
}
