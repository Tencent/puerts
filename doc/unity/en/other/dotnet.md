# Using PuerTS in a Dotnet Project

PuerTS Unity is not only limited to Unity C#, but can also be used in a pure Dotnet project. The steps to do so are very simple:

1. Make sure your Dotnet project references all the PuerTS C# code.
2. Add the PUERTS_GENERAL macro.
3. Write a specific Loader to allow PuerTS to load the built-in JS.

You can find a Dotnet unit test project made using PuerTS in the unity/test directory of the official repository. You can refer to it to set up your own Dotnet project.