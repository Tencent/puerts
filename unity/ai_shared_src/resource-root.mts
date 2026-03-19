/**
 * Unified resource root management.
 *
 * C# sets this once at startup (e.g. "LLMAgent/editor-assistant").
 * Sub-modules (skills, builtins, etc.) read it via getResourceRoot().
 */

let resourceRoot: string | null = null;

/**
 * Set the Unity Resources path prefix.
 * @param root - e.g. "LLMAgent/editor-assistant"
 */
export function setResourceRoot(root: string): void {
    resourceRoot = root.endsWith('/') ? root.slice(0, -1) : root;
    console.log(`[ResourceRoot] Set to: ${resourceRoot}`);
}

/**
 * Get the current resource root. Returns null if not yet set.
 */
export function getResourceRoot(): string | null {
    return resourceRoot;
}
