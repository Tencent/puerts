'use strict';
// Blueprint classes and user defined structs changed and recompiled (editor only) while the script holds their classes.
// The FStructWrapper of a type is reused by full name, so the js class of a type never changes: members added after the
// js class was created are not on it, removed members throw when accessed. The observed behaviour is in the baseline.
// A struct instance must not live across a layout change (its memory has the old layout), so the struct cases create
// their instances after the change, the ones of the previous step are freed by the gc between the steps.
const { puerts, UE, test, step, eq, assert, note, observe, catchError, run } = require('./framework');
const BP = UE.PuertsTestBlueprintUtils;
const Reporter = UE.PuertsTestReporter;
const tojs = puerts.blueprint.tojs;

const state = {};

function must(v, what) {
    assert(v, `${what} failed (needs the editor)`);
    return v;
}

// ---------------- blueprint class ----------------

test('class: create', () => {
    const cls = must(BP.CreateBlueprintClass(UE.PuertsTestObject.StaticClass()), 'CreateBlueprintClass');
    const withScore = must(BP.AddClassVariable(cls, 'Score', 'int'), 'AddClassVariable');
    observe('class: add variable keeps the UClass', () => withScore === cls);
    state.cls = cls;
    state.Js = tojs(cls);
    observe('class: tojs is cached', () => tojs(cls) === state.Js);
    observe('class: StaticClass', () => state.Js.StaticClass() === cls);
    observe('class: has Score', () => BP.HasOwnProperty(cls, 'Score'));

    const a = new state.Js();
    a.Score = 3;
    a.IntValue = 5;
    eq(a.Score, 3);
    eq(a.IntValue, 5);
    eq(a.Add(1, 2), 3);
    observe('class: instanceof parent', () => a instanceof UE.PuertsTestObject);
    observe('class: instanceof itself', () => a instanceof state.Js);
    observe('class: instance GetClass', () => a.GetClass() === cls);
    note('class: merge', catchError(() => puerts.merge(a, { Score: 10, IntValue: 11 })));
    observe('class: merged', () => [a.Score, a.IntValue]);
    a.Score = 3;
    a.IntValue = 5;
    state.a0 = a;
});

test('class: create derived', () => {
    const child = must(BP.CreateBlueprintClass(state.cls), 'CreateBlueprintClass(derived)');
    state.child = child;
    state.JsChild = tojs(child);
    const c = new state.JsChild();
    c.Score = 4;
    eq(c.Score, 4);
    observe('derived: instanceof base blueprint', () => c instanceof state.Js);
    observe('derived: prototype chain', () => Object.getPrototypeOf(state.JsChild.prototype) === state.Js.prototype);
    state.c0 = c;
});

step(() => {
    test('class: recompile unchanged', () => {
        const cls = must(BP.RecompileClass(state.cls), 'RecompileClass');
        observe('recompile: same UClass', () => cls === state.cls);
        observe('recompile: same js class', () => tojs(cls) === state.Js);
        observe('recompile: old instance alive', () => Reporter.IsAlive(state.a0));
        observe('recompile: old instance Score', () => state.a0.Score);
        observe('recompile: old instance IntValue', () => state.a0.IntValue);
        const a = new state.Js();
        a.Score = 6;
        eq(a.Score, 6);
        eq(a.Add(2, 3), 5);
    });

    test('class: add variable', () => {
        const cls = must(BP.AddClassVariable(state.cls, 'Label', 'string'), 'AddClassVariable');
        observe('add: same UClass', () => cls === state.cls);
        observe('add: same js class', () => tojs(cls) === state.Js);
        observe('add: has Label', () => BP.HasOwnProperty(cls, 'Label'));
        observe('add: Label on js prototype', () => 'Label' in state.Js.prototype);
        observe('add: old instance alive', () => Reporter.IsAlive(state.a0));
        observe('add: old instance Score', () => state.a0.Score);
        observe('add: old instance Label', () => state.a0.Label);

        const a = new state.Js();
        a.Score = 7;
        observe('add: new instance Score', () => a.Score);
        observe('add: new instance Label', () => a.Label);
        a.Label = 'hello';
        observe('add: new instance Label after write', () => a.Label);
        observe('add: new instance GetClass', () => a.GetClass() === cls);
        state.a1 = a;

        // the merger of the class was created before the recompile, its properties are destroyed
        const m = new state.Js();
        note('add: merge after recompile', catchError(() => puerts.merge(m, { Score: 12, IntValue: 13, Label: 'm' })));
        observe('add: merged', () => [m.Score, m.IntValue]);
    });

    test('class: derived after the base changed', () => {
        observe('derived after add: same js class', () => tojs(state.child) === state.JsChild);
        observe('derived after add: has inherited Label', () => BP.HasOwnProperty(state.cls, 'Label'));
        const c = new state.JsChild();
        c.Score = 8;
        observe('derived after add: new instance Score', () => c.Score);
        observe('derived after add: new instance Label', () => c.Label);
        observe('derived after add: old instance alive', () => Reporter.IsAlive(state.c0));
        state.c1 = c;
    });
});

