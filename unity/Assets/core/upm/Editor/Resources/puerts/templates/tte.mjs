/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
class TTFor {
    constructor(str) {
        this.str = str;
    }

    toString() {
        return this.str;
    }
}
class TTIf {
    constructor(exp) {
        this.b = !!exp;
    }
    isTrue() { return this.b }
    isFalse() { return !this.b }
    toString() {
        throw new Error('invalid TTE use. please sure that you use the template literal as tagged template');
    }
};
class TTEndif { };
class TTElse { };
class TTElseif {
    constructor(exp) {
        this.b = !!exp;
    }
    isTrue() { return this.b }
    isFalse() { return !this.b }
    toString() {
        throw new Error('invalid TTE use. please sure that you use the template literal as tagged template');
    }
}

let scopeLevel = 0;
let resultInScope = [];
function enterScope() {
    const curScopeLevel = scopeLevel++
    resultInScope[curScopeLevel] = [];
    return curScopeLevel
}
function exitScope(curScopeLevel) {
    const ret = resultInScope[curScopeLevel];
    resultInScope[curScopeLevel] = [];
    scopeLevel--;
    return ret
}
export default function TaggedTemplateEngine(str, ...exps) {
    let ret = '';
    let justAddedAnEmptyExp = false;
    let ifStack = [];
    let i = -1;
    while (i < str.length - 2) {
        i++;
        // handle str
        if (!ifStack.length || ifStack[ifStack.length - 1].isTrue()) {
            appendStr(str[i])
        }
        justAddedAnEmptyExp = false;

        // handle exp
        if (exps[i] == IF) throw new Error('tte.IF must be used as a function');
        if (exps[i] == ENDIF) throw new Error('tte.ENDIF must be used as a function');
        if (exps[i] == ELSE) throw new Error('tte.ELSE must be used as a function');
        if (exps[i] == ELSEIF) throw new Error('tte.ELSEIF must be used as a function');

        if (ifStack.length) {
            if (exps[i] === TTEndif) {
                ifStack.pop();
                justAddedAnEmptyExp = true;
                continue;
            }
            if (exps[i] === TTElse) {
                const curif = ifStack[ifStack.length - 1]
                curif.b = !curif.b
                justAddedAnEmptyExp = true;
                continue;
            }
            if (exps[i] instanceof TTElseif) {
                const curif = ifStack[ifStack.length - 1]
                curif.b = !curif.b && exps[i].b
                justAddedAnEmptyExp = true;
                continue;
            }
            if (ifStack[ifStack.length - 1].isFalse()) {
                if (exps[i] instanceof TTIf) {
                    ifStack.push(new IF(false));
                }
                continue;
            }
        }
        if (exps[i] instanceof TTIf) {
            ifStack.push(exps[i]);
            justAddedAnEmptyExp = true;
            continue;
        }
        if (exps[i] === TTElse) throw new Error('unexpected else');
        if (exps[i] instanceof TTElseif) throw new Error('unexpected elseif');
        if (exps[i] === TTEndif) throw new Error('unexpected endif');

        if (exps[i] instanceof TTFor) {
            justAddedAnEmptyExp = true;
        }
        appendStr(exps[i].toString());

        if (exps[i].trim && exps[i].trim() == "") {
            justAddedAnEmptyExp = true;
        }
    }
    appendStr(str[i + 1]);

    function appendStr(str) {
        // 如果一行里除了 IF ELSE ELSEIF ENDIF没有其它东西，最终会形成一个空行，可以切掉。
        if (justAddedAnEmptyExp) {
            const [retLastLineSeq, strFirstLineSeq] = WillConnectWithAnEmptyLine(ret, str)
            if (retLastLineSeq != void 0 && strFirstLineSeq != void 0) {
                ret = ret.substring(0, retLastLineSeq);
                str = str.substring(strFirstLineSeq);
            }
        }
        ret += str;
    }
    function WillConnectWithAnEmptyLine(str1, str2) {
        if (!str1.indexOf || !str2.indexOf) return [];
        const str1LastLineSeq = str1.lastIndexOf('\n');
        const str2FirstLineSeq = str2.indexOf('\n');
        if (
            str1LastLineSeq != -1 && str1.substring(str1LastLineSeq).trim()== "" && 
            str2FirstLineSeq != -1 && str2.substring(0, str2FirstLineSeq).trim() == ""
        ) {
            return [str1LastLineSeq, str2FirstLineSeq]
        } else {
            return [];
        }
    }

    if (scopeLevel) {
        resultInScope[scopeLevel - 1].push(ret);
    }
    return ret;
}

