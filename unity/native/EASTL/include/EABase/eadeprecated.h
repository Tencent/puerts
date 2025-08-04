/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Electronic Arts Inc. All rights reserved.
/////////////////////////////////////////////////////////////////////////////////

#ifndef EABASE_EADEPRECATED_H
#define EABASE_EADEPRECATED_H

#include <EABase/eabase.h>

#if defined(EA_PRAGMA_ONCE_SUPPORTED)
	#pragma once
#endif


/////////////////////////////////////////////////////////////////////////////////
//
// Documentation on deprecated attribute: https://en.cppreference.com/w/cpp/language/attributes/deprecated
// Documentation on SimVer version numbers: http://simver.org/
//
// These macros provide a structured formatting to C++ deprecated annotation messages. This ensures
//  that the required information is presented in a standard format for developers and tools.
//
// Example usage:
//
// Current package version : current_ver
// Future version for code removal : major_ver, minor_ver, change_ver
// Deprecation comment : ""
//
// 	EA_DEPRECATED_API(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated function")
// 	void TestFunc() {}
//
// 	EA_DEPRECATED_API(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated typedef")
// 	typedef int TestTypedef;
//
// 	EA_DEPRECATED_API(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated variable")
// 	int TestVariable;
//
// 	EA_DEPRECATED_STRUCT(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated struct")
// 	TestStruct {};
//
// 	EA_DEPRECATED_CLASS(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated class")
// 	TestClass {};
//
// 	union TestUnion
// 	{
// 		EA_DEPRECATED_API(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated data member") int n;
// 	};
//
// 	EA_DEPRECATED_ENUM(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated enumeration")
// 	TestEnumeration { TestEnumeration_Value1, TestEnumeration_Value2 };
//
// 	enum TestEnumerator
// 	{
// 		EA_DEPRECATED_ENUMVALUE(TestEnumerator_Value1, current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated enum value") = 5,
// 		TestEnumerator_Value2 = 4
// 	};
//
// 	EA_DISABLE_DEPRECATED(current_ver, major_ver, minor_ver, change_ver, tag, "Suppress the deprecated warning until the given Release")
// 	void TestFunc() {}
// 	EA_RESTORE_DEPRECATED()
//

/////////////////////////////////////////////////////////////////////////////////
//
// Create an integer version number which can be compared with numerical operators
//
#define EA_CREATE_VERSION(MAJOR, MINOR, PATCH)							\
	(((MAJOR) * 1000000) + (((MINOR) + 1) * 10000) + (((PATCH) + 1) * 100))


/////////////////////////////////////////////////////////////////////////////////
//
// INTERNAL MACROS - DO NOT USE DIRECTLY
//
// When EA_DEPRECATED_API_EXPIRED_IS_ERROR this macro produce a static asset on code that is past the expiry date.
//
#if defined(EA_DEPRECATED_API_EXPIRED_IS_ERROR) && EA_DEPRECATED_API_EXPIRED_IS_ERROR
#define EA_INTERNAL_DEPRECATED_BEFORETYPE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation) \
	static_assert(_moduleVersion < EA_CREATE_VERSION(_major_version,_minor_version,_patch_version), "This API has been deprecated and needs to be removed");
#else
	#define EA_INTERNAL_DEPRECATED_BEFORETYPE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation)
#endif


/////////////////////////////////////////////////////////////////////////////////
//
// INTERNAL MACROS - DO NOT USE DIRECTLY
//
// When EA_IGNORE_DEPRECATION is set deprecation annotation will not be produced
//
#if defined(EA_IGNORE_DEPRECATION) && EA_IGNORE_DEPRECATION
	#define EA_INTERNAL_DEPRECATED_AFTERTYPE(_major_version, _minor_version, _patch_version, _annotation, _msg)
#else
#define EA_INTERNAL_DEPRECATED_AFTERTYPE(_major_version, _minor_version, _patch_version, _annotation, _msg)	\
	EA_DEPRECATED_MESSAGE(_msg. This API will be removed in _major_version._minor_version._patch_version _annotation)
#endif

/////////////////////////////////////////////////////////////////////////////////
//
// INTERNAL MACROS - DO NOT USE DIRECTLY
//
// Simple case
//
#define EA_INTERNAL_DEPRECATED_SIMPLE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg) \
	EA_INTERNAL_DEPRECATED_BEFORETYPE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation) \
	EA_INTERNAL_DEPRECATED_AFTERTYPE(_major_version, _minor_version, _patch_version, _annotation, _msg)


// ------------------------------------------------------------------------
// INTERNAL MACROS - DO NOT USE DIRECTLY
//
// Macro which inserts the keyword to correctly format the deprecation annotation
#define EA_INTERNAL_DEPRECATED_TYPE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg, _keyword) \
	EA_INTERNAL_DEPRECATED_BEFORETYPE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation) \
	_keyword															\
	EA_INTERNAL_DEPRECATED_AFTERTYPE(_major_version, _minor_version, _patch_version, _annotation, _msg)



/////////////////////////////////////////////////////////////////////////////////
//
// PUBLIC MACROS
// See file header comment for example usage.
//

/////////////////////////////////////////////////////////////////////////////////
//
// 	EA_DEPRECATED_API(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated function")
// 	void TestFunc() {}
//
// 	EA_DEPRECATED_API(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated typedef")
// 	typedef int TestTypedef;
//
// 	EA_DEPRECATED_API(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated variable")
// 	int TestVariable;
//
#define EA_DEPRECATED_API(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg) \
	EA_INTERNAL_DEPRECATED_SIMPLE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg)