step(() => {
    test('class: instances after reinstancing and gc', () => {
        observe('gc: first instance alive', () => Reporter.IsAlive(state.a0));
        observe('gc: first instance Score', () => state.a0.Score);
        observe('gc: second instance alive', () => Reporter.IsAlive(state.a1));
        observe('gc: second instance Score', () => state.a1.Score);
        observe('gc: second instance Label', () => state.a1.Label);
        observe('gc: derived instance alive', () => Reporter.IsAlive(state.c0));
        observe('gc: derived instance Score', () => state.c1.Score);
    });

    test('class: remove variable', () => {
        const cls = must(BP.RemoveClassVariable(state.cls, 'Score'), 'RemoveClassVariable');
        observe('remove: same js class', () => tojs(cls) === state.Js);
        observe('remove: has Score', () => BP.HasOwnProperty(cls, 'Score'));
        observe('remove: Score on js prototype', () => 'Score' in state.Js.prototype);
        const a = new state.Js();
        observe('remove: new instance read Score', () => a.Score);
        note('remove: new instance write Score', catchError(() => {
            a.Score = 1;
        }));
        observe('remove: new instance Label', () => a.Label);
        observe('remove: new instance IntValue', () => a.IntValue);
        observe('remove: kept instance read Score', () => state.a1.Score);
        observe('remove: derived new instance read Score', () => new state.JsChild().Score);
        const m = new state.Js();
        note('remove: merge', catchError(() => puerts.merge(m, { Score: 1, IntValue: 2 })));
        observe('remove: merged IntValue', () => m.IntValue);
        state.a2 = a;
    });
});

step(() => {
    test('class: change variable type', () => {
        const cls = must(BP.ChangeClassVariableType(state.cls, 'Label', 'int'), 'ChangeClassVariableType');
        observe('change type: same js class', () => tojs(cls) === state.Js);
        observe('change type: property type', () => BP.PropertyTypeOf(cls, 'Label'));
        const a = new state.Js();
        observe('change type: new instance Label', () => a.Label);
        note('change type: write int', catchError(() => {
            a.Label = 12;
        }));
        observe('change type: read after int write', () => a.Label);
        note('change type: write string', catchError(() => {
            a.Label = 'x';
        }));
        observe('change type: read after string write', () => a.Label);
    });

    test('class: add the removed variable back with another type', () => {
        const cls = must(BP.AddClassVariable(state.cls, 'Score', 'float'), 'AddClassVariable');
        observe('add back: property type', () => BP.PropertyTypeOf(cls, 'Score'));
        const a = new state.Js();
        note('add back: write', catchError(() => {
            a.Score = 1.5;
        }));
        observe('add back: read', () => a.Score);
        const m = new state.Js();
        note('add back: merge', catchError(() => puerts.merge(m, { Score: 2.5, Label: 3, IntValue: 4 })));
        observe('add back: merged IntValue', () => m.IntValue);
    });
});

step(() => {
    test('class: identity at the end', () => {
        observe('end: tojs', () => tojs(state.cls) === state.Js);
        observe('end: derived tojs', () => tojs(state.child) === state.JsChild);
        const c = new state.JsChild();
        observe('end: derived instanceof', () => c instanceof state.Js && c instanceof UE.PuertsTestObject);
        observe('end: derived GetClass', () => c.GetClass() === state.child);
        c.IntValue = 9;
        eq(c.IntValue, 9);
        eq(c.Add(4, 5), 9);
        state.a0 = state.a1 = state.a2 = state.c0 = state.c1 = undefined;
    });
});

// ---------------- user defined struct ----------------

test('struct: create', () => {
    const s = must(BP.CreateUserStruct('Value', 'int'), 'CreateUserStruct');
    state.S = s;
    state.JsS = tojs(s);
    observe('struct: tojs is cached', () => tojs(s) === state.JsS);
    observe('struct: has Value', () => BP.HasOwnProperty(s, 'Value'));
    const v = new state.JsS();
    observe('struct: default Value', () => v.Value);
    v.Value = 7;
    eq(v.Value, 7);
    const arr = UE.NewArray(state.JsS);
    arr.Add(v);
    observe('struct: copied into array', () => arr.Get(0).Value);
    note('struct: js object into array', catchError(() => arr.Add({ Value: 3 })));
    observe('struct: js object element', () => arr.Get(1).Value);
    note('struct: merge', catchError(() => puerts.merge(v, { Value: 21 })));
    observe('struct: merged', () => v.Value);
});

