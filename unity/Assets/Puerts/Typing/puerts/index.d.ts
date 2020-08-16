declare module "puerts" {
    import {$Ref, $Task} from "csharp"
    
    function $ref<T>(x? : T) : $Ref<T>;
    
    function $unref<T>(x: $Ref<T>) : T;
    
    function $set<T>(x: $Ref<T>, val:T) : void;

    function $promise<T>(x: $Task<T>) : Promise<T>
    
    function $generic<T extends new (...args:any[]) => any> (genericType :T, ...genericArguments: (new (...args:any[]) => any)[]) : T
}

declare function require(name: string): any;