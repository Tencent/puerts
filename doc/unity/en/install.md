# How to install

### GitHub Clone and use Unity UPM to install

You can add it by this way with Unity that support UPM

- git clone `https://github.com/chexiongsheng/puerts_unity_demo.git`
- open Package Manager
- click `+`
- select `Add from File`
- select [your cloned path]/package/package.json 
- click `Add`

### Add from OpenUPM | available in 2018+

PuerTS Has Uploaded to OpenUPM: https://openupm.com/packages/com.tencent.puerts.core/

you can follow the guide of [OpenUPM](https://openupm.com/) to install


### Download code and native plugins manually  | available in all version
It's friendly for modifing PuerTS yourself。

1. Goto [Github Releases](https://github.com/Tencent/puerts/releases) to download PuerTS_V8_x.x.x.tgz or some other PuerTS version you need.
2. Extract it into your Assets directory

> If you're using Unity2018 or below. you have to append .txt to the builtin js code in the PuerTS

> if you found the problem caused in mac os: puerts.bundle is damaged. you can do `sudo xattr -r -d com.apple.quarantine puerts.bundle`. But is may cause git problem
