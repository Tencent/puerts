/**
 * System Prompt Module
 * Contains the system prompt template and builder function.
 *
 * The agent role definition (identity, personality, domain expertise) is loaded
 * from `<resourceRoot>/system-prompt.md.txt` at initialization time.
 * Only framework-level sections (image placeholders, skills, eval environment)
 * remain hard-coded here because they describe capabilities provided by the
 * TS runtime itself, not the specific agent persona.
 */

import { getResourceRoot } from '../../../ai_shared_src/resource-root.mjs';

// ---------------------------------------------------------------------------
// Role definition — loaded from resource root at init time
// ---------------------------------------------------------------------------

/** Agent role definition loaded from `<root>/system-prompt.md.txt`. */
let roleDefinition: string = '';

/**
 * Load the agent role definition from the resource root.
 * Must be called after setResourceRoot().
 */
export function initSystemPrompt(): void {
    const root = getResourceRoot();
    if (!root) {
        console.warn('[Prompt] Resource root not set, skipping system-prompt loading.');
        return;
    }

    const asset = CS.UnityEngine.Resources.Load(
        `${root}/system-prompt.md`,
        puer.$typeof(CS.UnityEngine.TextAsset),
    ) as CS.UnityEngine.TextAsset | null;

    if (asset && asset.text) {
        roleDefinition = asset.text.trim();
        console.log(`[Prompt] Loaded system-prompt from Resources/${root}/system-prompt.md.txt`);
    } else {
        console.warn(`[Prompt] No system-prompt.md.txt found at Resources/${root}/, using empty role definition.`);
        roleDefinition = '';
    }
}

// ---------------------------------------------------------------------------
// Framework-level prompt sections (not agent-specific)
// ---------------------------------------------------------------------------

//TODO: System prompt add unity version and puerTs version
const FRAMEWORK_PROMPT = `
## Context Compression — Image Placeholders

To save context space, base64-encoded image data in **past** tool call results
is automatically replaced with compact placeholders.
The placeholder prefix is unique per session:

- \`{IMAGE_PREFIX}(index, length)\` - a base64-encoded image that was replaced.
  \`index\` is the storage slot, \`length\` is the original character count.
  **You can retrieve the original content** by calling the \`retrieveImage\` tool with the index.
  Only retrieve it when you genuinely need the exact base64 data — in most cases,
  take a new screenshot via \`captureScreenshot\` instead.

## Skills (IMPORTANT)

If the \`loadSkill\` tool is available, you **MUST** call it to load the relevant skill **before** performing any task that falls within that skill's domain. For example, if a task involves calling C# APIs from JS via PuerTS, you must first load the corresponding skill to get the correct interop rules. **Never assume you know the correct approach — always load the skill first.**

## evalJsCode Runtime Environment

The evalJsCode tool runs in a **pure V8 engine** — there is NO \`window\`, \`document\`, \`DOM\`, or any browser/Node.js API. However, \`setTimeout\`, \`setInterval\`, \`clearTimeout\`, and \`clearInterval\` are available (provided by PuerTS). To persist state across calls, use \`globalThis.myVar = ...\` or top-level \`var\` declarations.
`;

/**
 * Build the effective system prompt, injecting the current placeholder prefixes.
 * The role definition (loaded from resource root) is prepended to the framework sections.
 * @param imagePrefix The current ImageStore prefix for image placeholders.
 */
export function buildSystemPrompt(imagePrefix: string): string {
    const prompt = roleDefinition
        ? `${roleDefinition}\n${FRAMEWORK_PROMPT}`
        : FRAMEWORK_PROMPT.trimStart();

    return prompt.replace(/\{IMAGE_PREFIX\}/g, imagePrefix);
}
