//由于python代码有缩进限制，直接在C++文件中书写可能会增加阅读难度，因此单独抽象出来
//important: 如果你希望exec不要直接访问到全局环境，请手动构建字典替代globals()传入
#include <stdio.h>

class CodeLoader{
public:
    static const char* getFileCode(char* filename);
};

const char* CodeLoader::getFileCode(char* filename) {
    static char buf[65536];
    FILE* f = fopen(filename, "r");
    if (!f) return nullptr;
    size_t len = fread(buf, 1, sizeof(buf) - 1, f);
    buf[len] = 0;
    fclose(f);
    return buf;
}

//BypassClassDefination
//并不能支持所有python函数，有需要请自行扩充
const char* bypass_class_defination_code = R"(

exec("""

class TestStruct:
    ctor_count = 0
    def __init__(self, v=0):
        self.value = v

    def Calc(self,a,b):
        return a+b

    def Add(a,b):
        return a+b

    def GetSelf(self):
        return self

    def Foo(self,r):
        return r

""", globals())

)";

//ClassCtorFinalizer
const char* class_ctor_finalizer_code = R"(

(lambda:(obj:=TestStruct(), 0))()[-1]

)";

//StaticFunctionCall
const char* static_function_call_code = R"(

(lambda:(
    0,#Dont forget that you need to import class under normal circumstances
    TestStruct.Add(123,456)
))()[-1]

)";

//InstanceMethodCall
const char* instance_method_call_code = R"(

(lambda:(
    0,#Dont forget that you need to import class under normal circumstances
    ts:=TestStruct(123),
    ts.Calc(123,456)
))()[-1]

)";

//PropertyAccess
const char* property_access_code = R"(

(lambda:(
exec("""

#Dont forget that you need to import class under normal circumstances
obj = TestStruct(123)
ret = str(obj.value) + ":"
obj.value = 0
ret = ret + str(obj.Calc(123,456))

""", globals()),
ret
))()[-1]

)";


//VariableAccess
const char* variable_access_code = R"(

(lambda:(
exec("""

#Dont forget that you need to import class under normal circumstances
obj = TestStruct(123)
ret = TestStruct.ctor_count
TestStruct.ctor_count = 999

""", globals()),
ret
))()[-1]

)";

//ReturnAObject
const char* return_a_object_code = R"(

(lambda:(
exec("""

#Dont forget that you need to import class under normal circumstances
obj = TestStruct(123)
self = obj.GetSelf()

""", globals()),
obj==self
))()[-1]

)";

//MultiObject
const char* multi_object_code = R"(

exec("""

def test_func():
    #Dont forget that you need to import class under normal circumstances
    for i in range(1000):
        obj = TestStruct(123)
        self_obj = obj.GetSelf()

test_func()

""", globals())

)";

//SuperAccess
const char* super_access_code = R"(

(lambda:(
exec("""

#Dont forget that you need to import class under normal circumstances
obj = TestStruct(123)
ret = str(obj.value)+":"
obj.value = 5
ret += str(obj.Foo(6))

""", globals()),
ret
))()[-1]

)";