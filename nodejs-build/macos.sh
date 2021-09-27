[ -z "$GITHUB_WORKSPACE" ] && GITHUB_WORKSPACE="$( cd "$( dirname "$0" )"/.. && pwd )"

VERSION=$1

cd ~
git clone --single-branch -b v14.x https://github.com/nodejs/node.git

cd node
git fetch origin v$VERSION
git checkout v$VERSION

git apply --cached $GITHUB_WORKSPACE/nodejs-build/nodemod.patch
git checkout -- .

./configure --shared
make -j8

mkdir -p ../puerts-node/nodejs/include
mkdir -p ../puerts-node/nodejs/deps/uv/include
mkdir -p ../puerts-node/nodejs/deps/v8/include

cp src/node.h ../puerts-node/nodejs/include
cp src/node_version.h ../puerts-node/nodejs/include
cp -r deps/uv/include ../puerts-node/nodejs/deps/uv
cp -r deps/v8/include ../puerts-node/nodejs/deps/v8

mkdir -p ../puerts-node/nodejs/lib/macOS/
cp out/Release/libnode.83.dylib ../puerts-node/nodejs/lib/macOS/