# Checklist Tự Kiểm Tra Tính Năng TabRest

Checklist QA thủ công định kỳ, bao quát mọi tính năng người dùng nhìn thấy. Chạy trước mỗi lần phát hành, sau khi refactor lớn, hoặc khi Chrome cập nhật API extension.

- **Phạm vi:** v0.0.4 (đã hoàn thành Sprint 1–3)
- **Thời lượng ước tính:** 60–90 phút cho một lượt đầy đủ
- **Trình duyệt:** Chrome (hoặc nhân Chromium) bản stable mới nhất
- **Bao phủ ngôn ngữ:** Kiểm tra cả `en` và `vi` cho mọi thay đổi chuỗi UI

## Cách sử dụng

1. Tải extension dạng **Unpacked** từ `chrome://extensions` (bật Developer mode).
2. Mở DevTools của service worker: `chrome://extensions` → TabRest → "Inspect views: service worker".
3. Đi qua từng mục. Đánh `[x]` khi đạt kết quả mong đợi; đánh `[!]` và ghi chú nếu lỗi.
4. Reset trạng thái giữa các mục khi được chỉ định (ví dụ: reset thống kê, xóa whitelist).

Ký hiệu: `[ ]` chưa test · `[x]` đạt · `[!]` lỗi · `[~]` bỏ qua / không áp dụng.

---

## 0. Pre-flight

- [ ] Tải lại extension; service worker khởi động không lỗi trong DevTools console.
- [ ] `chrome://extensions/?errors=<id>` trống cho TabRest.
- [ ] Trang onboarding tự mở khi cài lần đầu (profile ẩn danh hoặc data dir mới).
- [ ] Icon trên toolbar và badge hiển thị đúng ở 16/48/128 px.
- [ ] Mở popup → header có logo, version, nút theme, biểu tượng cài đặt.
- [ ] Mở Options → mọi section render gọn ở 1280×800.
- [ ] Đổi ngôn ngữ sang `vi` (Chrome → Settings → Languages → đặt tiếng Việt làm chính, reload extension); chuỗi popup + options chuyển sang tiếng Việt.
- [ ] Đổi lại `en`; chuỗi quay lại tiếng Anh.

## 1. Auto-Unload - Hẹn giờ không hoạt động

- [ ] Đặt `Unload after` = 5 phút (Options → Auto-Unload), `Min inactive tabs before discard` = Disabled.
- [ ] Mở 3 tab (site bất kỳ không nằm trong whitelist). Focus tab A.
- [ ] Đợi 5 phút trên tab A.
- [ ] Tab B và C bị discard (favicon mờ, có prefix). Tab A vẫn loaded.
- [ ] Click tab B đã discard → tải lại tức thì, scroll giữ nguyên (nếu bật `restoreScrollPosition`).
- [ ] Đặt delay = Disabled → tắt auto-unload; xác nhận tab không còn discard sau 5 phút.

## 2. Auto-Unload - Ngưỡng RAM

- [ ] Đặt `Memory threshold` = 60% (Options → Memory Management).
- [ ] Mở đủ tab để RAM > 60% (hoặc tạm hạ ngưỡng = RAM hiện tại −5%).
- [ ] Trong 30s, tab LRU bị discard cho tới khi RAM tụt dưới ngưỡng.
- [ ] Đặt threshold = 0 → tắt discard theo memory.

## 3. Auto-Unload - Giới hạn JS Heap mỗi tab

- [ ] Đặt `Per-tab JS heap limit` = 100 MB (Options).
- [ ] Nếu host permission cho form-checker đã cấp trước đó, `chrome.scripting` inject reporter; ngược lại, banner phục hồi xuất hiện trong popup.
- [ ] Mở site nặng (Figma, Google Sheet lớn) và đợi > 30s.
- [ ] Tab discard khi heap > 100 MB.
- [ ] Đặt limit = 0 → tắt giám sát heap.

## 4. Auto-Unload - Khi khởi động

- [ ] Bật `Auto-unload on startup` (Options).
- [ ] Thoát Chrome rồi mở lại với nhiều tab từ phiên trước.
- [ ] Mọi tab không active và không trong whitelist bị discard ngay sau khởi động.
- [ ] Tắt → tab không discard sau khi mở lại.

## 5. Ngưỡng số tab inactive tối thiểu

