// UI translations for EN and VI locales

export const languages = {
  en: 'English',
  vi: 'Tiếng Việt',
} as const;

export type Locale = keyof typeof languages;

export const translations = {
  en: {
    meta: {
      title: 'TabRest - Rest your tabs, free your memory',
      description: 'Browser extension for Chrome, Edge, Brave, Opera & Vivaldi that automatically unloads inactive tabs to reduce memory usage.',
    },
    header: {
      features: 'Features',
      howItWorks: 'How It Works',
      faq: 'FAQ',
      docs: 'Docs',
      github: 'GitHub',
    },
    hero: {
      tagline: 'Rest your tabs, free your memory',
      description: 'Automatically unload inactive tabs to reduce memory usage and speed up your browser',
      cta: "Install Free",
      subtext: 'Chrome • Edge • Brave • Opera • Vivaldi',
    },
    problem: {
      title: 'The Tab Problem',
      before: 'Before TabRest',
      after: 'After TabRest',
      beforeItems: [
        '100+ tabs consuming 8GB RAM',
        'Browser freezing and crashing',
        'Slow system performance',
        'Manual tab management nightmare',
      ],
      afterItems: [
        'Same tabs, only 2GB RAM used',
        'Smooth browsing experience',
        'Fast system performance',
        'Automatic and intelligent',
      ],
      savings: 'Save up to <highlight>75% memory</highlight> without closing tabs',
    },
    features: {
      title: 'Powerful Features',
      subtitle: 'Everything you need to manage tabs efficiently',
      items: [
        {
          icon: 'clock',
          title: 'Auto-Unload Timer',
          description: 'Automatically unload tabs after a customizable period of inactivity (10 min to 4 hours)',
        },
        {
          icon: 'database',
          title: 'Memory Threshold',
          description: 'Trigger unloading when system memory usage reaches your specified threshold (60-90%)',
        },
        {
          icon: 'rocket',
          title: 'Startup Unload',
          description: 'Optionally unload all tabs on browser startup to begin with a clean slate',
        },
        {
          icon: 'shield',
          title: 'Smart Whitelist',
          description: 'Protect important tabs with domain-based whitelist and special rules for audio/forms',
        },
        {
          icon: 'keyboard',
          title: 'Keyboard Shortcuts',
          description: 'Quick access via customizable shortcuts: unload current tab, unload others, or unload all',
        },
        {
          icon: 'barChart',
          title: 'Usage Statistics',
          description: 'Track memory saved and tabs unloaded to see the real impact on your system',
        },
        {
          icon: 'moon',
          title: 'Visual Indicator',
          description: 'Easily identify unloaded tabs with customizable prefix symbol in tab titles',
        },
        {
          icon: 'hash',
          title: 'Tab Count Threshold',
          description: 'Only start auto-unloading when you have more than a specified number of inactive tabs',
        },
        {
          icon: 'mousePointer',
          title: 'Toolbar Click Action',
          description: 'Customize what happens when clicking the extension icon: open popup or quick-discard',
        },
        {
          icon: 'bedDouble',
          title: 'Idle State Only',
          description: 'Only auto-unload tabs when your computer is idle, never interrupt active browsing',
        },
        {
          icon: 'battery',
          title: 'Power Mode',
          description: 'Switch between Battery Saver, Normal, and Performance modes to adjust aggressiveness',
        },
        {
          icon: 'trendingUp',
          title: 'Per-Tab Memory',
          description: 'Automatically unload individual tabs that consume excessive JavaScript memory',
        },
        {
          icon: 'pause',
          title: 'Snooze Tabs',
          description: 'Temporarily protect specific tabs or entire domains from auto-unload (30min to 2hrs)',
        },
        {
          icon: 'scroll',
          title: 'Scroll Restore',
          description: 'Automatically save and restore scroll position when tabs are discarded and reloaded',
        },
        {
          icon: 'wifi',
          title: 'Offline Aware',
          description: 'Pauses auto-unload when offline so tabs can reload when network returns',
        },
        {
          icon: 'bell',
          title: 'Notifications',
          description: 'Get notified when tabs are auto-unloaded with reason (timer or memory threshold)',
        },
        {
          icon: 'globe',
          title: 'Multi-Browser Support',
          description: 'Works on all Chromium-based browsers: Chrome, Edge, Brave, Opera, Vivaldi, and Arc',
        },
      ],
    },
    howItWorks: {
      title: 'How It Works',
      subtitle: 'Get started in under 60 seconds',
      steps: [
        {
          title: 'Install the Extension',
          description: 'Add TabRest from the Chrome Web Store with one click. No account or signup required.',
        },
        {
          title: 'Configure Your Preferences',
          description: 'Set your ideal inactivity timer, memory threshold, and whitelist. Or use the smart defaults that work for most users.',
        },
        {
          title: 'Relax and Browse',
          description: 'TabRest works silently in the background, automatically managing your tabs. Click any unloaded tab to instantly restore it.',
        },
      ],
      cta: 'Get Started Now',
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about TabRest',
      items: [
        {
          question: "Will I lose my tabs when they're unloaded?",
          answer: "No! Unloading tabs is not the same as closing them. The tab stays in your browser with the same URL and position. Click it to instantly reload the page exactly where you left off.",
        },
        {
          question: 'How much memory does TabRest actually save?',
          answer: 'It depends on the websites, but typically 50-150MB per tab. With 50-100 inactive tabs, you can easily save 5-10GB of RAM. Check the statistics in the extension popup to see your real savings.',
        },
        {
          question: 'Can I prevent certain tabs from being unloaded?',
          answer: 'Yes! Add domains to your whitelist in the settings. You can also enable automatic protection for tabs playing audio or containing forms with unsaved data.',
        },
        {
          question: 'Does TabRest work offline?',
          answer: "Yes! TabRest is a local extension that doesn't require internet connection to function. Your settings and tab data never leave your computer.",
        },
        {
          question: 'Is TabRest open source?',
          answer: 'Yes! TabRest is fully open source under the MIT License. You can review the code, contribute improvements, or report issues on GitHub.',
        },
        {
          question: 'Which browsers does TabRest support?',
          answer: 'TabRest works on all Chromium-based browsers including Chrome, Microsoft Edge, Brave, Opera, Vivaldi, and Arc. Same extension, same features across all browsers.',
        },
      ],
    },
    footer: {
      cta: {
        title: 'Ready to free your memory?',
        subtitle: 'Install TabRest now and experience faster browsing',
        button: "Install Free",
      },
      sections: {
        product: 'Product',
        resources: 'Resources',
        legal: 'Legal',
      },
      links: {
        features: 'Features',
        howItWorks: 'How It Works',
        faq: 'FAQ',
        github: 'GitHub',
        reportIssue: 'Report Issue',
        chromeStore: 'Chrome Web Store',
        license: 'License',
      },
      copyright: '© 2026 TabRest. Open source under MIT License.',
      builtBy: 'Built by',
    },
    docs: {
      sidebar: {
        title: 'Documentation',
        sections: {
          'getting-started': 'Getting Started',
          features: 'Features',
          reference: 'Reference',
        },
      },
    },
  },
  vi: {
    meta: {
      title: 'TabRest - Nghỉ ngơi tab, giải phóng bộ nhớ',
      description: 'Tiện ích trình duyệt cho Chrome, Edge, Brave, Opera & Vivaldi tự động giải phóng các tab không hoạt động để giảm sử dụng bộ nhớ.',
    },
    header: {
      features: 'Tính năng',
      howItWorks: 'Cách hoạt động',
      faq: 'Câu hỏi',
      docs: 'Tài liệu',
      github: 'GitHub',
    },
    hero: {
      tagline: 'Nghỉ ngơi tab, giải phóng bộ nhớ',
      description: 'Tự động giải phóng các tab không hoạt động để giảm sử dụng bộ nhớ và tăng tốc trình duyệt',
      cta: 'Cài đặt miễn phí',
      subtext: 'Chrome • Edge • Brave • Opera • Vivaldi',
    },
    problem: {
      title: 'Vấn đề với Tab',
      before: 'Trước khi dùng TabRest',
      after: 'Sau khi dùng TabRest',
      beforeItems: [
        '100+ tab tiêu tốn 8GB RAM',
        'Trình duyệt đơ và crash',
        'Máy tính chạy chậm',
        'Quản lý tab thủ công rất mệt',
      ],
      afterItems: [
        'Cùng số tab, chỉ dùng 2GB RAM',
        'Duyệt web mượt mà',
        'Máy tính chạy nhanh',
        'Tự động và thông minh',
      ],
      savings: 'Tiết kiệm đến <highlight>75% bộ nhớ</highlight> mà không cần đóng tab',
    },
    features: {
      title: 'Tính năng mạnh mẽ',
      subtitle: 'Mọi thứ bạn cần để quản lý tab hiệu quả',
      items: [
        {
          icon: 'clock',
          title: 'Hẹn giờ tự động giải phóng',
          description: 'Tự động giải phóng tab sau thời gian không hoạt động tùy chỉnh (10 phút đến 4 giờ)',
        },
        {
          icon: 'database',
          title: 'Ngưỡng bộ nhớ',
          description: 'Kích hoạt giải phóng khi sử dụng bộ nhớ hệ thống đạt ngưỡng (60-90%)',
        },
        {
          icon: 'rocket',
          title: 'Giải phóng khi khởi động',
          description: 'Tùy chọn giải phóng tất cả tab khi khởi động trình duyệt để bắt đầu gọn gàng',
        },
        {
          icon: 'shield',
          title: 'Danh sách trắng thông minh',
          description: 'Bảo vệ các tab quan trọng với danh sách domain và quy tắc đặc biệt cho audio/form',
        },
        {
          icon: 'keyboard',
          title: 'Phím tắt',
          description: 'Truy cập nhanh qua phím tắt tùy chỉnh: giải phóng tab hiện tại, các tab khác, hoặc tất cả',
        },
        {
          icon: 'barChart',
          title: 'Thống kê sử dụng',
          description: 'Theo dõi bộ nhớ đã tiết kiệm và số tab đã giải phóng để thấy tác động thực tế',
        },
        {
          icon: 'moon',
          title: 'Chỉ báo trực quan',
          description: 'Dễ dàng nhận biết tab đã giải phóng với ký hiệu tùy chỉnh trên tiêu đề tab',
        },
        {
          icon: 'hash',
          title: 'Ngưỡng số tab',
          description: 'Chỉ bắt đầu tự động giải phóng khi có nhiều hơn số tab không hoạt động được chỉ định',
        },
        {
          icon: 'mousePointer',
          title: 'Thao tác thanh công cụ',
          description: 'Tùy chỉnh hành động khi nhấp vào icon tiện ích: mở popup hoặc giải phóng nhanh',
        },
        {
          icon: 'bedDouble',
          title: 'Chỉ khi máy nghỉ',
          description: 'Chỉ tự động giải phóng tab khi máy tính không hoạt động, không làm gián đoạn duyệt web',
        },
        {
          icon: 'battery',
          title: 'Chế độ nguồn',
          description: 'Chuyển đổi giữa Tiết kiệm pin, Bình thường và Hiệu suất để điều chỉnh mức độ tích cực',
        },
        {
          icon: 'trendingUp',
          title: 'Bộ nhớ từng tab',
          description: 'Tự động giải phóng các tab tiêu thụ quá nhiều bộ nhớ JavaScript',
        },
        {
          icon: 'pause',
          title: 'Tạm hoãn tab',
          description: 'Tạm thời bảo vệ tab hoặc domain cụ thể khỏi tự động giải phóng (30 phút đến 2 giờ)',
        },
        {
          icon: 'scroll',
          title: 'Khôi phục vị trí cuộn',
          description: 'Tự động lưu và khôi phục vị trí cuộn khi tab được giải phóng và tải lại',
        },
        {
          icon: 'wifi',
          title: 'Nhận biết offline',
          description: 'Tạm dừng tự động giải phóng khi mất mạng để tab có thể tải lại khi có mạng',
        },
        {
          icon: 'bell',
          title: 'Thông báo',
          description: 'Nhận thông báo khi tab tự động giải phóng với lý do (hẹn giờ hoặc ngưỡng bộ nhớ)',
        },
        {
          icon: 'globe',
          title: 'Hỗ trợ đa trình duyệt',
          description: 'Hoạt động trên tất cả trình duyệt Chromium: Chrome, Edge, Brave, Opera, Vivaldi và Arc',
        },
      ],
    },
    howItWorks: {
      title: 'Cách hoạt động',
      subtitle: 'Bắt đầu trong vòng 60 giây',
      steps: [
        {
          title: 'Cài đặt tiện ích',
          description: 'Thêm TabRest từ Chrome Web Store chỉ với một click. Không cần tài khoản hay đăng ký.',
        },
        {
          title: 'Cấu hình tùy chọn',
          description: 'Đặt thời gian chờ, ngưỡng bộ nhớ và danh sách trắng. Hoặc dùng cài đặt mặc định thông minh.',
        },
        {
          title: 'Thư giãn và duyệt web',
          description: 'TabRest hoạt động im lặng trong nền, tự động quản lý tab. Click vào tab đã giải phóng để khôi phục ngay.',
        },
      ],
      cta: 'Bắt đầu ngay',
    },
    faq: {
      title: 'Câu hỏi thường gặp',
      subtitle: 'Mọi thứ bạn cần biết về TabRest',
      items: [
        {
          question: 'Tôi có mất tab khi chúng bị giải phóng không?',
          answer: 'Không! Giải phóng tab không giống đóng tab. Tab vẫn ở trong trình duyệt với cùng URL và vị trí. Click vào để tải lại ngay trang đúng nơi bạn đã dừng.',
        },
        {
          question: 'TabRest thực sự tiết kiệm bao nhiêu bộ nhớ?',
          answer: 'Tùy thuộc vào website, thường là 50-150MB mỗi tab. Với 50-100 tab không hoạt động, bạn có thể tiết kiệm 5-10GB RAM. Xem thống kê trong popup để biết số liệu thực.',
        },
        {
          question: 'Tôi có thể ngăn một số tab bị giải phóng không?',
          answer: 'Có! Thêm domain vào danh sách trắng trong cài đặt. Bạn cũng có thể bật bảo vệ tự động cho tab đang phát audio hoặc có form chưa lưu.',
        },
        {
          question: 'TabRest có hoạt động offline không?',
          answer: 'Có! TabRest là tiện ích cục bộ, không cần kết nối internet. Cài đặt và dữ liệu tab không bao giờ rời khỏi máy tính của bạn.',
        },
        {
          question: 'TabRest có phải mã nguồn mở không?',
          answer: 'Có! TabRest hoàn toàn mã nguồn mở theo giấy phép MIT. Bạn có thể xem code, đóng góp cải tiến, hoặc báo lỗi trên GitHub.',
        },
        {
          question: 'TabRest hỗ trợ những trình duyệt nào?',
          answer: 'TabRest hoạt động trên tất cả trình duyệt nhân Chromium: Chrome, Microsoft Edge, Brave, Opera, Vivaldi và Arc. Cùng một tiện ích, cùng tính năng trên mọi trình duyệt.',
        },
      ],
    },
    footer: {
      cta: {
        title: 'Sẵn sàng giải phóng bộ nhớ?',
        subtitle: 'Cài đặt TabRest ngay và trải nghiệm duyệt web nhanh hơn',
        button: 'Cài đặt miễn phí',
      },
      sections: {
        product: 'Sản phẩm',
        resources: 'Tài nguyên',
        legal: 'Pháp lý',
      },
      links: {
        features: 'Tính năng',
        howItWorks: 'Cách hoạt động',
        faq: 'Câu hỏi',
        github: 'GitHub',
        reportIssue: 'Báo lỗi',
        chromeStore: 'Chrome Web Store',
        license: 'Giấy phép',
      },
      copyright: '© 2026 TabRest. Mã nguồn mở theo giấy phép MIT.',
      builtBy: 'Phát triển bởi',
    },
    docs: {
      sidebar: {
        title: 'Tài liệu',
        sections: {
          'getting-started': 'Bắt đầu',
          features: 'Tính năng',
          reference: 'Tham khảo',
        },
      },
    },
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];
