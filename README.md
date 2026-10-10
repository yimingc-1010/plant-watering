# Plant Watering

記錄家裡植物的澆水：每株植物有自己的澆水間隔，App 告訴你今天要澆哪些，澆完按一下記錄。資料只存在手機上。

這個 repo 用來測試「由 agent 端到端開發」的流程，從 [mobile-agent-template](https://github.com/yimingc-1010/mobile-agent-template) 建立並保留 git 關聯。

- 產品需求：[`docs/prd.md`](docs/prd.md)
- 開發流程：[`docs/process.md`](docs/process.md)；平台設定：[`docs/platform.md`](docs/platform.md)
- Agent CI：[`docs/agent-ci.md`](docs/agent-ci.md)
- Agent 的進入點：[`CLAUDE.md`](CLAUDE.md)

## 開發

```bash
npm install
npm run verify
```

## 同步 template 的更新

```bash
git fetch template && git merge template/main
```
