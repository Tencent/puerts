/**
 * Builtin: Unity Log Functions
 *
 * Provides helper functions to access Unity console logs from the eval VM.
 * These functions are injected as globals when the eval VM is created.
 */

// ---- Summary for tool description (always in context) ----

export const summary = `**unity-log** — Unity console log access (retrieve and summarize recent logs). Read \`.description\` to see available functions and their signatures.`;

// ---- Description for on-demand access via import ----

export const description = `
- **\`getUnityLogs(count?, logType?)\`** — Get recent Unity console logs.
  - \`count\` (number, default 20): Number of log entries to retrieve (1-50).
  - \`logType\` (string, default \`'all'\`): Filter by type — \`'all'\`, \`'error'\`, \`'warning'\`, or \`'log'\`.
  - Returns an array of log entry objects: \`{ timestamp, type, message, stackTrace? }\`.

- **\`getUnityLogSummary()\`** — Get a summary count of Unity logs by type.
  - Returns: \`{ log: number, warning: number, error: number, total: number }\`.
`.trim();

// ---- Function implementations (become globals in eval VM) ----

interface LogEntry {
    timestamp: string;
    type: string;
    message: string;
    stackTrace?: string;
}

interface LogSummary {
    log: number;
    warning: number;
    error: number;
    total: number;
}

/**
 * Get recent Unity console logs.
 * @param count Number of log entries to retrieve (default 20, range 1-50)
 * @param logType Filter by type: 'all', 'error', 'warning', or 'log' (default 'all')
 */
export function getUnityLogs(count: number = 20, logType: string = 'all'): LogEntry[] {
    if (typeof count !== 'number' || count < 1 || count > 50 || !Number.isInteger(count)) {
        throw new Error(`getUnityLogs: 'count' must be an integer between 1 and 50 (got ${JSON.stringify(count)}). Read module.description for usage.`);
    }
    const validTypes = ['all', 'error', 'warning', 'log'];
    if (typeof logType !== 'string' || !validTypes.includes(logType)) {
        throw new Error(`getUnityLogs: 'logType' must be one of ${validTypes.join(', ')} (got ${JSON.stringify(logType)}). Read module.description for usage.`);
    }
    const logsJson = CS.LLMAgent.UnityLogBridge.GetRecentLogs(count, logType);
    return JSON.parse(logsJson);
}

/**
 * Get a summary count of Unity logs by type.
 */
export function getUnityLogSummary(): LogSummary {
    const summaryJson = CS.LLMAgent.UnityLogBridge.GetLogSummary();
    return JSON.parse(summaryJson);
}
