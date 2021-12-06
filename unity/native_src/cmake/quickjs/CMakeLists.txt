if ( WIN32 AND NOT MSYS )
    set(LIB_FILE_NAMES 
        quickjs.dll.lib
    )
else ()
    set(LIB_FILE_NAMES 
        libquickjs.a
    )
endif()