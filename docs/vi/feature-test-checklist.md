# Checklist Tự Kiểm Tra Tính Năng TabRest

Danh sách kiểm tra QA thủ công định kỳ, bao quát mọi tính năng người dùng nhìn thấy. Chạy trước mỗi lần phát hành, sau đợt tái cấu trúc lớn hoặc khi Chrome cập nhật API tiện ích.

- **Phạm vi:** v0.0.4 (đã hoàn thành Sprint 1-3)
- **Thời lượng ước tính:** 60-90 phút cho một lượt đầy đủ
- **Trình duyệt:** Chrome (hoặc trình duyệt dùng nhân Chromium) bản ổn định mới nhất
- **Phạm vi ngôn ngữ:** Kiểm tra cả `en` và `vi` khi chuỗi giao diện thay đổi

## Cách sử dụng

1. Nạp tiện ích ở chế độ **Unpacked** từ `chrome://extensions` (bật Chế độ nhà phát triển).
2. Mở DevTools của service worker: `chrome://extensions` → TabRest → `Inspect views: service worker`.
3. Đi qua từng mục. Đánh `[x]` khi đạt kết quả mong đợi; đánh `[!]` và ghi chú nếu lỗi.
4. Đặt lại trạng thái giữa các mục khi được chỉ định (ví dụ: đặt lại thống kê, xóa danh sách trắng).

Ký hiệu: `[ ]` chưa test · `[x]` đạt · `[!]` lỗi · `[~]` bỏ qua / không áp dụng.

---

## 0. Kiểm tra trước khi chạy

- [ ] Tải lại tiện ích; service worker khởi động không lỗi trong bảng điều khiển DevTools.
- [ ] `chrome://extensions/?errors=<id>` trống cho TabRest.
- [ ] Trang hướng dẫn ban đầu tự mở khi cài lần đầu (hồ sơ ẩn danh hoặc thư mục dữ liệu mới).
- [ ] Biểu tượng trên thanh công cụ và huy hiệu hiển thị đúng ở 16/48/128 px.
- [ ] Mở cửa sổ TabRest → phần đầu có logo, phiên bản, nút giao diện và biểu tượng cài đặt.
- [ ] Mở Tùy chọn → mọi phần hiển thị vừa khung 1280×800.
- [ ] Đổi ngôn ngữ sang `vi` (Chrome → Cài đặt → Ngôn ngữ → đặt tiếng Việt làm chính rồi tải lại tiện ích); cửa sổ và trang tùy chọn chuyển sang tiếng Việt.
- [ ] Đổi lại `en`; chuỗi quay lại tiếng Anh.

## 1. Tự động giải phóng - Hẹn giờ không hoạt động

- [ ] Đặt `Unload after` = 5 phút (Options → Auto-Unload), `Min inactive tabs before discard` = Disabled.
- [ ] Mở 3 tab (trang bất kỳ không nằm trong danh sách trắng). Chuyển sang tab A.
- [ ] Đợi 5 phút trên tab A.
- [ ] Tab B và C được giải phóng (biểu tượng trang mờ, có tiền tố). Tab A vẫn hoạt động.
- [ ] Nhấp tab B đã giải phóng → tải lại tức thì, giữ nguyên vị trí cuộn nếu bật `restoreScrollPosition`.
- [ ] Đặt thời gian chờ = Disabled → tắt tự động giải phóng; xác nhận tab không còn được giải phóng sau 5 phút.

## 2. Tự động giải phóng - Ngưỡng RAM

- [ ] Đặt `Memory threshold` = 60% (Options → Memory Management).
- [ ] Mở đủ tab để RAM > 60% (hoặc tạm hạ ngưỡng = RAM hiện tại −5%).
- [ ] Trong 30 giây, tab LRU được giải phóng cho tới khi RAM xuống dưới ngưỡng.
- [ ] Đặt ngưỡng = 0 → tắt giải phóng theo bộ nhớ.

## 3. Tự động giải phóng - Giới hạn vùng nhớ JavaScript từng tab

