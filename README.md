# omp-traffic-light

macOS 桌面悬浮红绿灯，用来显示 omp 当前工作状态。

- 黄灯：omp 正在干活。
- 绿灯：活干完了，可以验收；10 分钟后自动变空闲。
- 红灯：omp 在等你回复、审批或补东西。

## 长这样

一个悬浮在屏幕上方的小红绿灯，可以拖动，始终置顶。
红灯会先闪烁 10 秒再常亮；绿灯常亮；空闲时全暗。
底部左侧有一个很淡的小圆点，是隐藏静音按钮，点一下静音/恢复。

## 提示声

- 黄灯：不响。
- 绿灯：响一声 `Glass`（3 秒自动停）。
- 红灯：响一声 `Basso`（10 秒后自动停，灯也停止闪烁）。
- 静音后都不响，静音状态持久保存。

## 文件位置

```text
~/Library/Application Support/OmpTrafficLight/state.json         状态
~/Library/Application Support/OmpTrafficLight/preferences.json   静音
~/Library/Application Support/OmpTrafficLight/hook.log           扩展日志（可选）
```

## 安装

```bash
git clone https://github.com/rfeng1016/omp-traffic-light.git
cd omp-traffic-light

./build.command                  # 编译 Swift 悬浮窗 → ./OmpTrafficLight
./install-autostart.command      # 装到 ~/Library/LaunchAgents，登录自启
./install-global-command.command # 装 omp-light / omp-light-run 到 ~/.omp/bin，
                                 # 并把 omp-light-extension.ts 软链到 ~/.omp/agent/extensions/
```

`install-global-command.command` 完之后，确认 `~/.omp/bin` 在 `PATH`：

```bash
export PATH="$HOME/.omp/bin:$PATH"
```

## 卸载

```bash
./uninstall-autostart.command                                  # 关掉开机自启
rm ~/.omp/bin/omp-light ~/.omp/bin/omp-light-run               # 删命令
rm ~/.omp/agent/extensions/omp-light-extension.ts              # 删扩展
rm -rf ~/Library/Application\ Support/OmpTrafficLight          # 删状态
```

## 手动控制

四种方式，按方便挑：

1. 双击悬浮灯，按 `working → done → waiting → idle` 循环。
2. 右键悬浮灯，菜单里选。
3. 双击下面的 `.command`：
   ```text
   黄灯-正在干活.command
   绿灯-完成验收.command
   红灯-等你回复.command
   退出红绿灯.command
   ```
4. 命令行：
   ```bash
   omp-light working    # 黄
   omp-light done       # 绿
   omp-light waiting    # 红
   omp-light idle       # 全暗
   omp-light quit       # 退出
   omp-light status     # 查当前
   ```

## 让脚本自动切灯

任何脚本：

```bash
/path/to/omp-light working   # 开始
# ... 干活 ...
/path/to/omp-light done      # 成功
/path/to/omp-light waiting   # 需要等用户
```

或者直接包一层：

```bash
omp-light-run npm run build
omp-light-run python3 your_script.py
```

`omp-light-run` 规则：

- 命令开始 → 黄
- 退出码 0 → 绿
- 退出码非 0 → 红

退出码原样透传。

## 让 omp 自己切灯

omp 进程内的扩展 `omp-light-extension.ts` 已经监听 omp 的事件：

| omp 事件                  | 灯                                                              |
| ------------------------- | --------------------------------------------------------------- |
| `agent_start`             | 黄                                                              |
| `tool_approval_requested` | 红（等用户审批工具调用）                                        |
| `agent_end`               | `willContinue`/`awaitingAsyncWork` → 黄；否则看末尾 assistant 文本是否在等用户 → 红 / 绿 |
| `session_shutdown`        | 全暗                                                            |

子代理（task、eval `agent()`、`/tan`）的事件全部忽略，父代理的灯不受影响。

`install-global-command.command` 已经把这个扩展软链到 `~/.omp/agent/extensions/`，omp 下次启动自动加载。
不想软链、想直接复制也行：`cp omp-light-extension.ts ~/.omp/agent/extensions/`。

扩展怎么工作、想改逻辑，看 `omp-extension.example.md`。

## 开机自启

`install-autostart.command` 会做三件事：

1. 如果二进制旧于源码，跑 `./build.command` 重编。
2. 把 `OmpTrafficLight` 拷到 `~/Library/Application Support/OmpTrafficLight/`。
3. 把 `com.ss.omp-traffic-light.plist` 写到 `~/Library/LaunchAgents/` 并 `launchctl bootstrap`。

卸载就跑 `uninstall-autostart.command`。

## 目录结构

```text
OmpTrafficLight.swift                  悬浮窗本体（AppKit，自绘）
omp_light.py                           写 state.json 的命令行
omp-light                              omp_light.py 的 zsh 包装
omp-light-run                          包任意命令自动切灯
omp-light-extension.ts                 omp 扩展（自动切灯）
omp-light.command                      双击启动
build.command                          编译 Swift
install-autostart.command              装开机自启
install-global-command.command         装命令行 + 扩展
uninstall-autostart.command            卸开机自启
com.ss.omp-traffic-light.plist.template LaunchAgent 模板
omp-extension.example.md               扩展说明
黄灯/绿灯/红灯/退出红绿灯.command       快捷命令
```
