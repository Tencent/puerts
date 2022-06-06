if ( WIN32 AND NOT MSYS )
    set(LIB_FILE_NAMES 
        libnode.lib
    )
elseif ( APPLE AND NOT IOS )
    set(LIB_FILE_NAMES 
        libnode.93.dylib
    )
else ()
    message( FATAL_ERROR "Node.js is only supported in osx/win" )
endif()

include_directories(    
    ${PROJECT_SOURCE_DIR}/${JS_ENGINE}/include
    ${PROJECT_SOURCE_DIR}/${JS_ENGINE}/deps/v8/include
    ${PROJECT_SOURCE_DIR}/${JS_ENGINE}/deps/uv/include
)

target_compile_definitions (puerts PRIVATE WITH_NODEJS)