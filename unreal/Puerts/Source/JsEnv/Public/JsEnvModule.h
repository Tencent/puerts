#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleInterface.h"
#include "Modules/ModuleManager.h"

/**
 * The public interface to this module
 */
class IJsEnvModule : public IModuleInterface
{

public:

	/**
	 * Singleton-like access to this module's interface.  This is just for convenience!
	 * Beware of calling this during the shutdown phase, though.  Your module might have been unloaded already.
	 *
	 * @return Returns singleton instance, loading the module on demand if needed
	 */
	static inline IJsEnvModule& Get()
	{
		return FModuleManager::LoadModuleChecked< IJsEnvModule >( "JsEnv" );
	}

	/**
	 * Checks to see if this module is loaded and ready.  It is only valid to call Get() if IsAvailable() returns true.
	 *
	 * @return True if the module is loaded and ready to use
	 */
	static inline bool IsAvailable()
	{
		return FModuleManager::Get().IsModuleLoaded( "JsEnv" );
	}

#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC
	virtual void* GetV8Platform() = 0;
#endif
};

