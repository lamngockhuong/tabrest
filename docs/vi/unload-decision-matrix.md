# Ma trận quyết định giải phóng tab

Cách TabRest quyết định khi nào cần giải phóng tab.

## Tác nhân kích hoạt

| Tác nhân | Tần suất | Mục đích |
| ---------------- | ----------- | --------------------------------------------------------------- |
| **Bộ hẹn giờ** | Mỗi 1 phút | Giải phóng tab không hoạt động quá `unloadDelayMinutes` |
| **Bộ nhớ** | Mỗi 30 giây | Giải phóng tab LRU khi RAM vượt `memoryThresholdPercent` |
| **Vùng nhớ từng tab** | Mỗi 30 giây | Giải phóng tab có vùng nhớ JavaScript vượt `perTabJsHeapThresholdMB` |
| **Danh sách đen** | Cùng bộ hẹn giờ | Giải phóng ngay tab khớp với miền trong danh sách đen |

## Ma trận bảo vệ

| Bảo vệ                  | Bộ hẹn giờ | Bộ nhớ | Vùng nhớ từng tab | Danh sách đen |
| ----------------------- | :---: | :----: | :----------: | :-------: |
| Đang tạm dừng toàn cục  |  Có   |   Có   |      Có      |    Có     |
| Tab đang hoạt động      |  Có   |   Có   |      Có      |    Có     |
| Tab đã giải phóng       |  Có   |   Có   |      Có      |    Có     |
| Đang tạm hoãn           |  Có   |   Có   |      Có      |    Có     |
| Tab đã ghim (nếu bật)   |  Có   |   Có   |      Có      |    Có     |
| Danh sách trắng         |  Có   |   Có   |      Có      |    Có     |
| Đang phát âm thanh      |  Có   |   Có   |      Có      |    Có     |
| Biểu mẫu chưa lưu       |  Có   |   Có   |      Có      |    Có     |
| Bỏ qua khi ngoại tuyến  |  Có   |   Có   |      Có      |    Có     |
| Chỉ khi không hoạt động |  Có   | Không  |    Không     |   Không   |
| Ngưỡng số tab tối thiểu |  Có   | Không  |    Không     |   Không   |

**Ghi chú:** Chế độ chỉ chạy khi người dùng không hoạt động và ngưỡng số tab tối thiểu chỉ áp dụng cho bộ hẹn giờ:

| Bảo vệ | Tại sao chỉ áp dụng cho bộ hẹn giờ? |
| ----------------- | ----------------------------------------------------------------------------- |
| **Chỉ khi không hoạt động** | Thiếu bộ nhớ là tình huống khẩn cấp; chờ người dùng ngừng hoạt động có thể làm treo máy nếu RAM đầy |
| **Ngưỡng số tab** | Áp lực bộ nhớ cần được xử lý ngay, bất kể số tab |

Bộ hẹn giờ phục vụ sự tiện lợi, còn bộ nhớ/vùng nhớ là tình huống khẩn cấp cần xử lý ngay để tránh sự cố.

**Ghi chú:** Tạm dừng toàn cục được kiểm tra trước mọi tác nhân ở trên và chặn cả bốn tác nhân cùng
lúc. Đây không phải cơ chế bảo vệ từng tab. Nó không ảnh hưởng đến thao tác giải phóng thủ công
(tab hiện tại/tab khác/bên trái/bên phải, trình đơn chuột phải, phím tắt hoặc nhấp thanh công cụ).

## Thứ tự ưu tiên bảo vệ

```
0. GHI ĐÈ TOÀN CỤC (kiểm tra đầu tiên, chặn mọi trigger)
   - Đang tạm dừng toàn cục (pause-manager.isPaused())

1. TUYỆT ĐỐI (không bao giờ giải phóng)
   - Tab đang hoạt động
   - Tab đã giải phóng

2. BẢO VỆ RÕ RÀNG TỪ USER
   - Tab/miền đang tạm hoãn

3. BẢO VỆ DỮ LIỆU
   - Biểu mẫu chưa lưu
   - Chế độ ngoại tuyến (tab không thể tải lại)

4. BẢO VỆ TRẢI NGHIỆM
   - Đang phát âm thanh
   - Miền trong danh sách trắng
   - Tab đã ghim

5. CÓ ĐIỀU KIỆN (chỉ bộ hẹn giờ)
   - Kiểm tra idle-only
   - Ngưỡng số tab tối thiểu
```

## Luồng quyết định

```
Tác nhân đến (Bộ hẹn giờ/Bộ nhớ/Vùng nhớ/Danh sách đen)
                │
                ▼
┌───────────────────────────────┐
│ GHI ĐÈ TOÀN CỤC (tất cả)      │
│ • Đang tạm dừng? → BỎ QUA HẾT │
└───────────────────────────────┘
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
│ • Ngoại tuyến? → BỎ QUA       │
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
│ CÓ ĐIỀU KIỆN (chỉ bộ hẹn giờ) │
│ • User không idle? → BỎ QUA   │
│ • Dưới minTabs? → BỎ QUA      │
└───────────────────────────────┘
                │
                ▼
          ✓ GIẢI PHÓNG TAB
```

## Chế độ năng lượng

| Chế độ | Hệ số thời gian | Mức điều chỉnh ngưỡng bộ nhớ |
| ------------- | ---------------------- | ---------------------- |
| Battery Saver | 0.5x (tích cực hơn)    | -10% (ngưỡng thấp hơn) |
| Normal        | 1.0x                   | 0%                     |
| Performance   | 2.0x (ít tích cực hơn) | +10% (ngưỡng cao hơn)  |

## Cùng tồn tại với Chrome Memory Saver

Từ Chrome 108, trình duyệt có cơ chế giải phóng tab riêng mang tên Memory Saver tại `chrome://settings/performance`. Cơ chế này chạy ở tầng trình duyệt và **không** tham khảo bất kỳ tiện ích nào, kể cả TabRest.

### Điều này nghĩa là gì trong thực tế

- Danh sách trắng và trạng thái tạm hoãn của TabRest được lưu trong `chrome.storage`. Chúng ngăn **TabRest** giải phóng tab nhưng **không** ngăn Chrome Memory Saver giải phóng.
- Chrome Memory Saver chỉ tôn trọng điều kiện riêng: tab đang phát âm thanh, dùng máy ảnh/micrô, có biểu mẫu chưa lưu, đã ghim hoặc nằm trong danh sách **Luôn duy trì hoạt động cho các trang web này** của Chrome.
- Không có API tiện ích Chrome nào cho phép loại trừ tab khỏi Memory Saver.

### Thiết lập khuyến nghị

| Thiết lập                                                                                                                | Đánh đổi                                                             |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Tắt Chrome Memory Saver, chỉ dùng TabRest                                                                                | Hành vi sạch nhất; toàn quyền kiểm soát qua cài đặt TabRest          |
| Giữ Chrome Memory Saver và thêm lại các miền quan trọng vào danh sách **Luôn duy trì hoạt động cho các trang web này** của Chrome | Hai hệ thống cùng chạy; người dùng phải duy trì hai danh sách |
| Giữ Chrome Memory Saver mà không thêm danh sách tương ứng | Danh sách trắng/tạm hoãn có vẻ "không hoạt động" với tab do Chrome giải phóng |

Đây là giới hạn của nền tảng Chrome, không phải giới hạn của TabRest.
