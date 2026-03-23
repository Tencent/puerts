/**
 * Compaction Module
 * Handles context compression, token estimation, tool output pruning,
 * structured summarization (compaction), and sliding-window trimming.
 */
import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

import type { AgentConfig } from './agent-core.mjs';

// ============================================================
// Constants
// ============================================================

/**
 * SLIDING WINDOW TOGGLE
 * Set to `false` to completely disable the sliding-window
 * context management (automatic message trimming &
 * history summarization). Useful for debugging.
 */
export const ENABLE_SLIDING_WINDOW = true;

/**
 * Approximate ratio of characters to tokens for English/code mixed content.
 * Used as a fallback when precise token counts are unavailable.
 */
const CHARS_PER_TOKEN = 4;

/**
 * Maximum input token budget. When the estimated (or actual) input token count
 * exceeds this value, older messages are trimmed.
 * Default: 600 000 tokens (safe for most 1M-context models).
 */
export const MAX_INPUT_TOKENS = 600_000;

/**
 * Minimum number of recent messages to always keep, even during aggressive trimming.
 * This protects the current user request + the most recent assistant/tool exchanges.
 */
export const MIN_KEEP_MESSAGES = 6;

/**
 * Character budget for the compaction summary.
 * Increased to preserve more structured context.
 */
const SUMMARY_MAX_CHARS = 4000;

/**
 * Minimum token savings required before actually pruning tool outputs.
 * Avoids pruning when the savings would be negligible.
 */
const PRUNE_MINIMUM = 20_000;

/**
 * Token budget of recent tool outputs to protect from pruning.
 * Tool results within this budget (counting from the most recent) are kept intact.
 */
const PRUNE_PROTECT = 40_000;

// ============================================================
// History summary state
// ============================================================

/**
 * Stores the summary of previously trimmed messages, if any.
 * This is prepended to the messages when sending to the LLM so the agent
 * doesn't completely "forget" earlier context.
 */
let historySummary: string | null = null;

/** Get the current history summary. */
export function getHistorySummary(): string | null {
    return historySummary;
}

/** Reset the history summary (e.g. when clearing history). */
export function resetHistorySummary(): void {
    historySummary = null;
}

// ============================================================
// Token estimation helpers
// ============================================================

/**
 * Estimate the token count for a messages array by serializing to JSON
 * and dividing by CHARS_PER_TOKEN.
 */
export function estimateTokens(messages: any[]): number {
    let totalChars = 0;
    for (const msg of messages) {
        totalChars += JSON.stringify(msg).length;
    }
    return Math.ceil(totalChars / CHARS_PER_TOKEN);
}

/**
 * Estimate the token count for a single value by JSON-serializing it.
 */
function estimateTokensSingle(value: unknown): number {
    try {
        return Math.ceil(JSON.stringify(value).length / CHARS_PER_TOKEN);
    } catch {
        return 0;
    }
}

// ============================================================
// Prune old tool outputs (inspired by opencode's prune mechanism)
// ============================================================

/**
 * Walk backwards through messages and replace old tool-call outputs with
 * a short placeholder. The most recent tool outputs (within PRUNE_PROTECT
 * budget) are kept intact. Only outputs older than that are pruned.
 *
 * This dramatically reduces token usage before compaction runs, while
 * preserving recent tool context the model likely still needs.
 *
 * @returns The number of tokens reclaimed by pruning.
 */
