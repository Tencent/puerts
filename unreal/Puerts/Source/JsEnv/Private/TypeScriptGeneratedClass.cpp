// Fill out your copyright notice in the Description page of Project Settings.


#include "TypeScriptGeneratedClass.h"
#include "PropertyMacros.h"
#include "JSGeneratedFunction.h"

void UTypeScriptGeneratedClass::StaticConstructor(const FObjectInitializer& ObjectInitializer)
{
    auto Class = ObjectInitializer.GetClass();

    //UE_LOG(LogTemp, Error, TEXT("UTypeScriptGeneratedClass::StaticConstructor"));
    if (auto TypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(Class))
    {
        TypeScriptGeneratedClass->ObjectInitialize(ObjectInitializer);
    }
    else if (auto SuperTypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(Class->GetSuperClass()))
    {
        SuperTypeScriptGeneratedClass->ObjectInitialize(ObjectInitializer);
    }
    else
    {
        Class->GetSuperClass()->ClassConstructor(ObjectInitializer);
    }
}

void UTypeScriptGeneratedClass::ObjectInitialize(const FObjectInitializer& ObjectInitializer)
{
    auto Object = ObjectInitializer.GetObj();
    if (auto SuperTypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(GetSuperClass()))
    {
        SuperTypeScriptGeneratedClass->ObjectInitialize(ObjectInitializer);
    }
    else
    {
        GetSuperClass()->ClassConstructor(ObjectInitializer);
    }

    auto PinedDynamicInvoker = DynamicInvoker.Pin();
    if (PinedDynamicInvoker)
    {
        PinedDynamicInvoker->Construct(this, Object, Constructor, Prototype);
    }
}

void UTypeScriptGeneratedClass::Bind()
{
    //普通对象会从CDO拷贝，而CDO会从蓝图AR那反序列化（见UBlueprintGeneratedClass::SerializeDefaultObject），这会
    //导致TS的构造函数对生成的蓝图变量赋值都失效，不太符合程序员直觉，设置CPF_SkipSerialization可以跳过这个过程。
    //然而在构造对象还有一个PostConstructInit步骤，里头有个从基类的CDO拷贝值的过程（ps：UE对象构造巨复杂，对象巨大）
    //这个过程如果是CDO的话，目前只找到把属性的flag设置为CPF_Transient | CPF_InstancedReference才能搞定
    //TODO: 后续尝试下TypeScript生成类不继承UBlueprintGeneratedClass的实现，能实现的话优雅些
    for (TFieldIterator<PropertyMacro> PropertyIt(this, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        PropertyMacro *Property = *PropertyIt;
        Property->SetPropertyFlags(CPF_SkipSerialization | CPF_Transient | CPF_InstancedReference);
    }

    //可避免非CDO的在PostConstructInit从基类拷贝值
    //ClassFlags |= CLASS_Native;

    for (TFieldIterator<UFunction> FuncIt(this, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
    {
        auto Function = *FuncIt;
        if (Function->IsA<UJSGeneratedFunction>())
        {
            Function->FunctionFlags |= FUNC_BlueprintCallable | FUNC_BlueprintEvent | FUNC_Public | FUNC_Native;
            Function->SetNativeFunc(&UJSGeneratedFunction::execCallJS);
            AddNativeFunction(*Function->GetName(), &UJSGeneratedFunction::execCallJS);
        }
    }

    Super::Bind();
    ReBind = true;
}