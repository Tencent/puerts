/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JSEngine.h"

#if PLATFORM_IOS || PLATFORM_MAC
#include <JavaScriptCore/JavaScript.h>
#include <vector>
#include <map>
#include "Containers/Ticker.h"

#import <WebKit/WebKit.h>
#if PLATFORM_IOS
#include "IOS/IOSAppDelegate.h"
#endif

@interface WKWebViewWrapper : NSObject<WKUIDelegate>
{
    std::function<FString(const FString&)> MessageHandler;
}
@property(strong) WKWebView* WebView;

- (id)init;

- (void)setMessageHandler:(std::function<FString(const FString&)>) messageHandler;

- (void)evaluateJavaScript:(NSString *)javaScriptString completionHandler:(void (^ _Nullable)(_Nullable id, NSError * _Nullable error))completionHandler;

- (void)close;

@end

@implementation WKWebViewWrapper
@synthesize WebView;

- (id)init {
    MessageHandler = nullptr;
    dispatch_async(dispatch_get_main_queue(), ^ {
        WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];
        WKUserContentController *controller = [[WKUserContentController alloc] init];
        configuration.userContentController = controller;
        WebView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:configuration]; //CGRectMake(0, 0, 1, 1)
#if PLATFORM_IOS
        [[IOSAppDelegate GetDelegate].IOSView addSubview : WebView];
#else
        [[[NSApp mainWindow] contentView] addSubview : WebView];
#endif
        WebView.UIDelegate = self;
    });
    return self;
}

- (void)setMessageHandler:(std::function<FString(const FString&)>) messageHandler {
    MessageHandler = messageHandler;
}

- (void)evaluateJavaScript:(NSString *)javaScriptString completionHandler:(void (^ _Nullable)(_Nullable id, NSError * _Nullable error))completionHandler {
    dispatch_async(dispatch_get_main_queue(), ^ {
        [WebView evaluateJavaScript:javaScriptString completionHandler:completionHandler];
    });
}

- (void)close {
    MessageHandler = nullptr;
#if PLATFORM_IOS
    dispatch_async(dispatch_get_main_queue(), ^ {
        [self.WebView removeFromSuperview];
        WebView = nil;
    });
#endif
}

#pragma mark - WKUIDelegate

- (WKWebView *)webView:(WKWebView *)webView createWebViewWithConfiguration:(WKWebViewConfiguration *)configuration forNavigationAction:(WKNavigationAction *)navigationAction windowFeatures:(WKWindowFeatures *)windowFeatures
{
    return nil;
}

- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(nonnull void (^)(void))completionHandler
{
    completionHandler();
}

- (void)webView:(WKWebView *)webView runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(BOOL))completionHandler {
    completionHandler(NO);
}

- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString *))completionHandler {
    //NSLog(@"prompt: %@",prompt);
    if (nullptr != MessageHandler) {
        completionHandler([NSString stringWithFString: MessageHandler(prompt)]);
    }
}

@end

namespace puerts
{
class WKWebviewEnv: public IJsEngine
{
public:
    WKWebviewEnv();
    
    void ExecuteJavascript(const FString& Script, const FString& ScripUrl, std::function<void(const JSError *)> CompletionHander = nullptr) override;
    
    void SetMessageHandler(std::function<FString(const FString&)> MessageHandler) override;
    
    void Close() override;
    
    void SetLogger(std::shared_ptr<ILogger> Logger) override {} //do nothing
    
private:
    mutable __strong WKWebViewWrapper* WebViewWrapper;
};

WKWebviewEnv::WKWebviewEnv()
{
    WebViewWrapper = [[WKWebViewWrapper alloc] init];
}

void WKWebviewEnv::ExecuteJavascript(const FString& Script, const FString& ScripUrl, std::function<void(const JSError *)> CompletionHander)
{
    //UE_LOG(LogTemp, Warning, TEXT("Script: %s"), *Script);
    if (nullptr == CompletionHander)
    {
        [WebViewWrapper evaluateJavaScript: [NSString stringWithFString: Script] completionHandler: nil];
    }
    else
    {
        [WebViewWrapper evaluateJavaScript: [NSString stringWithFString: Script]
                     completionHandler: ^(NSString *result, NSError *error){
                                  if (error != nil) {
                                      //UE_LOG(LogTemp, Warning, TEXT("err:%s"), error.localizedDescription);
                                      JSError jserror;
                                      jserror.Message = [NSString stringWithFormat:@"%@", error];
                                      CompletionHander(&jserror);
                                  } else {
                                      //UE_LOG(LogTemp, Warning, TEXT("ok"));
                                      CompletionHander(nullptr);
                                  }
                              }];
    }
}

void WKWebviewEnv::SetMessageHandler(std::function<FString(const FString&)> MessageHandler)
{
    [WebViewWrapper setMessageHandler:MessageHandler];
}

void WKWebviewEnv::Close()
{
    [WebViewWrapper close];
}

std::unique_ptr<IJsEngine> CreateJSEngine(EBackendEngine BackendEngine)
{
    if (BackendEngine == EBackendEngine::Auto || BackendEngine == EBackendEngine::WKWebview)
    {
        return std::make_unique<WKWebviewEnv>();
    }
    else
    {
        throw JSError("No supported in this platform!");
    }
}
}


#endif
