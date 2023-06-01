# 在Dotnet项目中使用PuerTS
PuerTS Unity不仅可以在Unity C#中使用，同样可以在一个纯Dotnet项目中使用。步骤也非常简单：
1. 让dotnet项目引用所有PuerTS C#代码
2. 添加 PUERTS_GENERAL 宏
3. 编写特定的 Loader 使PuerTS可以加载内置JS

你可以在官方仓库中的unity/test目录找到使用dotnet制作的单元测试项目，并参考它完成你dotnet项目的搭建。