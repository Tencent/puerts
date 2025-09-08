
import module1 from './module1.mjs';
// CS.System.Console.WriteLine('module2 loading');

function callMe(msg)
{
    new module1.M1();
    // CS.System.Console.WriteLine('callMe called', msg);
}


export default { callMe };