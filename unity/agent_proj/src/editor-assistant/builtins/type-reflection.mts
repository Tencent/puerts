/**
 * Builtin: Type Reflection Functions
 *
 * Progressive disclosure of C# type information:
 *   - listNamespaces()           – all namespaces in the runtime
 *   - listTypesInNamespace(ns)   – types (name + kind) under given namespaces
 *   - getTypeDetails(typeNames)  – full signatures (properties, methods, fields) for given types
 *
 * Backed by C# TypeReflectionBridge which uses System.Reflection with caching.
 */

// ---- Summary for tool description (always in context) ----

export const summary = `**type-reflection** — C# type introspection via reflection (list namespaces, types, and type details). Read \`.description\` to see available functions and their signatures.`;

// ---- Description for on-demand access via import ----

export const description = `
- **\`listNamespaces()\`** — List all C# namespaces available across all loaded assemblies.
  - Returns a parsed JSON object with a \`namespaces\` array of namespace name strings.
  - Results are cached after the first call.

- **\`listTypesInNamespace(namespaces)\`** — List all public types under one or more C# namespaces.
  - \`namespaces\` (string): Comma-separated namespace names, e.g. \`'UnityEngine,UnityEngine.UI'\`.
  - Returns a parsed JSON object with type name, full name, and kind for each type.
  - Does NOT return property/method details — use \`getTypeDetails\` for that.

- **\`getTypeDetails(typeNames)\`** — Get detailed information about one or more C# types.
  - \`typeNames\` (string): Comma-separated fully-qualified type names, e.g. \`'UnityEngine.Transform,UnityEngine.GameObject'\`.
  - Returns a parsed JSON object with all public properties, methods, fields, interfaces, base type, and enum values.
`.trim();

// ---- Function implementations (become globals in eval VM) ----

/**
 * List all C# namespaces found across all loaded assemblies in the Unity runtime.
 */
export function listNamespaces(): any {
    const json = CS.LLMAgent.TypeReflectionBridge.GetAllNamespaces();
    return JSON.parse(json);
}

/**
 * List all public types (classes, structs, enums, interfaces, delegates)
 * under one or more C# namespaces.
 * @param namespaces Comma-separated namespace names, e.g. "UnityEngine,UnityEngine.UI"
 */
export function listTypesInNamespace(namespaces: string): any {
    if (typeof namespaces !== 'string' || namespaces.trim() === '') {
        throw new Error(`listTypesInNamespace: 'namespaces' must be a non-empty string (got ${JSON.stringify(namespaces)}). Read module.description for usage.`);
    }
    const json = CS.LLMAgent.TypeReflectionBridge.GetTypesInNamespaces(namespaces);
    return JSON.parse(json);
}

/**
 * Get detailed information about one or more C# types, including all public
 * properties, methods, fields, interfaces, base type, and enum values.
 * @param typeNames Comma-separated fully-qualified type names, e.g. "UnityEngine.Transform"
 */
export function getTypeDetails(typeNames: string): any {
    if (typeof typeNames !== 'string' || typeNames.trim() === '') {
        throw new Error(`getTypeDetails: 'typeNames' must be a non-empty string (got ${JSON.stringify(typeNames)}). Read module.description for usage.`);
    }
    const json = CS.LLMAgent.TypeReflectionBridge.GetTypeDetails(typeNames);
    return JSON.parse(json);
}
