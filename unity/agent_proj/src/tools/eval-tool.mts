/**
 * Eval Tool for AI Agent
 * Allows the LLM to execute arbitrary JavaScript code in the PuerTS runtime.
 * Since PuerTS bridges JS and C#, the evaluated code can call Unity Engine APIs
 * via the CS global object and use PuerTS helpers (puer.$ref, puer.$generic, etc.).
 */
import { tool } from 'ai';
import { z } from 'zod';
import { getResourceRoot } from '../resource-root.mjs';

// ---------------------------------------------------------------------------
// Eval VM & Builtins state (lazily initialised via initBuiltins)
// ---------------------------------------------------------------------------

/** The eval VM instance. Created once in initBuiltins(). */
let jsEnv: CS.Puerts.ScriptEnv | null = null;

/** Builtins helper module summaries, populated by initBuiltins(). */
export let builtinSummariesText: string = '';

/**
 * Get or create the eval VM.
 */
function getJsEnv(): CS.Puerts.ScriptEnv {
    if (!jsEnv) {
        jsEnv = CS.LLMAgent.ScriptEnvBridge.CreateJavaScriptEnv();
    }
    return jsEnv;
}

// ---------------------------------------------------------------------------
// Builtins initialisation via dynamic import()
// ---------------------------------------------------------------------------

/**
 * Initialise builtin helper modules by discovering `.mjs` assets under
 * `<resourceRoot>/builtins/` and dynamically importing each one in the
 * eval VM to extract its `summary` export.
 *
 * Dynamic import() supports top-level await inside the builtin modules.
 *
 * Must be called after setResourceRoot().
 * Returns a promise that resolves when all builtins have been loaded.
 */
export async function initBuiltins(): Promise<void> {
    const root = getResourceRoot();
    if (!root) {
        console.warn('[EvalTool] Resource root not set, skipping builtins loading.');
        return;
    }

    const env = getJsEnv();
    const builtinPath = `${root}/builtins`;
    const assets = CS.UnityEngine.Resources.LoadAll(builtinPath, puer.$typeof(CS.UnityEngine.TextAsset));
    if (!assets || assets.Length === 0) {
        console.log(`[EvalTool] No builtins assets found at Resources/${builtinPath}/`);
        return;
    }

    // Collect all module specifiers
    const specifiers: string[] = [];
    for (let i = 0; i < assets.Length; i++) {
        const asset = assets.get_Item(i) as CS.UnityEngine.TextAsset;
        specifiers.push(`${builtinPath}/${asset.name}.mjs`);
    }

    // Build a single script that imports all modules and returns all summaries
    const importEntries = specifiers
        .map((s, idx) => `import('${s}').then(function(m) { return { index: ${idx}, specifier: '${s}', summary: m.summary || '', error: null }; }).catch(function(e) { return { index: ${idx}, specifier: '${s}', summary: '', error: String(e.message || e) }; })`)
        .join(',\n        ');
    const batchScript = `(function(onFinish) {
    Promise.all([
        ${importEntries}
    ]).then(function(results) {
        onFinish.Invoke(JSON.stringify(results));
    });
})`;

    // Single Eval call for all modules
    const results = await new Promise<Array<{ index: number; specifier: string; summary: string; error: string | null }>>((resolve, reject) => {
        CS.LLMAgent.ScriptEnvBridge.Eval(env, batchScript, (resultJson: string) => {
            try {
                resolve(JSON.parse(resultJson));
            } catch (e) {
                reject(e);
            }
        });
    });

    const summaries: string[] = [];
    for (const entry of results) {
        if (entry.error) {
            console.warn(`[EvalTool] Failed to load builtins module '${entry.specifier}': ${entry.error}`);
        } else {
            if (entry.summary) {
                summaries.push(entry.summary);
            }
            console.log(`[EvalTool] Loaded builtins module '${entry.specifier}'.`);
        }
    }

    // Build the description text from collected summaries
    builtinSummariesText = summaries.length > 0
        ? '\n\n### Built-in Helper Modules\n\n' +
          `Several helper modules are pre-loaded in the evalJsCode VM under the path prefix \`${builtinPath}/\`. ` +
          'Each module exports:\n' +
          '- **`description`** — a detailed string documenting every function signature and usage.\n' +
          '- **Named functions** — the actual helper functions you can call.\n\n' +
          'To use a module, load it via ESM dynamic `import()`.\n\n' +
          '**IMPORTANT**: On first use of a module, read its `.description` export to see detailed function signatures. ' +
          'After that, you already know the API — just call functions directly without re-reading `.description`.\n' +
          'All functions validate their arguments at runtime and will throw errors if called with wrong parameters.\n\n' +
          'First-time usage — read description:\n' +
          '```\nasync function execute() {\n' +
          `    const sv = await import('${builtinPath}/scene-view.mjs');\n` +
          '    return sv.description;\n' +
          '}\n```\n\n' +
          'After you know the API, call functions directly (you can combine MULTIPLE operations in one script):\n' +
          '```\nasync function execute() {\n' +
          `    const sv = await import('${builtinPath}/scene-view.mjs');\n` +
          `    const ss = await import('${builtinPath}/screenshot.mjs');\n` +
          '    sv.focusSceneViewOn(\'Main Camera\');\n' +
          '    return await ss.captureSceneView();\n' +
          '}\n```\n\n' +
          'Available modules:\n\n' +
          summaries.join('\n\n')
        : '';

    console.log(`[EvalTool] Loaded ${summaries.length} builtins summary(s).`);
}