export function pruneOldToolOutputs(messages: any[]): number {
    let total = 0;
    let pruned = 0;
    const toPrune: Array<{ msg: any; partIndex: number; estimate: number }> = [];

    // Walk backwards, skip the last 2 messages (current user turn + last assistant)
    for (let msgIdx = messages.length - 1; msgIdx >= 0; msgIdx--) {
        const msg = messages[msgIdx] as any;

        // For tool-role messages, each content part may be a tool-result
        if (msg.role === 'tool' && Array.isArray(msg.content)) {
            for (let partIdx = msg.content.length - 1; partIdx >= 0; partIdx--) {
                const part = msg.content[partIdx];
                if (part?.type === 'tool-result') {
                    const estimate = estimateTokensSingle(part.output);
                    total += estimate;
                    if (total > PRUNE_PROTECT) {
                        pruned += estimate;
                        toPrune.push({ msg, partIndex: partIdx, estimate });
                    }
                }
            }
        }

        // For assistant messages with tool_calls results embedded
        if (msg.role === 'assistant' && Array.isArray(msg.content)) {
            for (let partIdx = msg.content.length - 1; partIdx >= 0; partIdx--) {
                const part = msg.content[partIdx];
                if (part?.type === 'tool-result') {
                    const estimate = estimateTokensSingle(part.output);
                    total += estimate;
                    if (total > PRUNE_PROTECT) {
                        pruned += estimate;
                        toPrune.push({ msg, partIndex: partIdx, estimate });
                    }
                }
            }
        }
    }

    if (pruned < PRUNE_MINIMUM) {
        return 0; // Not enough savings to bother
    }

    // Actually prune
    for (const { msg, partIndex } of toPrune) {
        const part = msg.content[partIndex];
        const toolName = part.toolName || 'unknown';
        part.output = { type: 'text' as const, value: `[output pruned — tool: ${toolName}]` };
    }

    console.log(`[Agent] Pruned ${toPrune.length} old tool output(s), reclaimed ~${pruned} tokens`);
    return pruned;
}

// ============================================================
// Context compaction (structured summarization)
// ============================================================

/** The structured prompt template for compaction, adapted for Unity dev context. */
const COMPACTION_PROMPT = `Provide a detailed summary for continuing our conversation.
Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files/GameObjects we're working on, and what we're going to do next.
The summary will be used so that another agent can read it and continue the work seamlessly.

When constructing the summary, follow this template:
---
## Goal

[What goal(s) is the user trying to accomplish?]

## Instructions

- [What important instructions did the user give that are relevant]
- [If there is a plan or spec, include information about it]

## Discoveries

[What notable things were learned during this conversation — e.g. scene hierarchy, component states, API behaviors, errors encountered and their fixes]

## Accomplished

[What work has been completed, what work is still in progress, and what work is left?]

## Relevant Context

[List relevant GameObjects, scripts, scenes, assets, tool outputs, or code snippets that pertain to the task. Include specific names and paths.]
---

Keep the summary under ${SUMMARY_MAX_CHARS} characters. Write in the same language the user used.`;

/**
 * Build a text representation of messages for the compaction model.
 * Strips images but preserves tool call names and text content.
 */
function buildCompactionInput(messages: any[]): string {
    let text = '';
    for (const msg of messages) {
        const role = (msg as any).role || 'unknown';
        let msgText = '';
        const content = (msg as any).content;
        if (typeof content === 'string') {
            msgText = content;
        } else if (Array.isArray(content)) {
            for (const part of content) {
                if (typeof part === 'string') {
                    msgText += part + '\n';
                } else if (part?.type === 'text' && part.text) {
                    msgText += part.text + '\n';
                } else if (part?.type === 'tool-call') {
                    msgText += `[Tool call: ${part.toolName}(${JSON.stringify(part.args || {}).substring(0, 200)})]\n`;
                } else if (part?.type === 'tool-result') {
                    const output = typeof part.output === 'string'
                        ? part.output
                        : JSON.stringify(part.output || '');
                    const truncOutput = output.length > 500 ? output.substring(0, 500) + '...' : output;
                    msgText += `[Tool result: ${part.toolName} → ${truncOutput}]\n`;
                }
            }
        }
        // Truncate extremely long individual messages
        if (msgText.length > 2000) {
            msgText = msgText.substring(0, 2000) + '... (truncated)';
        }
        text += `[${role}]: ${msgText}\n`;
    }

    // Limit total input to the compaction model
    if (text.length > 40000) {
        text = text.substring(0, 40000) + '\n... (further content omitted)';
    }
    return text;
}

/**
 * Generate a structured compaction summary from an array of messages.
 * Uses the compaction prompt template inspired by opencode.
 * Returns the summary string, or null if compaction fails.
 */
