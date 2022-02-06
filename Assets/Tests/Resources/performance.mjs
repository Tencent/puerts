// cs.PerformanceHelper.ReturnNumber(3);
// const start = Date.now();
// for (let i = 0; i < 1000000; i++) 
// {
//     cs.PerformanceHelper.ReturnNumber(3);
// }
// // cs.UnityEngine.Debug.Log('Puerts Number:');
// cs.PerformanceHelper.JSNumber.text = 'Puerts Number:' + (Date.now() - start) + 'ms'

cs.PerformanceHelper.ReturnVector(1, 2, 3)
const start2 = Date.now();
for (let i = 0; i < 1000000; i++) 
{
    cs.PerformanceHelper.ReturnVector(1, 2, 3);
}
// cs.UnityEngine.Debug.Log('Puerts Vector:');
// cs.UnityEngine.Debug.Log((Date.now() - start2));
cs.PerformanceHelper.JSVector.text = 'Puerts Vector:' + (Date.now() - start2) + 'ms'
// const fibcache = [0, 1]
// function fibonacci(level) {
//     if (level == 0) return 0;
//     if (level == 1) return 1;
//     return fibonacci(level - 1) + fibonacci(level - 2);
// }

// const start3 = Date.now();
// for (let i = 0; i < 100000; i++) {
//     fibonacci(12)
// }
// // cs.UnityEngine.Debug.Log('Puerts fibonacci:');
// // cs.UnityEngine.Debug.Log((Date.now() - start3));
// cs.PerformanceHelper.JSFibonacci.text = 'Puerts fibonacci:' + (Date.now() - start3) + 'ms'
