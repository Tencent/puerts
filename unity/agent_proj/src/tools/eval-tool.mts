/**
 * Eval Tool for AI Agent
 * Allows the LLM to execute arbitrary JavaScript code in the PuerTS runtime.
 * Since PuerTS bridges JS and C#, the evaluated code can call Unity Engine APIs
 * via the CS global object and use PuerTS helpers (puer.$ref, puer.$generic, etc.).
 */
import { tool } from 'ai';
import { z } from 'zod';
import { executeCode, initBuiltins, builtinSummariesText } from '../../../ai_shared_src/eval-core.mjs';

// Re-export initBuiltins so that main.mts can continue importing it from here.
export { initBuiltins, builtinSummariesText };

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/**
 * Create eval tools that the agent can use to execute JS code at runtime.
 */
export function createEvalTools() {
    return {
        /**
         * Evaluate JavaScript code in the PuerTS runtime environment.
         */
        evalJsCode: tool({
            description:
                'Execute JavaScript code in a dedicated PuerTS runtime environment. ' +
                'This VM is separate from the main agent VM but is **reused across calls** — ' +
                'variables, functions, and state defined in previous calls persist and can be referenced in later calls.\n\n' +
                'The code runs inside Unity via PuerTS with full access to the `CS` and `puer` globals ' +
                '(see PuerTS interop rules and runtime environment notes in the system prompt).\n\n' +
                'Use this tool when you need to inspect or modify Unity scene objects, ' +
                'create/destroy GameObjects or Components, query hierarchies, ' +
                'execute Unity API calls dynamically, or test code snippets in the live environment.\n\n' +
                '**Code format**: Your code MUST be an async function declaration named `execute`, for example:\n' +
                '```\nasync function execute() {\n    // your logic here\n    return someValue;\n}\n```\n' +
                'Use `return <value>` inside the function to pass a result back — the returned value will appear in the `result` field of the response. ' +
                'If no `return` statement is used, `result` will be "(no return value)". ' +
                'You can return any value directly — objects, arrays, strings, numbers, etc. ' +
                'The system automatically serializes return values for you. ' +
                '**Do NOT call JSON.stringify() on your return value** — just return the object directly.\n\n' +
                'On success the response is `{ success: true, result: string }`. ' +
                'On failure the response is `{ success: false, error: string, stack: string }`.\n\n' +
                'Use console.log() for debug output (it goes to the Unity console).' +
                builtinSummariesText,
            inputSchema: z.object({
                code: z
                    .string()
                    .describe(
                        'An async function declaration named `execute`. ' +
                        'Example: "async function execute() {\\n  const go = CS.UnityEngine.GameObject.Find(\'Main Camera\');\\n  return go.transform.position.toString();\\n}"'
                    ),
                timeout: z
                    .number()
                    .optional()
                    .default(30)
                    .describe(
                        'Execution timeout in seconds. Default is 30s. ' +
                        'If the code does not finish within this time, the tool returns a timeout error. ' +
                        'You can then decide whether to retry or take a different approach.'
                    ),
            }),
            execute: async ({ code, timeout }) => {
                return await executeCode(code, timeout ?? 30);
            },
            // Convert eval output to model-friendly content.
            // When the executed code returns an object with an __image marker
            // (e.g. from the screenshot builtin), the image is included as
            // file-data so that handlePrepareStep can extract it and inject
            // it as a user-message image part for the LLM to see.
            toModelOutput({ output }: { output: any }) {
                if (!output.success) {
                    return {
                        type: 'text' as const,
                        value: `Error: ${output.error}${output.stack ? '\nStack: ' + output.stack : ''}`,
                    };
                }

                const result = output.result;

                // Recursively collect all __image markers from an object and
                // delete them from the source so they don't appear in the text.
                const images: Array<{ base64: string; mediaType: string }> = [];
                function collectAndStrip(obj: any, visited: Set<any>) {
                    if (!obj || typeof obj !== 'object') return;
                    if (visited.has(obj)) return;
                    visited.add(obj);
                    if (obj.__image && obj.__image.base64) {
                        images.push({
                            base64: obj.__image.base64,
                            mediaType: obj.__image.mediaType || 'image/png',
                        });
                        delete obj.__image;
                    }
                    for (const key of Object.keys(obj)) {
                        collectAndStrip(obj[key], visited);
                    }
                }

                // Serialize the result to text, extracting images from objects.
                let textContent: string;
                if (result === undefined) {
                    textContent = '(no return value)';
                } else if (result === null) {
                    textContent = 'null';
                } else if (typeof result === 'object') {
                    collectAndStrip(result, new Set());
                    try { textContent = JSON.stringify(result, null, 2); } catch (_) { textContent = String(result); }
                } else {
                    textContent = String(result);
                }

                if (images.length > 0) {
                    console.log(`[Eval] toModelOutput: including ${images.length} image(s)`);
                    return {
                        type: 'content' as const,
                        value: [
                            { type: 'text' as const, text: textContent },
                            ...images.map(img => ({
                                type: 'file-data' as const,
                                data: img.base64,
                                mediaType: img.mediaType,
                            })),
                        ],
                    };
                }

                return {
                    type: 'text' as const,
                    value: textContent,
                };
            },
        }),
    };
}
