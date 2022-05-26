ENGINE=$1
if [ "$1" == "" ]
then
    ENGINE="v8"
fi

OUTPUT=build_osx_$(echo $ENGINE)_test

mkdir -p $OUTPUT && cd $OUTPUT
cmake -DJS_ENGINE=$ENGINE -DFOR_UT=ON ../
cd ..
cmake --build $OUTPUT --config Debug
cp -r $OUTPUT/libpuerts.dylib ../general/vs2013/Bin/