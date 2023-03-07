let Assert_AreEqual = CS.NUnit.Framework.Assert.AreEqual


let IntList = puer.$generic(CS.System.Collections.Generic.List$1, CS.System.Int32);
let list = new IntList();
list.Add(1);
list.Add(2);

let IntDict = puer.$generic(CS.System.Collections.Generic.Dictionary$2, CS.System.Int32, CS.System.Int32);
let dict = new IntDict();
dict.Add(10, 20);
dict.Add(30, 40);
let total = 0;
for (const listElement of list) {
    total += listElement;
}
for (const dictElement of dict) {
    total += dictElement.Key + dictElement.Value;
}
Assert_AreEqual(total, 103);


let StringList = puer.$generic(CS.System.Collections.Generic.List$1, CS.System.String);
let listFromCS = CS.Puerts.UnitTest.ForofTestHelper.GetAStringList();
let ret = [];
for (const element of listFromCS) {
    ret.push(element);
}
Assert_AreEqual(ret.join(" "), "puerts really good");