# ADR-003：E2E 以 fake 模式專用的 deep link 設定假時鐘與 fixture

- 狀態：提議
- 日期：2026-10-10
- 決策者：Architect agent / 待人類核准

## 背景

PRD 的驗收標準以特定日期描述（例：「今天是 2026-03-11」），且有「今天變為 2026-03-08」這類中途換日的步驟；US-07 需要關閉後重新啟動 App 驗證資料仍在；效能需求要以 200 株植物的 fixture 冷啟動。

限制：

- CI 的 e2e 跑的是內嵌 JS bundle 的 Release build（`docs/platform.md`、`ci-e2e.yml`），無法在執行中由測試程式注入物件，也無法讀取 repo 的檔案。
- Maestro flow 只能操作 UI、開啟連結、啟停 App；`launchApp` 的 `arguments` 需要原生模組才能在 JS 讀到。
- `.github/workflows/`、`apps/mobile/eas.json` 是受保護路徑，最好不需要修改。
- 選取元素要用 testID，不能用畫面文字；系統對話框無法設定 testID。

## 決策

在 fake 模式 build（`EXPO_PUBLIC_USE_FAKES=1`，即 development 與 e2e profile）中，提供控制用 deep link：

```
plantwatering://e2e?fixture=<name>&today=<YYYY-MM-DD>
```

- `fixture`：以 bundle 內的 `fixtures/storage/<name>.json` 覆寫儲存的 `garden` 文件。
- `today`：把 `FakeClock` 設為該日 12:00（固定 UTC+8），並把日期寫進儲存鍵 `e2e.today`；App 重新啟動時先讀它，所以 `stopApp`／`launchApp` 後日期不變。
- 處理完重新載入 Garden 並導向今日待澆；flow 以 `assertVisible: id: today-screen` 等待。
- 進入點是 Expo Router 的 `src/app/+native-intent.tsx`（`redirectSystemPath`），邏輯在 `src/services/e2e-control.ts`。
- fake 模式 build 的儲存使用 **real** 的 `expo-sqlite` 實作（不是記憶體 fake）：e2e 每個 flow 以 `launchApp: clearState: true` 開始，沙盒資料必為空，結果仍然確定；同時才能驗證 US-07 的重新啟動。
- 一般 build（preview、production）中：`e2e-control` 與 fixtures 只在 `process.env.EXPO_PUBLIC_USE_FAKES === '1'` 的分支內 `require`，經常數摺疊後不進 bundle；`e2e` 連結只導向 `/`，不讀參數。實作票以 `npx expo export` 的 bundle 不含 `e2e.today` 驗證。

## 考慮過的選項

| 選項 | 優點 | 缺點 |
| --- | --- | --- |
| fake 模式專用 deep link（選定） | 只用既有的 `scheme` 與 `expo-router`，不需原生套件、不改 workflow；iOS 與 Android 共用；同一份 flow 可多次換日 | production 必須確實排除，否則任何連結都能覆寫資料；需要實作與驗證這個排除 |
| Maestro `launchApp` 的 `arguments` | 語意清楚 | JS 讀不到啟動參數，需要新增原生模組（`native-change`）；中途換日要重啟 App |
| App 內隱藏的除錯畫面，flow 以 UI 輸入日期 | 不需 deep link | 每個 flow 多十幾個步驟，慢且脆弱；同樣要排除在 production 之外 |
| 時間由模擬器系統時鐘控制（`adb shell date`、`simctl`） | App 不需額外程式 | iOS 模擬器無法改時間；Android 需 root 且影響整台模擬器；與「時間經過 port」原則衝突 |
| fake 模式儲存也用記憶體 fake | 完全不碰真實儲存 | US-07 無法驗證重新啟動；每次啟動都要重新注入資料 |

## 後果

- 所有 e2e flow 共用「`launchApp: clearState: true` → `openLink` → 等 `today-screen`」的開頭；fixture 與日期都寫在 flow 中，一眼看出測試情境。
- 新增 fixture 時要同時加入 `e2e-fixtures.ts` 的對照表；fixture 與正式資料同一格式，會經過同一套遷移與驗證。
- fake 模式時區固定 UTC+8，與 CI 模擬器的時區無關。
- 風險：iOS 上 Maestro `openLink` 開啟自訂 scheme 若出現系統確認對話框，只能以文字點選；第一張 e2e 票需在 CI 的 `ios` job 實證，若出現則回報 `needs-design`。
- 風險：`redirectSystemPath` 是否能等待非同步處理需以 SDK 57 實作確認；若不行，改為回傳一個 fake 模式專用的導向路徑，由該路徑的畫面完成處理。
- 這是 fake 模式中少數「real 實作」的例外，registry 的註解與 `modules.md` 需寫明。
