
interface IntPtr {__cannotMockInJS: boolean}
interface CSString {__cannotMockInJS: boolean}
declare const Module: any
declare const unityInstance: any
declare type CSIdentifier = number; // 可以是一个CSObjectPool的ID，如果是BlittableCopy的Struct则是内存地址
declare type int = number;
declare type double = number;
declare type bool = boolean;
declare const wx: any;

declare type MockIntPtr = number;
declare type JSFunctionPtr = number;
declare type JSObjectPtr = number;
// declare type MockIntPtr = number;