# FAQ

Below is a translated version of the original docs by Incanta Games. The translation is mainly done with Google Translate, but then modified by hand to try to make sense of what Google Translate is missing.

## `new (std::nothrow) int[0] return nullptr, try fix it!` Warning

Unreal overloads the `new` operator, and processing does not comply with C ++ specification. Initializing an empry array of `nothrow` mode `new`, returns `nullptr`, where it should return a valid value. It should only return `nullptr` if we're OOM (Out of Memory). (Incanta guessing this next sentence; I don't think it's critical here) The modification let's comply with the C++ specification, where V8 is misunderstanding OOM, thereby abort. This issues seems to be prevalent on Windows machines, and this issue is also confirmed by Epic official.

If the Puerts discovery engine finds this bug, it will repair this problem by overwriting the memory allocation behavior, and prints `new (std::nothrow) int [0] return nullptr, try fix it!` warning to the Output Log. The warning only prompts the user that this exists, and there is no impact.

### Notes from Incanta Games translating this

The warning text is not telling the developer "to fix the issue", but rather it's telling the developer that Puerts is "trying to fix the issue."

In actuality this warning is presented when the `JsEnvModule.cpp` initializes:

``` c++
int * Dummy = new (std::nothrow) int[0];
if (!Dummy)
{
    UE_LOG(JsEnvModule, Warning, TEXT("new (std::nothrow) int[0] return nullptr, try fix it!"));
    MallocWrapper = new FMallocWrapper(GMalloc);
    GMalloc = MallocWrapper;
}
delete[] Dummy;
```

Per the documentation at https://www.cplusplus.com/reference/new/nothrow/, `new (std::nothrow) int[0]` shouldn't fail, and Puerts is trying to trying to fix the issue by providing a wrapper around `GMalloc` (which is Unreal's memory allocation overload). The `FMallocWrapper` merely checks to see if the size is `0` when allocating, and if so, it defaults it to `1`. This fix is meant to prevent further uses of `GMalloc` that use an array size of `0` during allocation from failing.

## Some plugins can not be used in automatic building mode

The Puerts module will traverse modules that are loaded before beforehand, so if your plugins or C++ modules are not being used, you can do one of two things:

1. Set the module to load at an earlier phase
1. After your module is started, you can call Puerts to reinitialize by calling the below function:

``` c++
IPuertsModule::Get().InitExtensionMethodsMap();
```

## Check WaitDebugger Option

(Incanta here) I'm not quite sure what the original author is trying to say here. There is a `WaitDebugger` setting for the plugin that is actually set to `false` with the latest checkout (Nov 4 2021) of the source branch. It appears that what this feature does is tell the V8 engine to "Break Before Start" and not run any JS until a debugger attaches.

Below is the raw google translate:

> This option is a snap process to wait for the debugger connection, and even go down.
>
> If you haven't configured the debugger yet, I accidentally selected this option, and there is no way to go to remove this option. At this time, you can turn off the process and open it. `Config\DefaultPuerts.ini` Bundle WaitDebugger Change to False。


## ts Blueprint StaticClass transfer, return UClass Use non-conformity

The TS class is not a StaticClass method, so the StaticClass call is actually the first class with the StaticClass method on the inheritance chain, and the returned is also UCLASS where the StaticClass method is located.

I don't understand this may cause some misunderstanding: For example, the object I created is a non-sub-class method, I inevitably CreateDefaultSubiTSubject reporting is Abstract, unable to create.

The correct approach should be loaded by UE.CLASS.LOAD ("path / to / your / blueprint / file").

## MacOS prompts "libv8.dylib cannot be opened because the developer cannot be verified"

(Incanta here) The original author is basically just telling you to tell the Mac firewall/antivirus to trust the library file by navigating to where ever the `dylib` file is (ususally `<YourProjectFolder>/Plugins/Puerts/ThirdParty/V8/Lib/macosdylib`), and execute the below command to authorize the files:

``` bash
sudo xattr -r -d com.apple.quarantine *.dylib
```

However, it should be noted that Puerts no longer uses shared `.dylib` files in favor of static `.a` libraries, and the original path has changed to `<YouProjectFolder>/Plugins/Puerts/ThirdParty/Library/V8/macOS` and you may have the issue with the FFI dependency too: `<YouProjectFolder>/Plugins/Puerts/ThirdParty/Library/ffi/macOS`. Instead of using `*.dylib` in the above command, you may need to use `*.a`. **HOWEVER**, it's likely you won't run into this issue as static libraries are not executed, but compiled in.

## "Project could not compiled. Try rebuilding from source manually"

(Incanta here). The original author is trying to tell you what to do if you receive this error, however, I am giving you a completely different set of instructions, that are hopefully clearer with more details (I'm also a plugin developer and understand the issue here).

This issue is likely happening because you tried to install Puerts in a Blueprint-only project, but since Puerts is built using C++, you'll need to compile the plugin yourself. To do that, you need to do a few steps; I'll give you a link to a guide below:
1. Download the necessary Visual Studio compiler dependencies.
1. Convert your project to a C++ project. This doesn't really do anything other than tell the engine that your project has C++ modules. You can still use Blueprints exactly how you did before.
1. Load the project again and let it compile the plugin for you.

You can follow my instructions on how to install plugins as a project plugin here: https://wiki.incanta.games/en/plugins/install-as-project-plugin

## After packaging, some fields cannot be found.

> Incanta here, below is my modified translation of the Google Translate. I kind of find it difficult to believe that UE would package your variable names with modified casing, so take this with a grain of salt and test on your own (I have not tested this). I know that UE displays variable and function names like `countThis` => `Count This` in the blueprint editor, but I didn't think it *actually changes* the exported symbol name. The author is saying that in some cases your `count` variables may get renamed to `Count` after packaging, causing references to `count` (i.e. through your JS) to be invalid since the variable got changed on you.

Usually this is caused by how Unreal processes variable names of the type `FName` (or just `Name` in blueprints) while running in the editor vs running in the packaged runtime. In the editor, the default is case sensitive, but at runtime it's case insensitive.

For example, you create a blueprint class and add a field called `count`. You write some BP code to under the BP to test it all. The field `count` can be referenced in PIE, and is running as normal.

After packaging, if you have access to this blueprint, there is already another place to initialize a `Count` field, then when you visit this blueprint, this field will be called `Count`. This happens because `FName.ToString` returns the first construction `FNameEntered` strings, (Incanta here, I can't decipher the meaning with the rest of Google Translate; what remains is raw) so as long as it is turned to lowercase and the first time FName It is the first time.

So you don't exist in the `count` field accessed on the script (becoming a `count` field).

## Generate buttons do not display in UE5 Early Access

UE5 EA changed the behavior of how the toolbar works, causing a failure. Your options are to either wait for Epic to fix the issue or modify the plugin to change how the button renders in the engine.

You can work around this by using the console command: `Puerts.Gen`
