// LLM Agent Entry Module

console.log("[Agent] LLM Agent initialized.");

/**
 * LLM Agent Entry Module
 * This is the main entry point loaded by PuerTS.
 */
import './polyfills/streams-polyfill.mjs';
import './polyfills/fetch-polyfill.mjs';
import {
    configure,
    sendMessage,
    abortGeneration,
    clearHistory,
    getHistoryLength,
    getIsConfigured,
} from './agent/agent-core.mjs';
import { setResourceRoot } from './resource-root.mjs';
import { initSystemPrompt } from './agent/prompt.mjs';
import { initSkills } from './tools/skill-tool.mjs';
import { initBuiltins } from './tools/eval-tool.mjs';

// Start capturing Unity logs for the agent's log tool
CS.LLMAgent.UnityLogBridge.StartListening();

console.log('[Agent] LLM Agent module loaded.');

/**
 * Configure the agent with API settings.
 * Called from C# side.
 */
export function configureAgent(
    apiKey: string,
    baseURL: string,
    model: string,
    maxSteps: number = 0
): string {
    return configure({
        apiKey,
        baseURL: baseURL || undefined,
        model: model || undefined,
        maxSteps: maxSteps,
    });
}

/**
 * Handle incoming user message with direct callback pattern.
 * C# passes an Action<string, bool> callback directly, TS calls callback() when done.
 *
 * @param message - User input text
 * @param callback - C# Action<string, bool> callback to invoke with (response, isError)
 */
export function onMessageReceived(message: string, imageBase64: string, imageMimeType: string, callback: CS.System.Action$2<string, boolean>, progressCallback?: CS.System.Action$1<string>): void {
    console.log(`[Agent] User said: ${message}${imageBase64 ? ' (with image)' : ''}`);

    if (!getIsConfigured()) {
        // Immediately callback with error
        callback.Invoke!('[Agent] Not configured. Please set your API key in Settings.', false);
        return;
    }

    // Build progress handler from C# callback
    const onProgress = progressCallback ? (text: string) => {
        try {
            progressCallback.Invoke!(text);
        } catch (e) {
            console.error(`[Agent] Progress callback error: ${e}`);
        }
    } : undefined;

    // Fire and forget - the async operation will call back when done
    sendMessage(message, imageBase64 || undefined, imageMimeType || undefined, onProgress)
        .then((response: string) => {
            callback.Invoke!(response, false);
        })
        .catch((error: any) => {
            const errorMsg = `[Agent] Error: ${error.message || String(error)}`;
            console.error(errorMsg);
            callback.Invoke!(errorMsg, true);
        });
}

/**
 * Synchronous message handler for simple echo/test (no LLM call).
 * Called from C# side.
 */
export function onMessageSync(message: string): string {
    if (!getIsConfigured()) {
        return '[Agent] Not configured. Please set your API key in Settings.';
    }
    return `[Echo] ${message}`;
}

/**
 * Abort the current in-flight generation.
 * Called from C# side when the user clicks Stop.
 */
export function onAbortGeneration(): void {
    abortGeneration();
}

/**
 * Clear conversation history.
 * Called from C# side.
 */
export function onClearHistory(): void {
    clearHistory();
}

/**
 * Get conversation history length.
 * Called from C# side.
 */
export function onGetHistoryLength(): number {
    return getHistoryLength();
}

/**
 * Check if agent is configured.
 * Called from C# side.
 */
export function onIsConfigured(): boolean {
    return getIsConfigured();
}

/**
 * Initialize resource-dependent modules (builtins, skills, etc.).
 * C# calls this once at startup with the Resources path prefix and a completion callback.
 * The callback is invoked after all async initialization finishes.
 * @param root - Unity Resources path prefix, e.g. "LLMAgent/editor-assistant"
 * @param onReady - C# Action callback invoked when initialization is complete
 */
export function onInitialize(root: string, onReady: CS.System.Action): void {
    setResourceRoot(root);

    // Async initialization — load system prompt, builtins (supports top-level await) then skills
    (async () => {
        try {
            initSystemPrompt();
            await initBuiltins();
            initSkills();
            console.log('[Agent] Resource initialization complete.');
        } catch (e: any) {
            console.error(`[Agent] Initialization error: ${e.message || e}`);
        } finally {
            onReady.Invoke!();
        }
    })();
}
