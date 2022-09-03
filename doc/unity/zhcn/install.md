## 如何安装

<details>
<summary>从 OpenUPM 安装 | Unity 2018+ 可用</summary>

PuerTS 现已上传 OpenUPM: https://openupm.com/packages/com.tencent.puerts.core/

你可按照[OpenUPM](https://openupm.com/)所支持的方式安装

</details>

-----------------------------------------------------

<details>
<summary>用 Unity UPM 从 Github 安装 | Unity 2019.4+ 可用</summary>

You can add it directly from GitHub on Unity 2019.4+. Note that you won't be able to receive updates through Package Manager this way, you'll have to update manually.

- open Package Manager
- click <kbd>+</kbd>
- select <kbd>Add from Git URL</kbd>
- paste `https://github.com/chexiongsheng/puerts_unity_demo.git?path=/package`
- click <kbd>Add</kbd>
</details>

-----------------------------------------------------

<details>
<summary>手动下载代码与插件  | 全版本可用</summary>
以往支持的源码安装模式依旧支持。相比前两种方式管理起来稍麻烦，但对代码魔改更友好。

1. 前往 [Github Releases](https://github.com/Tencent/puerts/releases) 下载PuerTS_V8_x.x.x.tgz 或是别的你需要的Puerts版本。
2. 将压缩包内的Puerts文件夹解压至你的Assets目录

> 如果你是2018以下版本，还需要你将Puerts代码内的内置js手动加上.txt后缀

> mac下如果遇到移入废纸篓问题，请使用sudo xattr -r -d com.apple.quarantine puerts.bundle。但用了后提交git容易出问题
</details>

-----------------------------------------------------

当然还有一种最傻瓜的办法：从官方Demo中拷贝出来用。