/**
 * Skill Tool for AI Agent
 *
 * A "skill" is a named, externally-authored Markdown document that provides
 * domain-specific instructions (an "operation guide") to the LLM.
 * Skills are loaded on-demand via the `loadSkill` tool so they only consume
 * context tokens when the agent actually needs them.
 *
 * Skill files live in `Resources/<root>/skills/` as `.md.txt` assets
 * (Unity Resources does not support bare `.md`).
 * Each file uses YAML front-matter to declare `name` and `description`.
 */
import { tool } from 'ai';
import { z } from 'zod';
import { getResourceRoot } from '../../../ai_shared_src/resource-root.mjs';

// ---------------------------------------------------------------------------
// Skill registry
// ---------------------------------------------------------------------------

export interface SkillInfo {
    /** Unique skill identifier (from front-matter `name`). */
    name: string;
    /** Short description shown in the tool's description (from front-matter `description`). */
    description: string;
    /** Full Markdown body (everything after the front-matter). */
    content: string;
}

/** In-memory registry populated at startup via `setSkillResourceRoot`. */
const skills: Map<string, SkillInfo> = new Map();

/**
 * Return a snapshot of all registered skills (without full content).
 */
export function listSkills(): SkillInfo[] {
    return Array.from(skills.values());
}

// ---------------------------------------------------------------------------
// YAML front-matter parsing
// ---------------------------------------------------------------------------

/**
 * Parse a Markdown string with YAML front-matter.
 * Expected format:
 * ---
 * name: skillName
 * description: Short description
 * ---
 * (Markdown body)
 */
function parseSkillMarkdown(text: string, fileName: string): SkillInfo | null {
    if (!text || !text.trimStart().startsWith('---')) {
        console.warn(`[Skill] '${fileName}' has no YAML front-matter, skipping.`);
        return null;
    }

    const firstDelim = text.indexOf('---');
    const secondDelim = text.indexOf('---', firstDelim + 3);
    if (secondDelim < 0) {
        console.warn(`[Skill] '${fileName}' has unclosed front-matter, skipping.`);
        return null;
    }

    const frontMatter = text.substring(firstDelim + 3, secondDelim).trim();
    const body = text.substring(secondDelim + 3).replace(/^\r?\n/, '');

    // Simple line-by-line YAML parsing for name and description
    let name: string | undefined;
    let description: string | undefined;

    for (const line of frontMatter.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('name:')) {
            name = trimmed.substring(5).trim().replace(/^["']|["']$/g, '');
        } else if (trimmed.startsWith('description:')) {
            description = trimmed.substring(12).trim().replace(/^["']|["']$/g, '');
        }
    }

    if (!name) {
        console.warn(`[Skill] '${fileName}' has no 'name' in front-matter, skipping.`);
        return null;
    }

    return { name, description: description ?? '', content: body };
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize skills by auto-discovering `.md.txt` files from the resource root.
 * Reads the root from the unified resource-root module, then loads all TextAsset
 * from `<root>/skills` via Unity Resources.LoadAll.
 *
 * Safe to call multiple times — clears and reloads each time.
 */
export function initSkills(): void {
    skills.clear();

    const root = getResourceRoot();
    if (!root) {
        console.warn('[Skill] Resource root not set, skipping skill loading.');
        return;
    }

    const skillsPath = `${root}/skills`;
    const assets = CS.UnityEngine.Resources.LoadAll(skillsPath, puer.$typeof(CS.UnityEngine.TextAsset));
    if (!assets || assets.Length === 0) {
        console.log(`[Skill] No skill assets found at Resources/${skillsPath}/`);
        return;
    }

    for (let i = 0; i < assets.Length; i++) {
        const asset = assets.get_Item(i) as CS.UnityEngine.TextAsset;
        try {
            const text = asset.text;
            const skill = parseSkillMarkdown(text, asset.name);
            if (skill) {
                skills.set(skill.name, skill);
                console.log(`[Skill] Registered skill: ${skill.name}`);
            }
        } catch (e: any) {
            console.warn(`[Skill] Failed to parse '${asset.name}': ${e.message || e}`);
        }
    }

    console.log(`[Skill] Loaded ${skills.size} skill(s) from Resources/${skillsPath}/`);
}

// ---------------------------------------------------------------------------
// Build the dynamic tool description
// ---------------------------------------------------------------------------

function buildSkillListMarkdown(): string {
    const list = listSkills();
    if (list.length === 0) {
        return '';
    }
    return list.map(s => `- **${s.name}**: ${s.description}`).join('\n');
}

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/**
 * Create the `loadSkill` tool for the agent.
 * If no skills are registered the tool is omitted (returns empty object).
 */
export function createSkillTools() {
    const list = listSkills();

    // No skills → don't expose the tool at all
    if (list.length === 0) {
        return {} as Record<string, never>;
    }

    const examples = list.slice(0, 3).map(s => `'${s.name}'`).join(', ');
    const hint = examples ? ` (e.g. ${examples})` : '';

    const description = [
        'Load a specialized skill that provides domain-specific instructions and workflows.',
        '',
        '**IMPORTANT**: You MUST call this tool BEFORE performing any task that involves ' +
        'a domain listed below. Do NOT rely on your own knowledge — always load the skill first ' +
        'to get the authoritative and project-specific rules.',
        '',
        '## Available Skills',
        buildSkillListMarkdown(),
    ].join('\n');

    return {
        loadSkill: tool({
            description,
            inputSchema: z.object({
                name: z.string().describe(`The name of the skill to load${hint}`),
            }),
            execute: async ({ name }) => {
                const skill = skills.get(name);
                if (!skill) {
                    const available = listSkills().map(s => s.name).join(', ');
                    return {
                        success: false,
                        error: `Skill "${name}" not found. Available skills: ${available || 'none'}`,
                    };
                }
                return {
                    success: true,
                    result: [
                        `<skill_content name="${skill.name}">`,
                        `# Skill: ${skill.name}`,
                        '',
                        skill.content.trim(),
                        '',
                        '</skill_content>',
                    ].join('\n'),
                };
            },
        }),
    };
}