- [ ] Đặt `Min inactive tabs before auto-discard` = 5.
- [ ] Khi < 5 tab inactive, auto-unload KHÔNG chạy dù đã hết delay.
- [ ] Mở thêm tab vượt ngưỡng → auto-unload tiếp tục.

## 6. Chế độ chỉ chạy khi máy idle

- [ ] Bật `Only auto-unload when idle`; `Idle threshold` = 2 phút.
- [ ] Liên tục gõ phím / di chuột → không có auto-unload.
- [ ] Ngưng tương tác ≥ 2 phút → auto-unload chạy ở alarm kế tiếp.
- [ ] Tắt → auto-unload chạy bất kể idle.

## 7. Bỏ qua khi offline

- [ ] Bật `Skip when offline`.
- [ ] Ngắt mạng (DevTools → Network → Offline, hoặc tắt Wi-Fi).
- [ ] Đợi vượt `unloadDelayMinutes` → không tab nào discard.
- [ ] Kết nối lại → discard tiếp tục ở alarm kế tiếp.

## 8. Power Mode

- [ ] Chuyển **Battery saver**: ngưỡng aggressive; delay dài hơn.
- [ ] Chuyển **Normal**: dùng default.
- [ ] Chuyển **Performance**: chu kỳ ngắn nhất, ưu tiên discard cao.
- [ ] Sau mỗi lần chuyển, kiểm tra alarm period đổi (DevTools `chrome.alarms.getAll`).

## 9. Điều khiển thủ công - Nút trong popup

- [ ] **Unload Current** → discard tab đang focus; popup đóng; tab có prefix.
- [ ] **Unload Others** → mọi tab khác active đều discard.
- [ ] **More Actions → Unload Right** → chỉ tab bên phải tab active discard.
- [ ] **More Actions → Unload Left** → chỉ tab bên trái.
- [ ] **More Actions → Close Duplicates** → trong window có ≥ 3 URL trùng, giữ tab cũ nhất, đóng các tab còn lại.
- [ ] Icon "Unload" mỗi dòng tab discard đúng tab đó.

## 10. Phím tắt

Cấu hình tại `chrome://extensions/shortcuts`.

- [ ] `Alt+Shift+D` - unload tab hiện tại.
- [ ] `Alt+Shift+O` - unload các tab khác.
- [ ] `Alt+Shift+→` - unload tab bên phải.
- [ ] `Alt+Shift+←` - unload tab bên trái.
- [ ] Đổi binding một phím tắt → vẫn fire đúng lệnh.

## 11. Hành động click toolbar

- [ ] `popup` (mặc định) → click icon mở popup.
- [ ] `discard-current` → click icon discard tab active; không popup.
- [ ] `discard-others` → click icon discard mọi tab khác.
- [ ] Đổi setting có hiệu lực ngay sau khi lưu Options, không cần reload service worker.

## 12. Menu chuột phải

- [ ] Right-click trên trang bất kỳ → submenu TabRest hiện ra.
- [ ] "Unload this tab" hoạt động.
- [ ] "Add domain to whitelist" thêm hostname trang đó (gồm localhost hoặc IP).
- [ ] "Snooze this tab (1h)" + "Snooze this site (1h)" hoạt động.
- [ ] Right-click trên link → "Open link in suspended state" tạo tab discarded.

## 13. Tìm kiếm tab
- [ ] Click toggle search trong popup → input xuất hiện và auto focus.
- [ ] Gõ chuỗi con → danh sách lọc theo title và URL (không phân biệt hoa/thường).
- [ ] Kết hợp filter chips (All / Sleeping / Snoozed / Protected) → giao (AND).
- [ ] Xóa input → danh sách đầy đủ trở lại.
- [ ] Đóng popup rồi mở lại → input thu lại (giá trị không lưu).

## 14. Filter Chips

- [ ] **All** hiển thị mọi tab.
- [ ] **Sleeping** chỉ tab đã discard.
- [ ] **Snoozed** tab/domain đang snooze.
- [ ] **Protected** tab pinned/audio/form/whitelist với badge tương ứng.
- [ ] Số đếm trên mỗi chip cập nhật trực tiếp khi tab đổi state.

