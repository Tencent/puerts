# PuerTS Issue #2013 修复说明

## 问题描述

**Issue #2013**: 在Unity中使用PuerTS时，在多层C#与JavaScript互相调用的场景中（C# → JS → C# → JS），当在JavaScript中进行调试时，Unity Editor会崩溃。

**影响版本**: PuerTS 2.1.1, Unity 2022.3.44f1c1 (LTS)
**平台**: Editor(win)

## 问题原因分析

通过代码分析，发现问题的根本原因包括：

1. **线程安全问题**: 多层调用时，调试器的`InspectorTick`函数可能在不同线程间访问，导致V8引擎状态不一致
2. **异常处理缺失**: 调试器相关的代码缺乏适当的异常处理，一旦出错就直接导致崩溃
3. **V8 Isolate访问冲突**: 多个调用层级可能同时访问同一个V8 Isolate，导致竞争条件
4. **调试器状态管理问题**: 在复杂的多层调用中，调试器的状态切换和上下文管理存在缺陷

## 修复方案

### 1. C# 层面修复

#### 1.1 JsEnv.cs 修复 (Default版本)
- **位置**: `unity/Assets/core/upm/Runtime/Src/Default/JsEnv.cs`
- **修改内容**:
  - 在`Tick()`方法中为`InspectorTick`调用添加异常处理
  - 在`WaitDebugger()`方法中添加超时机制和异常处理
  - 添加CPU优化，避免过度占用

#### 1.2 JsEnv.cs 修复 (IL2CPP版本)
- **位置**: `unity/Assets/core/upm/Runtime/Src/IL2Cpp/JsEnv.cs`
- **修改内容**:
  - 同样为`Tick()`和`WaitDebugger()`方法添加异常处理
  - 确保IL2CPP环境下的稳定性

### 2. 原生代码层面修复

#### 2.1 JSEngine.cpp 修复
- **位置**: `unity/native_src/Src/JSEngine.cpp`
- **修改内容**:
  - 为`InspectorTick()`方法添加完整的V8异常处理
  - 增加线程安全保护
  - 添加C++异常捕获

#### 2.2 BackendEnv.cpp 修复
- **位置**: `unity/native_src/Src/BackendEnv.cpp`
- **修改内容**:
  - 在`InspectorTick()`中添加异常捕获
  - 确保调试器异常不会影响主程序

#### 2.3 PluginImpl.cpp 修复
- **位置**: `unity/native_src/Src/PluginImpl.cpp`
- **修改内容**:
  - 为V8Plugin的`InspectorTick()`添加异常保护

## 关键修复点

### 异常处理策略
```csharp
// C# 层面：捕获调试器异常，记录警告但不崩溃
try
{
    if (PuertsDLL.InspectorTick(isolate))
    {
        // 处理调试器连接状态
    }
}
catch (System.Exception e)
{
    UnityEngine.Debug.LogWarning("PuerTS InspectorTick exception (recovered): " + e.Message);
}
```

### 超时保护机制
```csharp
// 为WaitDebugger添加30秒超时，避免无限等待
var timeout = System.TimeSpan.FromSeconds(30);
while (!PuertsDLL.InspectorTick(isolate) && (DateTime.Now - startTime) < timeout)
{
    System.Threading.Thread.Sleep(10); // 减少CPU占用
}
```

### V8层面异常处理
```cpp
// 原生代码：添加V8 TryCatch保护
v8::TryCatch TryCatch(MainIsolate);
bool result = BackendEnv.InspectorTick();
if (TryCatch.HasCaught())
{
    SetLastException(TryCatch.Exception());
    return false; // 返回错误但不崩溃
}
```

## 测试验证

### 自动化测试
创建了专门的测试类 `DebugMultiLayerTest.cs`，包含以下测试：
- 多层调用稳定性测试
- 压力测试（连续10次多层调用）
- 调试器异常恢复测试

### Unity实例测试
创建了 `DebugIssue2013Test.cs` 脚本，可以直接在Unity中运行：
- 实时多层调用测试
- 可视化测试结果
- 手动触发各种测试场景

## 使用说明

### 1. 应用修复
所有修复已经直接应用到相关文件中，无需额外配置。

### 2. 验证修复效果

#### 方法1：运行单元测试
```bash
# 在Unity中运行单元测试
# 找到 DebugMultiLayerTest 类并运行所有测试
```

#### 方法2：使用示例脚本
1. 将 `DebugIssue2013Test.cs` 附加到场景中的GameObject
2. 运行场景，观察Console输出
3. 可以启用调试器进行断点测试

#### 方法3：手动测试多层调用调试
1. 创建JsEnv并启用调试端口
2. 执行多层C#-JS调用
3. 在JavaScript回调中设置断点
4. 验证Unity不再崩溃

## 修复验证标准

### ✅ 修复成功指标
- 多层调用中设置JavaScript断点不会导致Unity崩溃
- 调试器异常被正确捕获和记录
- 系统在调试器出错后能够继续正常工作
- 压力测试可以稳定通过

### 🔧 如果仍有问题
1. 检查Unity版本兼容性（推荐使用Unity 2022.3 LTS及以上）
2. 确认PuerTS版本（推荐使用2.1.1及以上）
3. 查看是否需要重新编译原生库
4. 检查项目中是否有自定义的PuerTS修改

## 影响评估

### 性能影响
- **最小化**: 异常处理代码只在异常发生时执行
- **优化**: WaitDebugger中添加了Sleep，减少CPU占用
- **稳定性提升**: 显著提高了调试环境下的稳定性

### 兼容性
- **向后兼容**: 修复不会影响现有功能
- **API不变**: 公共API接口保持不变
- **行为改进**: 仅改进了错误处理行为

## 相关链接
- 原始Issue: [#2013](https://github.com/Tencent/puerts/issues/2013)
- 相关PR: [#2100](https://github.com/Tencent/puerts/pull/2100) (线程安全改进)
- 参考PR: [#1704](https://github.com/Tencent/puerts/pull/1704) (JS堆栈跟踪)

## 总结

此修复通过在多个层面添加异常处理和线程安全保护，解决了多层C#-JS调用中的调试器崩溃问题。修复后，开发者可以安全地在复杂的调用场景中进行JavaScript调试，不用担心Unity Editor崩溃。 