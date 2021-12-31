/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JSModuleLoader.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"
#include "Engine.h"
#include "Algo/Reverse.h"

namespace puerts
{
    static FString PathNormalize(const FString& PathIn)
    {
    	// --> modified by ksg begin
    	// liangcheng: 原生算法并不能将path转换成绝对路径，当require相对路径不一样，则会重复require
        // TArray<FString> PathFrags;
        // PathIn.ParseIntoArray(PathFrags, TEXT("/"));
        // Algo::Reverse(PathFrags);
        // TArray<FString> NewPathFrags;
        // bool FromRoot = PathIn.StartsWith(TEXT("/"));
        // while (PathFrags.Num() > 0) {
        //     FString E = PathFrags.Pop();
        //     if (E != TEXT("") && E != TEXT("."))
        //     {
        //         if (E == TEXT("..") && NewPathFrags.Num() > 0 && NewPathFrags.Last() != TEXT("..")) {
        //             NewPathFrags.Pop();
        //         }
        //         else {
        //             NewPathFrags.Push(E);
        //         }
        //     }
        // }
        // if (FromRoot)
        // {
        //     return TEXT("/") + FString::Join(NewPathFrags, TEXT("/"));
        // }
        // else
        // {
        //     return FString::Join(NewPathFrags, TEXT("/"));
        // }
    	return FPaths::ConvertRelativePathToFull(PathIn);
    	// --< end
    }

	bool DefaultJSModuleLoader::CheckExists(const FString& PathIn, FString& Path, FString& AbsolutePath)
	{
        IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
        FString NormalizedPath = PathNormalize(PathIn);
		if (PlatformFile.FileExists(*NormalizedPath))
		{
            AbsolutePath = IFileManager::Get().ConvertToAbsolutePathForExternalAppForRead(*NormalizedPath);
            Path = NormalizedPath;
            return true;
		}

		return false;
	}

	bool DefaultJSModuleLoader::SearchModuleInDir(const FString& Dir, const FString&RequiredModule, FString& Path, FString& AbsolutePath)
	{
        if (FPaths::GetExtension(RequiredModule) == TEXT(""))
        {
            return SearchModuleWithExtInDir(Dir, RequiredModule + ".js", Path, AbsolutePath)
                || SearchModuleWithExtInDir(Dir, RequiredModule / "index.js", Path, AbsolutePath)
                || SearchModuleWithExtInDir(Dir, RequiredModule / "package.json", Path, AbsolutePath);
        }
        else
        {
            return SearchModuleWithExtInDir(Dir, RequiredModule, Path, AbsolutePath);
        }
	}

    bool DefaultJSModuleLoader::SearchModuleWithExtInDir(const FString& Dir, const FString&RequiredModule, FString& Path, FString& AbsolutePath)
    {
        return CheckExists(Dir / RequiredModule, Path, AbsolutePath)
            || (!Dir.EndsWith(TEXT("node_modules")) && CheckExists(Dir / TEXT("node_modules") / RequiredModule, Path, AbsolutePath));
    }

	bool DefaultJSModuleLoader::Search(const FString& RequiredDir, const FString& RequiredModule, FString& Path, FString& AbsolutePath)
	{
        if (SearchModuleInDir(RequiredDir, RequiredModule, Path, AbsolutePath))
        {
            return true;
        }
        // --> modified by ksg begin
        // tiansen:此处去掉contains("/")条件判断，该条件判断会导致部分插件查找不到（比如：@protobufjs/aspromise）
        // else if (RequiredDir != TEXT("") && !RequiredModule.GetCharArray().Contains('/') && !RequiredModule.EndsWith(TEXT(".js")))
        else if (RequiredDir != TEXT("") && !RequiredModule.EndsWith(TEXT(".js")))
        // --< end
        {
            // 调用require的文件所在的目录往上找
            TArray<FString> pathFrags;
            RequiredDir.ParseIntoArray(pathFrags, TEXT("/"));
            pathFrags.Pop(); // has try in "if (SearchModuleInDir(RequiredDir, RequiredModule, Path, AbsolutePath))"
            while (pathFrags.Num() > 0)
            {
                if (!pathFrags.Last().Equals(TEXT("node_modules")))
                {
                    if (SearchModuleInDir(FString::Join(pathFrags, TEXT("/")), RequiredModule, Path, AbsolutePath))
                    {
                        return true;
                    }
                }
                pathFrags.Pop();
            }
        }

		return SearchModuleInDir(FPaths::ProjectContentDir() / ScriptRoot, RequiredModule, Path, AbsolutePath)
            // Modify by Song Fuhao 解决插件自带脚本启动寻址问题
            // Modify by Tiansen  使用宏替换
            || SearchModuleInDir(FPaths::ProjectPluginsDir() / ENGINE_JS_SEARCH_PATH , RequiredModule, Path, AbsolutePath);
	}

	bool DefaultJSModuleLoader::Load(const FString& Path, TArray<uint8>& Content)
	{
		//return (FPaths::FileExists(FullPath) && FFileHelper::LoadFileToString(Content, *FullPath));
        IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
        IFileHandle* FileHandle = PlatformFile.OpenRead(*Path);
        if (FileHandle) {
            int len = FileHandle->Size();
            Content.Reset(len + 2);
            Content.AddUninitialized(len);
            FileHandle->Read(Content.GetData(), len);
            delete FileHandle;

            return true;
        }
        return false;
	}

    FString& DefaultJSModuleLoader::GetScriptRoot()
    {
        return ScriptRoot;
    }

}