/////////////////////////////////////////////////////////////////////////////////
//
// 	EA_DEPRECATED_STRUCT(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated struct")
// 	TestStruct {};
//
#define EA_DEPRECATED_STRUCT(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg)	\
	EA_INTERNAL_DEPRECATED_TYPE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg, struct)


/////////////////////////////////////////////////////////////////////////////////
//
// 	EA_DEPRECATED_CLASS(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated class")
// 	TestClass {};
//
#define EA_DEPRECATED_CLASS(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg) \
	EA_INTERNAL_DEPRECATED_TYPE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg, class)


/////////////////////////////////////////////////////////////////////////////////
//
// 	EA_DEPRECATED_ENUM(current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated enumeration")
// 	TestEnumeration { TestEnumeration_Value1, TestEnumeration_Value2 };
//
#define EA_DEPRECATED_ENUM(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg) \
	EA_INTERNAL_DEPRECATED_TYPE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg, enum)


/////////////////////////////////////////////////////////////////////////////////
//
// 	enum TestEnumerator
// 	{
// 		EA_DEPRECATED_ENUMVALUE(TestEnumerator_Value1, current_ver, major_ver, minor_ver, change_ver, tag, "Do not use deprecated enum value") = 5,
// 		TestEnumerator_Value2 = 4
// 	};
//
#define EA_DEPRECATED_ENUMVALUE(_value, _moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg) \
	_value EA_INTERNAL_DEPRECATED_AFTERTYPE(_major_version, _minor_version, _patch_version, _annotation, _msg)


/////////////////////////////////////////////////////////////////////////////////
//
// Suppress deprecated warnings around a block of code, see file comment for full usage.
//  EA_DISABLE_DEPRECATED(current_ver, major_ver, minor_ver, change_ver, tag, "Suppress the deprecated warning until the given Release")
//
#define EA_DISABLE_DEPRECATED(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation, _msg) \
	EA_INTERNAL_DEPRECATED_BEFORETYPE(_moduleVersion, _major_version, _minor_version, _patch_version, _annotation) \
	EA_DISABLE_VC_WARNING(4996);										\
	EA_DISABLE_CLANG_WARNING(-Wdeprecated-declarations);

/////////////////////////////////////////////////////////////////////////////////
//
// Restore the compiler warnings
//  EA_RESTORE_DEPRECATED()
//
#define EA_RESTORE_DEPRECATED()					\
	EA_RESTORE_CLANG_WARNING();					\
	EA_RESTORE_VC_WARNING();


/////////////////////////////////////////////////////////////////////////////////////
// Some of our code doesn't have fixed cadence on when major/minor/patch versions are updated, the
// following macros are for use when the deprecation window needs to be independent from the version
// numbers. We'll be providing these as needed in six months increments.


// EA_DEPRECATIONS_FOR_2024_APRIL
// This macro is provided as a means to disable warnings temporarily (in particular if a user is compiling with warnings as errors).
// All deprecations raised by this macro (when it is EA_ENABLED) are scheduled for removal approximately April 2024.
#ifndef EA_DEPRECATIONS_FOR_2024_APRIL
	#define EA_DEPRECATIONS_FOR_2024_APRIL EA_ENABLED
#endif

#if EA_IS_ENABLED(EA_DEPRECATIONS_FOR_2024_APRIL)
	#define EA_REMOVE_AT_2024_APRIL EA_DEPRECATED
	#define EA_REMOVE_AT_2024_APRIL_MSG EA_DEPRECATED_MESSAGE
#else
	#define EA_REMOVE_AT_2024_APRIL
	#define EA_REMOVE_AT_2024_APRIL_MSG(msg)
#endif

// EA_DEPRECATIONS_FOR_2024_SEPT
// This macro is provided as a means to disable warnings temporarily (in particular if a user is compiling with warnings as errors).
// All deprecations raised by this macro (when it is EA_ENABLED) are scheduled for removal approximately September 2024.
#ifndef EA_DEPRECATIONS_FOR_2024_SEPT
	#define EA_DEPRECATIONS_FOR_2024_SEPT EA_ENABLED
#endif

#if EA_IS_ENABLED(EA_DEPRECATIONS_FOR_2024_SEPT)
	#define EA_REMOVE_AT_2024_SEPT EA_DEPRECATED
	#define EA_REMOVE_AT_2024_SEPT_MSG EA_DEPRECATED_MESSAGE
#else
	#define EA_REMOVE_AT_2024_SEPT
	#define EA_REMOVE_AT_2024_SEPT_MSG(msg)
#endif

// EA_DEPRECATIONS_FOR_2025_APRIL
// This macro is provided as a means to disable warnings temporarily (in particular if a user is compiling with warnings as errors).
// All deprecations raised by this macro (when it is EA_ENABLED) are scheduled for removal approximately April 2025.
#ifndef EA_DEPRECATIONS_FOR_2025_APRIL
	#define EA_DEPRECATIONS_FOR_2025_APRIL EA_ENABLED
#endif

#if EA_IS_ENABLED(EA_DEPRECATIONS_FOR_2025_APRIL)
	#define EA_REMOVE_AT_2025_APRIL EA_DEPRECATED
	#define EA_REMOVE_AT_2025_APRIL_MSG EA_DEPRECATED_MESSAGE
#else
	#define EA_REMOVE_AT_2025_APRIL
	#define EA_REMOVE_AT_2025_APRIL_MSG(msg)
#endif


#endif /* EABASE_EADEPRECATED_H */