## 15. Ghi nhớ trạng thái section
- [ ] Thu gọn các section "Sessions", "More Actions", "Stats".
- [ ] Đóng popup. Mở lại → các section trên vẫn thu gọn.
- [ ] Mở rộng, đóng popup, mở lại → trạng thái mở rộng được giữ.
- [ ] Hành vi tương tự ở chế độ side panel.

## 16. Whitelist (gồm localhost & IP)

- [ ] Thêm `youtube.com` qua text field Options → lưu; tab youtube.com được bảo vệ khỏi auto-unload.
- [ ] Thêm `localhost` → tab `http://localhost:*` được bảo vệ.
- [ ] Thêm `127.0.0.1` → tab `http://127.0.0.1:*` được bảo vệ.
- [ ] Thêm `::1` (IPv6) → được bảo vệ.
- [ ] Nhập sai (ví dụ `http://`) → input báo lỗi, không lưu.
- [ ] Xóa entry → auto-unload kế tiếp có thể discard domain đó.
- [ ] Context menu "Add to whitelist" trên tab localhost hoặc IP hoạt động trọn vẹn.
- [ ] Thêm domain đã có trong blacklist → toast báo conflict, không thêm.

## 17. Blacklist

- [ ] Thêm domain ưu tiên thấp vào blacklist.
- [ ] Tab thuộc domain đó discard ngay ở timer kế tiếp (bỏ qua delay).
- [ ] Xóa entry → ngừng discard aggressive.
- [ ] Thêm domain đã có trong whitelist → toast báo conflict, không thêm.
- [ ] Domain xuất hiện ở cả 2 list (state cũ) → whitelist thắng, tab được bảo vệ.

## 18. Bảo vệ Pinned / Audio / Form

- [ ] Tab ghim + bật `Protect pinned tabs` → không bao giờ discard qua auto-unload.
- [ ] Tab ghim + bật `Include pinned tabs` (tức cho phép discard tab ghim) → dòng popup vẫn hiển thị badge "pin" (intrinsic) và filter chip "protected" vẫn count.
- [ ] Tab phát YouTube + `Protect audio tabs` → không discard.
- [ ] Tab có form chưa lưu (ví dụ Google Form điền dở) + `Protect form tabs` → không discard; dòng popup hiển thị badge "Form".
- [ ] Tab có form chưa lưu trên React/contenteditable editor (ví dụ body issue GitHub) → sau khi gõ, dòng popup hiển thị badge "Form" (eager-injection bắt được keystroke).
- [ ] Tab vừa whitelist vừa pin/audio/form → popup ưu tiên badge cụ thể (pin/audio/form), không hiển thị "safe" - whitelist là priority thấp nhất.
- [ ] Tắt một protection → tab khớp trở lại đủ điều kiện.
- [ ] **Force unload** (menu mỗi tab trong popup) override mọi protection.

## 19. Optional Host Permissions + Form Injector
- [ ] Cài mới: host permissions KHÔNG cấp mặc định.
- [ ] Tắt rồi bật `Protect form tabs` → prompt cấp quyền hoặc banner phục hồi xuất hiện.
- [ ] Cấp quyền → form-checker eager-inject mỗi khi page load (và lazy-inject với tab đã mở sẵn ở lần check đầu); xác nhận qua badge popup và `window.__tabrestFormCheckLoaded` trong DevTools.
- [ ] Thu hồi qua `chrome://extensions` → banner phục hồi tái xuất trong popup với CTA "Enable".
- [ ] Bật `Discarded tab title prefix` → nếu chưa có quyền `scripting`/host, sẽ yêu cầu.

## 20. Snooze

- [ ] Snooze tab 30 phút → hiển thị badge "Snoozed"; auto-unload bỏ qua.
- [ ] Snooze domain 1 giờ → mọi tab hiện tại và mới của domain được bảo vệ.
- [ ] Hủy snooze → tab/domain trở lại đủ điều kiện.
- [ ] Snooze giữ qua khởi động lại trình duyệt (trong cùng window).
- [ ] Snooze tự hết hạn khi timer kết thúc.

## 21. Cảnh báo trước khi suspend
- [ ] Bật `Show suspend warning`; delay = 3000 ms.
- [ ] Mở một tab và để nó đủ điều kiện auto-unload.
- [ ] Toast xuất hiện trong trang 3 s trước khi discard.
- [ ] Chuyển sang tab → hủy discard.
- [ ] Bật audio/video, sửa form, hoặc snooze trong 3 s cũng hủy được.
- [ ] Tắt setting → không có toast; tab discard im lặng.
- [ ] Delay tùy chỉnh (ví dụ 5000 ms) được tôn trọng.