async function compactMessages(messages: any[], config: AgentConfig): Promise<string | null> {
    try {
        const provider = createOpenAICompatible({
            name: 'compaction-provider',
            apiKey: config.apiKey,
            baseURL: config.baseURL || 'https://api.openai.com/v1',
        });

        const modelId = config.summaryModel || config.model || 'gpt-4o-mini';
        const model = provider.chatModel(modelId);

        const conversationText = buildCompactionInput(messages);

        const result = await generateText({
            model,
            system: COMPACTION_PROMPT,
            prompt: conversationText,
            maxRetries: 1,
        });

        const summary = result.text?.trim();
        if (summary && summary.length > 0) {
            console.log(`[Agent] Generated compaction summary (${summary.length} chars)`);
            return summary;
        }
    } catch (err: any) {
        console.error(`[Agent] Failed to generate compaction summary: ${err.message || err}`);
    }
    return null;
}

// ============================================================
// Sliding window with prune + compaction
// ============================================================

/**
 * Trim a messages array so that the estimated token count is within budget.
 * Uses a two-phase approach inspired by opencode:
 *
 * Phase 1 — **Prune**: Walk backwards and replace old tool-call outputs
 *   with short placeholders, keeping only the most recent tool results intact.
 *   This alone often frees enough tokens.
 *
 * Phase 2 — **Compact**: If still over budget after pruning, remove older
 *   messages and generate a structured compaction summary via the LLM.
 *
 * @param messages    The full messages array (mutated in-place for pruning)
 * @param tokenBudget Maximum tokens allowed
 * @param config      Agent configuration (needed for compaction LLM call)
 * @returns The trimmed messages array (may include a compaction summary at the start)
 */
export async function trimMessagesByTokenBudget(
    messages: any[],
    tokenBudget: number,
    config: AgentConfig,
): Promise<{ messages: any[]; trimmed: boolean }> {
    let estimated = estimateTokens(messages);
    if (estimated <= tokenBudget) {
        return { messages, trimmed: false };
    }

    console.log(`[Agent] Token estimate ${estimated} exceeds budget ${tokenBudget}`);

    // ---- Phase 1: Prune old tool outputs in-place ----
    const prunedTokens = pruneOldToolOutputs(messages);
    if (prunedTokens > 0) {
        estimated = estimateTokens(messages);
        console.log(`[Agent] After pruning: ~${estimated} tokens`);
        if (estimated <= tokenBudget) {
            return { messages, trimmed: true };
        }
    }

    // ---- Phase 2: Compact — remove old messages + structured summary ----
    console.log(`[Agent] Still over budget after pruning, running compaction...`);

    // Find how many messages to keep from the end
    let keepFromEnd = Math.min(MIN_KEEP_MESSAGES, messages.length);
    const targetTokens = tokenBudget * 0.75; // trim to 75% to leave room for the summary

    while (keepFromEnd < messages.length) {
        const candidate = messages.slice(messages.length - keepFromEnd);
        if (estimateTokens(candidate) > targetTokens) {
            keepFromEnd = Math.max(keepFromEnd - 1, MIN_KEEP_MESSAGES);
            break;
        }
        keepFromEnd++;
    }

    const keptMessages = messages.slice(messages.length - keepFromEnd);
    const removedMessages = messages.slice(0, messages.length - keepFromEnd);

    console.log(`[Agent] Compaction: removing ${removedMessages.length} messages, keeping ${keptMessages.length}`);

    // Build input for compaction, including any previous summary
    let summaryMsg: any | null = null;
    if (removedMessages.length > 0) {
        const toCompact = historySummary
            ? [{ role: 'user', content: `[Previous compaction summary]:\n${historySummary}` }, ...removedMessages]
            : removedMessages;

        const summary = await compactMessages(toCompact, config);
        if (summary) {
            historySummary = summary;
            summaryMsg = {
                role: 'user' as const,
                content: `[Compacted Context — this is a structured summary of earlier conversation that was compacted to save context space]:\n${summary}`,
            };
        }
    }

    const result = summaryMsg ? [summaryMsg, ...keptMessages] : keptMessages;
    return { messages: result, trimmed: true };
}