- [ ] Đặt `Per-tab JS heap limit` = 100 MB (Options).
- [ ] Nếu đã cấp quyền máy chủ cho trình kiểm tra biểu mẫu, `chrome.scripting` chèn trình báo cáo vùng nhớ; nếu chưa, cửa sổ hiện thông báo khôi phục quyền.
- [ ] Mở trang nặng (Figma, Google Sheet lớn) và đợi > 30 giây.
- [ ] Tab được giải phóng khi vùng nhớ > 100 MB.
- [ ] Đặt giới hạn = 0 → tắt giám sát vùng nhớ.

## 4. Tự động giải phóng - Khi khởi động

- [ ] Bật `Auto-unload on startup` (Options).
- [ ] Thoát Chrome rồi mở lại với nhiều tab từ phiên trước.
- [ ] TẤT CẢ tab không hoạt động được giải phóng ngay sau khởi động, kể cả tab đã ghim và thuộc danh sách trắng.
- [ ] Tab ở mọi cửa sổ được khôi phục đều được giải phóng, không chỉ cửa sổ đang mở.
- [ ] Tắt → tab không được giải phóng sau khi mở lại.

## 5. Ngưỡng số tab inactive tối thiểu

- [ ] Đặt `Min inactive tabs before auto-discard` = 5.
- [ ] Khi có dưới 5 tab không hoạt động, tự động giải phóng KHÔNG chạy dù đã hết thời gian chờ.
- [ ] Mở thêm tab vượt ngưỡng → tự động giải phóng tiếp tục.

## 6. Chế độ chỉ chạy khi máy idle

- [ ] Bật `Only auto-unload when idle`; `Idle threshold` = 2 phút.
- [ ] Liên tục gõ phím / di chuột → không tự động giải phóng.
- [ ] Ngưng tương tác ≥ 2 phút → tự động giải phóng chạy ở lần báo thức kế tiếp.
- [ ] Tắt → tự động giải phóng chạy bất kể người dùng có hoạt động hay không.

## 7. Bỏ qua khi ngoại tuyến

- [ ] Bật `Skip when offline`.
- [ ] Ngắt mạng (DevTools → Network → Offline, hoặc tắt Wi-Fi).
- [ ] Đợi quá `unloadDelayMinutes` → không tab nào được giải phóng.
- [ ] Kết nối lại → tiếp tục giải phóng ở lần báo thức kế tiếp.

## 8. Power Mode

- [ ] Chuyển sang **Battery Saver**: hệ số thời gian 0,5x, ngưỡng bộ nhớ thấp hơn 10%, giải phóng tích cực hơn.
- [ ] Chuyển sang **Normal**: dùng giá trị mặc định.
- [ ] Chuyển sang **Performance**: hệ số thời gian 2x, ngưỡng bộ nhớ cao hơn 10%, giải phóng ít tích cực hơn.
- [ ] Sau mỗi lần chuyển, xác nhận chu kỳ báo thức thay đổi bằng `chrome.alarms.getAll` trong DevTools.

## 9. Điều khiển thủ công - Nút trong cửa sổ

- [ ] **Unload Current** → giải phóng tab đang mở; cửa sổ đóng; tab có tiền tố.
- [ ] **Unload Others** → mọi tab khác đang hoạt động đều được giải phóng.
- [ ] **More Actions → Unload Right** → chỉ tab bên phải tab đang mở được giải phóng.
- [ ] **More Actions → Unload Left** → chỉ tab bên trái.
- [ ] **More Actions → Close Duplicates** → trong window có ≥ 3 URL trùng, giữ tab cũ nhất, đóng các tab còn lại.
- [ ] Biểu tượng `Unload` trên mỗi dòng chỉ giải phóng đúng tab đó.

## 10. Phím tắt

Cấu hình tại `chrome://extensions/shortcuts`.

- [ ] `Alt+Shift+D` - giải phóng tab hiện tại.
- [ ] `Alt+Shift+O` - giải phóng các tab khác.
- [ ] `Alt+Shift+→` - giải phóng tab bên phải.
- [ ] `Alt+Shift+←` - giải phóng tab bên trái.
- [ ] Đổi binding một phím tắt → vẫn fire đúng lệnh.

## 11. Hành động khi nhấp thanh công cụ