## 22. Khôi phục thời điểm YouTube

- [ ] Bật `Save YouTube timestamp`.
- [ ] Phát video YouTube đến 1:00 rồi unload tab.
- [ ] Reload tab đã discard → playback tiếp tục từ ≥ 0:55.
- [ ] Sau > 7 ngày → cache hết hạn (kiểm tra thủ công: chỉnh `chrome.storage.sync`).

## 23. Khôi phục vị trí cuộn

- [ ] Bật `Restore scroll position`.
- [ ] Cuộn nửa trang dài rồi để tab discard.
- [ ] Mở lại tab → khôi phục trong khoảng ±50 px so với vị trí gốc.
- [ ] Giới hạn 100 entry: discard 110 tab khác nhau và xác nhận entry cũ bị loại khỏi `tabrest_scroll_positions` (chrome.storage.local).

## 24. Tab Groups

- [ ] Tạo group có 3 tab.
- [ ] Selector `Tab groups` trong popup hiển thị group với số tab.
- [ ] "Unload this group" discard mọi tab trong group, giữ nguyên cấu trúc.
- [ ] Tắt `Enable tab groups` → ẩn selector.
- [ ] Đa cửa sổ: mở 2 cửa sổ với group khác nhau → popup mỗi cửa sổ chỉ liệt kê group của chính nó.
- [ ] Side panel: khi panel đang mở, tạo/đổi tên/xoá group → selector tự cập nhật, không cần đóng-mở.

## 25. Chỉ báo trực quan

- [ ] Badge count = số tab discarded (toggle `Show badge count`).
- [ ] Title prefix dùng glyph cấu hình (mặc định `💤`); glyph tùy chỉnh (≤ 4 ký tự) lưu và áp dụng sau prompt host permission.
- [ ] Tắt prefix → title không thay đổi ở lần discard kế tiếp.
- [ ] RAM % header popup cập nhật mỗi ~5 s.

## 26. Tooltip ước lượng RAM
- [ ] Hover stats RAM trong popup → tooltip giải thích ước lượng (ví dụ "~150 MB mỗi tab discarded").
- [ ] Text tooltip có bản `vi`.
- [ ] Tooltip biến mất khi rời chuột.

## 27. Notifications

- [ ] Bật `Notify on auto-unload`.
- [ ] Trigger auto-unload → notification desktop với số tab + RAM tiết kiệm.
- [ ] Notification tôn trọng OS focus-assist / Do Not Disturb.

## 28. Thống kê

- [ ] Sau khi unload vài tab, popup `Stats` hiển thị đúng tổng hôm nay + tổng thời gian.
- [ ] Ước lượng "RAM saved" tăng.
- [ ] "Member since" phản ánh ngày cài đặt.
- [ ] "Reset stats" về 0 và xác nhận qua toast.

## 29. Sessions

- [ ] Lưu window hiện tại thành session "test-1" (popup → Sessions → đặt tên → Save).
- [ ] Đóng mọi tab.
- [ ] Restore "test-1" → mở lại đúng danh sách tab (URL khớp, thứ tự giữ nguyên).
- [ ] Xóa "test-1" → entry biến mất.
- [ ] 100+ session đã lưu phân trang hoặc cuộn không vỡ layout popup.

## 30. Import / Export

Cho từng loại: **whitelist**, **blacklist**, **sessions**:

- [ ] Export → JSON copy vào clipboard với schema `version: 1`.
- [ ] Xóa danh sách rồi Import lại JSON đã export → khôi phục đầy đủ, không trùng.
- [ ] Import JSON có overlap → merge cộng dồn, dedup theo name (sessions) hoặc domain (whitelist/blacklist).
- [ ] Import whitelist/blacklist có entry trùng list đối lập → entry đó bị skip (đếm vào skipped), không tạo conflict.
- [ ] JSON sai cú pháp → toast lỗi, không thay đổi state.
- [ ] Sai schema version → từ chối với thông báo rõ ràng.

## 31. Side Panel

