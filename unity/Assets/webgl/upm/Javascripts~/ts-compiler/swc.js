"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const core_1 = require("@swc/core");
const base_1 = __importDefault(require("./base"));
class PuerSWCTranspiler extends base_1.default {
    transpile(specifier) {
        const content = (0, fs_1.readFileSync)(specifier, 'utf-8');
        try {
            const output = (0, core_1.transformSync)(content, {
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
            });
            return output.code;
        }
        catch (e) {
            if (e instanceof Error) {
                e.message = 'swc error: ' + e.message;
            }
            throw e;
        }
    }
}
exports.default = PuerSWCTranspiler;
