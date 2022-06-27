declare enum __Puerts_CSharpEnum {}

declare module "puerts" {
    import { $Ref, $Task, System } from "csharp";
    
    function $ref<T>(x? : T) : $Ref<T>;
    
    function $unref<T>(x: $Ref<T>) : T;
    
    function $set<T>(x: $Ref<T>, val:T) : void;

    function $promise<T>(x: $Task<T>) : Promise<T>;
    
    function $generic<T extends new (...args:any[]) => any> (genericType: T, ...genericArguments: (typeof __Puerts_CSharpEnum | (new (...args:any[]) => any))[]) : T;

    function $genericMethod(genericType: new (...args:any[]) => any, methodName: string, ...genericArguments: (typeof __Puerts_CSharpEnum | (new (...args:any[]) => any))[]) : (...args: any[]) => any;
    
    function $typeof(x : new (...args:any[]) => any) : System.Type;
    
    function $extension(c : Function, e: Function) : void;
    
    function on(eventType: string, listener: Function, prepend?: boolean) : void;
    
    function off(eventType: string, listener: Function) : void;
    
    function emit(eventType: string, ...args:any[]) : boolean;
}

declare function require(name: string): any;