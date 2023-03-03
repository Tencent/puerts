# Performance of il2cpp binding
The main optimization of il2cpp binding is **cross-language performance**, and based on our test results:

* On Android, the cross-language performance of Puerts is already 10 times better than that of xlua.
* On iOS, the performance is slightly weaker but still better than xlua in general (slightly slower when there are no parameters or when the parameters are basic data types, but much faster when the parameters are objects).
The benchmark project used in the test was modified by the community contributor [throw-out](https://github.com/throw-out), and can be found in [this fork](https://github.com/puerts/PerformanceTesting).

> The following data may have slight errors due to environmental factors.

> When focusing on cross-language data, especially for cases involving structures, you can subtract the time consumed by C# (i.e., the API itself) to consider the performance.

> The data for v1 shown here is better than that of the original project by @throw-out, due to the optimization caused by this PR: https://github.com/throw-out/PerformanceTesting/pull/2

### Android (Vivo Neo6SE)
| Method                                                | Static  | Call         | csharp(ms)   | xLua(ms)  | puerts v1 with wrapper(ms) | puerts v2 reflection (ms) | puerts v2 with wrapper (ms)
| :----                                                 | :----:  | :----:       | :----:       | :----:    | :----:                     | :----:                    | :----:           
| void Payload();                                       | √       | 200000       | 0.0          | 50.6      | 25.0                       | 20.0                      | 10.0             
| void Payload();                                       | ×       | 200000       | 0.0          | 92.5      | 31.0                       | 14.0                      | 11.0             
| void Payload(int);                                    | √       | 200000       | 0.0          | 49.9      | 12.0                       | 20.0                      | 8.0              
| void Payload(int);                                    | ×       | 200000       | 0.0          | 90.0      | 15.0                       | 26.0                      | 9.0              
| void Payload(int, int, float);                        | √       | 200000       | 0.0          | 68.6      | 41.0                       | 35.0                      | 8.0              
| void Payload(int, int, float);                        | ×       | 200000       | 0.0          | 96.7      | 23.0                       | 48.0                      | 28.0             
| float Payload(int, int, float);                       | √       | 200000       | 0.2          | 52.4      | 21.0                       | 69.0                      | 31.0             
| float Payload(int, int, float);                       | ×       | 200000       | 0.2          | 95.6      | 18.0                       | 60.0                      | 41.0          
| float Payload();                                      | √       | 200000       | 0.1          | 49.0      | 26.0                       | 39.0                      | 8.0              
| float Payload();                                      | ×       | 200000       | 0.1          | 87.2      | 19.0                       | 34.0                      | 10.0             
| Quaternion Payload(Transform);                        | √       | 200000       | 18.6         | 104.4     | 77.0                       | 48.0                      | 35.0             
| Quaternion Payload(Transform);                        | ×       | 200000       | 18.7         | 141.5     | 70.0                       | 47.0                      | 36.0             
| Quaternion Payload(Transform, float, float, float);   | √       | 200000       | 32.9         | 132.0     | 77.0                       | 66.0                      | 37.0             
| Quaternion Payload(Transform, float, float, float);   | ×       | 200000       | 33.0         | 173.0     | 76.0                       | 68.0                      | 38.0             
| Quaternion Payload(Transform, Vector3);               | √       | 200000       | 18.7         | 141.4     | 115.0                      | 58.0                      | 36.0             
| Quaternion Payload(Transform, Vector3);               | ×       | 200000       | 18.7         | 178.6     | 113.0                      | 57.0                      | 38.0             

### iOS （iPhone XsMax）
| Method                                                | Static  | Call         | csharp(ms)   | xLua(ms)  | puerts v1 with wrapper(ms) | puerts v2 reflection (ms) | puerts v2 with wrapper (ms)
| :----                                                 | :----:  | :----:       | :----:       | :----:    | :----:                     | :----:                    | :----:           
| void Payload();                                       | √       | 200000       | 0.0          | 9.7       | 14.0                       | 16.0                      | 13.0  
| void Payload();                                       | ×       | 200000       | 0.0          | 10.3      | 21.0                       | 21.0                      | 19.0  
| void Payload(int);                                    | √       | 200000       | 0.0          | 9.6       | 19.0                       | 23.0                      | 15.0  
| void Payload(int);                                    | ×       | 200000       | 0.0          | 17.3      | 22.0                       | 27.0                      | 18.0  
| void Payload(int, int, float);                        | √       | 200000       | 0.0          | 10.3      | 24.0                       | 36.0                      | 20.0  
| void Payload(int, int, float);                        | ×       | 200000       | 0.0          | 10.3      | 25.0                       | 41.0                      | 23.0  
| float Payload(int, int, float);                       | √       | 200000       | 0.2          | 10.2      | 28.0                       | 54.0                      | 26.0  
| float Payload(int, int, float);                       | ×       | 200000       | 0.2          | 20.9      | 28.0                       | 56.0                      | 27.0
| float Payload();                                      | √       | 200000       | 0.1          | 9.7       | 20.0                       | 30.0                      | 20.0  
| float Payload();                                      | ×       | 200000       | 0.1          | 10.3      | 24.0                       | 36.0                      | 24.0  
| Quaternion Payload(Transform);                        | √       | 200000       | 18.6         | 40.6      | 60.0                       | 39.0                      | 32.0  
| Quaternion Payload(Transform);                        | ×       | 200000       | 18.7         | 50.8      | 62.0                       | 40.0                      | 34.0  
| Quaternion Payload(Transform, float, float, float);   | √       | 200000       | 32.9         | 51.2      | 65.0                       | 60.0                      | 41.0  
| Quaternion Payload(Transform, float, float, float);   | ×       | 200000       | 33.0         | 60.5      | 69.0                       | 62.0                      | 42.0  
| Quaternion Payload(Transform, Vector3);               | √       | 200000       | 18.7         | 50.6      | 92.0                       | 45.0                      | 36.0  
| Quaternion Payload(Transform, Vector3);               | ×       | 200000       | 18.7         | 51.2      | 94.0                       | 48.0                      | 36.0  
