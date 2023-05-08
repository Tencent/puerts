console.log('console.log ok');
(typeof CS.UnityEngine.Debug.Log == 'function' ? CS.UnityEngine.Debug.Log : CS.System.Console.WriteLine)
    ('CS.UnityEngine.Debug.Log ok')