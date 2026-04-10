# Ma Trận Quyết Định Unload

Cách TabRest quyết định khi nào unload tab.

## Triggers

| Trigger          | Tần suất    | Mục đích                                                        |
| ---------------- | ----------- | --------------------------------------------------------------- |
| **Timer**        | Mỗi 1 phút  | Unload tab không hoạt động quá `unloadDelayMinutes`             |
| **Memory**       | Mỗi 30 giây | Unload tab LRU khi RAM vượt `memoryThresholdPercent`            |
| **Per-tab Heap** | Mỗi 30 giây | Unload tab có JS heap vượt `perTabJsHeapThresholdMB`            |
| **Blacklist**    | Cùng Timer  | Unload ngay lập tức các tab khớp với domain trong danh sách đen |

## Ma Trận Bảo Vệ

| Bảo vệ                  | Timer | Memory | Per-tab Heap | Blacklist |
| ----------------------- | :---: | :----: | :----------: | :-------: |
| Tab đang active         |  Có   |   Có   |      Có      |    Có     |
| Đã discarded            |  Có   |   Có   |      Có      |    Có     |
| Đang snooze             |  Có   |   Có   |      Có      |    Có     |
| Pinned (nếu bật)        |  Có   |   Có   |      Có      |    Có     |
| Whitelist               |  Có   |   Có   |      Có      |    Có     |
| Đang phát âm thanh      |  Có   |   Có   |      Có      |    Có     |
| Form chưa lưu           |  Có   |   Có   |      Có      |    Có     |
| Bỏ qua khi offline      |  Có   |   Có   |      Có      |    Có     |
| Chỉ khi idle            |  Có   | Không  |    Không     |   Không   |
| Ngưỡng số tab tối thiểu |  Có   | Không  |    Không     |   Không   |

**Ghi chú:** Idle-only và Min tabs threshold chỉ áp dụng cho Timer:

| Bảo vệ            | Tại sao chỉ Timer?                                                            |
| ----------------- | ----------------------------------------------------------------------------- |
| **Chỉ khi idle**  | Memory là trường hợp khẩn cấp - đợi idle có thể gây treo hệ thống nếu RAM đầy |
| **Ngưỡng số tab** | Memory pressure cần giải phóng ngay, không quan tâm số lượng tab              |

Timer = tiện lợi (không gấp), Memory/Heap = khẩn cấp (cần xử lý ngay để tránh crash).

## Thứ Tự Ưu Tiên Bảo Vệ

```
1. TUYỆT ĐỐI (không bao giờ unload)
   - Tab đang active
   - Đã discarded

2. BẢO VỆ RÕ RÀNG TỪ USER
   - Tab/domain đang snooze

3. BẢO VỆ DỮ LIỆU
   - Form chưa lưu
   - Chế độ offline (tab không thể reload)

4. BẢO VỆ TRẢI NGHIỆM
   - Đang phát âm thanh
   - Domain trong whitelist
   - Tab pinned

5. CÓ ĐIỀU KIỆN (chỉ Timer)
   - Kiểm tra idle-only
   - Ngưỡng số tab tối thiểu
```

## Luồng Quyết Định

```
Trigger đến (Timer/Memory/Heap/Blacklist)
                │
                ▼
┌───────────────────────────────┐
│ KIỂM TRA TUYỆT ĐỐI (tất cả)   │
│ • Active? → BỎ QUA            │
│ • Discarded? → BỎ QUA         │
│ • Snoozed? → BỎ QUA           │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ BẢO VỆ DỮ LIỆU (tất cả)       │
│ • Form chưa lưu? → BỎ QUA     │
│ • Offline? → BỎ QUA           │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ TRẢI NGHIỆM (tất cả)          │
│ • Đang phát audio? → BỎ QUA   │
│ • Trong whitelist? → BỎ QUA   │
│ • Pinned (bảo vệ)? → BỎ QUA   │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ CÓ ĐIỀU KIỆN (chỉ Timer)      │
│ • User không idle? → BỎ QUA   │
│ • Dưới minTabs? → BỎ QUA      │
└───────────────────────────────┘
                │
                ▼
          ✓ UNLOAD TAB
```

## Chế Độ Power

| Chế độ        | Hệ số delay            | Offset ngưỡng Memory   |
| ------------- | ---------------------- | ---------------------- |
| Battery Saver | 0.5x (tích cực hơn)    | -10% (ngưỡng thấp hơn) |
| Normal        | 1.0x                   | 0%                     |
| Performance   | 2.0x (ít tích cực hơn) | +10% (ngưỡng cao hơn)  |
