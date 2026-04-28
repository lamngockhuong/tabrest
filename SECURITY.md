# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email the maintainer or use [GitHub Security Advisories](https://github.com/lamngockhuong/tabrest/security/advisories/new)
3. Include steps to reproduce the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Scope

This extension runs locally in Chrome and:

- Does not collect or transmit user data
- Stores settings via `chrome.storage.sync` and tab activity via `chrome.storage.local`
- Does not make external network requests
- Requests host permissions only when the user enables features that need them (e.g. discarded-tab title prefix, form protection)
- Uses Manifest V3 with no remote code execution

## Response

- Acknowledgment within 48 hours
- Fix timeline communicated within 7 days
- Credit given in release notes (unless anonymity requested)
