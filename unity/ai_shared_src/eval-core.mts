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
 * On first creation, starts a periodic Tick from the main VM to drive
 * the eval VM's timer queue (setTimeout / setInterval).
 */
export function getJsEnv(): CS.Puerts.ScriptEnv {
    if (!jsEnv) {
        jsEnv = CS.LLMAgent.ScriptEnvBridge.CreateJavaScriptEnv();

        // Drive the eval VM's timer queue from the main VM.
        // The main VM's setInterval is powered by EditorApplication.update,
        // so this keeps the eval VM's setTimeout/setInterval working.
        const envRef = jsEnv;
        setInterval(() => {
            try {
                CS.LLMAgent.ScriptEnvBridge.Tick(envRef);
            } catch (_) {
                // Ignore tick errors to avoid crashing the main VM loop.
            }
        }, 20); // ~50 ticks/sec, enough for responsive timers
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
          '**Examples below are illustrative only** — replace `<module-A>`, `<module-B>`, and function names ' +
          'with the actual modules and APIs listed in "Available modules" below.\n\n' +
          'First-time usage — read description:\n' +
          '```\nasync function execute() {\n' +
          `    const mod = await import('${builtinPath}/<module-A>.mjs');\n` +
          '    return mod.description;\n' +
          '}\n```\n\n' +
          'After you know the API, call functions directly (you can combine MULTIPLE operations in one script):\n' +
          '```\nasync function execute() {\n' +
          `    const a = await import('${builtinPath}/<module-A>.mjs');\n` +
          `    const b = await import('${builtinPath}/<module-B>.mjs');\n` +
          '    a.someFunction(\'arg\');\n' +
          '    return await b.anotherFunction();\n' +
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
// handles async result and error reporting via onFinish callback.
// The raw return value of execute() is passed through as-is in the result
// field — any __image markers or serialization are handled downstream
// by toModelOutput in eval-tool.mts.
const RUNNER_CODE = `(function(onFinish) {
    execute().then(function(result) {
        onFinish.Invoke(JSON.stringify({ __error: false, result: result }));
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
    result?: any;
    error?: string;
    stack?: string;
}

/**
 * Execute user-supplied JS code in the eval VM.
 *
 * The code must define an async function named `execute`.
 * This function defines `execute()` via EvalSync, then runs the
 * RUNNER_CODE which calls `execute()` and serialises the result.
 *
 * @param code - An async function declaration named `execute`.
 * @param timeoutSeconds - Optional execution timeout in seconds (default 30).
 *                         If the code does not finish within this time, a timeout
 *                         EvalResult is returned so the caller can decide to retry.
 * @returns EvalResult with success/error info and optional image data.
 */
export async function executeCode(code: string, timeoutSeconds: number = 30): Promise<EvalResult> {
    const env = getJsEnv();
    try {
        console.log(`[EvalCore] Executing code (timeout=${timeoutSeconds}s):\n${code}`);

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
        const executionPromise = new Promise<string>((resolve) => {
            CS.LLMAgent.ScriptEnvBridge.Eval(env, RUNNER_CODE, resolve);
        });

        // Step 3: Race execution against a timeout.
        const timeoutMs = timeoutSeconds * 1000;
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(
                    `Execution timed out after ${timeoutSeconds}s. ` +
                    `The code may be stuck (e.g. waiting for a resource that never resolves). ` +
                    `You can retry with a longer timeout, simplify the code, or try a different approach.`
                ));
            }, timeoutMs);
        });

        const resultJson = await Promise.race([executionPromise, timeoutPromise]);

        const parsed = JSON.parse(resultJson);
        if (parsed.__error) {
            return {
                success: false,
                error: parsed.message,
                stack: parsed.stack || '',
            };
        }

        return {
            success: true,
            result: parsed.result,
        };
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
