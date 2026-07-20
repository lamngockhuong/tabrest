// UI translations for all supported locales (en, vi, ja, zh_CN)

export const languages = {
  en: 'English',
  vi: 'Tiếng Việt',
  ja: '日本語',
  zh_CN: '简体中文',
} as const;

export type Locale = keyof typeof languages;

export const localeFlags = {
  en: '🇺🇸',
  vi: '🇻🇳',
  ja: '🇯🇵',
  zh_CN: '🇨🇳',
} as const;

export const ogLocales = {
  en: 'en_US',
  vi: 'vi_VN',
  ja: 'ja_JP',
  zh_CN: 'zh_CN',
} as const;

export const bcp47 = {
  en: 'en',
  vi: 'vi',
  ja: 'ja',
  zh_CN: 'zh-CN',
} as const;

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
      title: 'TabRest - Cho tab nghỉ ngơi, giải phóng bộ nhớ',
      description: 'Tiện ích trình duyệt cho Chrome, Edge, Brave, Opera & Vivaldi tự động giải phóng các tab không hoạt động để giảm sử dụng bộ nhớ.',
    },
    header: {
      features: 'Tính năng',
      howItWorks: 'Cách hoạt động',
      faq: 'Hỏi đáp',
      docs: 'Tài liệu',
      github: 'GitHub',
    },
    hero: {
      tagline: 'Cho tab nghỉ ngơi, giải phóng bộ nhớ',
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
        'Trình duyệt đơ và treo',
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
          title: 'Chỉ khi máy rảnh',
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
          title: 'Hoãn giải phóng tab',
          description: 'Tạm thời bảo vệ tab hoặc domain cụ thể khỏi tự động giải phóng (30 phút đến 2 giờ)',
        },
        {
          icon: 'scroll',
          title: 'Khôi phục vị trí cuộn',
          description: 'Tự động lưu và khôi phục vị trí cuộn khi tab được giải phóng và tải lại',
        },
        {
          icon: 'wifi',
          title: 'Nhận biết khi mất mạng',
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
        faq: 'Hỏi đáp',
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
  ja: {
    meta: {
      title: 'TabRest - タブを休ませて、メモリを解放',
      description: 'Chrome、Edge、Brave、Opera、Vivaldi向けのブラウザ拡張機能で、非アクティブなタブを自動的にアンロードしてメモリ使用量を削減します。',
    },
    header: {
      features: '機能',
      howItWorks: '仕組み',
      faq: 'よくある質問',
      docs: 'ドキュメント',
      github: 'GitHub',
    },
    hero: {
      tagline: 'タブを休ませて、メモリを解放',
      description: '非アクティブなタブを自動的にアンロードし、メモリ使用量を削減してブラウザを高速化します',
      cta: '無料でインストール',
      subtext: 'Chrome • Edge • Brave • Opera • Vivaldi',
    },
    problem: {
      title: 'タブの問題',
      before: 'TabRest導入前',
      after: 'TabRest導入後',
      beforeItems: [
        '100個以上のタブが8GBのRAMを消費',
        'ブラウザのフリーズとクラッシュ',
        'システムの動作が遅い',
        '手動でのタブ管理が大変',
      ],
      afterItems: [
        '同じタブ数でもRAMは2GBだけ',
        'スムーズなブラウジング体験',
        'システムが高速に動作',
        '自動でスマートに管理',
      ],
      savings: 'タブを閉じずに<highlight>メモリを最大75%</highlight>節約',
    },
    features: {
      title: 'パワフルな機能',
      subtitle: 'タブを効率的に管理するために必要なすべて',
      items: [
        {
          icon: 'clock',
          title: '自動アンロードタイマー',
          description: 'カスタマイズ可能な非アクティブ時間（10分から4時間）が経過するとタブを自動的にアンロードします',
        },
        {
          icon: 'database',
          title: 'メモリしきい値',
          description: 'システムのメモリ使用量が指定したしきい値（60〜90%）に達するとアンロードを開始します',
        },
        {
          icon: 'rocket',
          title: '起動時アンロード',
          description: 'ブラウザ起動時にすべてのタブをアンロードして、すっきりした状態で始めることもできます',
        },
        {
          icon: 'shield',
          title: 'スマートホワイトリスト',
          description: 'ドメインベースのホワイトリストと、音声/フォーム向けの特別ルールで重要なタブを保護します',
        },
        {
          icon: 'keyboard',
          title: 'キーボードショートカット',
          description: 'カスタマイズ可能なショートカットで素早く操作：現在のタブ、他のタブ、またはすべてをアンロード',
        },
        {
          icon: 'barChart',
          title: '使用統計',
          description: '節約したメモリとアンロードしたタブ数を記録し、システムへの実際の効果を確認できます',
        },
        {
          icon: 'moon',
          title: '視覚的インジケーター',
          description: 'タブタイトルにカスタマイズ可能な接頭記号を付けて、アンロード済みのタブを簡単に識別できます',
        },
        {
          icon: 'hash',
          title: 'タブ数しきい値',
          description: '指定した数を超える非アクティブなタブがある場合にのみ自動アンロードを開始します',
        },
        {
          icon: 'mousePointer',
          title: 'ツールバークリック動作',
          description: '拡張機能アイコンをクリックしたときの動作をカスタマイズ：ポップアップを開くか、クイックアンロード',
        },
        {
          icon: 'bedDouble',
          title: 'アイドル時のみ',
          description: 'コンピューターがアイドル状態のときだけタブを自動アンロードし、アクティブな操作を妨げません',
        },
        {
          icon: 'battery',
          title: '電源モード',
          description: 'バッテリー節約、通常、パフォーマンスの各モードを切り替えて動作の積極度を調整します',
        },
        {
          icon: 'trendingUp',
          title: 'タブごとのメモリ',
          description: 'JavaScriptメモリを過剰に消費する個々のタブを自動的にアンロードします',
        },
        {
          icon: 'pause',
          title: 'タブのスヌーズ',
          description: '特定のタブやドメイン全体を一時的に自動アンロードから保護します（30分から2時間）',
        },
        {
          icon: 'scroll',
          title: 'スクロール位置の復元',
          description: 'タブがアンロードされて再読み込みされる際に、スクロール位置を自動的に保存して復元します',
        },
        {
          icon: 'wifi',
          title: 'オフライン対応',
          description: 'オフライン時は自動アンロードを一時停止し、ネットワーク復帰時にタブを再読み込みできるようにします',
        },
        {
          icon: 'bell',
          title: '通知',
          description: 'タブが自動アンロードされたときに、その理由（タイマーまたはメモリしきい値）とともに通知します',
        },
        {
          icon: 'globe',
          title: 'マルチブラウザ対応',
          description: 'すべてのChromiumベースのブラウザで動作：Chrome、Edge、Brave、Opera、Vivaldi、Arc',
        },
      ],
    },
    howItWorks: {
      title: '仕組み',
      subtitle: '60秒以内に使い始められます',
      steps: [
        {
          title: '拡張機能をインストール',
          description: 'Chrome Web StoreからワンクリックでTabRestを追加。アカウントやサインアップは不要です。',
        },
        {
          title: '設定をカスタマイズ',
          description: '理想的な非アクティブタイマー、メモリしきい値、ホワイトリストを設定します。または、ほとんどのユーザーに適したスマートな初期設定をそのまま使えます。',
        },
        {
          title: 'くつろいでブラウジング',
          description: 'TabRestはバックグラウンドで静かに動作し、タブを自動的に管理します。アンロード済みのタブをクリックすると、すぐに元に戻ります。',
        },
      ],
      cta: '今すぐ始める',
    },
    faq: {
      title: 'よくある質問',
      subtitle: 'TabRestについて知っておくべきすべて',
      items: [
        {
          question: 'タブがアンロードされると、タブは失われますか？',
          answer: 'いいえ。タブのアンロードは、タブを閉じることとは異なります。タブは同じURLと位置のままブラウザに残ります。クリックすれば、中断したところからページが即座に再読み込みされます。',
        },
        {
          question: 'TabRestは実際にどれくらいのメモリを節約しますか？',
          answer: 'ウェブサイトによりますが、通常はタブごとに50〜150MBです。非アクティブなタブが50〜100個あれば、5〜10GBのRAMを簡単に節約できます。拡張機能のポップアップの統計で実際の節約量を確認できます。',
        },
        {
          question: '特定のタブがアンロードされないようにできますか？',
          answer: 'はい。設定でホワイトリストにドメインを追加してください。音声を再生しているタブや、未保存のデータを含むフォームがあるタブを自動的に保護することもできます。',
        },
        {
          question: 'TabRestはオフラインで動作しますか？',
          answer: 'はい。TabRestはローカルの拡張機能で、動作にインターネット接続は必要ありません。設定やタブのデータがあなたのコンピューターから外部に送信されることはありません。',
        },
        {
          question: 'TabRestはオープンソースですか？',
          answer: 'はい。TabRestはMITライセンスの完全なオープンソースです。コードを確認したり、改善に貢献したり、GitHubで問題を報告したりできます。',
        },
        {
          question: 'TabRestはどのブラウザに対応していますか？',
          answer: 'TabRestは、Chrome、Microsoft Edge、Brave、Opera、Vivaldi、ArcなどすべてのChromiumベースのブラウザで動作します。すべてのブラウザで同じ拡張機能、同じ機能をご利用いただけます。',
        },
      ],
    },
    footer: {
      cta: {
        title: 'メモリを解放する準備はできましたか？',
        subtitle: '今すぐTabRestをインストールして、より高速なブラウジングを体験しましょう',
        button: '無料でインストール',
      },
      sections: {
        product: '製品',
        resources: 'リソース',
        legal: '法的情報',
      },
      links: {
        features: '機能',
        howItWorks: '仕組み',
        faq: 'よくある質問',
        github: 'GitHub',
        reportIssue: '問題を報告',
        chromeStore: 'Chrome Web Store',
        license: 'ライセンス',
      },
      copyright: '© 2026 TabRest. MITライセンスのオープンソースです。',
      builtBy: '開発者',
    },
    docs: {
      sidebar: {
        title: 'ドキュメント',
        sections: {
          'getting-started': 'はじめに',
          features: '機能',
          reference: 'リファレンス',
        },
      },
    },
  },
  zh_CN: {
    meta: {
      title: 'TabRest - 让标签页休息，释放你的内存',
      description: '适用于 Chrome、Edge、Brave、Opera 和 Vivaldi 的浏览器扩展，可自动卸载非活动标签页以降低内存占用。',
    },
    header: {
      features: '功能',
      howItWorks: '工作原理',
      faq: '常见问题',
      docs: '文档',
      github: 'GitHub',
    },
    hero: {
      tagline: '让标签页休息，释放你的内存',
      description: '自动卸载非活动标签页，降低内存占用并加快浏览器速度',
      cta: '免费安装',
      subtext: 'Chrome • Edge • Brave • Opera • Vivaldi',
    },
    problem: {
      title: '标签页难题',
      before: '使用 TabRest 之前',
      after: '使用 TabRest 之后',
      beforeItems: [
        '100 多个标签页占用 8GB RAM',
        '浏览器卡顿和崩溃',
        '系统运行缓慢',
        '手动管理标签页令人头疼',
      ],
      afterItems: [
        '相同数量的标签页，仅占用 2GB RAM',
        '流畅的浏览体验',
        '系统运行快速',
        '自动且智能',
      ],
      savings: '无需关闭标签页即可节省高达<highlight>75% 的内存</highlight>',
    },
    features: {
      title: '强大的功能',
      subtitle: '高效管理标签页所需的一切',
      items: [
        {
          icon: 'clock',
          title: '自动卸载定时器',
          description: '在可自定义的非活动时长（10 分钟到 4 小时）后自动卸载标签页',
        },
        {
          icon: 'database',
          title: '内存阈值',
          description: '当系统内存占用达到你设定的阈值（60-90%）时触发卸载',
        },
        {
          icon: 'rocket',
          title: '启动时卸载',
          description: '可选择在浏览器启动时卸载所有标签页，以一个干净的状态开始',
        },
        {
          icon: 'shield',
          title: '智能白名单',
          description: '通过基于域名的白名单以及针对音频/表单的特殊规则保护重要标签页',
        },
        {
          icon: 'keyboard',
          title: '键盘快捷键',
          description: '通过可自定义的快捷键快速操作：卸载当前标签页、其他标签页或全部标签页',
        },
        {
          icon: 'barChart',
          title: '使用统计',
          description: '记录已节省的内存和已卸载的标签页数量，直观了解对系统的实际影响',
        },
        {
          icon: 'moon',
          title: '视觉标识',
          description: '通过标签页标题中可自定义的前缀符号，轻松识别已卸载的标签页',
        },
        {
          icon: 'hash',
          title: '标签页数量阈值',
          description: '仅当非活动标签页数量超过指定值时才开始自动卸载',
        },
        {
          icon: 'mousePointer',
          title: '工具栏点击动作',
          description: '自定义点击扩展图标时的行为：打开弹出窗口或快速卸载',
        },
        {
          icon: 'bedDouble',
          title: '仅在空闲时',
          description: '仅在计算机空闲时才自动卸载标签页，绝不打断你正在进行的浏览',
        },
        {
          icon: 'battery',
          title: '电源模式',
          description: '在省电、正常和性能模式之间切换，以调整卸载的积极程度',
        },
        {
          icon: 'trendingUp',
          title: '单个标签页内存',
          description: '自动卸载消耗过多 JavaScript 内存的单个标签页',
        },
        {
          icon: 'pause',
          title: '暂停标签页',
          description: '临时保护特定标签页或整个域名免于自动卸载（30 分钟到 2 小时）',
        },
        {
          icon: 'scroll',
          title: '滚动位置恢复',
          description: '在标签页被卸载并重新加载时，自动保存并恢复滚动位置',
        },
        {
          icon: 'wifi',
          title: '离线感知',
          description: '离线时暂停自动卸载，以便网络恢复后标签页能够重新加载',
        },
        {
          icon: 'bell',
          title: '通知',
          description: '当标签页被自动卸载时通知你，并附上原因（定时器或内存阈值）',
        },
        {
          icon: 'globe',
          title: '多浏览器支持',
          description: '适用于所有基于 Chromium 的浏览器：Chrome、Edge、Brave、Opera、Vivaldi 和 Arc',
        },
      ],
    },
    howItWorks: {
      title: '工作原理',
      subtitle: '60 秒内即可上手',
      steps: [
        {
          title: '安装扩展',
          description: '从 Chrome Web Store 一键添加 TabRest。无需账户或注册。',
        },
        {
          title: '配置你的偏好',
          description: '设置理想的非活动定时器、内存阈值和白名单。或使用适合大多数用户的智能默认设置。',
        },
        {
          title: '放松浏览',
          description: 'TabRest 在后台静默运行，自动管理你的标签页。点击任何已卸载的标签页即可立即恢复。',
        },
      ],
      cta: '立即开始',
    },
    faq: {
      title: '常见问题',
      subtitle: '关于 TabRest 你需要了解的一切',
      items: [
        {
          question: '标签页被卸载后，我会丢失它们吗？',
          answer: '不会！卸载标签页与关闭标签页不同。标签页会以相同的 URL 和位置保留在浏览器中。点击它即可立即从你上次离开的地方重新加载页面。',
        },
        {
          question: 'TabRest 实际能节省多少内存？',
          answer: '这取决于网站，但通常每个标签页可节省 50-150MB。如果有 50-100 个非活动标签页，你可以轻松节省 5-10GB 的 RAM。查看扩展弹出窗口中的统计信息，即可了解你的实际节省量。',
        },
        {
          question: '我可以阻止某些标签页被卸载吗？',
          answer: '可以！在设置中将域名添加到白名单。你还可以为正在播放音频或包含未保存数据表单的标签页启用自动保护。',
        },
        {
          question: 'TabRest 能离线工作吗？',
          answer: '可以！TabRest 是一个本地扩展，无需互联网连接即可运行。你的设置和标签页数据绝不会离开你的计算机。',
        },
        {
          question: 'TabRest 是开源的吗？',
          answer: '是的！TabRest 是基于 MIT 许可证的完全开源软件。你可以查看代码、贡献改进，或在 GitHub 上报告问题。',
        },
        {
          question: 'TabRest 支持哪些浏览器？',
          answer: 'TabRest 适用于所有基于 Chromium 的浏览器，包括 Chrome、Microsoft Edge、Brave、Opera、Vivaldi 和 Arc。所有浏览器上都是相同的扩展、相同的功能。',
        },
      ],
    },
    footer: {
      cta: {
        title: '准备好释放你的内存了吗？',
        subtitle: '立即安装 TabRest，体验更快速的浏览',
        button: '免费安装',
      },
      sections: {
        product: '产品',
        resources: '资源',
        legal: '法律',
      },
      links: {
        features: '功能',
        howItWorks: '工作原理',
        faq: '常见问题',
        github: 'GitHub',
        reportIssue: '报告问题',
        chromeStore: 'Chrome Web Store',
        license: '许可证',
      },
      copyright: '© 2026 TabRest. 基于 MIT 许可证的开源软件。',
      builtBy: '开发者',
    },
    docs: {
      sidebar: {
        title: '文档',
        sections: {
          'getting-started': '快速开始',
          features: '功能',
          reference: '参考',
        },
      },
    },
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];
