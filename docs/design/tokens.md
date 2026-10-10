# Design tokens

> 實作位置：`apps/mobile/src/theme/tokens.ts`（`as const` 物件），畫面與元件只引用 token，不寫死數值。
> 只有淺色主題：`apps/mobile/app.json` 設定 `userInterfaceStyle: light`，MVP 不做深色模式。

## 色彩

對比度以 WCAG 2.x 公式計算（已以腳本驗證）；文字至少 4.5:1，非文字 UI（輸入框外框）至少 3:1。

| Token | 值 | 用途 | 對比 |
| --- | --- | --- | --- |
| `color.background` | `#F6F8F4` | 畫面底色 | — |
| `color.surface` | `#FFFFFF` | 清單列、表單、對話框 | — |
| `color.text` | `#1B1F1A` | 主要文字 | 16.7:1（surface）、15.6:1（background） |
| `color.textSecondary` | `#5A6357` | 次要文字（日期、間隔、提示） | 6.3:1（surface）、5.9:1（background） |
| `color.primary` | `#2E7D32` | 主要按鈕底色、連結、選中的分頁 | 5.1:1（surface 上作文字） |
| `color.onPrimary` | `#FFFFFF` | 主要按鈕文字 | 5.1:1（primary） |
| `color.dueTodayText` | `#1E5E22` | 「今天到期」文字 | 6.7:1（dueTodayBg） |
| `color.dueTodayBg` | `#E3F1E3` | 「今天到期」標籤底色 | — |
| `color.overdueText` | `#8A4B00` | 「逾期 N 天」文字、植物清單已到期的下次澆水日 | 6.1:1（overdueBg） |
| `color.overdueBg` | `#FFF1DD` | 「逾期 N 天」標籤底色 | — |
| `color.danger` | `#B3261E` | 欄位錯誤文字與外框、刪除按鈕 | 6.5:1（surface） |
| `color.border` | `#7A8476` | 輸入框外框 | 3.9:1（surface） |
| `color.divider` | `#C5CCC1` | 清單分隔線（裝飾） | — |
| `color.snackbarBg` | `#2B312A` | 提示底色 | — |
| `color.snackbarText` | `#FFFFFF` | 提示文字 | 13.3:1（snackbarBg） |
| `color.snackbarAction` | `#A5D6A7` | 提示上的「復原」 | 8.1:1（snackbarBg） |
| `color.scrim` | `rgba(0, 0, 0, 0.4)` | 確認對話框背後的遮罩 | — |

狀態不只靠顏色區分：「今天到期」與「逾期 N 天」都有文字，錯誤欄位同時顯示錯誤文字。

## 字級

使用系統字型（iOS San Francisco / PingFang TC，Android Roboto / Noto Sans CJK），不內嵌字型。數值為未縮放的 pt，隨系統字級縮放（`allowFontScaling` 保持預設）。

| Token | 大小 / 行高 | 字重 | 用途 |
| --- | --- | --- | --- |
| `font.title` | 22 / 28 | 600 | 畫面標題 |
| `font.heading` | 18 / 24 | 600 | 清單列的植物名稱 |
| `font.body` | 16 / 22 | 400 | 一般文字、輸入框、按鈕 |
| `font.caption` | 14 / 20 | 400 | 日期、間隔、欄位提示與錯誤、狀態標籤 |

## 間距

4 pt 為基準。

| Token | 值 | 用途 |
| --- | --- | --- |
| `space.xs` | 4 | 文字與其標籤之間 |
| `space.sm` | 8 | 列內元素間距 |
| `space.md` | 12 | 列的上下內距 |
| `space.lg` | 16 | 畫面左右邊距、列的左右內距 |
| `space.xl` | 24 | 區塊之間、表單欄位之間 |
| `space.xxl` | 32 | 空狀態上下留白 |

## 尺寸與圓角

| Token | 值 | 用途 |
| --- | --- | --- |
| `size.minTouch` | 44 | 所有可點元素的最小寬高（PRD 非功能需求） |
| `size.inputHeight` | 48 | 輸入框最小高度（字級放大時可長高） |
| `radius.sm` | 6 | 狀態標籤 |
| `radius.md` | 10 | 按鈕、輸入框、提示 |
| `radius.lg` | 16 | 對話框 |
| `border.width` | 1 | 輸入框外框；錯誤時 2 |

## 動態與時間

| Token | 值 | 用途 |
| --- | --- | --- |
| `duration.undoSnackbar` | 5000 ms | 復原提示顯示時間（ADR-005） |
| `duration.errorSnackbar` | 5000 ms | 儲存失敗提示顯示時間 |
| `duration.fast` | 150 ms | 提示淡入淡出、列消失 |

e2e build 停用動畫不影響結果（CI 模擬器以 `disable-animations` 啟動）；提示時間不因 fake 模式改變。
