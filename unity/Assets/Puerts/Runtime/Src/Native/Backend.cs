
namespace Puerts
{
    public class Backend
    {
        protected JsEnv env;
        public Backend(JsEnv env)
        {
            this.env = env;
        }
    }

    public class BackendV8: Backend
    {
        public BackendV8(JsEnv env): base(env)
        {
        }

        public bool IdleNotificationDeadline(double DeadlineInSeconds)
        {
#if THREAD_SAFE
            lock(this) {
#endif
                return PuertsDLL.IdleNotificationDeadline(env.isolate, DeadlineInSeconds);
#if THREAD_SAFE
            }
#endif
        }

        public void LowMemoryNotification()
        {
#if THREAD_SAFE
            lock(this) {
#endif
                PuertsDLL.LowMemoryNotification(env.isolate);
#if THREAD_SAFE
            }
#endif
        }

        public void RequestMinorGarbageCollectionForTesting()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            PuertsDLL.RequestMinorGarbageCollectionForTesting(env.isolate);
#if THREAD_SAFE
            }
#endif
        }

        public void RequestFullGarbageCollectionForTesting()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            PuertsDLL.RequestFullGarbageCollectionForTesting(env.isolate);
#if THREAD_SAFE
            }
#endif
        }

    }

    public class BackendNodeJS: BackendV8
    {
        public BackendNodeJS(JsEnv env): base(env)
        {
        }
    }

    public class BackendQuickJS: Backend
    {
        public BackendQuickJS(JsEnv env): base(env)
        {
        }
    }
}