- [ ] `popup` (mặc định) → nhấp biểu tượng để mở cửa sổ TabRest.
- [ ] `discard-current` → nhấp biểu tượng để giải phóng tab đang mở; không hiện cửa sổ.
- [ ] `discard-others` → nhấp biểu tượng để giải phóng mọi tab khác.
- [ ] Cài đặt có hiệu lực ngay sau khi lưu Tùy chọn, không cần tải lại service worker.

## 12. Menu chuột phải

- [ ] Nhấp chuột phải trên trang bất kỳ → trình đơn con TabRest hiện ra.
- [ ] `Unload this tab` hoạt động.
- [ ] `Add domain to whitelist` thêm tên máy chủ của trang (gồm localhost hoặc IP).
- [ ] Các lệnh `Snooze this tab (1h)` và `Snooze this site (1h)` hoạt động.
- [ ] Nhấp chuột phải vào liên kết → `Open link in suspended state` tạo tab đã giải phóng.

## 13. Tìm kiếm tab
- [ ] Nhấp nút tìm kiếm trong cửa sổ → ô nhập hiện ra và tự nhận tiêu điểm.
- [ ] Gõ chuỗi con → danh sách lọc theo title và URL (không phân biệt hoa/thường).
- [ ] Kết hợp các thẻ lọc (All / Sleeping / Snoozed / Protected) → lấy giao của các điều kiện (AND).
- [ ] Xóa nội dung ô nhập → danh sách đầy đủ trở lại.
- [ ] Đóng cửa sổ rồi mở lại → ô nhập thu lại và không giữ giá trị.

## 14. Thẻ lọc

- [ ] **All** hiển thị mọi tab.
- [ ] **Sleeping** chỉ tab đã giải phóng.
- [ ] **Snoozed** chỉ tab/miền đang tạm hoãn.
- [ ] **Protected** hiển thị tab đã ghim, đang phát âm thanh, có biểu mẫu hoặc thuộc danh sách trắng cùng huy hiệu tương ứng.
- [ ] Số đếm trên mỗi chip cập nhật trực tiếp khi tab đổi state.

## 15. Ghi nhớ trạng thái phần
- [ ] Thu gọn các phần `Sessions`, `More Actions`, `Stats`.
- [ ] Đóng cửa sổ rồi mở lại → các phần trên vẫn thu gọn.
- [ ] Mở rộng, đóng popup, mở lại → trạng thái mở rộng được giữ.
- [ ] Hành vi tương tự ở chế độ bảng bên.

## 16. Danh sách trắng (gồm localhost và IP)

- [ ] Thêm `youtube.com` qua ô nhập trong Tùy chọn → lưu; tab youtube.com được bảo vệ khỏi tự động giải phóng.
- [ ] Thêm `localhost` → tab `http://localhost:*` được bảo vệ.
- [ ] Thêm `127.0.0.1` → tab `http://127.0.0.1:*` được bảo vệ.
- [ ] Thêm `::1` (IPv6) → được bảo vệ.
- [ ] Nhập sai (ví dụ `http://`) → ô nhập báo lỗi, không lưu.
- [ ] Xóa mục → lần tự động giải phóng kế tiếp có thể giải phóng miền đó.
- [ ] Menu chuột phải `Add to whitelist` trên tab localhost hoặc IP hoạt động trọn vẹn.
- [ ] Thêm miền đã có trong danh sách đen → thông báo báo xung đột, không thêm.

## 17. Danh sách đen

- [ ] Thêm miền ưu tiên thấp vào danh sách đen.
- [ ] Tab thuộc miền đó được giải phóng ngay ở lần hẹn giờ kế tiếp (bỏ qua thời gian chờ).
- [ ] Xóa mục → ngừng giải phóng tích cực.
- [ ] Thêm miền đã có trong danh sách trắng → thông báo báo xung đột, không thêm.
- [ ] Miền xuất hiện ở cả hai danh sách do trạng thái cũ → danh sách trắng được ưu tiên, tab được bảo vệ.

## 18. Bảo vệ tab đã ghim / âm thanh / biểu mẫu

