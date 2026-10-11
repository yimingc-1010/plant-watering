import type { LocalDate } from '../date/local-date';
import type { PlantId } from '../plant/plant';
import type { NewPlantInput, PlantEditInput, PlantFieldErrors } from '../plant/validation';
import type { UndoToken } from './garden';

/**
 * Application service: the UI's only entry point to garden data.
 * See docs/design/modules.md "GardenService".
 */

export interface PlantView {
  id: PlantId;
  name: string;
  intervalDays: number;
  lastWateredOn: LocalDate;
  nextWateringOn: LocalDate;
  overdueDays: number; // 負數 = 未到期
}

export interface GardenSnapshot {
  status: 'loading' | 'ready' | 'error';
  today: LocalDate;
  plants: PlantView[]; // 植物清單排序
  dueList: PlantView[]; // 今日待澆排序，只含 overdueDays >= 0
}

export interface GardenService {
  load(): Promise<void>; // 讀取 + 遷移；失敗時 status = 'error'，不覆寫資料
  getSnapshot(): GardenSnapshot; // 狀態不變時回傳同一個物件（供 useSyncExternalStore）
  subscribe(listener: () => void): () => void;
  refreshToday(): void; // 重新讀取時鐘；日期改變才通知
  addPlant(input: NewPlantInput): Promise<MutationResult<PlantId>>;
  updatePlant(id: PlantId, input: PlantEditInput): Promise<MutationResult<void>>;
  deletePlant(id: PlantId): Promise<void>;
  water(id: PlantId): Promise<UndoToken>;
  undoWatering(token: UndoToken): Promise<void>;
}

export type MutationResult<T> = { ok: true; value: T } | { ok: false; errors: PlantFieldErrors };
