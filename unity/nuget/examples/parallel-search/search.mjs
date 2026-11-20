// Executed inside PuerTS, with the host's public C# types available through CS.
export function run(argumentsJson) {
    const [command, value] = JSON.parse(argumentsJson);
    const bridge = CS.ParallelSearchExample.McpBridge;
    const tools = JSON.parse(bridge.ListTools());
    if (command === 'list') return JSON.stringify(tools, null, 2);

    const name = command === 'search' ? 'web_search' : 'web_fetch';
    if (!tools.includes(name)) throw new Error(`Server does not provide ${name}`);
    const args = command === 'search'
        ? { objective: value, search_queries: [value] }
        : { urls: [value] };
    // One conversation per invocation; reuse this ID if extending the script
    // to make related search and fetch calls in the same conversation.
    args.session_id = CS.System.Guid.NewGuid().ToString();
    return JSON.stringify(JSON.parse(bridge.CallTool(name, JSON.stringify(args))), null, 2);
}