step(() => {
    test('struct: add variable', () => {
        must(BP.AddUserStructVariable(state.S, 'Extra', 'string'), 'AddUserStructVariable');
        observe('struct add: same js class', () => tojs(state.S) === state.JsS);
        observe('struct add: has Extra', () => BP.HasOwnProperty(state.S, 'Extra'));
        observe('struct add: Extra on js prototype', () => 'Extra' in state.JsS.prototype);
        const v = new state.JsS();
        v.Value = 2;
        observe('struct add: new instance Value', () => v.Value);
        observe('struct add: new instance Extra', () => v.Extra);
        note('struct add: write Extra', catchError(() => {
            v.Extra = 'e';
        }));
        observe('struct add: read Extra', () => v.Extra);
        const arr = UE.NewArray(state.JsS);
        note('struct add: js object into array', catchError(() => arr.Add({ Value: 4, Extra: 'x' })));
        observe('struct add: element Value', () => arr.Get(0).Value);
        observe('struct add: element Extra', () => arr.Get(0).Extra);
        // containers made after the layout change must use the new element size (the element property of a struct is cached),
        // or the elements overlap and the strings of Extra are corrupted (crash at the destruction by Empty)
        const many = UE.NewArray(state.JsS);
        for (let i = 1; i <= 8; i++) many.Add({ Value: i, Extra: `a string long enough to be allocated ${i}` });
        const values = (a) => {
            const r = [];
            for (let i = 0; i < a.Num(); i++) r.push(a.Get(i).Value);
            return r.join(',');
        };
        observe('struct add: many elements', () => values(many));
        many.RemoveAt(0);
        many.Add({ Value: 9, Extra: 'last' });
        observe('struct add: many elements after remove', () => values(many));
        many.Empty();
        observe('struct add: emptied', () => many.Num());
        const map = UE.NewMap(UE.BuiltinString, state.JsS);
        for (let i = 1; i <= 4; i++) map.Add(`k${i}`, { Value: i * 10, Extra: `map value string ${i}` });
        observe('struct add: map values', () => [1, 2, 3, 4].map((i) => map.Get(`k${i}`).Value).join(','));
        map.Empty();
        // kept across the rename, which does not change the layout
        state.sv = v;
    });
});

step(() => {
    test('struct: rename variable', () => {
        must(BP.RenameUserStructVariable(state.S, 'Value', 'Amount'), 'RenameUserStructVariable');
        observe('struct rename: same js class', () => tojs(state.S) === state.JsS);
        observe('struct rename: has Value', () => BP.HasOwnProperty(state.S, 'Value'));
        observe('struct rename: has Amount', () => BP.HasOwnProperty(state.S, 'Amount'));
        observe('struct rename: old instance Value', () => state.sv.Value);
        observe('struct rename: old instance Amount', () => state.sv.Amount);
        const v = new state.JsS();
        observe('struct rename: new instance Value', () => v.Value);
        note('struct rename: write Amount', catchError(() => {
            v.Amount = 11;
        }));
        observe('struct rename: read Amount', () => v.Amount);
        observe('struct rename: new instance Extra', () => v.Extra);
        const m = new state.JsS();
        note('struct rename: merge', catchError(() => puerts.merge(m, { Value: 1, Amount: 2, Extra: 'm' })));
        state.sv = undefined;
    });
});

step(() => {
    test('struct: change variable type', () => {
        must(BP.ChangeUserStructVariableType(state.S, 'Extra', 'int'), 'ChangeUserStructVariableType');
        observe('struct change type: property type', () => BP.PropertyTypeOf(state.S, 'Extra'));
        const v = new state.JsS();
        observe('struct change type: new instance Extra', () => v.Extra);
        note('struct change type: write int', catchError(() => {
            v.Extra = 5;
        }));
        observe('struct change type: read', () => v.Extra);
    });
});

step(() => {
    test('struct: remove variable', () => {
        must(BP.RemoveUserStructVariable(state.S, 'Extra'), 'RemoveUserStructVariable');
        observe('struct remove: same js class', () => tojs(state.S) === state.JsS);
        observe('struct remove: has Extra', () => BP.HasOwnProperty(state.S, 'Extra'));
        const v = new state.JsS();
        observe('struct remove: read Extra', () => v.Extra);
        note('struct remove: write Extra', catchError(() => {
            v.Extra = 1;
        }));
        observe('struct remove: Value', () => v.Value);
        observe('struct remove: Amount', () => v.Amount);
        const arr = UE.NewArray(state.JsS);
        note('struct remove: js object into array', catchError(() => arr.Add({ Extra: 1 })));
        observe('struct remove: array length', () => arr.Num());
    });
});

run();
