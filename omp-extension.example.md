# omp 扩展接入说明

`omp-light-extension.ts` 是 omp 的扩展模块（ExtensionAPI），不是 codex 那种 stdin JSON hook。
omp 启动时会扫描 `~/.omp/agent/extensions/` 目录并自动加载里面的 `.ts` / `.js` 文件。

## 安装

```bash
mkdir -p ~/.omp/agent/extensions
ln -sf "$PWD/omp-light-extension.ts" ~/.omp/agent/extensions/omp-light-extension.ts
```

或者直接拷贝过去：

```bash
cp omp-light-extension.ts ~/.omp/agent/extensions/
```

`install-global-command.command` 已经替你做了软链这一步。

## 事件 → 灯映射

| omp 事件                  | 灯                                                            |
| ------------------------- | ------------------------------------------------------------- |
| `agent_start`             | `working`（黄）                                                |
| `tool_approval_requested` | `waiting`（红，等用户审批）                                    |
| `agent_end`               | `willContinue` / `awaitingAsyncWork` → `working`；否则扫尾条 assistant 文本，命中 waiting 正则 → `waiting`，否则 `done` |
| `session_shutdown`        | `idle`                                                        |

子代理（`ctx.agent.kind === "sub"`）的所有事件都不动灯，相当于 codex 版本里 `SubagentStop` 的静默处理。

## 手动加载一次（可选）

不想放到 `extensions/` 目录、只想临时跑：

```bash
omp --extension /完整路径/omp-light-extension.ts
```

## 调试

omp 的扩展日志在 `~/.omp/logs/omp.$(date +%F).*.log`。
扩展本身不直接打日志，要验证就看灯有没有按预期切换：

```bash
tail -f ~/.omp/logs/omp.$(date +%F).*.log | grep -i extension
omp-light status
```