- [ ] Tab đã ghim + bật `Protect pinned tabs` → không bao giờ bị tự động giải phóng.
- [ ] Tab đã ghim + bật `Include pinned tabs` (tức cho phép giải phóng tab đã ghim) → dòng tương ứng vẫn có huy hiệu ghim vốn có và số đếm của bộ lọc được bảo vệ vẫn tính tab này.
- [ ] Tab phát YouTube + `Protect audio tabs` → không bị giải phóng.
- [ ] Tab có biểu mẫu chưa lưu (ví dụ Google Form điền dở) + `Protect form tabs` → không bị giải phóng; dòng tương ứng hiện huy hiệu `Form`.
- [ ] Tab có biểu mẫu chưa lưu trong trình soạn thảo React/contenteditable (ví dụ phần nội dung issue GitHub) → sau khi gõ, dòng tương ứng hiện huy hiệu `Form` vì tập lệnh chèn sớm bắt được thao tác bàn phím.
- [ ] Tab vừa thuộc danh sách trắng vừa ghim/phát âm thanh/có biểu mẫu → cửa sổ ưu tiên huy hiệu cụ thể, không hiện `safe`; danh sách trắng có mức ưu tiên thấp nhất.
- [ ] Tắt một cơ chế bảo vệ → tab phù hợp trở lại đủ điều kiện.
- [ ] **Buộc giải phóng** trong trình đơn từng tab bỏ qua mọi cơ chế bảo vệ.

## 19. Quyền máy chủ tùy chọn và tập lệnh kiểm tra biểu mẫu
- [ ] Cài mới: host permissions KHÔNG cấp mặc định.
- [ ] Tắt rồi bật `Protect form tabs` → lời nhắc cấp quyền hoặc thông báo khôi phục xuất hiện.
- [ ] Cấp quyền → trình kiểm tra biểu mẫu được chèn sớm mỗi khi trang tải (và chèn theo nhu cầu cho tab đã mở ở lần kiểm tra đầu); xác nhận qua huy hiệu trong cửa sổ và `window.__tabrestFormCheckLoaded` trong DevTools.
- [ ] Thu hồi qua `chrome://extensions` → banner phục hồi tái xuất trong popup với CTA "Enable".
- [ ] Bật `Discarded tab title prefix` → nếu chưa có quyền `scripting`/host, sẽ yêu cầu.

## 20. Tạm hoãn

- [ ] Tạm hoãn tab 30 phút → hiển thị huy hiệu `Snoozed`; tự động giải phóng bỏ qua tab đó.
- [ ] Tạm hoãn miền 1 giờ → mọi tab hiện tại và mới của miền đều được bảo vệ.
- [ ] Hủy tạm hoãn → tab/miền trở lại đủ điều kiện.
- [ ] Trạng thái tạm hoãn vẫn còn sau khi khởi động lại trình duyệt trong thời hạn.
- [ ] Tạm hoãn tự hết hạn khi bộ hẹn giờ kết thúc.

## 21. Cảnh báo trước khi giải phóng
- [ ] Bật `Show suspend warning`; thời gian chờ = 3000 ms.
- [ ] Mở một tab và để nó đủ điều kiện tự động giải phóng.
- [ ] Thông báo xuất hiện trong trang 3 giây trước khi giải phóng.
- [ ] Chuyển sang tab → hủy giải phóng.
- [ ] Phát âm thanh/hình ảnh, sửa biểu mẫu hoặc tạm hoãn trong 3 giây cũng hủy giải phóng.
- [ ] Tắt cài đặt → không có thông báo; tab được giải phóng im lặng.
- [ ] Delay tùy chỉnh (ví dụ 5000 ms) được tôn trọng.

## 22. Khôi phục thời điểm YouTube

- [ ] Bật `Save YouTube timestamp`.
- [ ] Phát YouTube đến 1:00 rồi giải phóng tab.
- [ ] Tải lại tab đã giải phóng → nội dung phát tiếp từ ≥ 0:55.
- [ ] Sau > 7 ngày → cache hết hạn (kiểm tra thủ công: chỉnh `chrome.storage.sync`).

## 23. Khôi phục vị trí cuộn

