#include "JSEngine.h"
#include "stdio.h"

using namespace std;

int main(int argc, char** argv)
{
    puerts::JSEngine engine(true, nullptr, nullptr);
    printf("===================================\n");
    printf("hello JSEngine\n");
    engine.Eval("\
        try {\
            console.log('start'); \
            setInterval(()=> {console.log(123)}, 1000);\
            require('fs').readFile('D:/1213.txt', function () { console.log(arguments); });\
        } catch(e) {\
            console.error(e)\
        }\
    ", "");
    printf("LastExceptionInfo: %s\n", engine.LastExceptionInfo.c_str());
    engine.CreateInspector(9222);

    while (true)
    {
        engine.LogicTick();
        engine.InspectorTick();
    }
}