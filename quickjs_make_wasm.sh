#!/bin/bash

EMSDK_PATH="emsdk"
DESIRED_VERSION="2.0.19-lto"
REPO_DIR="backend-quickjs"

install_emsdk() {
    echo "Installing Emscripten SDK..."

    # Fetch the latest version of the emsdk (Emscripten SDK) repository
    git clone https://github.com/emscripten-core/emsdk.git $EMSDK_PATH

    # Fetch the latest registry of available tools
    $EMSDK_PATH/emsdk update-tags

    # Install the desired version of the SDK
    $EMSDK_PATH/emsdk install $DESIRED_VERSION

    # Activate the installed SDK version
    $EMSDK_PATH/emsdk activate $DESIRED_VERSION

    # Source the Emscripten environment into the current shell session
    source $EMSDK_PATH/emsdk_env.sh

    echo "Emscripten SDK installed successfully!"
}

check_emsdk_version() {
    if $EMSDK_PATH/emsdk list 2>&1 | grep -q "$DESIRED_VERSION.*INSTALLED"; then
        echo "Emscripten version $DESIRED_VERSION is already installed."
        return 0
    else
        return 1
    fi
}

# Check for emsdk installation and correct version
if [ ! -d "$EMSDK_PATH" ]; then
    install_emsdk
elif ! check_emsdk_version; then
    read -p "Emscripten version $DESIRED_VERSION is not installed. Would you like to install it now? (y/n): " response
    if [ "$response" == "y" ]; then
        install_emsdk
    else
        echo "Exiting..."
        exit 1
    fi
fi

# Source the Emscripten environment
source $EMSDK_PATH/emsdk_env.sh

# Set up Emscripten compiler environment
export CC="emcc"
export CXX="em++"

BUILD_DIR="$REPO_DIR/build_wasm"

# Create build directory
mkdir -p $BUILD_DIR

# Configure cmake for WebAssembly using absolute paths
emcmake cmake $REPO_DIR -B$BUILD_DIR

# Build using cmake
cmake --build $BUILD_DIR --config Release

LIB_OUTPUT_DIR="$REPO_DIR/qjs/quickjs/Lib/WASM"

# Create library output directory
mkdir -p $LIB_OUTPUT_DIR

# Copy the generated .a file
cp $BUILD_DIR/libquickjs.a $LIB_OUTPUT_DIR

echo "Successfully built and copied the WebAssembly library!"
