# Using PuerTS in a Dotnet Project

PuerTS Unity is not only limited to Unity C#, but can also be used in a pure Dotnet project. The steps to do so are very simple:

1. Make sure your Dotnet project references all the PuerTS C# code.
2. Add the PUERTS_GENERAL macro.
3. Write a specific Loader to allow PuerTS to load the built-in JS.


## Sample
PuerTS itself doing code unittest by DotNet. Your can refer to the `github action` configuration file: `<repository>/.github/workflows/unity-unittest.yml`, do the following:

cd into `<repository>/unity/test/dotnet`, run `node ../../cli dotnet-test v8_9.4` .

then a Dotnet project named `vsauto-static` will be generated in the working directory