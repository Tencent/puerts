using System.Text.Json;
using ModelContextProtocol.Client;
using Puerts;

namespace ParallelSearchExample;

public static class Program
{
    public static async Task<int> Main(string[] args)
    {
        if (!(args.Length == 1 && args[0] == "list") &&
            !(args.Length == 2 && (args[0] == "search" || args[0] == "fetch")))
        {
            Console.Error.WriteLine("Usage: dotnet run -- list | search \"query\" | fetch https://example.com");
            return 2;
        }

        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(90));
        using var http = new HttpClient(new RequestHeaders()) { Timeout = TimeSpan.FromSeconds(60) };
        try
        {
            await using var client = await McpClient.CreateAsync(
                new HttpClientTransport(new HttpClientTransportOptions
                {
                    Endpoint = new Uri("https://search.parallel.ai/mcp"),
                    TransportMode = HttpTransportMode.StreamableHttp
                }, http), cancellationToken: timeout.Token);
            McpBridge.Client = client;
            McpBridge.Cancellation = timeout.Token;

            // The module is loaded by PuerTS and calls the C# MCP bridge via CS.
            using var env = new ScriptEnv(new BackendNodeJS(new DefaultLoader(AppContext.BaseDirectory)));
            var module = env.ExecuteModule("search.mjs");
            var run = module.Get<Func<string, string>>("run");
            Console.WriteLine(run(JsonSerializer.Serialize(args)));
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.Message);
            return 1;
        }
        finally
        {
            McpBridge.Client = null;
        }
    }
}

// This console example deliberately uses synchronous C# interop. For a Unity
// UI or game loop, use an asynchronous host bridge rather than blocking a frame.
public static class McpBridge
{
    internal static McpClient? Client;
    internal static CancellationToken Cancellation;

    public static string ListTools()
    {
        var tools = Client!.ListToolsAsync(cancellationToken: Cancellation).GetAwaiter().GetResult();
        return JsonSerializer.Serialize(tools.Select(tool => tool.Name));
    }

    public static string CallTool(string name, string argumentsJson)
    {
        var arguments = JsonSerializer.Deserialize<Dictionary<string, object?>>(argumentsJson)!;
        var result = Client!.CallToolAsync(name, arguments, cancellationToken: Cancellation)
            .GetAwaiter().GetResult();
        if (result.IsError == true)
            throw new InvalidOperationException(JsonSerializer.Serialize(result));
        return JsonSerializer.Serialize(result);
    }
}

internal sealed class RequestHeaders : DelegatingHandler
{
    internal RequestHeaders() : base(new HttpClientHandler()) { }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        request.Headers.UserAgent.Clear();
        request.Headers.UserAgent.ParseAdd("puerts-parallel-search-example/1.0");
        if (Environment.GetEnvironmentVariable("PUERTS_MCP_TRACE") == "1")
        {
            var body = request.Content == null ? "" : await request.Content.ReadAsStringAsync(cancellationToken);
            string? method = null;
            string? tool = null;
            if (body.Length > 0)
            {
                using var json = JsonDocument.Parse(body);
                method = json.RootElement.GetProperty("method").GetString();
                if (method == "tools/call")
                    tool = json.RootElement.GetProperty("params").GetProperty("name").GetString();
            }
            Console.Error.WriteLine($"{request.Method} {request.RequestUri} User-Agent={request.Headers.UserAgent} Authorization={request.Headers.Authorization != null} method={method} tool={tool}");
        }
        return await base.SendAsync(request, cancellationToken);
    }
}
