# ADR-002：本機儲存使用 expo-sqlite 的 kv-store，整份資料存成一份 JSON 文件

- 狀態：提議
- 日期：2026-10-10
- 決策者：Architect agent / 待人類核准

## 背景

PRD 要求資料只存在手機上、App 重新啟動與版本更新後保留、解除安裝時刪除、不要求任何權限、不傳出資料（US-07、非功能需求「資料保存」「隱私與權限」）。資料量很小：效能目標是 200 株植物，每株只有 id、名稱、間隔、最後澆水日，整份不到 30 KB。ADR-001 沒有指定儲存方案；儲存是外部依賴，必須經過 port 並提供 fake（`CLAUDE.md` 規則）。

## 決策

採用 `expo-sqlite` 的 `expo-sqlite/kv-store`（`Storage`），包在 `KeyValueStore` port 後面；整個 Garden 以一份 JSON 文件存在鍵 `garden`，帶 `schemaVersion` 供日後遷移。

- Port：`packages/core/src/ports/key-value-store.ts`，只有 `getItem`、`setItem`、`removeItem` 三個非同步方法；fake 為 `InMemoryKeyValueStore`。
- Real：`apps/mobile/src/services/sqlite-key-value-store.ts`，使用 `getItemAsync`／`setItemAsync`／`removeItemAsync`。
- 序列化、驗證、遷移放在 core 的 `PlantRepository`（純 TS），以 fake 做單元測試；real 實作只是薄薄一層轉接，由 US-07 的 e2e 驗證。
- 以 `npx expo install expo-sqlite` 加入；屬原生模組，相關票標 `native-change`。

## 考慮過的選項

| 選項 | 優點 | 缺點 |
| --- | --- | --- |
| `expo-sqlite/kv-store` + 單一 JSON 文件（選定） | Expo 官方維護、與 SDK 版本一起升級；SQLite 單一 `setItem` 具原子性，不會寫一半；API 最小，port 容易 fake；邏輯集中在 core 可單元測試；不需要權限或 config plugin 選項 | 每次變更重寫整份文件（30 KB 以內，遠低於 1 秒門檻）；不能用 SQL 查詢（MVP 不需要） |
| `expo-sqlite` 直接建資料表 | 可逐列更新、可查詢，日後加澆水歷史較自然 | 需要寫 SQL 與資料表遷移；real 實作邏輯變多卻無法在 Vitest／Jest 中執行，只能靠 e2e 驗證 |
| `@react-native-async-storage/async-storage` | 社群標準、API 與 kv-store 相同 | 非 Expo 官方模組，升級 SDK 時要另外確認相容；Expo 文件把 kv-store 定位為它的替代品 |
| `expo-file-system` 寫 JSON 檔 | 不需資料庫 | 自己處理原子寫入（寫暫存檔再改名）與錯誤，容易出錯 |
| `react-native-mmkv` | 同步、極快 | 第三方原生模組；這個資料量用不到它的效能 |

## 後果

- 資料位於 App 沙盒，解除安裝即刪除；不關閉系統備份（PRD Q5），iCloud 裝置備份與 Android 自動備份會照系統預設包含它，不需原生設定。
- App 版本更新時沙盒保留，`schemaVersion` 遷移在 core 以單元測試涵蓋；跨版本升級另由人工驗收腳本確認。
- 讀到無法解析、版本較新或違反不變條件的資料時回報載入錯誤且不覆寫，避免資料遺失。
- 日後若要澆水歷史或大量資料，可在不改 port 介面的前提下換成資料表實作，或新增 port。
- fake 模式 build 也使用 real 實作（理由見 ADR-003）。
