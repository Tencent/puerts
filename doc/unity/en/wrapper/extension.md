
# using C# extension methods
For methods implemented using C# extension in the project, there are three ways to handle them when calling on the JS side:

1. Add the target class and the class containing the extension method to the wrapper generation list (recommended).
When generating code, Puerts will help you iterate through the entire assembly and add all extension functions that exist in the class to the static-wrapper, so that they can be called normally on the JS side.

2. Call the extension method manually on the JS side.
As shown in the figure below, Parameter 0 is the extended target class, and Parameter 1 is the extended class that contains the extension method. You can call this function at the initialization of JsEnv.

```javascript
puer.$extension(CS.PuertsTest.BaseClass, CS.PuertsTest.BaseClassExtension);
```
3. Enable the PUERTS_REFLECT_ALL_EXTENSION macro.
After enabling this macro, Puerts will help you iterate through the entire assembly when the first reflection call is generated. This means that you don't need to generate it or call the extension function manually, but the side effect is that the waiting time for the first reflection call will become longer, and the memory usage will increase.