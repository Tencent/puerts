using System.Text;
using System.Collections.Generic;
using WebSocketSharp;
using WebSocketSharp.Server;
using WebSocketSharp.Net;
#if CSHARP_7_3_OR_NEWER
using System.Threading.Tasks;
#endif

namespace Puerts
{
    public class Inspector
    {
        protected Dictionary<string, Handler> sessionDict = new Dictionary<string, Handler>();

        protected class Handler : WebSocketBehavior
        {
            internal Inspector inspector;

            public List<string> inspectorMessageNextTick = new List<string>();

            protected override void OnMessage(MessageEventArgs e)
            {
                lock (inspectorMessageNextTick)
                {
                    inspectorMessageNextTick.Add(e.Data);
                }
            }

            protected override void OnOpen()
            {
                PuertsDLL.NoticeInspectorSessionOpen(inspector.jsEnv.isolate, ID);
                lock (inspector.sessionDict)
                {
                    inspector.sessionDict.Add(ID, this);
                }
            }

            protected override void OnClose(CloseEventArgs e)
            {
                PuertsDLL.NoticeInspectorSessionClose(inspector.jsEnv.isolate, ID);
                lock (inspector.sessionDict)
                {
                    inspector.sessionDict.Remove(ID);
                }
            }

            protected override void OnError(ErrorEventArgs e)
            {
                PuertsDLL.NoticeInspectorSessionError(inspector.jsEnv.isolate, ID, e.Message);
            }

            internal void Internal_Send(string data)
            {
                Send(data);
            }
        }

        protected HttpServer wsv;

        protected JsEnv jsEnv;

        public Inspector(JsEnv jsEnv, int port)
        {
            this.jsEnv = jsEnv;
            wsv = new HttpServer(port);
            wsv.OnGet += (sender, e) => {
                var req = e.Request;
                var res = e.Response;
                System.Console.WriteLine(req.RawUrl);
          
                if (req.RawUrl == "/json" || req.RawUrl == "/json/list")
                {
                    res.ContentType = "application/javascript";
                    res.ContentEncoding = Encoding.UTF8;
                    
                    var contents = Encoding.UTF8.GetBytes((@"[{
                        'description': 'Puerts Inspector',
                        'id': '0',
                        'title': 'Puerts Inspector',
                        'webSocketDebuggerUrl': 'ws://127.0.0.1:" + port + @"',
                        'v8only': true,
                        'type': 'page'
                    }]").Replace("'", "\""));
                    res.ContentLength64 = contents.Length;
                    res.Close(contents, true);
                }
                else if (req.RawUrl == "/json/version")
                {
                    res.ContentType = "application/javascript";
                    res.ContentEncoding = Encoding.UTF8;
                    
                    var contents = Encoding.UTF8.GetBytes(@"{
                        'Browser': 'Puerts/v1.0.0',
                        'Protocol-Version': '1.3'
                    }".Replace("'", "\""));
                    res.ContentLength64 = contents.Length;
                    res.Close(contents, true);
                }
                else
                {
                    res.StatusCode = (int) HttpStatusCode.NotFound;
                    res.ContentLength64 = 0;
                    res.Close (new byte[]{}, true);
                }
            };
            wsv.AddWebSocketService<Handler>("/", (Handler handler) =>
            {
                handler.inspector = this;
            });
            wsv.Start();
            PuertsDLL.CreateInspector(
                jsEnv.isolate, 
                StaticCallbacks.SendMessageToInspectorSession,
                StaticCallbacks.SetInspectorPausing
            );
        }

        ~Inspector()
        {
            Dispose();
        }

        public void Dispose()
        {
            wsv.Stop();
            PuertsDLL.DestroyInspector(jsEnv.isolate);
        }

        public void SendMessageToSession(string id, string message)
        {
            Handler handler;
            if (sessionDict.TryGetValue(id, out handler))
            {
                handler.Internal_Send(message);
            }
        }

        Dictionary<string, string> MessageWillSentNextTick = new Dictionary<string, string>();
        protected void AddMessageNextTick(string id, string message)
        {
            MessageWillSentNextTick.Add(message, id);
        }

        public void Tick()
        {
#if CSHARP_7_3_OR_NEWER
            if (waitDebugerTaskSource != null && sessionDict.Count != 0)
            {
                var tmp = waitDebugerTaskSource;
                waitDebugerTaskSource = null;
                tmp.SetResult(true);
            }
#endif
            lock (sessionDict)
            {
                foreach (var session in sessionDict)
                {
                    lock (session.Value.inspectorMessageNextTick)
                    {
                        foreach (var message in session.Value.inspectorMessageNextTick)
                        {
                            PuertsDLL.NoticeInspectorSessionMessage(jsEnv.isolate, session.Key, message);
                        }
                        session.Value.inspectorMessageNextTick.Clear();
                    }
                }
            }
        }

        private bool IsPause = false;

        public void runMessageLoopOnPause()
        {
            if (IsPause)
                return;
            IsPause = true;

            while (IsPause)
            {
                Tick();
            }
        }

        public void quitMessageLoopOnPause()
        {
            IsPause = false;
        }

        public void WaitDebugger()
        {
            while (sessionDict.Count == 0) { }
        }
#if CSHARP_7_3_OR_NEWER
        TaskCompletionSource<bool> waitDebugerTaskSource;
        public Task WaitDebuggerAsync()
        {
            waitDebugerTaskSource = new TaskCompletionSource<bool>();
            return waitDebugerTaskSource.Task;
        }
#endif
    }
}