class Elser {
    constructor(b, contentFn) {
        if (b) {
            const scope = enterScope();
            let ret = contentFn();
            let scopeRet = exitScope(scope);
            this.content = ret || scopeRet.join('');
            this.done = true;
        }
    }
    ELSE(contentFn) {
        if (!this.done) {
            const scope = enterScope();
            let ret = contentFn();
            let scopeRet = exitScope(scope);
            this.content = ret || scopeRet.join('');
            this.done = true;
        }
        return this;
    }
    ELSEIF(b, contentFn) {
        if (!this.done && b) {
            const scope = enterScope();
            let ret = contentFn();
            let scopeRet = exitScope(scope);
            this.content = ret || scopeRet.join('');
            this.done = true;
        }
        return this;
    }
    toString() {
        return this.content || "";
    }
}
export function IF(b, contentFn) {
    if (!contentFn) {
        return new TTIf(b);

    } else {
        return new Elser(b, contentFn);
    }
}
export function ELSE() {
    return TTElse
}
export function ELSEIF(b) {
    return new TTElseif(b);
}
export function ENDIF() {
    return TTEndif
}
export function FOR(arr, fn, joiner = '') {
    if (!arr || !(arr instanceof Array)) return '';

    let scope = enterScope();
    let ret = arr.map(fn);
    var resultInScope = exitScope(scope);

    if (ret.filter(item => item !== void 0) == 0) {
        ret = resultInScope;
    }

    return new TTFor(ret
        .filter(str => !str.trim || str.trim() != "")
        .map(str => { 
            if (!str.lastIndexOf) return str;
            const lastLineSeq = str.lastIndexOf('\n'); 
            if (str.substring(lastLineSeq).trim() == "") return str.substring(0, lastLineSeq);
            else return str;
        })
        .join(joiner)
    );
}

if (typeof process != 'undefined' && process.env.__TEST == 1) {

    assertEqual(TaggedTemplateEngine`1`, '1')
    assertEqual(TaggedTemplateEngine`1${2}1`, '121')
    assertEqual(TaggedTemplateEngine`1${new class { toString() { return '3' } }}1`, '131')
    assertEqual(TaggedTemplateEngine`1${IF(true)}2${ENDIF()}1`, '121')
    assertEqual(TaggedTemplateEngine`1${IF(false)}2${ENDIF()}1`, '11')
    assertEqual(TaggedTemplateEngine`1${IF(false)}2${ELSE()}3${ENDIF()}1`, '131')
    assertEqual(TaggedTemplateEngine`1${IF(true)}2${ELSE()}3${ENDIF()}1`, '121')
    assertEqual(TaggedTemplateEngine`1${IF(true)}2${ELSEIF(false)}3${ENDIF()}1`, '121')
    assertEqual(TaggedTemplateEngine`1${IF(false)}2${ELSEIF(false)}3${ELSE()}4${ENDIF()}1`, '141')
    assertEqual(TaggedTemplateEngine`1${IF(false)}2${IF(true)}3${ENDIF()}2${ENDIF()}1`, '11')
    assertEqual(TaggedTemplateEngine`1${IF(true)}2${IF(false)}3${ENDIF()}2${ENDIF()}1`, '1221')
    assertEqual(TaggedTemplateEngine`1${IF(true)}2${IF(false)}3${IF(true)}4${ENDIF()}3${ENDIF()}2${ENDIF()}1`, '1221')
    assertEqual(TaggedTemplateEngine`1${FOR([2, 3, 4], item => item)}5`, '12345');
    assertEqual(TaggedTemplateEngine`1${FOR([2, 3, 4], item => { TaggedTemplateEngine`_` })}5`, '1___5');
    assertEqual(TaggedTemplateEngine`1 ${FOR([2, 3], item => { TaggedTemplateEngine`${FOR([4, 5], jtem => TaggedTemplateEngine`${item}*${jtem}=${item * jtem}`, ' ')}` }, ' ')} 5`, '1 2*4=8 2*5=10 3*4=12 3*5=15 5');
    assertEqual(TaggedTemplateEngine`1${IF(true, () => '2')}3`, '123');
    assertEqual(TaggedTemplateEngine`1${IF(false, () => '2').ELSE(()=> '3')}4`, '134');
    assertEqual(TaggedTemplateEngine`1${IF(false, () => '2').ELSEIF(true, ()=> '3').ELSE(()=> '4')}5`, '135');
    assertEqual(TaggedTemplateEngine`1${IF(false, () => '2').ELSEIF(false, ()=> '3').ELSE(()=> '4')}5`, '145');
    assertEqual(TaggedTemplateEngine`1${IF(true, () => {TaggedTemplateEngine`2`})}3`, '123');
    assertEqual(TaggedTemplateEngine`1
    ${'      '}
    1`, '1\n    1')
    assertEqual(TaggedTemplateEngine`1
    ${IF(false)}
    2
    ${ELSE()}
    3
    ${ENDIF()}
    1`, '1\n    3\n    1')
    assertEqual(TaggedTemplateEngine`1
    ${IF(true)}
    2
    ${ELSE()}
    3
    ${ENDIF()}
    1`, '1\n    2\n    1')
    assertEqual(TaggedTemplateEngine`1
    ${FOR([2, 3, 4], item => `
    ${item}
    `)}
    1`, '1\n    2\n    3\n    4\n    1')
    assertEqual(TaggedTemplateEngine`
    struct 1
    {
        ${FOR([2,3,4], (s, i) => TaggedTemplateEngine`
        p${i};
        `)}
    };`, '1')
    assertThrow(() => TaggedTemplateEngine`${IF}`, 'must be used as a function')
    assertThrow(() => TaggedTemplateEngine`${IF(true)}1${ENDIF}`, 'must be used as a function')
    assertThrow(() => TaggedTemplateEngine`${IF(true)}1${ENDIF()}${ENDIF()}2`, 'unexpected endif')

    function assertEqual(a, b) {
        if (a != b) {
            throw new Error(`${a} != ${b}`);
        }
    }
    function assertThrow(a, message) {
        let res;
        try {
            res = a()
        } catch (e) {
            if (e.message.indexOf(message) != -1) return;
            throw new Error(`thrown error ${e.message}. does not detected error '${message}'`);
        }
        throw new Error(`got result ${res}. does not detected error '${message}'`);
    }
    console.log('all passed');
}