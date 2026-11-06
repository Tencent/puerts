# Parallel Search from PuerTS on .NET

Run web search and page fetching from a JavaScript module hosted by PuerTS.
[Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) is free
for exploration and light use, with no account or API key. Anonymous search uses
Fast mode and is subject to rate limits.

## Run

Install the .NET 8 SDK on Linux x64, Windows x64, or macOS. From this
directory:

```sh
dotnet restore
dotnet build
```

On Linux, add the packaged native libraries to the dynamic loader's search path:

```sh
export LD_LIBRARY_PATH="$PWD/bin/Debug/net8.0/runtimes/linux-x64/native${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

Then run:

```sh
dotnet run -- list
dotnet run -- search "PuerTS JavaScript CSharp interop"
dotnet run -- fetch https://puerts.github.io/en/
```

`list` discovers the available MCP tools. `search` prints search results with
source URLs and excerpts; `fetch` prints page excerpts. Each command opens an
anonymous Streamable HTTP connection to `https://search.parallel.ai/mcp` and
closes it on completion. Connection and MCP tool errors produce a nonzero exit status.

The example explicitly uses `BackendNodeJS` and loads `search.mjs` with
`ScriptEnv.ExecuteModule`. The JavaScript module calls the public C# `McpBridge`
through `CS`; the bridge uses the official C# MCP SDK for discovery and tool
execution. Both dependencies are declared in the project. No separate Node.js
installation, model, or inference API key is needed.

This is a standalone console example. Its synchronous bridge is intended for
console execution; a Unity UI or game loop needs an asynchronous bridge to avoid
blocking frames. It does not configure the Unity Editor Assistant.

To inspect outgoing request methods, URLs, and the project User-Agent, set
`PUERTS_MCP_TRACE=1` before running a command. This also shows whether an
Authorization header is present; the example does not load saved credentials or
read API keys from the environment.
