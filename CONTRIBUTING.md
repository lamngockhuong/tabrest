# Contributing to TabRest

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/<your-username>/tabrest.git
   cd tabrest
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Create a branch:

   ```bash
   git checkout -b feat/your-feature
   ```

## Development

```bash
pnpm lint              # Check code style
pnpm lint:fix          # Auto-fix issues
pnpm test              # Run tests
pnpm run validate:manifest  # Validate manifest.json
pnpm run ci            # Full CI (validate + lint + test)
```

### Loading the Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the project root
4. View service worker logs: TabRest → "Inspect views: service worker"

## Project Structure

```text
src/
├── background/   # Service worker modules (orchestration, unload logic, LRU, memory)
├── content/      # Content scripts (form checker, YouTube tracker)
├── popup/        # Popup / side panel UI
├── options/      # Settings page
├── pages/        # Onboarding, changelog
└── shared/       # Constants, storage wrapper, utilities
```

See `docs/system-architecture.md` and `CLAUDE.md` for module dependency flow.

## Adding a New Feature

1. Add default to `SETTINGS_DEFAULTS` in `src/shared/constants.js`
2. Implement logic in the appropriate `src/background/*` module
3. Add UI toggle in `src/options/options.html` (and popup if user-facing)
4. Wire up the storage key in the corresponding JS file
5. Add i18n strings to `_locales/en/messages.json` and `_locales/vi/messages.json`
6. Update `docs/` if it changes architecture or user-facing behavior

## Code Style

- Vanilla JavaScript (ES Modules) - no build step for extension code
- Keep files under 200 lines; split by concern
- Follow existing patterns in the codebase
- Run `pnpm lint` before committing
- See `docs/code-standards.md` for details

## Commit Messages

Use [conventional commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `refactor:` code refactoring
- `test:` adding or updating tests
- `chore:` maintenance tasks

## Pull Requests

1. Ensure `pnpm run ci` passes
2. Test the extension as unpacked in Chrome
3. Fill out the PR template
4. Keep PRs focused on a single change

## Reporting Issues

- Use the **Bug Report** template for bugs
- Use the **Feature Request** template for suggestions
- Include browser version, extension version, and steps to reproduce

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
