import { readFileSync } from 'fs';
import { transformSync } from '@swc/core';
import PuerBuiltinTranspiler from './base';

class PuerSWCTranspiler extends PuerBuiltinTranspiler {
    transpile(specifier: string): string {
        const content = readFileSync(specifier, 'utf-8');
        try {
            const output = transformSync(content, {
                // Some options cannot be specified in .swcrc
                filename: specifier,
                sourceMaps: 'inline',
                // Input files are treated as module by default.
                isModule: true,

                // All options below can be configured via .swcrc
                jsc: {
                    parser: {
                        syntax: "typescript",
                    },
                    transform: {},
                },
            })
            return output.code;

        } catch (e: any) {
            if (e instanceof Error) {
                e.message = 'swc error: ' + e.message;
            }
            throw e;
        }

    }
}

export default PuerSWCTranspiler