declare namespace puer {
    function require(name: string): any;

    function genRequire(): (name: string) => any;

    function getModuleBySID(id: number): any;
    
    function clearModuleCache(): void;
}

declare module 'puerts' 
{
    export = puer;
}

declare module 'csharp'
{
    export = CS;
}

declare function require(name: string): any;