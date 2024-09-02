globalThis.lazyss = globalThis.lazyss ? globalThis.lazyss + "module_root>>" : "module_root>>";

function foo () {
    globalThis.lazyss += "foo>>";
}

exports.foo = foo;
