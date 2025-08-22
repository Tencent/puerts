#!/usr/bin/env python3
"""
Example usage of pesapi Python extension
"""

import ctypes
import sys
import os

# Load the pesapi Python extension
try:
    # Try to load from current directory
    pesapi_lib = ctypes.CDLL('./pesapi_python.dll' if sys.platform == 'win32' else './libpesapi_python.so')
except OSError:
    print("Could not load pesapi Python extension. Make sure it's built and in the current directory.")
    sys.exit(1)

# Define function signatures
pesapi_lib.pesapi_create_null.argtypes = [ctypes.c_void_p]
pesapi_lib.pesapi_create_null.restype = ctypes.c_void_p

pesapi_lib.pesapi_create_boolean.argtypes = [ctypes.c_void_p, ctypes.c_int]
pesapi_lib.pesapi_create_boolean.restype = ctypes.c_void_p

pesapi_lib.pesapi_create_int32.argtypes = [ctypes.c_void_p, ctypes.c_int32]
pesapi_lib.pesapi_create_int32.restype = ctypes.c_void_p

pesapi_lib.pesapi_create_double.argtypes = [ctypes.c_void_p, ctypes.c_double]
pesapi_lib.pesapi_create_double.restype = ctypes.c_void_p

pesapi_lib.pesapi_create_string_utf8.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_size_t]
pesapi_lib.pesapi_create_string_utf8.restype = ctypes.c_void_p

pesapi_lib.pesapi_create_array.argtypes = [ctypes.c_void_p]
pesapi_lib.pesapi_create_array.restype = ctypes.c_void_p

pesapi_lib.pesapi_create_object.argtypes = [ctypes.c_void_p]
pesapi_lib.pesapi_create_object.restype = ctypes.c_void_p

# Example usage
def example_basic_types():
    """Example of creating basic types"""
    print("=== Basic Types Example ===")
    
    # Create a null value
    null_value = pesapi_lib.pesapi_create_null(None)
    print(f"Created null value: {null_value}")
    
    # Create a boolean
    true_value = pesapi_lib.pesapi_create_boolean(None, 1)
    false_value = pesapi_lib.pesapi_create_boolean(None, 0)
    print(f"Created boolean values: {true_value}, {false_value}")
    
    # Create an integer
    int_value = pesapi_lib.pesapi_create_int32(None, 42)
    print(f"Created integer value: {int_value}")
    
    # Create a double
    double_value = pesapi_lib.pesapi_create_double(None, 3.14159)
    print(f"Created double value: {double_value}")
    
    # Create a string
    string_value = pesapi_lib.pesapi_create_string_utf8(None, b"Hello, World!", 13)
    print(f"Created string value: {string_value}")

def example_containers():
    """Example of creating containers"""
    print("\n=== Containers Example ===")
    
    # Create an array
    array_value = pesapi_lib.pesapi_create_array(None)
    print(f"Created array: {array_value}")
    
    # Create an object
    object_value = pesapi_lib.pesapi_create_object(None)
    print(f"Created object: {object_value}")

def main():
    """Main function"""
    print("PESAPI Python Extension Example")
    print("=" * 40)
    
    try:
        example_basic_types()
        example_containers()
        print("\nAll examples completed successfully!")
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
