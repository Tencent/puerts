import { PuertsJSEngine } from "./library";

type pesapi_env = number;
type pesapi_value = number;
type pesapi_scope = number;
type pesapi_callback = number;
type pesapi_function_finalize = number;
type pesapi_callback_info = number;
type pesapi_env_ref = number;
type pesapi_value_ref = number;


let webglFFI:number = undefined;

// 需要在Unity里调用PlayerSettings.WebGL.emscriptenArgs = " -s ALLOW_TABLE_GROWTH=1";
export function GetWebGLFFIApi(engine: PuertsJSEngine) {
    if (webglFFI) return webglFFI;

    // --------------- 值创建系列 ---------------
    function pesapi_create_null(env: pesapi_env): pesapi_value {
        throw new Error("pesapi_create_null not implemented yet!");
    }

    function pesapi_create_undefined(env: pesapi_env): pesapi_value {
        throw new Error("pesapi_create_undefined not implemented yet!");
    }

    function pesapi_create_boolean(env: pesapi_env, value: boolean): pesapi_value {
        throw new Error("pesapi_create_boolean not implemented yet!");
    }

    function pesapi_create_int32(env: pesapi_env, value: number): pesapi_value {
        throw new Error("pesapi_create_int32 not implemented yet!");
    }

    // 类似地处理其他基础类型创建函数
    function pesapi_create_uint32(env: pesapi_env, value: number): pesapi_value { 
        throw new Error("pesapi_create_uint32 not implemented yet!");
    }
    function pesapi_create_int64(env: pesapi_env, value: bigint): pesapi_value { 
        throw new Error("pesapi_create_int64 not implemented yet!");
    }
    function pesapi_create_uint64(env: pesapi_env, value: bigint): pesapi_value { 
        throw new Error("pesapi_create_uint64 not implemented yet!");
    }
    function pesapi_create_double(env: pesapi_env, value: number): pesapi_value { 
        throw new Error("pesapi_create_double not implemented yet!");
    }

    function pesapi_create_string_utf8(env: pesapi_env, str: number, length: number): pesapi_value {
        throw new Error("pesapi_create_string_utf8 not implemented yet!");
    }

    function pesapi_create_binary(env: pesapi_env, bin: number, length: number): pesapi_value {
        throw new Error("pesapi_create_binary not implemented yet!");
    }

    function pesapi_create_array(env: pesapi_env): pesapi_value { 
        throw new Error("pesapi_create_array not implemented yet!");
    }
    function pesapi_create_object(env: pesapi_env): pesapi_value { 
        throw new Error("pesapi_create_object not implemented yet!");
    }

    function pesapi_create_function(
        env: pesapi_env, 
        native_impl: pesapi_callback, 
        data: number, 
        finalize: pesapi_function_finalize
    ): pesapi_value {
        throw new Error("pesapi_create_function not implemented yet!");
    }

    function pesapi_create_class(env: pesapi_env, type_id: number): pesapi_value {
        throw new Error("pesapi_create_class not implemented yet!");
    }

    // --------------- 值获取系列 ---------------
    function pesapi_get_value_bool(env: pesapi_env, pvalue: pesapi_value): boolean {
        throw new Error("pesapi_get_value_bool not implemented yet!");
    }

    function pesapi_get_value_int32(env: pesapi_env, pvalue: pesapi_value): number {
        throw new Error("pesapi_get_value_int32 not implemented yet!");
    }

    // 类似处理其他类型获取
    function pesapi_get_value_uint32(env: pesapi_env, pvalue: pesapi_value): number { 
        throw new Error("pesapi_get_value_uint32 not implemented yet!");
    }
    function pesapi_get_value_int64(env: pesapi_env, pvalue: pesapi_value): bigint { 
        throw new Error("pesapi_get_value_int64 not implemented yet!");
    }
    function pesapi_get_value_uint64(env: pesapi_env, pvalue: pesapi_value): bigint { 
        throw new Error("pesapi_get_value_uint64 not implemented yet!");
    }
    function pesapi_get_value_double(env: pesapi_env, pvalue: pesapi_value): number { 
        throw new Error("pesapi_get_value_double not implemented yet!");
    }

    function pesapi_get_value_string_utf8(
        env: pesapi_env, 
        pvalue: pesapi_value, 
        buf: number, 
        bufsize: number
    ): number {
        throw new Error("pesapi_get_value_string_utf8 not implemented yet!");
    }

    function pesapi_get_value_binary(
        env: pesapi_env, 
        pvalue: pesapi_value, 
        bufsize: number
    ): number {
        throw new Error("pesapi_get_value_binary not implemented yet!");
    }

    function pesapi_get_array_length(env: pesapi_env, 
        pvalue: pesapi_value,
    ): number {
        throw new Error("pesapi_get_array_length not implemented yet!");
    }

    // --------------- 类型检查系列 ---------------
    function pesapi_is_null(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_null not implemented yet!");
    }
    function pesapi_is_undefined(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_undefined not implemented yet!");
    }
    function pesapi_is_boolean(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_boolean not implemented yet!");
    }
    function pesapi_is_int32(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_int32 not implemented yet!");
    }
    function pesapi_is_uint32(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_uint32 not implemented yet!");
    }
    function pesapi_is_int64(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_int64 not implemented yet!");
    }
    function pesapi_is_uint64(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_uint64 not implemented yet!");
    }
    function pesapi_is_double(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_double not implemented yet!");
    }
    function pesapi_is_string(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_string not implemented yet!");
    }
    function pesapi_is_object(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_object not implemented yet!");
    }
    function pesapi_is_function(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_function not implemented yet!");
    }
    function pesapi_is_binary(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_binary not implemented yet!");
    }
    function pesapi_is_array(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_array not implemented yet!");
    }

    // --------------- 对象操作系列 ---------------
    function pesapi_native_object_to_value(
        env: pesapi_env, 
        type_id: number, 
        object_ptr: number, 
        call_finalize: boolean
    ): pesapi_value {
        throw new Error("pesapi_native_object_to_value not implemented yet!");
    }

    function pesapi_get_native_object_ptr(env: pesapi_env, pvalue: pesapi_value): number {
        throw new Error("pesapi_get_native_object_ptr not implemented yet!");
    }

    function pesapi_get_native_object_typeid(env: pesapi_env, pvalue: pesapi_value): number {
        throw new Error("pesapi_get_native_object_typeid not implemented yet!");
    }

    function pesapi_is_instance_of(env: pesapi_env, type_id: number, pvalue: pesapi_value): boolean {
        throw new Error("pesapi_is_instance_of not implemented yet!");
    }

    // --------------- 装箱/拆箱 ---------------
    function pesapi_boxing(env: pesapi_env, pvalue: pesapi_value): pesapi_value { 
        throw new Error("pesapi_boxing not implemented yet!");
    }
    function pesapi_unboxing(env: pesapi_env, p_boxed_value: pesapi_value): pesapi_value { 
        throw new Error("pesapi_unboxing not implemented yet!");
    }
    function pesapi_update_boxed_value(env: pesapi_env, p_boxed_value: pesapi_value, pvalue: pesapi_value): void {
        throw new Error("pesapi_update_boxed_value not implemented yet!");
    }
    function pesapi_is_boxed_value(env: pesapi_env, value: pesapi_value): boolean { 
        throw new Error("pesapi_is_boxed_value not implemented yet!");
    }

    // --------------- 函数调用相关 ---------------
    function pesapi_get_args_len(pinfo: pesapi_callback_info): number { 
        throw new Error("pesapi_get_args_len not implemented yet!");
    }
    function pesapi_get_arg(pinfo: pesapi_callback_info, index: number): pesapi_value { 
        throw new Error("pesapi_get_arg not implemented yet!");
    }
    function pesapi_get_env(pinfo: pesapi_callback_info): pesapi_env { 
        throw new Error("pesapi_get_env not implemented yet!");
    }
    function pesapi_get_this(pinfo: pesapi_callback_info): pesapi_value { 
        throw new Error("pesapi_get_this not implemented yet!");
    }
    function pesapi_get_holder(pinfo: pesapi_callback_info): pesapi_value { 
        throw new Error("pesapi_get_holder not implemented yet!");
    }
    function pesapi_get_userdata(pinfo: pesapi_callback_info): number { 
        throw new Error("pesapi_get_userdata not implemented yet!");
    }
    function pesapi_add_return(pinfo: pesapi_callback_info, value: pesapi_value): void {
        throw new Error("pesapi_add_return not implemented yet!");
    }
    function pesapi_throw_by_string(pinfo: pesapi_callback_info, msg: string): void {
        throw new Error("pesapi_throw_by_string not implemented yet!");
    }

    // --------------- 环境引用 ---------------
    function pesapi_create_env_ref(env: pesapi_env): pesapi_env_ref { 
        throw new Error("pesapi_create_env_ref not implemented yet!");
    }
    function pesapi_env_ref_is_valid(penv_ref: pesapi_env_ref): boolean { 
        throw new Error("pesapi_env_ref_is_valid not implemented yet!");
    }
    function pesapi_get_env_from_ref(penv_ref: pesapi_env_ref): pesapi_env { 
        throw new Error("pesapi_get_env_from_ref not implemented yet!");
    }
    function pesapi_duplicate_env_ref(penv_ref: pesapi_env_ref): pesapi_env_ref { 
        throw new Error("pesapi_duplicate_env_ref not implemented yet!");
    }
    function pesapi_release_env_ref(penv_ref: pesapi_env_ref): void {
        throw new Error("pesapi_release_env_ref not implemented yet!");
    }

    // --------------- 作用域管理 ---------------
    function pesapi_open_scope(penv_ref: pesapi_env_ref): pesapi_scope { 
        throw new Error("pesapi_open_scope not implemented yet!");
    }
    function pesapi_open_scope_placement(penv_ref: pesapi_env_ref, memory: number): pesapi_scope { 
        throw new Error("pesapi_open_scope_placement not implemented yet!");
    }
    function pesapi_has_caught(pscope: pesapi_scope): boolean { 
        throw new Error("pesapi_has_caught not implemented yet!");
    }
    function pesapi_get_exception_as_string(pscope: pesapi_scope, with_stack: boolean): string { 
        throw new Error("pesapi_get_exception_as_string not implemented yet!");
    }
    function pesapi_close_scope(pscope: pesapi_scope): void {
        throw new Error("pesapi_close_scope not implemented yet!");
    }
    function pesapi_close_scope_placement(pscope: pesapi_scope): void {
        throw new Error("pesapi_close_scope_placement not implemented yet!");
    }

    // --------------- 值引用 ---------------
    function pesapi_create_value_ref(env: pesapi_env, pvalue: pesapi_value, internal_field_count: number): pesapi_value_ref { 
        throw new Error("pesapi_create_value_ref not implemented yet!");
    }
    function pesapi_duplicate_value_ref(pvalue_ref: pesapi_value_ref): pesapi_value_ref { 
        throw new Error("pesapi_duplicate_value_ref not implemented yet!");
    }
    function pesapi_release_value_ref(pvalue_ref: pesapi_value_ref): void {
        throw new Error("pesapi_release_value_ref not implemented yet!");
    }
    function pesapi_get_value_from_ref(env: pesapi_env, pvalue_ref: pesapi_value_ref): pesapi_value { 
        throw new Error("pesapi_get_value_from_ref not implemented yet!");
    }
    function pesapi_set_ref_weak(env: pesapi_env, pvalue_ref: pesapi_value_ref): void {
        throw new Error("pesapi_set_ref_weak not implemented yet!");
    }
    function pesapi_set_owner(env: pesapi_env, pvalue: pesapi_value, powner: pesapi_value): boolean { 
        throw new Error("pesapi_set_owner not implemented yet!");
    }
    function pesapi_get_ref_associated_env(value_ref: pesapi_value_ref): pesapi_env_ref { 
        throw new Error("pesapi_get_ref_associated_env not implemented yet!");
    }
    function pesapi_get_ref_internal_fields(pvalue_ref: pesapi_value_ref, pinternal_field_count: number): number { 
        throw new Error("pesapi_get_ref_internal_fields not implemented yet!");
    }

    // --------------- 属性操作 ---------------
    function pesapi_get_property(env: pesapi_env, pobject: pesapi_value, key: string): pesapi_value { 
        throw new Error("pesapi_get_property not implemented yet!");
    }
    function pesapi_set_property(env: pesapi_env, pobject: pesapi_value, key: string, pvalue: pesapi_value): void {
        throw new Error("pesapi_set_property not implemented yet!");
    }
    function pesapi_get_private(env: pesapi_env, pobject: pesapi_value, out_ptr: number): boolean { 
        throw new Error("pesapi_get_private not implemented yet!");
    }
    function pesapi_set_private(env: pesapi_env, pobject: pesapi_value, ptr: number): boolean { 
        throw new Error("pesapi_set_private not implemented yet!");
    }
    function pesapi_get_property_uint32(env: pesapi_env, pobject: pesapi_value, key: number): pesapi_value { 
        throw new Error("pesapi_get_property_uint32 not implemented yet!");
    }
    function pesapi_set_property_uint32(env: pesapi_env, pobject: pesapi_value, key: number, pvalue: pesapi_value): void {
        throw new Error("pesapi_set_property_uint32 not implemented yet!");
    }

    // --------------- 函数调用/执行 ---------------
    function pesapi_call_function(
        env: pesapi_env, 
        pfunc: pesapi_value, 
        this_object: pesapi_value, 
        argc: number, 
        argv: pesapi_value[]
    ): pesapi_value {
        throw new Error("pesapi_call_function not implemented yet!");
    }

    function pesapi_eval(env: pesapi_env, code: number, code_size: number, path: string): pesapi_value {
        throw new Error("pesapi_eval not implemented yet!");
    }

    // --------------- 全局对象 ---------------
    function pesapi_global(env: pesapi_env): pesapi_value { 
        throw new Error("pesapi_global not implemented yet!");
    }

    // --------------- 环境私有数据 ---------------
    function pesapi_get_env_private(env: pesapi_env): number { 
        throw new Error("pesapi_get_env_private not implemented yet!");
    }
    function pesapi_set_env_private(env: pesapi_env, ptr: number): void {
        throw new Error("pesapi_set_env_private not implemented yet!");
    }

    interface APIInfo {
        func: Function
        sig: string
    }

    const apiInfo: APIInfo[] = [
        {func: pesapi_create_null, sig: "ii"},
        {func: pesapi_create_undefined, sig: "ii"},
        {func: pesapi_create_boolean, sig: "iii"},
        {func: pesapi_create_int32, sig: "iii"},
        {func: pesapi_create_uint32, sig: "iii"},
        {func: pesapi_create_int64, sig: "iji"},
        {func: pesapi_create_uint64, sig: "iji"},
        {func: pesapi_create_double, sig: "iid"},
        {func: pesapi_create_string_utf8, sig: "iiii"},
        {func: pesapi_create_binary, sig: "iiii"},
        {func: pesapi_create_array, sig: "ii"},
        {func: pesapi_create_object, sig: "ii"},
        {func: pesapi_create_function, sig: "iiiii"},
        {func: pesapi_create_class, sig: "iii"},
        
        {func: pesapi_get_value_bool, sig: "iii"},
        {func: pesapi_get_value_int32, sig: "iii"},
        {func: pesapi_get_value_uint32, sig: "iii"},
        {func: pesapi_get_value_int64, sig: "jii"},
        {func: pesapi_get_value_uint64, sig: "jii"},
        {func: pesapi_get_value_double, sig: "dii"},
        {func: pesapi_get_value_string_utf8, sig: "iiiii"},
        {func: pesapi_get_value_binary, sig: "iiii"},
        {func: pesapi_get_array_length, sig: "iii"},
        
        {func: pesapi_is_null, sig: "iii"},
        {func: pesapi_is_undefined, sig: "iii"},
        {func: pesapi_is_boolean, sig: "iii"},
        {func: pesapi_is_int32, sig: "iii"},
        {func: pesapi_is_uint32, sig: "iii"},
        {func: pesapi_is_int64, sig: "iii"},
        {func: pesapi_is_uint64, sig: "iii"},
        {func: pesapi_is_double, sig: "iii"},
        {func: pesapi_is_string, sig: "iii"},
        {func: pesapi_is_object, sig: "iii"},
        {func: pesapi_is_function, sig: "iii"},
        {func: pesapi_is_binary, sig: "iii"},
        {func: pesapi_is_array, sig: "iii"},
        
        {func: pesapi_native_object_to_value, sig: "iiiii"},
        {func: pesapi_get_native_object_ptr, sig: "iii"},
        {func: pesapi_get_native_object_typeid, sig: "iii"},
        {func: pesapi_is_instance_of, sig: "iiii"},
        
        {func: pesapi_boxing, sig: "iii"},
        {func: pesapi_unboxing, sig: "iii"},
        {func: pesapi_update_boxed_value, sig: "viii"},
        {func: pesapi_is_boxed_value, sig: "iii"},
        
        {func: pesapi_get_args_len, sig: "ii"},
        {func: pesapi_get_arg, sig: "iii"},
        {func: pesapi_get_env, sig: "ii"},
        {func: pesapi_get_this, sig: "ii"},
        {func: pesapi_get_holder, sig: "ii"},
        {func: pesapi_get_userdata, sig: "ii"},
        {func: pesapi_add_return, sig: "vii"},
        {func: pesapi_throw_by_string, sig: "vii"},
        
        {func: pesapi_create_env_ref, sig: "ii"},
        {func: pesapi_env_ref_is_valid, sig: "ii"},
        {func: pesapi_get_env_from_ref, sig: "ii"},
        {func: pesapi_duplicate_env_ref, sig: "ii"},
        {func: pesapi_release_env_ref, sig: "vi"},
        
        {func: pesapi_open_scope, sig: "ii"},
        {func: pesapi_open_scope_placement, sig: "iii"},
        {func: pesapi_has_caught, sig: "ii"},
        {func: pesapi_get_exception_as_string, sig: "iii"},
        {func: pesapi_close_scope, sig: "vi"},
        {func: pesapi_close_scope_placement, sig: "vi"},
        
        {func: pesapi_create_value_ref, sig: "iiii"},
        {func: pesapi_duplicate_value_ref, sig: "ii"},
        {func: pesapi_release_value_ref, sig: "vi"},
        {func: pesapi_get_value_from_ref, sig: "iii"},
        {func: pesapi_set_ref_weak, sig: "vii"},
        {func: pesapi_set_owner, sig: "iiii"},
        {func: pesapi_get_ref_associated_env, sig: "ii"},
        {func: pesapi_get_ref_internal_fields, sig: "iii"},
        
        {func: pesapi_get_property, sig: "iiii"},
        {func: pesapi_set_property, sig: "viiii"},
        {func: pesapi_get_private, sig: "iiii"},
        {func: pesapi_set_private, sig: "iiii"},
        {func: pesapi_get_property_uint32, sig: "iiii"},
        {func: pesapi_set_property_uint32, sig: "viiii"},
        
        {func: pesapi_call_function, sig: "iiiiii"},
        {func: pesapi_eval, sig: "iiiii"},
        {func: pesapi_global, sig: "ii"},
        {func: pesapi_get_env_private, sig: "ii"},
        {func: pesapi_set_env_private, sig: "vii"}
    ];

    console.log(`create webgl ffi api count: ${apiInfo.length}`);
    const ptr = engine.unityApi._malloc(apiInfo.length * 4);
    const h32index = ptr >> 2;
    for(var i = 0; i < apiInfo.length; ++i) {
        engine.unityApi.HEAP32[h32index + i] = engine.unityApi.addFunction(apiInfo[i].func, apiInfo[i].sig);
    }

    webglFFI = ptr;
    engine.unityApi.InjectPapiGLNativeImpl(webglFFI);
    return ptr;
}

export function WebGLRegsterApi(engine: PuertsJSEngine) {
    return {
        GetRegsterApi: function() {
            return 0;
        },
        pesapi_alloc_property_descriptors: function() {
            throw new Error("pesapi_alloc_property_descriptors not implemented yet!");
        },
        pesapi_define_class: function() {
            throw new Error("pesapi_define_class not implemented yet!");
        },
        pesapi_get_class_data: function() {
            throw new Error("pesapi_get_class_data not implemented yet!");
        },
        pesapi_on_class_not_found: function() {
            throw new Error("pesapi_on_class_not_found not implemented yet!");
        },
        pesapi_set_method_info: function() {
            throw new Error("pesapi_set_method_info not implemented yet!");
        },
        pesapi_set_property_info: function() {
            throw new Error("pesapi_set_property_info not implemented yet!");
        },
        pesapi_trace_native_object_lifecycle: function() {
            throw new Error("pesapi_trace_native_object_lifecycle not implemented yet!");
        }
    }
}