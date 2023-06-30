
import module2 from './module2.mjs';
// CS.System.Console.WriteLine('module1 loading');

function callMe(msg)
{
    module2.callMe('module 2');
    // CS.System.Console.WriteLine('callMe called', msg);
}

class M1
{
    constructor()
    {
        // CS.System.Console.WriteLine('M1');
    }
}

export default { callMe, M1 };