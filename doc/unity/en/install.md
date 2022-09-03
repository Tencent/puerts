## How to install

<details>
<summary>Add from OpenUPM | available in 2018+</summary>

PuerTS Has Uploaded to OpenUPM: https://openupm.com/packages/com.tencent.puerts.core/

you can follow the guide of [OpenUPM](https://openupm.com/) to install

</details>

-----------------------------------------------------

<details>
<summary>Add from GitHub | available in 2019.4+</summary>

You can add it directly from GitHub on Unity 2019.4+. Note that you won't be able to receive updates through Package Manager this way, you'll have to update manually.

- open Package Manager
- click <kbd>+</kbd>
- select <kbd>Add from Git URL</kbd>
- paste `https://github.com/chexiongsheng/puerts_unity_demo.git?path=/package`
- click <kbd>Add</kbd>
</details>

-----------------------------------------------------

<details>
<summary>Download code and native plugins manually  | available in all version</summary>
It's friendly for self modifing。

1. Goto [Github Releases](https://github.com/Tencent/puerts/releases) to download PuerTS_V8_x.x.x.tgz or some other PuerTS version you need.
2. Extract it into your Assets directory

> If you're using Unity2018 or below. you have to append .txt to the builtin js code in the PuerTS

> if you found the problem caused in mac os: puerts.bundle is damaged. you can do `sudo xattr -r -d com.apple.quarantine puerts.bundle`. But is may cause git problem
</details>