- [ ] Bật `Restore scroll position`.
- [ ] Cuộn nửa trang dài rồi để tab được giải phóng.
- [ ] Mở lại tab → khôi phục trong khoảng ±50 px so với vị trí gốc.
- [ ] Giới hạn 100 mục: giải phóng 110 tab khác nhau và xác nhận mục cũ bị loại khỏi `tabrest_scroll_positions` (`chrome.storage.local`).

## 24. Tab Groups

- [ ] Tạo group có 3 tab.
- [ ] Bộ chọn `Tab groups` trong cửa sổ hiển thị nhóm cùng số tab.
- [ ] `Unload this group` giải phóng mọi tab trong nhóm mà vẫn giữ nguyên cấu trúc.
- [ ] Tắt `Enable tab groups` → ẩn selector.
- [ ] Đa cửa sổ: mở hai cửa sổ với nhóm khác nhau → mỗi cửa sổ TabRest chỉ liệt kê nhóm của chính nó.
- [ ] Bảng bên: khi đang mở, tạo/đổi tên/xóa nhóm → bộ chọn tự cập nhật, không cần đóng rồi mở lại.

## 25. Chỉ báo trực quan

- [ ] Số trên huy hiệu = số tab đã giải phóng khi bật `Show badge count`.
- [ ] Tiền tố tiêu đề dùng ký hiệu đã cấu hình (mặc định `💤`); ký hiệu tùy chỉnh (≤ 4 ký tự) được lưu và áp dụng sau lời nhắc cấp quyền máy chủ.
- [ ] Tắt tiền tố → tiêu đề không đổi ở lần giải phóng kế tiếp.
- [ ] Tỷ lệ RAM ở phần đầu cửa sổ cập nhật khoảng mỗi 5 giây.

## 26. Chú giải ước lượng RAM
- [ ] Di chuột lên số liệu RAM trong cửa sổ → chú giải cách ước tính (ví dụ "~150 MB mỗi tab đã giải phóng").
- [ ] Nội dung chú giải có bản `vi`.
- [ ] Chú giải biến mất khi đưa chuột ra ngoài.

## 27. Thông báo

- [ ] Bật `Notify on auto-unload`.
- [ ] Kích hoạt tự động giải phóng → thông báo hệ thống hiện số tab và RAM tiết kiệm.
- [ ] Thông báo tôn trọng chế độ hỗ trợ tập trung / Không làm phiền của hệ điều hành.

## 28. Thống kê

- [ ] Sau khi giải phóng vài tab, phần `Stats` hiển thị đúng tổng hôm nay và từ trước đến nay.
- [ ] Ước lượng `RAM saved` tăng.
- [ ] `Member since` phản ánh ngày cài đặt.
- [ ] "Reset stats" về 0 và xác nhận qua toast.

## 29. Sessions

- [ ] Lưu window hiện tại thành session "test-1" (popup → Sessions → đặt tên → Save).
- [ ] Đóng mọi tab.
- [ ] Restore "test-1" → mở lại đúng danh sách tab (URL khớp, thứ tự giữ nguyên).
- [ ] Xóa `test-1` → mục tương ứng biến mất.
- [ ] Hơn 100 phiên đã lưu có thể phân trang hoặc cuộn mà không làm vỡ bố cục cửa sổ.

## 30. Import / Export

Kiểm tra từng loại: **danh sách trắng**, **danh sách đen**, **phiên**:

- [ ] Xuất → JSON được sao chép vào bảng nhớ tạm với lược đồ `version: 1`.
- [ ] Xóa danh sách rồi Import lại JSON đã export → khôi phục đầy đủ, không trùng.
- [ ] Nhập JSON có phần trùng → hợp nhất cộng dồn, loại trùng theo tên (phiên) hoặc miền (danh sách trắng/đen).
- [ ] Nhập danh sách trắng/đen có mục trùng danh sách đối lập → bỏ qua mục đó, tính vào số mục đã bỏ qua và không tạo xung đột.
- [ ] JSON sai cú pháp → toast lỗi, không thay đổi state.
- [ ] Sai schema version → từ chối với thông báo rõ ràng.

## 31. Bảng bên

