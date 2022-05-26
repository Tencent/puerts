if ( WIN32 AND NOT MSYS )
    set(LIB_FILE_NAMES 
        wee8.lib
    )
else ()
    set(LIB_FILE_NAMES 
        libwee8.a
    )
endif ()