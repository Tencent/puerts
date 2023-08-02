# Performance of PuerTS
From our test results, in the extreme case, that is, xLua (Lua53) uses wrapper, PuerTS (v8_9.4) uses [xIl2cpp binding](./il2cpp.md) and generates wrapper at the same time:

* Cross-language performance:
  * On Android, Puer's interop performance is about twice that of xlua
  * On iOS Puer is on par with xlua (slightly slower when there are no parameters or parameters are primitive types, slightly faster when parameters are objects).
* Self-execution performance
  * Since lua53 does not support JIT, PuerTS is faster than xLua in execution on Android. PuerTS is even not much worse than C#.
  * On ios both language does not support JIT, PuerTS and xLua are on same level.

The benchmark project used in the test was modified by the community contributor [throw-out](https://github.com/throw-out), and can be found in [this fork](https://github.com/puerts/PerformanceTesting).

## Data display

* `Puer S` represents the data when **not using** xIl2cpp mode and **with** StaticWrapper generated.
* `Puer X R` represents the data when **using** xIl2cpp mode but **without** xIl2cpp StaticWrapper generated (by Reflection).
* `Puer X S` represents the data when **using** xIl2cpp mode and **with** xIl2cpp StaticWrapper generated.
* Time unit is ms

> Due to environmental factors, there may be slight errors in the following data.

> When paying attention to interop performance, especially for struct cases, consider subtracting the time consumption of C# (i.e. API itself consumption).

### android (Vivo Neo6SE)
| Method                                                | Static  | Call      | csharp | xLua   | puer S | puer X R  | puer X S       
| :----:                                                | :----:  | :----:    | :----: | :----: | :----: | :----:    | :----:                  
| void Payload();                                       | ×       | 200000    | 0.0    | 34.7   | 30.0   | 42.0      | 24.0       
| void Payload();                                       | √       | 200000    | 0.0    | 21.3   | 23.0   | 20.0      | 9.0       
| void Payload(int);                                    | √       | 200000    | 0.0    | 18.1   | 30.0   | 32.0      | 24.0       
| void Payload(int);                                    | ×       | 200000    | 0.0    | 37.0   | 36.0   | 56.0      | 29.0       
| void Payload(int, int, float);                        | √       | 200000    | 0.0    | 37.4   | 38.0   | 62.0      | 16.0       
| void Payload(int, int, float);                        | ×       | 200000    | 0.0    | 56.4   | 32.0   | 68.0      | 16.0       
| float Payload(int, int, float);                       | √       | 200000    | 0.3    | 30.1   | 25.0   | 72.0      | 36.0       
| float Payload(int, int, float);                       | ×       | 200000    | 0.3    | 41.4   | 30.0   | 95.0      | 25.0       
| float Payload();                                      | √       | 200000    | 0.2    | 17.8   | 29.0   | 34.0      | 27.0       
| float Payload();                                      | ×       | 200000    | 0.2    | 38.3   | 33.0   | 59.0      | 14.0       
| Quaternion Payload(Transform);                        | √       | 200000    | 24.3   | 87.3   | 93.0   | 58.0      | 46.0       
| Quaternion Payload(Transform);                        | ×       | 200000    | 24.2   | 100.0  | 90.0   | 60.0      | 46.0       
| Quaternion Payload(Transform, float, float, float);   | √       | 200000    | 43.1   | 102.2  | 98.0   | 85.0      | 48.0       
| Quaternion Payload(Transform, float, float, float);   | ×       | 200000    | 43.0   | 112.6  | 99.0   | 88.0      | 49.0       
| Quaternion Payload(Transform, Vector3);               | √       | 200000    | 24.2   | 103.7  | 152.0  | 72.0      | 47.0       
| Quaternion Payload(Transform, Vector3);               | ×       | 200000    | 24.3   | 118.3  | 149.0  | 73.0      | 49.0       
| fibonacci(40);                                        | √       | 1         | 640.8  | 20771.1| 1899.0 | 1888.0    | 1887.0       
| payload(): number // ScriptCallScript                 | √       | 200000000 | 245.3  | 9350.3 | 183.0  | 182.0     | 182.0       

### ios （iPhone XsMax）
| Method                                                | Static  | Call      | csharp | xLua   | puer S | puer X R  | puer X S
| :----:                                                | :----:  | :----:    | :----: | :----: | :----: | :----:    | :----:           
| void Payload();                                       | ×       | 200000    | 0.0    | 10.2   | 28.0   | 27.0      | 24.0
| void Payload();                                       | √       | 200000    | 0.0    | 25.8   | 34.0   | 34.0      | 26.0
| void Payload(int);                                    | √       | 200000    | 0.0    | 10.7   | 27.0   | 30.0      | 22.0
| void Payload(int);                                    | ×       | 200000    | 0.0    | 21.2   | 30.0   | 33.0      | 23.0
| void Payload(int, int, float);                        | √       | 200000    | 0.0    | 12.3   | 34.0   | 47.0      | 26.0
| void Payload(int, int, float);                        | ×       | 200000    | 0.0    | 23.9   | 36.0   | 50.0      | 28.0
| float Payload(int, int, float);                       | √       | 200000    | 0.0    | 10.4   | 43.0   | 72.0      | 34.0
| float Payload(int, int, float);                       | ×       | 200000    | 0.0    | 32.1   | 43.0   | 73.0      | 36.0
| float Payload();                                      | √       | 200000    | 0.3    | 11.0   | 29.0   | 46.0      | 25.0
| float Payload();                                      | ×       | 200000    | 0.3    | 16.4   | 31.0   | 49.0      | 27.0
| Quaternion Payload(Transform);                        | √       | 200000    | 34.0   | 68.7   | 99.0   | 72.0      | 62.0
| Quaternion Payload(Transform);                        | ×       | 200000    | 34.9   | 83.5   | 100.0  | 74.0      | 67.0
| Quaternion Payload(Transform, float, float, float);   | √       | 200000    | 63.3   | 78.5   | 108.0  | 101.0     | 83.0
| Quaternion Payload(Transform, float, float, float);   | ×       | 200000    | 63.6   | 89.7   | 107.0  | 102.0     | 75.0
| Quaternion Payload(Transform, Vector3);               | √       | 200000    | 35.9   | 78.8   | 159.0  | 88.0      | 64.0
| Quaternion Payload(Transform, Vector3);               | ×       | 200000    | 34.8   | 95.8   | 168.0  | 88.0      | 69.0
| fibonacci(40);                                        | √       | 1         | 500.8  | 20580.6| 17513.0| 17315.0   | 17474.0
| payload(): number // ScriptCallScript                 | √       | 200000000 | 282.3  | 9093.2 | 10896.0| 10502.0   | 10851.0