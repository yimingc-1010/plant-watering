import { fieldErrors, format, strings } from '../strings';
import { tokens } from '../theme/tokens';

describe('tokens', () => {
  it('matches docs/design/tokens.md', () => {
    expect(tokens.color).toEqual({
      background: '#F6F8F4',
      surface: '#FFFFFF',
      text: '#1B1F1A',
      textSecondary: '#5A6357',
      primary: '#2E7D32',
      onPrimary: '#FFFFFF',
      dueTodayText: '#1E5E22',
      dueTodayBg: '#E3F1E3',
      overdueText: '#8A4B00',
      overdueBg: '#FFF1DD',
      danger: '#B3261E',
      border: '#7A8476',
      divider: '#C5CCC1',
      snackbarBg: '#2B312A',
      snackbarText: '#FFFFFF',
      snackbarAction: '#A5D6A7',
      scrim: 'rgba(0, 0, 0, 0.4)',
    });
    expect(tokens.font).toEqual({
      title: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
      heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
      body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
      caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    });
    expect(tokens.space).toEqual({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 });
    expect(tokens.size).toEqual({ minTouch: 44, inputHeight: 48 });
    expect(tokens.radius).toEqual({ sm: 6, md: 10, lg: 16 });
    expect(tokens.border).toEqual({ width: 1, errorWidth: 2 });
    expect(tokens.duration).toEqual({ undoSnackbar: 5000, errorSnackbar: 5000, fast: 150 });
  });

  it('keeps the undo window and touch target required by the PRD', () => {
    expect(tokens.duration.undoSnackbar).toBe(5000);
    expect(tokens.size.minTouch).toBe(44);
  });
});

describe('strings', () => {
  it('has the fixed texts from docs/design/screens.md', () => {
    expect(strings.today.title).toBe('今日待澆');
    expect(strings.today.emptyNoneDue).toBe('今天沒有要澆的植物');
    expect(strings.today.emptyNoPlants).toBe('還沒有植物');
    expect(strings.tabs).toEqual({ today: '今日', plants: '植物' });
    expect(strings.plants.title).toBe('植物');
    expect(strings.plants.add).toBe('新增');
    expect(strings.plants.empty).toBe('還沒有植物');
    expect(strings.common.addPlant).toBe('新增植物');
    expect(strings.common.water).toBe('已澆水');
    expect(strings.common.save).toBe('儲存');
    expect(strings.common.cancel).toBe('取消');
    expect(strings.plantForm.newTitle).toBe('新增植物');
    expect(strings.plantForm.editTitle).toBe('編輯植物');
    expect(strings.plantForm.nameLabel).toBe('名稱');
    expect(strings.plantForm.nameHint).toBe('最多 30 個字');
    expect(strings.plantForm.intervalLabel).toBe('澆水間隔（天）');
    expect(strings.plantForm.intervalHint).toBe('1–365');
    expect(strings.plantForm.lastWateredLabel).toBe('上次澆水日');
    expect(strings.plantForm.delete).toBe('刪除植物');
    expect(strings.confirmDelete).toEqual({ confirm: '刪除', cancel: '取消' });
    expect(strings.snackbar.undo).toBe('復原');
    expect(strings.snackbar.saveFailed).toBe('儲存失敗，請再試一次');
    expect(strings.loadError).toBe('無法讀取資料');
  });

  it('has the error text for every field and error code', () => {
    expect(fieldErrors).toEqual({
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
    });
  });
});

describe('format', () => {
  it('formats the interval', () => {
    expect(format.interval(7)).toBe('每 7 天');
  });

  it('formats the due status', () => {
    expect(format.dueStatus(0)).toBe('今天到期');
    expect(format.dueStatus(3)).toBe('逾期 3 天');
  });

  it('formats dates on list rows and the edit form', () => {
    expect(format.lastWatered('2026-03-01')).toBe('上次 2026-03-01');
    expect(format.nextWatering('2026-03-08')).toBe('下次 2026-03-08');
    expect(format.lastWateredValue('2026-03-01')).toBe('上次澆水日 2026-03-01');
  });

  it('formats texts that include the plant name', () => {
    expect(format.waterLabel('龜背芋')).toBe('龜背芋，已澆水');
    expect(format.wateredMessage('龜背芋')).toBe('已記錄「龜背芋」澆水');
    expect(format.confirmDelete('龜背芋')).toBe('要刪除「龜背芋」嗎？');
  });

  it('formats the app version', () => {
    expect(format.version('0.1.0')).toBe('版本 0.1.0');
  });
});
