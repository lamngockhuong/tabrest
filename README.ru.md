🇬🇧 [English](README.md) • 🇻🇳 [Tiếng Việt](README.vi.md) • 🇪🇸 [Español](README.es.md) • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 [Français](README.fr.md) • 🇷🇺 **Русский** • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  Дайте вкладкам отдохнуть, освободите память - расширение Chrome, которое автоматически выгружает неактивные вкладки.
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
  <a href="https://unikorn.vn/p/tabrest?ref=embed-tabrest" target="_blank"><img src="https://unikorn.vn/api/widgets/badge/tabrest?theme=light" alt="TabRest on Unikorn.vn" width="200" height="50" /></a>
  &nbsp;
  <a href="https://launch.j2team.dev/products/tabrest?utm_source=badge-launched&utm_medium=badge&utm_campaign=badge-tabrest" target="_blank" rel="noopener noreferrer"><img src="https://launch.j2team.dev/badge/tabrest/neutral" alt="TabRest - Launched on J2TEAM Launch" width="200" height="43" /></a>
</p>

## Возможности

- **Автоматическая выгрузка неактивных вкладок** - Настраиваемый таймер бездействия (от 5 мин до 4 часов)
- **Порог памяти** - Выгрузка при превышении RAM 60-95%
- **Лимит памяти на вкладку** - Выгрузка вкладок, использующих более 100MB-1GB JS heap
- **Выгрузка при запуске** - Освобождение памяти при открытии браузера
- **Ручное управление** - Выгрузить текущую/левые/правые/остальные вкладки
- **Закрытие дублирующихся вкладок** - Удаление дубликатов в текущем окне одним кликом
- **Поиск по вкладкам** - Фильтрация списка вкладок по названию или URL
- **Группы вкладок** - Выгрузка целой группы вкладок
- **Режим боковой панели** - Открытие TabRest в боковой панели Chrome (опционально)
- **Отложить вкладки/сайты** - Временная защита вкладок или доменов (30 мин - 2 часа)
- **Предупреждение перед выгрузкой** - Уведомление на странице за 3 секунды до автоматического сброса
- **Визуальный индикатор** - Настраиваемый префикс (💤) в заголовках сброшенных вкладок
- **Белый список** - Защита сайтов от автоматической выгрузки (поддержка localhost и IP)
- **Импорт/экспорт** - Резервное копирование белых списков, чёрных списков и сессий в JSON
- **Сессии** - Сохранение и восстановление наборов вкладок
- **Восстановление прокрутки** - Восстановление позиции прокрутки при перезагрузке вкладки
- **Метка времени YouTube** - Возобновление видео с последней позиции после перезагрузки
- **Пропуск в офлайн-режиме** - Вкладки не сбрасываются при отсутствии сети
- **Режим только при простое** - Автовыгрузка только когда компьютер не используется
- **Режим питания** - Профили экономии заряда, обычный и производительный
- **Уведомления об автовыгрузке** - Получение уведомлений при выгрузке вкладок
- **Подсказка по памяти** - Наведите курсор на статистику, чтобы увидеть расчётную экономию RAM на вкладку
- **Мастер настройки** - Интерактивная пошаговая настройка при первом запуске
- **Необязательные отчёты об ошибках** - Анонимные отчёты об ошибках через Sentry (по умолчанию отключено) и ручная отправка сообщений об ошибках
- **Автооткрытие журнала изменений** - Открытие заметок о выпуске при обновлениях minor/major
- **Необязательные разрешения хоста** - Защита форм запрашивает доступ только при включении
- **Отображение использования RAM** - Процент RAM в реальном времени в заголовке всплывающего окна
- **Статистика** - Отслеживание числа выгруженных вкладок и объёма сэкономленной памяти
- **Многоязычность** - Поддержка 11 языков

## Сочетания клавиш

| Сочетание     | Действие                    |
| ------------- | --------------------------- |
| `Alt+Shift+D` | Выгрузить текущую вкладку   |
| `Alt+Shift+O` | Выгрузить остальные вкладки |
| `Alt+Shift+→` | Выгрузить вкладки справа    |
| `Alt+Shift+←` | Выгрузить вкладки слева     |

## Установка

### Из исходного кода

1. Клонируйте этот репозиторий
2. Откройте `chrome://extensions` в Chrome
3. Включите «Режим разработчика» (верхний правый угол)
4. Нажмите «Загрузить распакованное расширение»
5. Выберите папку проекта

### Из Chrome Web Store

[Установите TabRest из Chrome Web Store](https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib).

## Принцип работы

TabRest использует нативный API Chrome `chrome.tabs.discard()` для выгрузки вкладок. Сброшенные вкладки:

- Остаются видимыми на панели вкладок
- Сохраняют позицию прокрутки и данные форм
- Мгновенно перезагружаются при клике
- Освобождают память, пока не используются

## Структура проекта

```text
tabrest/
├── manifest.json           # Конфигурация расширения (MV3)
├── _locales/               # Переводы i18n (en, vi)
├── src/
│   ├── background/         # Модули service worker
│   ├── content/            # Form checker, YouTube tracker
│   ├── popup/              # UI всплывающего окна / боковой панели
│   ├── options/            # Страница настроек
│   ├── pages/              # Onboarding, changelog
│   └── shared/             # Общие утилиты
├── icons/                  # Иконки расширения
├── website/                # Документационный сайт Astro (tabrest.ohnice.app)
└── docs/                   # Документация проекта
```

## Разработка

```bash
pnpm install          # Установить зависимости
pnpm run lint         # Проверить код с помощью Biome
pnpm run lint:fix     # Автоматически исправить проблемы линтера
pnpm run format       # Форматировать код
pnpm run ci           # Запустить полный CI (validate + lint)
```

## Промоматериалы

Рекламные изображения для Chrome Web Store находятся в папке `assets/` в формате SVG.

```bash
./scripts/generate-promo-images.sh   # Сгенерировать файлы PNG
```

## Конфиденциальность

- Данные не собираются
- Внешние серверы не используются
- Все настройки хранятся локально
- См. [Политику конфиденциальности](docs/privacy-policy.md)

## Поддержка

Если Вы находите это расширение полезным, рассмотрите возможность поддержать его разработку:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Support-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Support-ae2070)](https://me.momo.vn/khuong)

## Другие проекты

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - Кросс-браузерное расширение, улучшающее интерфейс GitHub функциями повышения продуктивности
- [Termote](https://github.com/lamngockhuong/termote) - Инструменты CLI для удалённого управления (Claude Code, GitHub Copilot, любой терминал) с мобильного устройства или компьютера через PWA

## Лицензия

MIT
