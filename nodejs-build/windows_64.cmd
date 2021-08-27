cd %HOMEPATH%

md puerts-node\nodejs\include
md puerts-node\nodejs\deps\uv\include
md puerts-node\nodejs\deps\v8\include

copy node\src\node.h .\puerts-node\nodejs\include
copy node\src\node_version.h .\puerts-node\nodejs\include
xcopy /E /I node\deps\uv\include .\puerts-node\nodejs\deps\uv /s/h/e/k/f/c
xcopy /E /I node\deps\v8\include .\puerts-node\nodejs\deps\v8 /s/h/e/k/f/c

md puerts-node\nodejs\lib\Win64\
copy node\out\Release\libnode.dll .\puerts-node\nodejs\lib\Win64\
copy node\out\Release\libnode.exp .\puerts-node\nodejs\lib\Win64\
copy node\out\Release\libnode.lib .\puerts-node\nodejs\lib\Win64\