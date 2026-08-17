# 项目协作规范

## 必备结构

项目必须保留 `README.md`、`AGENTS.md`、`.gitignore`、`docs/` 和 Git 仓库元数据。

## 文档维护

- `docs/spec.md`：项目规格与架构。
- `docs/handoff.md`：收到“打包”或“转交”指令时，记录项目、Git 状态与开发进度，并更新全部文档。
- `docs/memory.md`：每 10 次对话总结一次增量。
- `docs/troubleshoot.md`：每 15 次对话检查记忆，将重复 3 次以上的问题固定为排障规则。
- `docs/context.md`：每次产生编辑、删除、重命名、重构或新建行为后，记录本次执行内容。
- `docs/todo.md`：创建待办时增量记录并保留时间戳。
- `docs/decisions.md`：记录架构、功能、数据、UI 或大批量代码变更等重大决定。
- `dpcs/smoke_logs.md`：每次冒烟测试后记录范围、结果和环境。

## 开发约束

- 代码更新后同步维护相关文档。
- 浏览器冒烟测试优先使用 ego-browser。
- 真实上传文件不得写入版本控制或作为测试样本；测试样本必须使用虚构数据。