// ---------------------------------------------------------------------------
// Runner code
// ---------------------------------------------------------------------------

// Fixed runner code that calls the globally defined execute() function,
// handles async result serialization and error reporting via onFinish callback.
// If the return value is an object containing an `__image` marker (used by the
// screenshot builtin), the image data is extracted and sent separately so that
// the eval tool's toModelOutput can convert it into multi-modal content.
const RUNNER_CODE = `(function(onFinish) {
    execute().then(function(result) {
        var resultStr;
        var imageData = null;
        if (result === undefined) {
            resultStr = '(no return value)';
        } else if (result === null) {
            resultStr = 'null';
        } else if (typeof result === 'object') {
            if (result.__image && result.__image.base64) {
                imageData = { base64: result.__image.base64, mediaType: result.__image.mediaType || 'image/png' };
                var copy = {};
                for (var k in result) { if (k !== '__image') copy[k] = result[k]; }
                try { resultStr = JSON.stringify(copy, null, 2); } catch(e) { resultStr = String(result); }
            } else {
                try { resultStr = JSON.stringify(result, null, 2); } catch(e) { resultStr = String(result); }
            }
        } else {
            resultStr = String(result);
        }
        onFinish.Invoke(JSON.stringify({ __error: false, result: resultStr, __image: imageData }));
    }).catch(function(err) {
        onFinish.Invoke(JSON.stringify({ __error: true, message: String(err.message || err), stack: String(err.stack || '') }));
    });
})`;

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
                const env = getJsEnv();
                try {
                    console.log(`[EvalJsTool] Executing code:\n${code}`);

                    // Step 1: Define the execute() function via EvalSync.
                    try {
                        CS.LLMAgent.ScriptEnvBridge.EvalSync(env, code);
                    } catch (defineError: any) {
                        return {
                            success: false,
                            error: defineError.message || String(defineError),
                            stack: defineError.stack || '',
                        };
                    }

                    // Step 2: Run the fixed runner that calls execute() and
                    // serialises the result / error back through onFinish.
                    const resultJson = await new Promise<string>((resolve) => {
                        CS.LLMAgent.ScriptEnvBridge.Eval(env, RUNNER_CODE, resolve);
                    });

                    const parsed = JSON.parse(resultJson);
                    if (parsed.__error) {
                        return {
                            success: false,
                            error: parsed.message,
                            stack: parsed.stack || '',
                        };
                    }

                    // If the runner extracted image data, include it in the output
                    // so that toModelOutput can convert it to multi-modal content.
                    const output: any = {
                        success: true,
                        result: parsed.result,
                    };
                    if (parsed.__image) {
                        output.__image = parsed.__image;
                    }
                    return output;
                } catch (error: any) {
                    const errorMsg = error.message || String(error);
                    const stack = error.stack || '';
                    return {
                        success: false,
                        error: errorMsg,
                        stack: stack,
                    };
                }
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
