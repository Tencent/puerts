var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/editor-assistant/builtins/unity-log.mts
var summary = `**unity-log** \u2014 Unity console log access (retrieve and summarize recent logs). Read \`.description\` to see available functions and their signatures.`;
var description = `
- **\`getUnityLogs(count?, logType?)\`** \u2014 Get recent Unity console logs.
  - \`count\` (number, default 20): Number of log entries to retrieve (1-50).
  - \`logType\` (string, default \`'all'\`): Filter by type \u2014 \`'all'\`, \`'error'\`, \`'warning'\`, or \`'log'\`.
  - Returns an array of log entry objects: \`{ timestamp, type, message, stackTrace? }\`.

- **\`getUnityLogSummary()\`** \u2014 Get a summary count of Unity logs by type.
  - Returns: \`{ log: number, warning: number, error: number, total: number }\`.
`.trim();
function getUnityLogs(count = 20, logType = "all") {
  if (typeof count !== "number" || count < 1 || count > 50 || !Number.isInteger(count)) {
    throw new Error(`getUnityLogs: 'count' must be an integer between 1 and 50 (got ${JSON.stringify(count)}). Read module.description for usage.`);
  }
  const validTypes = ["all", "error", "warning", "log"];
  if (typeof logType !== "string" || !validTypes.includes(logType)) {
    throw new Error(`getUnityLogs: 'logType' must be one of ${validTypes.join(", ")} (got ${JSON.stringify(logType)}). Read module.description for usage.`);
  }
  const logsJson = CS.LLMAgent.UnityLogBridge.GetRecentLogs(count, logType);
  return JSON.parse(logsJson);
}
__name(getUnityLogs, "getUnityLogs");
function getUnityLogSummary() {
  const summaryJson = CS.LLMAgent.UnityLogBridge.GetLogSummary();
  return JSON.parse(summaryJson);
}
__name(getUnityLogSummary, "getUnityLogSummary");
export {
  description,
  getUnityLogSummary,
  getUnityLogs,
  summary
};
