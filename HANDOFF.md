# HANDOFF

## 在做什么

把 https://github.com/st44464322/codex-honglvdeng-traffic-light 这个 macOS 桌面悬浮红绿灯项目，从适配 codex CLI 改成适配 omp（oh-my-pi，本地路径 `/Users/didi/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent`）。

工作目录：`/Users/didi/GitHubWorkspace/omp-traffic-light`（已经从 `codex-honglvdeng-traffic-light-main` 改名）。

## 当前状态

- 适配完成，所有 codex 文件已重命名/重写为 omp 版本。
- `OmpTrafficLight` 二进制已编译跑起来（用户机器上能看到悬浮窗）。
- `~/.omp/bin/omp-light`、`~/.omp/bin/omp-light-run` 已软链。
- `~/.omp/agent/extensions/omp-light-extension.ts` 已软链到项目文件。
- `~/.zshrc` 加了 `export PATH="$HOME/.omp/bin:$PATH"`（新开终端生效）。
- LaunchAgent label 改成 `com.ss.omp-traffic-light`，Support 目录 `~/Library/Application Support/OmpTrafficLight`。
- `install-autostart.command` 还没跑（没装开机自启）。
- 没有 git 仓库（原项目是 zip 解压的，没 `.git`）；README 里 `git clone` URL 还是 `<你的用户名>` 占位符。

## 下一步

1. **用户重启 omp**，扩展才会被加载。让用户在 omp 里做一件事（比如让我跑 `ls`），看灯自动变黄，结束看变绿/红，验证扩展工作。
2. 如果灯不切换：看 `~/.omp/logs/omp.$(date +%F).*.log` 里有没有 `omp-light-extension` 加载错误。
3. 用户要在 GitHub 建仓后，把 README 的 `<你的用户名>` 换成实际地址，然后 `git init && git remote add origin ... && git push`。
4. 可选：`./install-autostart.command` 装开机自启。

## 已完成的关键决策

- **omp 接入方式**：用 `ExtensionAPI`（TypeScript 模块），不用 stdin JSON hooks。omp 的 hooks 子系统是 legacy，新代码走 extensions，放 `~/.omp/agent/extensions/*.ts` 自动加载，或 `omp --extension` 手动。
- **事件映射**：
  - `agent_start` → `working`（黄）
  - `tool_approval_requested` → `waiting`（红，等审批）
  - `agent_end` → `willContinue`/`awaitingAsyncWork` → `working`；否则扫最后一条 assistant 文本，正则判定等用户 → `waiting`，否则 `done`
  - `session_shutdown` → `idle`
  - `ctx.agent.kind === "sub"` 的事件全部忽略（子代理不动灯）
- **删除**：`codex-light-hook`（stdin JSON 协议不存在于 omp）、`codex-light-notify`（omp 没有 turn-start/turn-ended 通知钩子）。
- **`agent_end` 比 codex `Stop` 更精细**：omp 区分"会自动继续"和"等异步任务"，所以黄灯保持更准。

## 文件清单

```
OmpTrafficLight.swift                  Swift/AppKit 悬浮窗（自绘红绿黄灯、静音按钮、拖动）
omp_light.py                           写 state.json 的 Python CLI
omp-light                              omp_light.py 的 zsh 包装（解符号链接）
omp-light-run                          包任意命令：跑前 working，exit 0 → done，非 0 → waiting
omp-light-extension.ts                 omp ExtensionAPI 扩展，监听 omp 事件切灯
omp-light.command                      双击启动（检查并编译 Swift）
build.command                          swiftc 编译
install-autostart.command              装 ~/Library/LaunchAgents/com.ss.omp-traffic-light.plist
install-global-command.command         软链 omp-light* + omp-light-extension.ts 到 ~/.omp
uninstall-autostart.command            卸 LaunchAgent
com.ss.omp-traffic-light.plist.template
omp-extension.example.md               扩展机制说明
README.md / 制作方案.md                 文档（已重写为 omp 版本）
{黄灯,绿灯,红灯,退出红绿灯}-*.command    双击切灯/退出
```

## 关键路径

