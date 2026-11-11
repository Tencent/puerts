export const url = import.meta.url;
export const resolved = import.meta.resolve('./esm_dep.mjs');
export const builtin = import.meta.resolve('ml_builtin');
let missing;
try {
    // only joins the path, the file is not checked
    missing = import.meta.resolve('./not_exist_meta_xyz.mjs');
} catch (e) {
    missing = `${e.name}: ${e.message}`;
}
export const resolveMissing = missing;
