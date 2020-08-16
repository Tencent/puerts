## vscode debug指引

* 编辑TGameJsUnrealDemo\Plugins\Puerts\Content\JavaScript\puerts\first_run.js，打开被注释的“createInspector(8080)”
    - 8080是连接的端口，和vscode工程目录下的.vscode\launch.json保持一致

* vscode下打开setting，搜索auto attach，将Debug>Node:Auto Attach设置为“on”


* 菜单打开“编辑->编辑器偏好设置”页面，在“通用->性能”中把“处于背景中时占用教室CPU”的勾选去掉，否则debug连接会很慢

![throttle cpu](../pic/ue_throttle_cpu.png)
