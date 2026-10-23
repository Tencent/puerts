export const url = import.meta.url;
export const resolved = import.meta.resolve('./esm_dep.mjs');
export const builtin = import.meta.resolve('ml_builtin');
let missing;
try {
    import.meta.resolve('./not_exist_meta_xyz.mjs');
    missing = '<no throw>';
} catch (e) {
    missing = `${e.name}: ${e.message}`;
}
export const resolveMissing = missing;
