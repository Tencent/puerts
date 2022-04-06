## 如何安装
## How to install

<details>
<summary>Add from GitHub | available in 2019.4+</summary>

You can add it directly from GitHub on Unity 2019.4+. Note that you won't be able to receive updates through Package Manager this way, you'll have to update manually.

- open Package Manager
- click <kbd>+</kbd>
- select <kbd>Add from Git URL</kbd>
- paste `https://github.com/chexiongsheng/puerts_unity_demo.git?path=/package`
- click <kbd>Add</kbd>
</details>
<details>
<summary>Add from OpenUPM | available in 2018+</summary>

PuerTS 现已上传 OpenUPM: https://openupm.com/packages/com.tencent.puerts.core/

你可按照OpenUPM所支持的方式安装

</details>
<details>
<summary>Download code and native plugins manually  | available in all version</summary>

1. 前往 [Github Releases](https://github.com/Tencent/puerts/releases) 下载你想要的版本的Plugins和Source Code
2. 将`Source Code.zip`中`unity/Assets/Puerts`拷贝到你的unity目录
3. 将`Plugins_xxx.zip`解压放入`Puerts/Runtime/Plugins`中

> 如果你是2018以下版本，还需要你将Puerts代码内的内置js手动加上.txt后缀

> mac下如果遇到移入废纸篓问题，请使用sudo xattr -r -d com.apple.quarantine puerts.bundle。但用了后提交git容易出问题
</details>