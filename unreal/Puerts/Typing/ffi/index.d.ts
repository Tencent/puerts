declare module "ffi" {
   
    
    class Closure {
    }
    
    class CFunctionPointer {
    }
    
    type PrimitiveTypes = "void" | "uint8" | "int8" | "uint16" | "int16" | "uint32" | "int32" | "uint64" | "int64" | "float" | "double" | "pointer" | "size_t" | "cstring" ;
    
    interface TypeInfo {
        new(...args: any[]): any

        size: number;
        
        alloc(...data: any[]): Uint8Array;
        
        read(pointer:Uint8Array, offset?: number): any;

        write(pointer:Uint8Array, val: any, offset?: number)
        
        get(pointer:Uint8Array, index: number): any;

        set(pointer:Uint8Array, val: any, index: number): any;
    }

    interface PointerTypeInfo extends TypeInfo {
        ref(val: any): Uint8Array;
        unref(buff:Uint8Array): any;
    }
    
    type AnyTypeInfo = PrimitiveTypes | TypeInfo;
    
    function typeInfo(info: AnyTypeInfo): TypeInfo;
    
    function makeStruct(description: Object): TypeInfo;
    
    function makePointer(info: AnyTypeInfo): PointerTypeInfo;
    
    function binding(funcIndex :number, abi: number, returnType: AnyTypeInfo, parameterTypes: AnyTypeInfo[], fixArgNum: number): Function;
    function binding(funcIndex :number, returnType: AnyTypeInfo, parameterTypes: AnyTypeInfo[], fixArgNum?: number): Function;
    
    namespace closure  {
        function alloc(func: Function, abi: number, returnType: AnyTypeInfo, parameterTypes: AnyTypeInfo[]): Closure;
        function alloc(func: Function, returnType: AnyTypeInfo, parameterTypes: AnyTypeInfo[]): Closure;
        function func(cl: Closure): CFunctionPointer;
        function free(cl: Closure):void;
    }
}
