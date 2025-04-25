# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2023-08-29
1. compat with core@2.1.0

## [2.0.5] - 2023-05-07
1. compat with core@2.0.5
2. make `puerts.cpp` only available in webgl, prevent ios crash #58 @xtutu
3. BigInt optimize @ctxdegithub #53
4. fix: failed to pass ArrayBuffer from JS to C# #55
5. jsbuild optimize @throw-out #56

## [2.0.4] - 2023-01-09
1. compat with core@2.0.4
2. support BigInt @jarvisjiang
3. support ArrayBuffer with offset @jarvisjiang
4. use double instead of float to store JS number @jarvisjiang

## [2.0.3] - 2023-11-2
1. compat with core@2.0.3

## [2.0.2] - 2023-9-7
1. compat with core@2.0.2

## [2.0.1] - 2023-8-14
1. fix JSObject bug

## [2.0.0] - 2023-7-31
1. fix LoaderResolve bug

## [2.0.0-rc.1] - 2023-7-14
1. did not use `Resolve` when using IResolvableLoader.
2. expose unityInstance in `global.PuertsWebGL`

## [2.0.0-rc.0] - 2023-6-30
1. many bug fix to able to run in core's unittest

## [2.0.0-pre.5] - 2023-6-16
1. compat with core@2.0.0-pre.5

## [1.1.1-pre.1] - 2023-5-17
1. optimize: the performance cost of cross-language reduce by 40%.
2. fix: stackoverflow exception will thrown in circular-dependency.

## [1.1.1-pre.0] - 2023-3-20
1. depend on puerts@2.0.0-pre.2

## [1.0.0-rc.1] - 2022-11-24
1. depend on puerts@1.4.0

## [1.0.0-rc.0] - 2022-10-25
1. compat API_LEVEL to 19. depend on puerts@1.4.0-rc.6

## [1.0.0-preview.4] - 2022-07-13
1. optimize error message #25

## [1.0.0-preview.3] - 2022-07-12
1. bugfixes

## [1.0.0-preview.2] - 2022-07-08
1. update puerts to 1.4.0

## [1.0.0-preview.1] - 2022-06-08
1. bugfixes

## [1.0.0-preview.0] - 2022-05-23
1. first publish