| 项 | 位置 |
|---|---|
| 项目目录 | `/Users/didi/GitHubWorkspace/omp-traffic-light` |
| state.json | `~/Library/Application Support/OmpTrafficLight/state.json` |
| preferences.json | `~/Library/Application Support/OmpTrafficLight/preferences.json` |
| LaunchAgent | `~/Library/LaunchAgents/com.ss.omp-traffic-light.plist` |
| omp 扩展目录 | `~/.omp/agent/extensions/` |
| omp 日志 | `~/.omp/logs/omp.YYYY-MM-DD.*.log` |
| omp 包源码 | `/Users/didi/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/` |

## 踩过的坑，别再踩

1. **AGENTS.md 规则极严**（在 `~/.omp/agent/AGENTS.md`）：
   - 禁止用 sed/python/heredoc 改文件，必须用 `edit`/`write` 工具。
   - 禁止 `git checkout/reset` 回滚；用户说"回滚"意思是手动改回去。
   - 禁止读写 `/tmp`（除了系统自己的临时文件，比如 tsc 输出）。
   - 禁止"先X后Y避免Z"这种预防性表述；禁止"不是...而是..."句式；禁止"落地/钉死/对齐"等黑话。
   - 禁止总结性段落开头（"上面说的是..."/"一句话总结"）。
   - 禁止单字动词（崩/死/挂/判/推/抛）；所有 identifier 保留英文。
   - **如果用户消息提到 `AGENTS.md`，必须先重读一遍**。

2. **omp 扩展文件**：`.ts` 文件放在 `~/.omp/agent/extensions/` 或 `~/.omp/agent/hooks/{pre,post}/` 才能被发现。根目录 `~/.omp/agent/hooks/*.ts` 不会被扫描到（必须在 `pre/` 或 `post/` 子目录）。

3. **omp 的 `agent_end`**：`willContinue=true` 或 `awaitingAsyncWork=true` 表示还没真正结束（自动继续或等后台任务），这时候保持 `working`，不要切 `done`。

4. **`tool_approval_requested` 只在有 handler 注册时才发**：omp 的 `wrapper.ts` 检查 `hasHandlers("tool_approval_requested") || hasHandlers("tool_approval_resolved")`，两个事件都没有 listener 就根本不发。

5. **扩展加载时不能调 runtime action**：`pi.sendMessage()`、`pi.exec()` 等在 factory 同步执行阶段会抛 `ExtensionRuntimeNotInitializedError`。在 factory 里只能 `pi.on(...)`、`pi.registerTool(...)` 等注册函数；动作要等事件触发。

6. **`ctx.setInterval`/`ctx.setTimeout` 是必须的**：raw `setInterval` 在 omp 扩展里 throw 会让整个 session 崩。所有后台定时器必须用 `ctx.setInterval`，或者自己 `try/catch` 包。

7. **tsc 类型检查**：本仓库没有 `package.json`/`tsconfig.json`，要检查 `omp-light-extension.ts` 用：
   ```
   cd /tmp && bun install @types/node @oh-my-pi/pi-coding-agent
   # tsconfig.json 的 paths 里把 @oh-my-pi/* 映射到 dist/types/*.d.ts
   bun x tsc --project tsconfig.json
   ```
   `main` 字段指向 `./src/index.ts`（源码），`types` 指向 `./dist/types/index.d.ts`，bundler resolution 下要显式 `paths`。

8. **shell 工作目录**：bash 工具每次调用 `cwd` 会重置到调用时的 cwd。如果 `cd` 失败（比如目录被改名了），下一次 bash 会报 "Working directory does not exist"。改名后用绝对路径或重新 `cd`。

9. **`install-autostart.command` 的 `sed` 替换**：plist 模板用 `__SUPPORT_DIR__` 占位符，安装时被替换成 `~/Library/Application Support/OmpTrafficLight`。如果模板变量名打错，launchctl 会装上一个路径错误的 plist。

10. **omp 没有"等用户输入"的 hook**：codex 通过看 `last_assistant_message` 正则判定是否在等用户；omp 里要做同样的事，得在 `agent_end` 里扫 `event.messages` 最后一条 `role==="assistant"` 的 `content` 里 `block.type==="text"` 的 `text` 字段。omp `AssistantMessage.content` 是 `(TextContent | ThinkingContent | ToolCall | ...)[]`，不是字符串。

11. **编译 Swift**：`swiftc -framework Cocoa OmpTrafficLight.swift -o OmpTrafficLight`，无外部依赖，macOS 自带。
