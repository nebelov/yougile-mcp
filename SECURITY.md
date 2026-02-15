# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue**
2. Email: **security@nebelov.dev** (or open a private advisory on GitHub)
3. Include: description, steps to reproduce, potential impact

## Response Timeline

- **Acknowledgment:** within 48 hours
- **Assessment:** within 1 week
- **Fix release:** within 2 weeks for critical issues

## Security Design

This package follows security best practices:

- **Zero secrets in code** — API key passed via environment variable only
- **Minimal dependencies** — reduces supply chain attack surface
- **No postinstall scripts** — no arbitrary code execution on install
- **TypeScript strict mode** — catches type-related bugs at compile time
- **No eval/Function** — no dynamic code execution
- **No network calls except YouGile API** — the server only communicates with `yougile.com/api-v2`

## Disclosure Policy

We follow [coordinated vulnerability disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). Security fixes are released as patch versions with a security advisory.
