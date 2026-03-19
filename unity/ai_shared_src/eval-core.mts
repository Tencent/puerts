/**
 * Eval Core — shared execution logic for evalJsCode.
 *
 * This module contains the SDK-agnostic core: Eval VM management,
 * builtins initialisation, and code execution.
 * Both agent_proj (AI SDK) and mcp_proj (MCP SDK) import from here.
 */
import { getResourceRoot } from './resource-root.mjs';

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
export function getJsEnv(): CS.Puerts.ScriptEnv {
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
        console.warn('[EvalCore] Resource root not set, skipping builtins loading.');
        return;
    }

    const env = getJsEnv();
    const builtinPath = `${root}/builtins`;
    const assets = CS.UnityEngine.Resources.LoadAll(builtinPath, puer.$typeof(CS.UnityEngine.TextAsset));
    if (!assets || assets.Length === 0) {
        console.log(`[EvalCore] No builtins assets found at Resources/${builtinPath}/`);
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
            console.warn(`[EvalCore] Failed to load builtins module '${entry.specifier}': ${entry.error}`);
        } else {
            if (entry.summary) {
                summaries.push(entry.summary);
            }
            console.log(`[EvalCore] Loaded builtins module '${entry.specifier}'.`);
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

    console.log(`[EvalCore] Loaded ${summaries.length} builtins summary(s).`);
}

// ---------------------------------------------------------------------------
// Runner code
// ---------------------------------------------------------------------------

// Fixed runner code that calls the globally defined execute() function,
// handles async result serialization and error reporting via onFinish callback.
// If the return value is an object containing an `__image` marker (used by the
// screenshot builtin), the image data is extracted and sent separately so that
// the caller can convert it into multi-modal content.
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
// Core execution
// ---------------------------------------------------------------------------

/**
 * Result type returned by executeCode.
 */
export interface EvalResult {
    success: boolean;
    result?: string;
    error?: string;
    stack?: string;
    __image?: { base64: string; mediaType: string };
}

/**
 * Execute user-supplied JS code in the eval VM.
 *
 * The code must define an async function named `execute`.
 * This function defines `execute()` via EvalSync, then runs the
 * RUNNER_CODE which calls `execute()` and serialises the result.
 *
 * @param code - An async function declaration named `execute`.
 * @returns EvalResult with success/error info and optional image data.
 */
export async function executeCode(code: string): Promise<EvalResult> {
    const env = getJsEnv();
    try {
        console.log(`[EvalCore] Executing code:\n${code}`);

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
        const output: EvalResult = {
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
}
