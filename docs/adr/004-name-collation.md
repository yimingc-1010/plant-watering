# ADR-004：植物名稱依筆畫排序（Intl.Collator zh-Hant-TW）

- 狀態：提議
- 日期：2026-10-10
- 決策者：Architect agent / 待人類核准

## 背景

US-03 規定今日待澆清單在逾期天數相同時「依名稱排序」，並把中文名稱的排序規則（注音或筆畫）留給設計決定。排序在 `packages/core` 實作與測試（Vitest，Node），實際在裝置的 Hermes 引擎執行；兩邊結果要一致。

## 決策

使用 `new Intl.Collator('zh-Hant-TW', { usage: 'sort', sensitivity: 'variant', numeric: true })`，即 CLDR `zh-Hant` 的預設定序：**筆畫**。比較結果為 0 時以 code point 順序、再以 id 決定，保證全序。植物清單也使用同一個比較函式。

已在 Node（full ICU）確認的結果：

```
['🌵仙人掌', '大岩桐', '文竹', '虎尾蘭', '盆栽2', '盆栽10', '龜背芋', 'aloe', 'Aloe', 'Basil', 'Monstera']
```

（以注音定序 `zh-TW-u-co-zhuyin` 則為 大岩桐、龜背芋、虎尾蘭、文竹。）

## 考慮過的選項

| 選項 | 優點 | 缺點 |
| --- | --- | --- |
| 筆畫，`zh-Hant-TW` 預設定序（選定） | 臺灣繁體中文的 CLDR 預設，不需指定擴充定序；各平台 ICU 最可能一致支援 | 使用者不容易憑直覺預期筆畫順序 |
| 注音，`zh-TW-u-co-zhuyin` | 與注音輸入法的心智模型接近 | 屬擴充定序，Hermes 在 Android／iOS 不一定支援，不支援時會靜默退回預設定序，造成平台間不一致 |
| 自帶筆畫或注音對照表 | 結果完全由我們控制 | 要收錄數萬個字的資料，增加 bundle 大小與維護成本 |
| Unicode code point 順序 | 完全確定、零依賴 | 對中文使用者沒有意義（約略為部首順序），英文大小寫分開 |

## 後果

- `Intl` 是 ECMAScript 標準 API，core 直接使用，不建 port。
- 風險：Hermes 的 `Intl.Collator` 由平台實作（Android 用系統 ICU，iOS 用 Foundation），結果可能與 Node 不同。驗證方式：`us-03-today-list.yaml` 以 `fixtures/storage/sort-zh-stroke.json` 在 Android 與 iOS 兩個 CI job 斷言順序為 大岩桐、文竹、虎尾蘭、龜背芋。若任一平台不符，開 `needs-design`，改為自帶常用字筆畫表等方案。
- 中文排在英文之前，emoji 與符號開頭的名稱排最前面；這是 CLDR 的行為，不另外調整。
