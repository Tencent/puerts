# PuerTS的性能表现
从我们的测试结果上看，极限情况下，即xLua(Lua53)使用wrapper，PuerTS(v8_9.4)使用[xIl2cpp模式](./il2cpp.md)同时生成wrapper：

* 跨语言性能：
    * 在安卓上，普洱的跨语言性能是xlua的2倍左右
    * ios上和xlua持平（无参或者参数为基本数据类型时稍慢，参数为对象时稍快）。
* 自身执行性能
    * 由于lua53没有JIT，安卓上执行性能PuerTS完胜xLua。甚至PuerTS不比C#差多少。
    * ios下大家都没有JIT，PuerTS与xLua持平。

测试基准项目由社区大佬[throw-out](https://github.com/throw-out)的项目修改而成，参见[该fork](https://github.com/puerts/PerformanceTesting)。

## 数据展示

* `Puer S` 代表**不使用**xIl2cpp模式，且**生成了**StaticWrapper时的数据
* `Puer X R` 代表**使用**xIl2cpp模式，但**没有生成**xIl2cpp StaticWrapper时的数据
* `Puer X S` 代表**使用**xIl2cpp模式，且**生成了**xIl2cpp Staticrapper时的数据
* 时间单位是ms

> 受环境影响以下数据可能会有略微误差。

> 关注跨语言数据时，尤其对于结构体的case，可减去C#的耗时（即API本身耗时）来考虑。

> 这个页面上线以来，数据也发生过变动，原因：https://github.com/throw-out/PerformanceTesting/pull/2 、 https://github.com/Tencent/xLua/commit/899175ef946bb8f9d3e70d425cb875d7510adc82

### 安卓所有数据 (Vivo Neo6SE)
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

### ios所有数据 （iPhone XsMax）
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