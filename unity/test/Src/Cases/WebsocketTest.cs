#if PUERTS_GENERAL
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Threading;

namespace Puerts.UnitTest
{
    public class WebSocketEchoServer
    {
        private HttpListener httpListener;

        public async Task StartAsync(string uriPrefix)
        {
            httpListener = new HttpListener();
            httpListener.Prefixes.Add(uriPrefix);
            httpListener.Start();
            Console.WriteLine($"Server started at {uriPrefix}");

            while (true)
            {
                HttpListenerContext httpContext = await httpListener.GetContextAsync();

                if (httpContext.Request.IsWebSocketRequest)
                {
                    HttpListenerWebSocketContext webSocketContext = await httpContext.AcceptWebSocketAsync(null);
                    WebSocket webSocket = webSocketContext.WebSocket;

                    await EchoAsync(webSocket);
                }
                else
                {
                    httpContext.Response.StatusCode = 400;
                    httpContext.Response.Close();
                }
            }
        }

        private async Task EchoAsync(WebSocket webSocket)
        {
            byte[] buffer = new byte[1024];

            while (webSocket.State == WebSocketState.Open)
            {
                WebSocketReceiveResult result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                }
                else
                {
                    string receivedMessage = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    Console.WriteLine("Received: " + receivedMessage);

                    byte[] responseBuffer = Encoding.UTF8.GetBytes(receivedMessage);
                    await webSocket.SendAsync(new ArraySegment<byte>(responseBuffer), WebSocketMessageType.Text, true, CancellationToken.None);
                    Console.WriteLine("Echoed: " + receivedMessage);
                }
            }
        }

        public void Stop()
        {
            if (httpListener != null)
            {
                httpListener.Stop();
                httpListener = null;
            }
        }
    }

    [TestFixture]
    public class WebsocketTest
    {
        [Test]
        public void SmokeTest () {
            WebSocketEchoServer wses = new WebSocketEchoServer();
            wses.StartAsync("http://localhost:5000/");
#if PUERTS_GENERAL
            var jsEnv = new JsEnv(new TxtLoader());
#else
            var jsEnv = new JsEnv(new DefaultLoader());
#endif

            jsEnv.Eval(@"
                (function() {
                    let con = new WebSocket('ws://localhost:5000');
                    con.addEventListener('open', (ev) => {
                        console.log(`on open`);
                        con.send('puerts websocket');
                    });
                    con.addEventListener('message', (ev) => {
                        console.log(`on message: ${ev.data}`);
                        global.webSocketMessage = ev.data;
                        con.close();
                    });
                })();
            ");
            for(int i =0; i < 20; i++) {
                jsEnv.Tick();
                Task.Yield();
                Thread.Sleep(10);
            }

            wses.Stop();
            var res = jsEnv.Eval<string>("global.webSocketMessage");
            Assert.AreEqual(res, "puerts websocket");
        }
    }
}
#endif
