using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Collections;
using System;
using NUnit.Framework;

public class Tester : MonoBehaviour {

    public Text m_ContentText;
    public Button m_StartBtn;
    public Button m_StopBtn;

    public bool IsTesting = false;

    void Start() {

        string MockConsoleContent = "";
        IsTesting = true;

        StartCoroutine(
            RunTest(
                (string name) => {
                    MockConsoleContent += $"Passed: TestCase {name}\n";
                    UnityEngine.Debug.Log($"Passed: TestCase {name}\n");
                    m_ContentText.text = MockConsoleContent;
                },
                (string name, Exception e) => {
                    MockConsoleContent += $"Failed: TestCase {name}\n";
                    UnityEngine.Debug.LogError($"Failed: TestCase {name}\n");
                    UnityEngine.Debug.LogError(e);
                    m_ContentText.text = MockConsoleContent;
                }
            )
        );
    }

    private IEnumerator RunTest(Action<string> OnSuccess, Action<string, Exception> OnFail)
    {
        UnityEngine.Debug.Log("Start RunTest");
        var types = from assembly in AppDomain.CurrentDomain.GetAssemblies()
                    // where !(assembly.ManifestModule is System.Reflection.Emit.ModuleBuilder)
                    from type in assembly.GetTypes()
                    where type.IsDefined(typeof(TestFixtureAttribute), false)
                    select type;

        foreach (var type in types)
        {
            var testInstance = System.Activator.CreateInstance(type);

            foreach (var method in type.GetMethods(BindingFlags.Instance | BindingFlags.Public
                | BindingFlags.NonPublic | BindingFlags.DeclaredOnly))
            {
                foreach (var ca in method.GetCustomAttributes(false))
                {
                    yield return null;
                    if (IsTesting && ca.GetType() == typeof(TestAttribute)) 
                    {
                        // if (method.Name != "InstanceMethodTest11") continue;
                        // if (!method.DeclaringType.Name.Contains("TimerTest")) continue;
                        UnityEngine.Debug.Log($"Started: TestCase {method.Name}\n");
                        try 
                        {
                            method.Invoke(testInstance, null);
                        } 
                        catch (TargetInvocationException e) 
                        {
                            OnFail(method.Name, e.GetBaseException());
                            continue;
                        }
                        catch (Exception e) 
                        {
                            OnFail(method.Name, e);
                            continue;
                        }
                        OnSuccess(method.Name);
                    }
                }
            }            
        }
    }
}