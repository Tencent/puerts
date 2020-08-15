#pragma once

#if ENGINE_MINOR_VERSION >= 25
    #define PropertyMacro FProperty

    #define NumericPropertyMacro FNumericProperty

    #define BytePropertyMacro FByteProperty

    #define Int8PropertyMacro FInt8Property

    #define Int16PropertyMacro FInt16Property

    #define IntPropertyMacro FIntProperty

    #define Int64PropertyMacro FInt64Property

    #define UInt16PropertyMacro FUInt16Property

    #define UInt32PropertyMacro FUInt32Property

    #define UInt64PropertyMacro FUInt64Property

    #define FloatPropertyMacro FFloatProperty

    #define DoublePropertyMacro FDoubleProperty

    #define BoolPropertyMacro FBoolProperty

    #define ObjectPropertyBaseMacro FObjectPropertyBase

    #define ObjectPropertyMacro FObjectProperty

    #define WeakObjectPropertyMacro FWeakObjectProperty

    #define LazyObjectPropertyMacro FLazyObjectProperty

    #define SoftObjectPropertyMacro FSoftObjectProperty

    #define ClassPropertyMacro FClassProperty

    #define SoftClassPropertyMacro FSoftClassProperty

    #define InterfacePropertyMacro FInterfaceProperty

    #define NamePropertyMacro FNameProperty

    #define StrPropertyMacro FStrProperty

    #define ArrayPropertyMacro FArrayProperty

    #define MapPropertyMacro FMapProperty

    #define SetPropertyMacro FSetProperty

    #define StructPropertyMacro FStructProperty
    
    #define DelegatePropertyMacro FDelegateProperty

    #define MulticastDelegatePropertyMacro FMulticastDelegateProperty

    #define MulticastInlineDelegatePropertyMacro FMulticastInlineDelegateProperty

    #define MulticastSparseDelegatePropertyMacro FMulticastSparseDelegateProperty

    #define EnumPropertyMacro FEnumProperty

    #define TextPropertyMacro FTextProperty
    
    #define CastFieldMacro CastField
#else
    #define PropertyMacro UProperty

    #define NumericPropertyMacro UNumericProperty

    #define BytePropertyMacro UByteProperty

    #define Int8PropertyMacro UInt8Property

    #define Int16PropertyMacro UInt16Property

    #define IntPropertyMacro UIntProperty

    #define Int64PropertyMacro UInt64Property

    #define UInt16PropertyMacro UUInt16Property

    #define UInt32PropertyMacro UUInt32Property

    #define UInt64PropertyMacro UUInt64Property

    #define FloatPropertyMacro UFloatProperty

    #define DoublePropertyMacro UDoubleProperty

    #define BoolPropertyMacro UBoolProperty

    #define ObjectPropertyBaseMacro UObjectPropertyBase

    #define ObjectPropertyMacro UObjectProperty

    #define WeakObjectPropertyMacro UWeakObjectProperty

    #define LazyObjectPropertyMacro ULazyObjectProperty

    #define SoftObjectPropertyMacro USoftObjectProperty

    #define ClassPropertyMacro UClassProperty

    #define SoftClassPropertyMacro USoftClassProperty

    #define InterfacePropertyMacro UInterfaceProperty

    #define NamePropertyMacro UNameProperty

    #define StrPropertyMacro UStrProperty

    #define ArrayPropertyMacro UArrayProperty

    #define MapPropertyMacro UMapProperty

    #define SetPropertyMacro USetProperty

    #define StructPropertyMacro UStructProperty
    
    #define DelegatePropertyMacro UDelegateProperty

    #define MulticastDelegatePropertyMacro UMulticastDelegateProperty

    #define MulticastInlineDelegatePropertyMacro UMulticastInlineDelegateProperty

    #define MulticastSparseDelegatePropertyMacro UMulticastSparseDelegateProperty

    #define EnumPropertyMacro UEnumProperty

    #define TextPropertyMacro UTextProperty
    
    #define CastFieldMacro Cast

#endif

