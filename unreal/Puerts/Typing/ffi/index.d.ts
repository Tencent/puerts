declare module "ffi" {
   
    
    class Closure {
    }
    
    class CFunctionPointer {
    }
    
    type PrimitiveTypes = "void" | "uint8" | "int8" | "uint16" | "int16" | "uint32" | "int32" | "uint64" | "int64" | "float" | "double" | "pointer" | "size_t" | "cstring" ;
    
    class TypeInfo {
        public size: number;
        
        public alloc(...data: any[]): Uint8Array;
        
        public read(pointer:Uint8Array, offset?: number): any;

        public write(pointer:Uint8Array, val: any, offset?: number)
        
        public get(pointer:Uint8Array, index: number): any;

        public set(pointer:Uint8Array, val: any, index: number): any;
    }
    
    type AnyTypeInfo = PrimitiveTypes | TypeInfo;
    
    function typeInfo(info: AnyTypeInfo): TypeInfo;
    
    function makeStruct(description: Object): TypeInfo;
    
    function makePointer(info: AnyTypeInfo): TypeInfo;
    
    function binding(funcIndex :number, abi: number, returnType: AnyTypeInfo, parameterTypes: AnyTypeInfo[], fixArgNum: number): Function;
    function binding(funcIndex :number, returnType: AnyTypeInfo, parameterTypes: AnyTypeInfo[], fixArgNum?: number): Function;
    
    namespace closure  {
        function alloc(func: Function, abi: number, returnType: AnyTypeInfo, parameterTypes: AnyTypeInfo[]): Closure;
        function alloc(func: Function, returnType: AnyTypeInfo, parameterTypes: AnyTypeInfo[]): Closure;
        function func(cl: Closure): CFunctionPointer;
        function free(cl: Closure):void;
    }
}