- [ ] Options → Toolbar Action → bật `Open in side panel`.
- [ ] Nhấp biểu tượng trên thanh công cụ → bảng bên mở, cửa sổ nhỏ không mở.
- [ ] Bố cục bảng bên thích ứng ở chiều rộng 360 px và 480 px.
- [ ] Bảng bên vẫn mở khi chuyển tab và cửa sổ.
- [ ] Tắt bảng bên → thanh công cụ trở lại mở cửa sổ nhỏ.
- [ ] Mọi thao tác (tìm kiếm, lọc, tạm hoãn, lưu phiên, nhập/xuất) hoạt động trong bảng bên.
- [ ] Khi hành động trên thanh công cụ là `popup`, phần đầu cửa sổ có nút mở bảng bên.
- [ ] Nhấp nút đó → bảng bên của Chrome mở và cửa sổ nhỏ đóng.
- [ ] Khi đang ở bảng bên, nút mở bảng bên được ẩn.

## 32. Tự mở nhật ký thay đổi

- [ ] Tăng phiên bản manifest từ `0.0.4` → `0.0.5` (bản vá). Tải lại tiện ích → tab nhật ký thay đổi KHÔNG tự mở.
- [ ] Tăng `0.0.4` → `0.1.0` (minor) → trang changelog mở ở tab mới.
- [ ] Tăng `0.1.0` → `1.0.0` (major) → changelog mở.
- [ ] Khôi phục version; xóa `tabrest_lastVersion` trong `chrome.storage.local` để test lại.

## 33. Giao diện (Tối / Sáng)

- [ ] Bật chế độ tối trong cửa sổ → áp dụng tức thì.
- [ ] Mở Tùy chọn ở cửa sổ khác → chế độ tối đã bật nhờ đồng bộ giữa các trang.
- [ ] Đổi giao diện trong Tùy chọn → cửa sổ TabRest đổi theo.
- [ ] Trang hướng dẫn ban đầu và nhật ký thay đổi dùng đúng giao diện đã chọn.
- [ ] Tôn trọng chế độ tối của hệ điều hành khi cài lần đầu.

## 34. Báo cáo lỗi

- [ ] Nhấp `Report a bug` ở chân cửa sổ → hộp thoại mở với thông tin chẩn đoán điền sẵn (phiên bản tiện ích, Chrome và nền tảng).
- [ ] Gửi → mở liên kết issue GitHub có sẵn nội dung.
- [ ] Tắt `Send anonymous error reports` → lỗi service worker KHÔNG bị gửi (xác minh không có request mạng trong DevTools).
- [ ] Bật → lỗi được thu thập qua `error-reporter.js` (kiểm tra thủ công: tạo một lỗi thử nghiệm).

## 35. Hướng dẫn ban đầu

- [ ] Cài mới → tab onboarding tự mở.
- [ ] Đi qua các tính năng chính và link tới Options.
- [ ] Giao diện khớp với lựa chọn của người dùng.

## 36. Bao phủ i18n

- [ ] Đổi UI Chrome sang tiếng Việt.
- [ ] Mọi chuỗi trong cửa sổ, tùy chọn, hướng dẫn ban đầu, nhật ký thay đổi, thông báo và lỗi đều hiện bằng tiếng Việt (không còn chỗ giữ `__MSG_*__`, không tự rơi về tiếng Anh ngoài chủ đích).
- [ ] Số/ngày dùng định dạng đúng locale.

## 37. Đặt lại cài đặt mặc định

- [ ] Trong cửa sổ → Cài đặt nhanh → nhấp `Reset to Defaults` → xác nhận nội tuyến hiện `Are you sure?` cùng nút Có/Hủy.
- [ ] Nhấp Hủy → trở lại nút ban đầu, không thay đổi gì.
- [ ] Nhấp Có → mọi cài đặt trở về `SETTINGS_DEFAULTS`; bộ chọn thời gian và ngưỡng cập nhật ngay; hiện thông báo.
- [ ] Trong Tùy chọn → chân trang → nhấp `Reset to Defaults` → hộp thoại xác nhận của trình duyệt xuất hiện.
- [ ] Xác nhận → mọi cài đặt (hộp chọn, bộ chọn, nút chọn, danh sách trắng/đen) trở về mặc định; hiện thông báo trạng thái.
- [ ] Sau khi đặt lại, danh sách trắng chỉ còn các mục mặc định (`youtube.com`, `meet.google.com`).
- [ ] Sau khi đặt lại, chế độ năng lượng trở về `Normal`.

