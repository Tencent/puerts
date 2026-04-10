using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace LLMAgent
{
    /// <summary>
    /// Captures Unity console logs and provides them to TypeScript via static methods.
    /// Logs are stored in a circular buffer with configurable capacity.
    /// </summary>
    public static class UnityLogBridge
    {
        /// <summary>
        /// Represents a single Unity log entry.
        /// </summary>
        private struct LogEntry
        {
            public string Timestamp;
            public string Type;
            public string Message;
            public string StackTrace;
        }

        private static readonly List<LogEntry> logBuffer = new List<LogEntry>();
        private static int maxBufferSize = 200;

#if UNITY_EDITOR
        /// <summary>
        /// Automatically start listening for Unity log messages when the Editor loads
        /// or after a domain reload (e.g. script recompilation, enter/exit play mode).
        /// No explicit call from JS/TS is needed.
        /// </summary>
        [InitializeOnLoadMethod]
        private static void OnDomainLoad()
        {
            Application.logMessageReceived -= OnLogMessageReceived;
            Application.logMessageReceived += OnLogMessageReceived;
        }
#endif

        /// <summary>
        /// Stop listening for Unity log messages.
        /// </summary>
        public static void StopListening()
        {
            Application.logMessageReceived -= OnLogMessageReceived;
        }

        /// <summary>
        /// Set the maximum number of log entries to keep in buffer.
        /// </summary>
        public static void SetBufferSize(int size)
        {
            maxBufferSize = Math.Max(10, size);
            TrimBuffer();
        }

        /// <summary>
        /// Clear all buffered logs.
        /// </summary>
        public static void ClearLogs()
        {
            lock (logBuffer)
            {
                logBuffer.Clear();
            }
        }

        /// <summary>
        /// Get recent logs as a JSON string.
        /// Called from TypeScript side.
        /// </summary>
        /// <param name="count">Maximum number of entries to return (0 = all)</param>
        /// <param name="logType">Filter by log type: "all", "error", "warning", "log" (default "all")</param>
        /// <returns>JSON array string of log entries</returns>
        public static string GetRecentLogs(int count, string logType)
        {
            lock (logBuffer)
            {
                var filtered = new List<LogEntry>();
                string typeFilter = (logType ?? "all").ToLower();

                for (int i = logBuffer.Count - 1; i >= 0; i--)
                {
                    var entry = logBuffer[i];

                    // Filter by type
                    if (typeFilter != "all" && entry.Type.ToLower() != typeFilter)
                        continue;

                    // Skip our own log messages to avoid recursion in results
                    if (entry.Message.StartsWith("[UnityLogBridge]"))
                        continue;

                    filtered.Add(entry);

                    if (count > 0 && filtered.Count >= count)
                        break;
                }

                // Reverse to chronological order
                filtered.Reverse();

                // Build JSON array
                var sb = new StringBuilder();
                sb.Append("[");

                for (int i = 0; i < filtered.Count; i++)
                {
                    if (i > 0) sb.Append(",");
                    sb.Append("{");
                    sb.Append($"\"timestamp\":\"{EscapeJson(filtered[i].Timestamp)}\",");
                    sb.Append($"\"type\":\"{EscapeJson(filtered[i].Type)}\",");
                    sb.Append($"\"message\":\"{EscapeJson(filtered[i].Message)}\"");

                    if (!string.IsNullOrEmpty(filtered[i].StackTrace))
                    {
                        sb.Append($",\"stackTrace\":\"{EscapeJson(filtered[i].StackTrace)}\"");
                    }

                    sb.Append("}");
                }

                sb.Append("]");
                return sb.ToString();
            }
        }

        /// <summary>
        /// Get a summary count of logs by type.
        /// </summary>
        /// <returns>JSON object with counts: {"log": N, "warning": N, "error": N, "total": N}</returns>
        public static string GetLogSummary()
        {
            lock (logBuffer)
            {
                int logCount = 0, warningCount = 0, errorCount = 0;

                foreach (var entry in logBuffer)
                {
                    switch (entry.Type.ToLower())
                    {
                        case "error":
                        case "exception":
                        case "assert":
                            errorCount++;
                            break;
                        case "warning":
                            warningCount++;
                            break;
                        default:
                            logCount++;
                            break;
                    }
                }

                return $"{{\"log\":{logCount},\"warning\":{warningCount},\"error\":{errorCount},\"total\":{logBuffer.Count}}}";
            }
        }

        private static void OnLogMessageReceived(string message, string stackTrace, LogType type)
        {
            var entry = new LogEntry
            {
                Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                Type = type.ToString(),
                Message = message ?? "",
                StackTrace = (type == LogType.Error || type == LogType.Exception || type == LogType.Assert)
                    ? (stackTrace ?? "") : ""
            };

            lock (logBuffer)
            {
                logBuffer.Add(entry);
                TrimBuffer();
            }
        }

        private static void TrimBuffer()
        {
            while (logBuffer.Count > maxBufferSize)
            {
                logBuffer.RemoveAt(0);
            }
        }

        private static string EscapeJson(string str)
        {
            if (string.IsNullOrEmpty(str)) return "";

            var sb = new StringBuilder(str.Length);
            foreach (char c in str)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    default:
                        if (c < 0x20)
                            sb.Append($"\\u{(int)c:x4}");
                        else
                            sb.Append(c);
                        break;
                }
            }
            return sb.ToString();
        }
    }
}
