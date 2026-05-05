🇬🇧 [English](README.md) • 🇻🇳 **Tiếng Việt** • 🇪🇸 [Español](README.es.md) • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 [Français](README.fr.md) • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  Cho tab nghỉ ngơi, giải phóng bộ nhớ - tiện ích Chrome tự động unload các tab không hoạt động.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/v/agajndkecodedlklmpnjgikglkpeopib?label=chrome&style=flat-square&logo=googlechrome&logoColor=white&color=4285F4" alt="Chrome Web Store Version">
  </a>
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/users/agajndkecodedlklmpnjgikglkpeopib?style=flat-square&color=6ee7b7" alt="Chrome Web Store Users">
  </a>
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/rating/agajndkecodedlklmpnjgikglkpeopib?style=flat-square&color=facc15" alt="Chrome Web Store Rating">
  </a>
  <a href="https://github.com/lamngockhuong/tabrest/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?style=flat-square&label=CI&color=22c55e" alt="CI">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/lamngockhuong/tabrest?style=flat-square&color=60a5fa" alt="MIT License">
  </a>
  <a href="https://github.com/lamngockhuong/tabrest/stargazers">
    <img src="https://img.shields.io/github/stars/lamngockhuong/tabrest?style=flat-square&color=f59e0b" alt="GitHub Stars">
  </a>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/badge/Install_from-Chrome_Web_Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store">
  </a>
  <a href="https://tabrest.ohnice.app">
    <img src="https://img.shields.io/badge/Visit-Website-8957e5?style=for-the-badge&logo=astro&logoColor=white" alt="Website">
  </a>
</p>

<p align="center">
  <a href="https://unikorn.vn/p/tabrest?ref=embed-tabrest" target="_blank"><img src="https://unikorn.vn/api/widgets/badge/tabrest?theme=light" alt="TabRest trên Unikorn.vn" width="200" height="50" /></a>
  &nbsp;
  <a href="https://launch.j2team.dev/products/tabrest?utm_source=badge-launched&utm_medium=badge&utm_campaign=badge-tabrest" target="_blank" rel="noopener noreferrer"><img src="https://launch.j2team.dev/badge/tabrest/neutral" alt="TabRest - Ra mắt trên J2TEAM Launch" width="200" height="43" /></a>
</p>

## Tính năng

- **Tự động unload tab không hoạt động** - Hẹn giờ tuỳ chỉnh (5 phút đến 4 giờ)
- **Ngưỡng bộ nhớ** - Unload khi RAM vượt 60-95%
- **Giới hạn bộ nhớ mỗi tab** - Unload tab dùng >100MB-1GB JS heap
- **Unload khi khởi động** - Giải phóng bộ nhớ khi mở trình duyệt
- **Điều khiển thủ công** - Unload tab hiện tại/trái/phải/khác
- **Đóng tab trùng lặp** - Một cú nhấp dedup trong cửa sổ hiện tại
- **Tìm kiếm tab** - Lọc danh sách tab theo tiêu đề hoặc URL
- **Nhóm tab** - Unload toàn bộ nhóm tab
- **Chế độ side panel** - Mở TabRest trong side panel của Chrome (tuỳ chọn)
- **Snooze tab/site** - Tạm thời bảo vệ tab hoặc domain (30 phút - 2 giờ)
- **Cảnh báo trước khi unload** - Toast 3 giây cảnh báo trên trang trước khi auto-discard
- **Chỉ báo trực quan** - Tiền tố tuỳ chỉnh (💤) trên tiêu đề tab đã unload
- **Whitelist** - Bảo vệ site khỏi auto-unload (hỗ trợ localhost & IP)
- **Import/Export** - Sao lưu whitelist, blacklist và session ra JSON
- **Session** - Lưu và khôi phục bộ tab
- **Khôi phục cuộn trang** - Khôi phục vị trí cuộn khi tab tải lại
- **Timestamp YouTube** - Tiếp tục video tại vị trí cuối sau khi tải lại
- **Bỏ qua khi offline** - Không discard tab khi mất mạng
- **Chỉ unload khi nhàn rỗi** - Chỉ auto-unload khi máy tính idle
- **Power Mode** - Chế độ tiết kiệm pin, bình thường, hoặc hiệu năng cao
- **Thông báo auto-unload** - Nhận thông báo khi tab được unload
- **Tooltip bộ nhớ** - Hover thống kê để xem ước tính RAM tiết kiệm trên mỗi tab
- **Trình hướng dẫn cài đặt** - Wizard nhiều bước tương tác khi mở lần đầu
- **Báo lỗi tuỳ chọn** - Gửi báo cáo sự cố ẩn danh qua Sentry (mặc định tắt) và form gửi báo lỗi thủ công
- **Tự mở changelog** - Mở release notes khi cập nhật minor/major
- **Host permissions tuỳ chọn** - Bảo vệ form chỉ yêu cầu quyền khi bật
- **Hiển thị RAM** - Phần trăm RAM trực tiếp trên popup
- **Thống kê** - Theo dõi số tab đã unload và bộ nhớ đã tiết kiệm
- **Đa ngôn ngữ** - Hỗ trợ 11 ngôn ngữ

## Phím tắt

| Phím tắt      | Hành động              |
| ------------- | ---------------------- |
| `Alt+Shift+D` | Unload tab hiện tại    |
| `Alt+Shift+O` | Unload các tab khác    |
| `Alt+Shift+→` | Unload tab bên phải    |
| `Alt+Shift+←` | Unload tab bên trái    |

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

TabRest sử dụng API native `chrome.tabs.discard()` của Chrome để unload tab. Tab đã discard:

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