- [ ] Options → Toolbar Action → bật `Open in side panel`.
- [ ] Click icon toolbar → side panel mở (popup không mở).
- [ ] Layout side panel responsive ở 360 px và 480 px.
- [ ] Side panel giữ mở khi chuyển tab và window.
- [ ] Tắt side panel → toolbar quay về popup.
- [ ] Mọi tương tác (search, filter, snooze, save session, import/export) hoạt động trong side panel.

## 32. Tự mở Changelog

- [ ] Tăng version manifest từ `0.0.4` → `0.0.5` (patch). Reload extension → tab changelog KHÔNG tự mở.
- [ ] Tăng `0.0.4` → `0.1.0` (minor) → trang changelog mở ở tab mới.
- [ ] Tăng `0.1.0` → `1.0.0` (major) → changelog mở.
- [ ] Khôi phục version; xóa `tabrest_lastVersion` trong `chrome.storage.local` để test lại.

## 33. Theme (Dark / Light)

- [ ] Toggle dark mode trong popup → áp dụng tức thì.
- [ ] Mở Options ở window khác → đã ở dark mode (đồng bộ giữa các trang).
- [ ] Toggle trong Options → popup theo theo.
- [ ] Trang Onboarding & changelog match theme đã chọn.
- [ ] Tôn trọng OS dark mode khi cài lần đầu.

## 34. Bug Report / Báo cáo lỗi

- [ ] Click "Report a bug" ở footer popup → modal mở với diagnostics tự điền (extension version, Chrome version, platform).
- [ ] Submit → mở link issue GitHub có sẵn body.
- [ ] Tắt `Send anonymous error reports` → lỗi service worker KHÔNG bị gửi (xác minh không có request mạng trong DevTools).
- [ ] Bật → lỗi được thu thập qua `error-reporter.js` (test thủ công: throw lỗi giả).

## 35. Onboarding

- [ ] Cài mới → tab onboarding tự mở.
- [ ] Đi qua các tính năng chính và link tới Options.
- [ ] Theme khớp với preference người dùng.

## 36. Bao phủ i18n

- [ ] Đổi UI Chrome sang tiếng Việt.
- [ ] Mọi chuỗi trong popup, options, onboarding, changelog, toast, notification, error message hiện tiếng Việt (không còn placeholder `__MSG_*__`, không fallback English ngoài ý đồ).
- [ ] Số/ngày dùng định dạng đúng locale.

## 37. Đồng bộ Settings

- [ ] Đăng nhập Chrome với tài khoản có sync.
- [ ] Sửa setting trên Profile A; trên Profile B (cùng tài khoản) xác nhận sync trong ~1 phút.
- [ ] Sessions và whitelist truyền giữa các thiết bị (sessions lưu trong `chrome.storage.sync`).
- [ ] Tab activity giữ riêng từng máy (`chrome.storage.local`).

## 38. Độ bền Service Worker

- [ ] Trong DevTools → Application → Service Workers → click "Stop" để kill worker.
- [ ] Đợi > 30s. Mở 1 tab rồi để máy idle.
- [ ] Worker tự thức qua `chrome.alarms`; auto-unload vẫn fire.
- [ ] Phiên dài (≥ 4 giờ) không leak memory (`chrome://serviceworker-internals` cho thấy heap ổn định).

## 39. Smoke test cross-browser (nhân Chromium)

Spot-check trên:

- [ ] Brave bản mới nhất
- [ ] Edge bản mới nhất
- [ ] Vivaldi bản mới nhất
- [ ] Opera bản mới nhất

Xác nhận popup load, unload thủ công OK, side panel render (nơi hỗ trợ), phím tắt phản hồi.

## 40. Gỡ cài đặt / Dọn dẹp

- [ ] Gỡ extension → mọi alarm bị xóa.
- [ ] Chrome dọn storage entries (xác minh bằng cài lại sạch: stats reset, không còn snooze/sessions sót).
- [ ] Không còn content script orphan ở các tab đã inject sau khi cài lại.

---

## Mẫu báo cáo lỗi

Khi một mục check fail, mở issue với:

- Section + ID mục checklist (ví dụ `§21 Cảnh báo trước khi suspend`).
- Các bước reproduce.
- Kết quả mong đợi vs thực tế.
- Browser + OS + extension version.
- Trích đoạn console DevTools service worker.
- Screenshot hoặc video khi cần thiết.

Repository: <https://github.com/lamngockhuong/tabrest/issues>
