# Puerts - Unreal Engine User Manual

The essence of puerts is:
- The (UE) engine provides a JavaScript virtual machine environment
- Allow TypeScript/JavaScript to interact with the engine, or call C++ or Blueprint APIs, and be called by C++ or Blueprints 

The js virtual machine implements the js language, but the js language itself can basically do nothing. What it can do depends on the APIs added to it by the host environment. For example, the browser adds a dom operation API to the js environment, so the js in the browser can write the logic of dynamic pages. For example, nodejs adds an asynchronous network (io) API, so the js in nodejs can be used to write web servers.

The host environment of js in puerts is the game engine. What APIs have been added?

First of all, Puerts imports all reflection APIs by default. In other words, the engine APIs that can be called in the UE blueprint can be called in the Typescript/JavaScript environment. If you use Typescript and correctly introduce the declaration file into the project, these APIs will be prompted.

Secondly, for non-reflective APIs, the blueprint can also be accessed after manual encapsulation into reflection. This is also applicable in TypeScript, and Puerts also supports "template-based static binding" . You can call it in TypeScript by declaring it according to the document.

In Puerts, to implement a game programming task, first think about how to implement this task in C++ or blueprint, and then call the same API in Typescript to implement it.

Puerts did not redefine the engine, but only defined the rules for TS and the engine to call each other. Puerts' demo also tends to demonstrate these rules rather than making a game. 

## Table Of Contents
- [Install](./install.md)
- [Setup](./dev_environment.md)
- [Getting Started](./getting_started.md)
- [Interacting With TypeScript From C++](./engine_call_script.md)
- [Interacting With C++ From TypeScript](./typescript_interacts_cpp.md)
- [Debugging](./vscode_debug.md)
- [Demo Projects](./demos.md)
- [FAQ](./faq.md)