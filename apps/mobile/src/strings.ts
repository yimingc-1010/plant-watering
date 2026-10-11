/**
 * All user-facing text (Traditional Chinese only). Texts follow
 * docs/design/screens.md; screens import from here instead of inlining text.
 */
import type { PlantFieldErrors } from '@app/core';

export const strings = {
  tabs: {
    today: '今日',
    plants: '植物',
  },
  common: {
    addPlant: '新增植物',
    water: '已澆水',
    save: '儲存',
    cancel: '取消',
  },
  today: {
    title: '今日待澆',
    emptyNoneDue: '今天沒有要澆的植物',
    emptyNoPlants: '還沒有植物',
  },
  plants: {
    title: '植物',
    add: '新增',
    empty: '還沒有植物',
  },
  plantForm: {
    newTitle: '新增植物',
    editTitle: '編輯植物',
    nameLabel: '名稱',
    nameHint: '最多 30 個字',
    intervalLabel: '澆水間隔（天）',
    intervalHint: '1–365',
    lastWateredLabel: '上次澆水日',
    delete: '刪除植物',
  },
  confirmDelete: {
    confirm: '刪除',
    cancel: '取消',
  },
  snackbar: {
    undo: '復原',
    saveFailed: '儲存失敗，請再試一次',
  },
  loadError: '無法讀取資料',
} as const;

/**
 * Error text per form field and error code. Keyed by the core error types, so
 * adding an error code in @app/core fails typecheck until its text is added.
 */
export const fieldErrors: {
  readonly [F in keyof Required<PlantFieldErrors>]: Readonly<
    Record<NonNullable<PlantFieldErrors[F]>, string>
  >;
} = {
  name: {
    required: '請輸入名稱',
    tooLong: '名稱最多 30 個字',
    duplicate: '已有同名的植物',
  },
  interval: {
    required: '請輸入澆水間隔',
    notInteger: '請輸入整數天數',
    outOfRange: '間隔須為 1–365 天',
  },
  lastWateredOn: {
    invalidDate: '請以 YYYY-MM-DD 格式輸入日期',
    inFuture: '上次澆水日不能晚於今天',
  },
};

/** Texts built from values. Dates are already `YYYY-MM-DD` strings. */
export const format = {
  /** Watering interval, e.g. `每 7 天`. */
  interval: (days: number) => `每 ${days} 天`,
  /** Due status from days overdue: 0 → `今天到期`, N → `逾期 N 天`. */
  dueStatus: (daysOverdue: number) => (daysOverdue === 0 ? '今天到期' : `逾期 ${daysOverdue} 天`),
  /** Last watered date on a plant row. */
  lastWatered: (date: string) => `上次 ${date}`,
  /** Next watering date on a plant row. */
  nextWatering: (date: string) => `下次 ${date}`,
  /** Read-only last watered date on the edit form. */
  lastWateredValue: (date: string) => `上次澆水日 ${date}`,
  /** Accessibility label of a row's water button. */
  waterLabel: (name: string) => `${name}，${strings.common.water}`,
  /** Undo snackbar message. */
  wateredMessage: (name: string) => `已記錄「${name}」澆水`,
  /** Delete confirmation dialog message. */
  confirmDelete: (name: string) => `要刪除「${name}」嗎？`,
  /** App version footer. */
  version: (version: string) => `版本 ${version}`,
} as const;
