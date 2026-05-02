🇬🇧 [English](README.md) • 🇻🇳 **Tiếng Việt** • 🇪🇸 [Español](README.es.md) • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 [Français](README.fr.md) • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  Cho tab nghỉ ngơi, giải phóng bộ nhớ - tiện ích Chrome tự động giải phóng các tab không hoạt động.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome" alt="Manifest V3">
  <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?branch=main&logo=github" alt="CI Status">
  <img src="https://img.shields.io/badge/code_style-biome-60a5fa?logo=biome" alt="Code Style: Biome">
  <img src="https://img.shields.io/badge/JavaScript-ES_Modules-f7df1e?logo=javascript&logoColor=black" alt="JavaScript ES Modules">
  <img src="https://img.shields.io/github/license/lamngockhuong/tabrest" alt="License">
</p>

## Tính năng

- **Tự động giải phóng tab không hoạt động** - Hẹn giờ tuỳ chỉnh (5 phút đến 4 giờ)
- **Ngưỡng bộ nhớ** - Giải phóng khi RAM vượt 60-95%
- **Giới hạn bộ nhớ mỗi tab** - Giải phóng tab dùng >100MB-1GB JS heap
- **Giải phóng khi khởi động** - Giải phóng bộ nhớ khi mở trình duyệt
- **Điều khiển thủ công** - Giải phóng tab hiện tại/trái/phải/khác
- **Đóng tab trùng lặp** - Một cú nhấp loại bỏ trùng lặp trong cửa sổ hiện tại
- **Tìm kiếm tab** - Lọc danh sách tab theo tiêu đề hoặc URL
- **Nhóm tab** - Giải phóng toàn bộ nhóm tab
- **Chế độ thanh bên** - Mở TabRest trong thanh bên của Chrome (tuỳ chọn)
- **Tạm hoãn tab/trang** - Tạm thời bảo vệ tab hoặc domain (30 phút - 2 giờ)
- **Cảnh báo trước khi giải phóng** - Hiện thông báo 3 giây trên trang trước khi tự động giải phóng
- **Chỉ báo trực quan** - Tiền tố tuỳ chỉnh (💤) trên tiêu đề tab đã giải phóng
- **Danh sách trắng** - Bảo vệ trang khỏi tự động giải phóng (hỗ trợ localhost & IP)
- **Nhập/Xuất** - Sao lưu danh sách trắng, danh sách đen và phiên ra JSON
- **Phiên làm việc** - Lưu và khôi phục bộ tab
- **Khôi phục cuộn trang** - Khôi phục vị trí cuộn khi tab tải lại
- **Vị trí phát YouTube** - Tiếp tục video tại vị trí cuối sau khi tải lại
- **Bỏ qua khi offline** - Không giải phóng tab khi mất mạng
- **Chỉ giải phóng khi nhàn rỗi** - Chỉ tự động giải phóng khi máy tính nhàn rỗi
- **Chế độ tiết kiệm** - Tiết kiệm pin, bình thường, hoặc hiệu năng cao
- **Thông báo tự động giải phóng** - Nhận thông báo khi tab được giải phóng
- **Chú thích bộ nhớ** - Di chuột qua thống kê để xem ước tính RAM tiết kiệm trên mỗi tab
- **Trình hướng dẫn cài đặt** - Nhiều bước tương tác khi mở lần đầu
- **Báo lỗi tuỳ chọn** - Gửi báo cáo sự cố ẩn danh qua Sentry (mặc định tắt) và biểu mẫu gửi báo lỗi thủ công
- **Tự mở changelog** - Mở ghi chú phát hành khi cập nhật minor/major
- **Quyền truy cập trang tuỳ chọn** - Bảo vệ biểu mẫu chỉ yêu cầu quyền khi bật
- **Hiển thị RAM** - Phần trăm RAM trực tiếp trên cửa sổ popup
- **Thống kê** - Theo dõi số tab đã giải phóng và bộ nhớ đã tiết kiệm
- **Đa ngôn ngữ** - Hỗ trợ 11 ngôn ngữ

## Phím tắt

| Phím tắt      | Hành động              |
| ------------- | ---------------------- |
| `Alt+Shift+D` | Giải phóng tab hiện tại |
| `Alt+Shift+O` | Giải phóng các tab khác |
| `Alt+Shift+→` | Giải phóng tab bên phải |
| `Alt+Shift+←` | Giải phóng tab bên trái |

## Cài đặt

### Từ mã nguồn

1. Clone repository này
2. Mở `chrome://extensions` trong Chrome
3. Bật "Chế độ nhà phát triển" (góc trên bên phải)
4. Nhấp "Tải tiện ích đã giải nén"
5. Chọn thư mục dự án

### Từ Chrome Web Store

[Cài đặt TabRest từ Chrome Web Store](https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib).

## Cách hoạt động

TabRest sử dụng API gốc `chrome.tabs.discard()` của Chrome để giải phóng tab. Tab đã giải phóng:

- Vẫn hiển thị trên thanh tab
- Giữ nguyên vị trí cuộn và dữ liệu form
- Tải lại ngay lập tức khi nhấp vào
- Giải phóng bộ nhớ khi không hoạt động

## Cấu trúc dự án

```text
tabrest/
├── manifest.json           # Cấu hình tiện ích (MV3)
├── _locales/               # Bản dịch i18n (11 locale)
├── src/
│   ├── background/         # Module service worker
│   ├── content/            # Form checker, YouTube tracker
│   ├── popup/              # UI popup / side panel
│   ├── options/            # Trang cài đặt
│   ├── pages/              # Onboarding, changelog
│   └── shared/             # Tiện ích dùng chung
├── icons/                  # Biểu tượng tiện ích
├── website/                # Trang docs Astro (tabrest.ohnice.app)
└── docs/                   # Tài liệu dự án
```

## Phát triển

```bash
pnpm install          # Cài dependencies
pnpm run lint         # Kiểm tra code với Biome
pnpm run lint:fix     # Tự động sửa lỗi lint
pnpm run format       # Format code
pnpm run ci           # Chạy CI đầy đủ (validate + lint)
```

## Tài nguyên quảng bá

Hình ảnh quảng bá Chrome Web Store nằm trong `assets/` dưới dạng nguồn SVG.

```bash
./scripts/generate-promo-images.sh   # Tạo file PNG
```

## Quyền riêng tư

- Không thu thập dữ liệu
- Không có server bên ngoài
- Tất cả cài đặt lưu cục bộ
- Xem [Chính sách quyền riêng tư](docs/privacy-policy.md)

## Tài trợ

Nếu bạn thấy tiện ích này hữu ích, hãy cân nhắc hỗ trợ phát triển:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Hỗ_trợ-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Hỗ_trợ-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Hỗ_trợ-ae2070)](https://me.momo.vn/khuong)

## Dự án khác

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - Tiện ích đa trình duyệt nâng cấp giao diện GitHub với các tính năng tăng năng suất
- [Termote](https://github.com/lamngockhuong/termote) - Điều khiển CLI từ xa (Claude Code, GitHub Copilot, bất kỳ terminal nào) từ di động/máy tính qua PWA

## Giấy phép

MIT
