abstract class PuerBuiltinTranspiler {
    constructor() {

    }

    abstract transpile(specifier: string): string;
}

export default PuerBuiltinTranspiler;