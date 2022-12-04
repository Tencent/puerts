extern "C" {
    int GetArgumentValue(int infoptr, int index) {
        return infoptr | index;
    }
}