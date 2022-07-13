using System.Collections.Generic;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace Puerts
{
    public class Inspector 
    {
        protected Dictionary<string, Handler> sessionDict = new Dictionary<string, Handler>();
        
        protected class Handler: WebSocketBehavior
        {
            internal Inspector inspector;

            protected override void OnMessage(MessageEventArgs e) 
            {
                PuertsDLL.NoticeInspectorSessionMessage(inspector.jsEnv.isolate, ID, e.Data);
            }

            protected override void OnOpen()
            {
                PuertsDLL.NoticeInspectorSessionOpen(inspector.jsEnv.isolate, ID);
                inspector.sessionDict.Add(ID, this);
            }   

            protected override void OnClose(CloseEventArgs e)
            {
                PuertsDLL.NoticeInspectorSessionClose(inspector.jsEnv.isolate, ID);
                inspector.sessionDict.Remove(ID);
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

        protected WebSocketServer wsv;

        protected JsEnv jsEnv;

        public Inspector(JsEnv jsEnv, int port)
        {
            this.jsEnv = jsEnv;
            wsv = new WebSocketServer("ws://0.0.0.0:" + port);
            wsv.AddWebSocketService<Handler>("/", (Handler handler) => { 
                handler.inspector = this;
            });
            wsv.Start();
            PuertsDLL.CreateInspector(jsEnv.isolate, StaticCallbacks.SendMessageToInspectorSession);
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

        public void SendMessageTo(string id, string message)
        {
            Handler handler;
            if (sessionDict.TryGetValue(id, out handler))
            {
                handler.Internal_Send(message);
            }
        }
    }
}