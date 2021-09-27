set VERSION=%1

cd %HOMEPATH%
git clone --single-branch -b v14.x https://github.com/nodejs/node.git

cd node
git fetch origin v%VERSION%
git checkout v%VERSION%

node %GITHUB_WORKSPACE%\v8-build\CRLF2LF.js %GITHUB_WORKSPACE%\nodejs-build\nodemod.patch
call git apply --cached --reject %GITHUB_WORKSPACE%\nodejs-build\nodemod.patch
call git checkout -- .

copy /y %GITHUB_WORKSPACE%\nodejs-build\zlib.def deps\zlib\win32\zlib.def

.\vcbuild.bat dll openssl-no-asm
