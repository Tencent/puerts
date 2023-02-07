using Puerts;
using System;
using System.Collections.Generic;

[Configure]
public class PuerCfg {
    [Binding]
    public static List<Type> binding {
        get {
            return new List<Type>{
                typeof(UnityEngine.UIElements.UQueryExtensions)
            };
        }
    }
}