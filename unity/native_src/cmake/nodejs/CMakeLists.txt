if ( WIN32 AND NOT MSYS )
    set(LIB_FILE_NAMES 
        libnode.lib
    )
elseif ( APPLE AND NOT IOS )
    set(LIB_FILE_NAMES 
        libnode.83.dylib
    )
else ()
    message( FATAL_ERROR "Node.js is only supported in osx/win" )
endif()

include_directories(    
    ${PROJECT_SOURCE_DIR}/nodejs/include
    ${PROJECT_SOURCE_DIR}/nodejs/deps/v8/include
    ${PROJECT_SOURCE_DIR}/nodejs/deps/uv/include
)