## 38. Đồng bộ cài đặt

- [ ] Đăng nhập Chrome với tài khoản có sync.
- [ ] Sửa cài đặt trên Hồ sơ A; trên Hồ sơ B (cùng tài khoản), xác nhận đồng bộ trong khoảng 1 phút.
- [ ] Sessions và whitelist truyền giữa các thiết bị (sessions lưu trong `chrome.storage.sync`).
- [ ] Tab activity giữ riêng từng máy (`chrome.storage.local`).

## 39. Độ bền của service worker

- [ ] Trong DevTools → Application → Service Workers → nhấp `Stop` để dừng worker.
- [ ] Đợi > 30s. Mở 1 tab rồi để máy idle.
- [ ] Worker tự thức qua `chrome.alarms`; tự động giải phóng vẫn chạy.
- [ ] Phiên dài (≥ 4 giờ) không rò rỉ bộ nhớ (`chrome://serviceworker-internals` cho thấy vùng nhớ ổn định).

## 40. Kiểm tra nhanh trên các trình duyệt dùng nhân Chromium

Kiểm tra nhanh trên:

- [ ] Brave bản mới nhất
- [ ] Edge bản mới nhất
- [ ] Vivaldi bản mới nhất
- [ ] Opera bản mới nhất

Xác nhận cửa sổ tải được, giải phóng thủ công hoạt động, bảng bên hiển thị ở nơi được hỗ trợ và phím tắt phản hồi.

## 41. Gỡ cài đặt / Dọn dẹp

- [ ] Gỡ tiện ích → mọi báo thức bị xóa.
- [ ] Chrome dọn các mục lưu trữ (xác minh bằng lần cài lại sạch: số liệu được đặt lại, không còn trạng thái tạm hoãn/tạm dừng/phiên cũ).
- [ ] Không còn tập lệnh nội dung mồ côi trong các tab từng được chèn sau khi cài lại.

## 42. Tạm dừng toàn cục

- [ ] Tạm dừng 30 phút / 1 giờ / 2 giờ / "Đến khi tôi tiếp tục" qua danh sách trên thanh tạm dừng → thanh hiện nút Tiếp tục kèm thời gian còn lại.
- [ ] Khi đang tạm dừng, tự động giải phóng (bộ hẹn giờ, bộ nhớ, vùng nhớ từng tab, khởi động) KHÔNG giải phóng tab nào.
- [ ] Khi đang tạm dừng, các thao tác giải phóng thủ công (Hiện tại/Khác/Trái/Phải, trình đơn chuột phải, phím tắt, nhấp thanh công cụ) vẫn hoạt động bình thường.
- [ ] Huy hiệu trên thanh công cụ hiển thị `❚❚` khi đang tạm dừng.
- [ ] Danh sách tab ẩn bộ đếm ngược của từng tab khi đang tạm dừng.
- [ ] Tạm dừng có thời hạn tự động tiếp tục khi hết hạn, không cần người dùng thao tác; huy hiệu và bộ đếm ngược trở lại bình thường.
- [ ] Tạm dừng "Đến khi tôi tiếp tục" giữ nguyên cho đến khi người dùng nhấn Tiếp tục.
- [ ] Trạng thái tạm dừng là device-local (`chrome.storage.local`) - tạm dừng trên một profile KHÔNG xuất hiện trên profile khác đã sync.
- [ ] Bảng bên: thanh tạm dừng phản ánh đúng trạng thái tạm dừng/tiếp tục như cửa sổ nhỏ.

---

## Mẫu báo cáo lỗi

Khi một mục kiểm tra không đạt, mở issue với:

- Phần + mã mục kiểm tra (ví dụ `§21 Cảnh báo trước khi giải phóng`).
- Các bước tái hiện.
- Kết quả mong đợi và thực tế.
- Trình duyệt + hệ điều hành + phiên bản tiện ích.
- Trích đoạn bảng điều khiển DevTools của service worker.
- Ảnh chụp hoặc bản ghi màn hình khi cần.

Repository: <https://github.com/lamngockhuong/tabrest/issues>
