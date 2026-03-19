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
                'Objects are serialized via JSON.stringify; primitives are converted to strings.\n\n' +
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
            }),
            execute: async ({ code }) => {
                return await executeCode(code);
            },
            // Convert eval output to model-friendly content.
            // When the executed code returns an object with an __image marker
            // (e.g. from the screenshot builtin), the image is included as
            // file-data so that handlePrepareStep can extract it and inject
            // it as a user-message image part for the LLM to see.
            toModelOutput({ output }: { output: any }) {
                const textContent = output.success
                    ? output.result
                    : `Error: ${output.error}${output.stack ? '\nStack: ' + output.stack : ''}`;

                if (output.success && output.__image) {
                    return {
                        type: 'content' as const,
                        value: [
                            { type: 'text' as const, text: textContent },
                            {
                                type: 'file-data' as const,
                                data: output.__image.base64,
                                mediaType: output.__image.mediaType || 'image/png',
                            },
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
