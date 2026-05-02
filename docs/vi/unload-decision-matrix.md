# Ma Trận Quyết Định Giải Phóng Tab

Cách TabRest quyết định khi nào giải phóng tab.

## Triggers

| Trigger          | Tần suất    | Mục đích                                                        |
| ---------------- | ----------- | --------------------------------------------------------------- |
| **Timer**        | Mỗi 1 phút  | Giải phóng tab không hoạt động quá `unloadDelayMinutes`         |
| **Memory**       | Mỗi 30 giây | Giải phóng tab LRU khi RAM vượt `memoryThresholdPercent`        |
| **Per-tab Heap** | Mỗi 30 giây | Giải phóng tab có JS heap vượt `perTabJsHeapThresholdMB`        |
| **Blacklist**    | Cùng Timer  | Giải phóng ngay lập tức các tab khớp với domain trong danh sách đen |

## Ma Trận Bảo Vệ

| Bảo vệ                  | Timer | Memory | Per-tab Heap | Blacklist |
| ----------------------- | :---: | :----: | :----------: | :-------: |
| Tab đang hoạt động      |  Có   |   Có   |      Có      |    Có     |
| Đã giải phóng           |  Có   |   Có   |      Có      |    Có     |
| Đang tạm hoãn           |  Có   |   Có   |      Có      |    Có     |
| Đã ghim (nếu bật)       |  Có   |   Có   |      Có      |    Có     |
| Danh sách trắng         |  Có   |   Có   |      Có      |    Có     |
| Đang phát âm thanh      |  Có   |   Có   |      Có      |    Có     |
| Biểu mẫu chưa lưu       |  Có   |   Có   |      Có      |    Có     |
| Bỏ qua khi offline      |  Có   |   Có   |      Có      |    Có     |
| Chỉ khi nhàn rỗi        |  Có   | Không  |    Không     |   Không   |
| Ngưỡng số tab tối thiểu |  Có   | Không  |    Không     |   Không   |

**Ghi chú:** Chỉ-khi-nhàn-rỗi và Ngưỡng số tab tối thiểu chỉ áp dụng cho Timer:

| Bảo vệ            | Tại sao chỉ Timer?                                                            |
| ----------------- | ----------------------------------------------------------------------------- |
| **Chỉ khi nhàn rỗi** | Memory là trường hợp khẩn cấp - đợi nhàn rỗi có thể gây treo hệ thống nếu RAM đầy |
| **Ngưỡng số tab** | Memory pressure cần giải phóng ngay, không quan tâm số lượng tab              |

Timer = tiện lợi (không gấp), Memory/Heap = khẩn cấp (cần xử lý ngay để tránh crash).

## Thứ Tự Ưu Tiên Bảo Vệ

```
1. TUYỆT ĐỐI (không bao giờ giải phóng)
   - Tab đang hoạt động
   - Đã giải phóng

2. BẢO VỆ RÕ RÀNG TỪ USER
   - Tab/domain đang tạm hoãn

3. BẢO VỆ DỮ LIỆU
   - Biểu mẫu chưa lưu
   - Chế độ offline (tab không thể tải lại)

4. BẢO VỆ TRẢI NGHIỆM
   - Đang phát âm thanh
   - Domain trong danh sách trắng
   - Tab đã ghim

5. CÓ ĐIỀU KIỆN (chỉ Timer)
   - Kiểm tra chỉ-khi-nhàn-rỗi
   - Ngưỡng số tab tối thiểu
```

## Luồng Quyết Định

```
Trigger đến (Timer/Memory/Heap/Blacklist)
                │
                ▼
┌───────────────────────────────┐
│ KIỂM TRA TUYỆT ĐỐI (tất cả)   │
│ • Đang hoạt động? → BỎ QUA    │
│ • Đã giải phóng? → BỎ QUA     │
│ • Đang tạm hoãn? → BỎ QUA     │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ BẢO VỆ DỮ LIỆU (tất cả)       │
│ • Biểu mẫu chưa lưu? → BỎ QUA │
│ • Offline? → BỎ QUA           │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ TRẢI NGHIỆM (tất cả)          │
│ • Đang phát âm thanh? → BỎ QUA│
│ • Trong danh sách trắng? → BỎ QUA│
│ • Đã ghim (bảo vệ)? → BỎ QUA  │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ CÓ ĐIỀU KIỆN (chỉ Timer)      │
│ • Không nhàn rỗi? → BỎ QUA    │
│ • Dưới ngưỡng số tab? → BỎ QUA│
└───────────────────────────────┘
                │
                ▼
          ✓ GIẢI PHÓNG TAB
```

## Chế Độ Tiết Kiệm

| Chế độ        | Hệ số delay            | Offset ngưỡng Memory   |
| ------------- | ---------------------- | ---------------------- |
| Battery Saver | 0.5x (tích cực hơn)    | -10% (ngưỡng thấp hơn) |
| Normal        | 1.0x                   | 0%                     |
| Performance   | 2.0x (ít tích cực hơn) | +10% (ngưỡng cao hơn)  |

## Cùng Tồn Tại Với Chrome Memory Saver

Chrome có sẵn cơ chế giải phóng tab riêng (Memory Saver, `chrome://settings/performance`, từ Chrome 108). Cơ chế này chạy ở tầng trình duyệt và **không** tham khảo bất kỳ extension nào, kể cả TabRest.

### Điều này nghĩa là gì trong thực tế

- Danh sách trắng và tạm hoãn là cờ của TabRest lưu trong `chrome.storage`. Chúng ngăn **TabRest** giải phóng một tab. Chúng **không** ngăn được **Chrome Memory Saver** giải phóng cùng tab đó.
- Chrome Memory Saver chỉ tôn trọng các điều kiện riêng của nó: tab đang phát âm thanh, đang dùng camera/mic, có biểu mẫu chưa lưu, đã ghim, hoặc nằm trong danh sách "Always keep these sites active" của Chrome.
- Không có Chrome Extension API nào cho phép loại trừ một tab khỏi Memory Saver.

### Các thiết lập khuyến nghị cho user

| Thiết lập                                                                                                                | Đánh đổi                                                             |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Tắt Chrome Memory Saver, chỉ dùng TabRest                                                                                | Hành vi sạch nhất; toàn quyền kiểm soát qua cài đặt TabRest          |
| Giữ Chrome Memory Saver bật VÀ duplicate các domain quan trọng vào danh sách "Always keep these sites active" của Chrome | Hai hệ thống cùng chạy; user phải duy trì hai danh sách              |
| Giữ Chrome Memory Saver bật mà không duplicate                                                                           | Danh sách trắng / tạm hoãn trông như "hỏng" với những tab Chrome quyết giải phóng |

Đây là giới hạn của nền tảng Chrome, không phải giới hạn của TabRest.
