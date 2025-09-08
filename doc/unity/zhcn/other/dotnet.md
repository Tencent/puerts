# 在Dotnet项目中使用PuerTS
PuerTS Unity不仅可以在Unity C#中使用，同样可以在一个纯Dotnet项目中使用。步骤也非常简单：
1. 让dotnet项目引用所有PuerTS C#代码
2. 添加 PUERTS_GENERAL 宏
3. 编写特定的 Loader 使PuerTS可以加载内置JS

## 示例
普洱官方采用了一个dotnet程序进行代码单元测试，你可以参见我们的github action配置:`<repository>/.github/workflows/unity-unittest.yml`。

进入官方仓库的`<repository>/unity/test/dotnet`目录，执行 `node ../../cli dotnet-test v8_9.4` 。

随后就会在该目录下生成名为`vsauto-static`的dotnet项目。