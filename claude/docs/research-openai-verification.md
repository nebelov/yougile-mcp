# OpenAI Domain Verification for ChatGPT Apps/Connectors

**Research Date:** 2026-02-16
**Topic:** `/.well-known/openai-apps-challenge` endpoint and domain verification for ChatGPT Apps (formerly Connectors)

---

## Table of Contents

1. [Overview](#overview)
2. [Two Types of Domain Verification](#two-types-of-domain-verification)
3. [/.well-known/openai-apps-challenge Endpoint](#well-known-openai-apps-challenge-endpoint)
4. [Where to Get the Verification Token](#where-to-get-the-verification-token)
5. [Step-by-Step Domain Verification for ChatGPT Apps](#step-by-step-domain-verification-for-chatgpt-apps)
6. [DNS TXT Record Verification (Builder Profile)](#dns-txt-record-verification-builder-profile)
7. [Implementation Examples](#implementation-examples)
8. [Additional Required Endpoints](#additional-required-endpoints)
9. [OAuth Configuration](#oauth-configuration)
10. [Common Issues and Solutions](#common-issues-and-solutions)
11. [Submission Checklist](#submission-checklist)
12. [Sources](#sources)

---

## Overview

OpenAI uses domain verification to confirm that developers own the domains hosting their MCP (Model Context Protocol) servers before allowing apps to be listed in the ChatGPT Apps marketplace.

**Key Points:**
- As of December 2025, ChatGPT "Connectors" were renamed to "Apps"
- Verification is MANDATORY for app submission
- Two verification methods exist: `openai-apps-challenge` endpoint (for MCP servers) and DNS TXT records (for Builder Profile)

---

## Two Types of Domain Verification

### 1. MCP Server Domain Verification (`openai-apps-challenge`)

Used when submitting an MCP app to the ChatGPT Apps Directory. OpenAI needs to verify you own the domain hosting your MCP server.

- **Endpoint:** `/.well-known/openai-apps-challenge`
- **Method:** HTTP endpoint returns verification token as plain text
- **When used:** During app submission at platform.openai.com/apps-manage
- **Timing:** OpenAI pings immediately when you click submit

### 2. Builder Profile Domain Verification (DNS TXT)

Used to verify your identity as a GPT builder and show your domain instead of personal name.

- **Method:** DNS TXT record
- **Where:** Settings > Builder Profile > Links > Verify new domain
- **When used:** For publishing GPTs with custom actions to the GPT Store

---

## /.well-known/openai-apps-challenge Endpoint

### What It Is

A special HTTP endpoint that your MCP server must expose to prove domain ownership. OpenAI's servers will request this endpoint during the app submission process.

### Requirements

| Requirement | Details |
|-------------|---------|
| **Path** | `GET /.well-known/openai-apps-challenge` |
| **Response Type** | `text/plain` (NOT JSON, NOT HTML) |
| **Content** | The verification token provided by OpenAI |
| **HTTPS** | Required (must be publicly accessible) |
| **Timing** | Must be deployed BEFORE clicking submit |

### Important Notes

- The endpoint must return the token as **plain text only**
- OpenAI pings this endpoint **immediately** when you submit your app
- If the endpoint is not accessible or returns wrong format, submission will fail

---

## Where to Get the Verification Token

### Process

1. Go to **https://platform.openai.com/apps-manage**
2. Click "Create new app" or open your draft app
3. Enter your MCP server URL (e.g., `https://mcp.yourdomain.com/mcp`)
4. Select OAuth as authentication method (if applicable)
5. **OpenAI will display a verification token** in the submission form
6. Copy this token and configure your server to return it at `/.well-known/openai-apps-challenge`
7. Deploy the endpoint
8. Click Submit - OpenAI immediately verifies the endpoint

### Token Characteristics

- Generated uniquely for your submission
- Looks like a random alphanumeric string
- Must be served exactly as provided (no modifications)

---

## Step-by-Step Domain Verification for ChatGPT Apps

### Prerequisites

1. **Organization Verification:** Your organization must be verified on OpenAI Platform
   - Go to: https://platform.openai.com/settings/organization/general
   - Complete individual or business verification

2. **Owner Role:** You must have the Owner role in your organization

3. **MCP Server Ready:** Your server must be:
   - Publicly accessible via HTTPS
   - Not using local or testing endpoints
   - Have CSP (Content Security Policy) defined

### Step-by-Step Process

1. **Access the Dashboard**
   - Navigate to https://platform.openai.com/apps-manage

2. **Create/Open Your App**
   - Click "Create new app" or open an existing draft

3. **Configure MCP Server Details**
   - Enter your MCP server URL
   - Select authentication method (OAuth if needed)

4. **Receive Verification Token**
   - OpenAI displays the verification token in the form

5. **Implement the Challenge Endpoint**
   - Add `/.well-known/openai-apps-challenge` endpoint to your server
   - Return the token as plain text

6. **Deploy Your Server**
   - Ensure the endpoint is accessible before submitting
   - Test with: `curl https://yourdomain.com/.well-known/openai-apps-challenge`

7. **Complete OAuth Setup (if using)**
   - Add OpenAI's redirect URI: `https://platform.openai.com/apps-manage/oauth`
   - Also add ChatGPT's redirect URI: `https://chatgpt.com/connector_platform_oauth_redirect`

8. **Fill App Details**
   - App name, descriptions, category
   - Privacy Policy URL (required, must be live)
   - Terms of Service URL (required, must be live)

9. **Scan Tools**
   - Click "Scan Tools" to verify your MCP server's tools are detected

10. **Complete Tool Justifications**
    - For each tool, explain: Read Only? Open World? Destructive?

11. **Add Test Cases**
    - Minimum 5 positive test cases
    - Minimum 3 negative test cases

12. **Submit for Review**
    - Click Submit - OpenAI immediately pings your challenge endpoint
    - If verification passes, app enters review queue

---

## DNS TXT Record Verification (Builder Profile)

For GPT Store publishing (separate from MCP Apps):

### Process

1. Go to **Settings > Builder Profile**
2. Under "Links," click **Verify new domain**
3. Enter your domain (e.g., `yourcompany.com`)
4. OpenAI provides a TXT record value
5. Add TXT record to your DNS:
   - **Host/Name:** `@` (root domain)
   - **Type:** `TXT`
   - **Value:** The string provided by OpenAI
6. Wait up to 24 hours for DNS propagation
7. Click Verify in OpenAI dashboard

### Important Limitations

- Only ONE verified domain per Builder Profile
- Once an organization verifies a domain, no other organization can verify it
- Subdomains may require separate verification

---

## Implementation Examples

### Python (FastAPI)

```python
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

app = FastAPI()

# Store your verification token (get from OpenAI dashboard during submission)
OPENAI_VERIFICATION_TOKEN = "your-verification-token-here"

@app.get("/.well-known/openai-apps-challenge")
async def openai_apps_challenge():
    return PlainTextResponse(
        content=OPENAI_VERIFICATION_TOKEN,
        media_type="text/plain"
    )
```

### Node.js (Express)

```javascript
const express = require('express');
const app = express();

// Store your verification token (get from OpenAI dashboard during submission)
const OPENAI_VERIFICATION_TOKEN = 'your-verification-token-here';

app.get('/.well-known/openai-apps-challenge', (req, res) => {
    res.type('text/plain').send(OPENAI_VERIFICATION_TOKEN);
});

app.listen(8000, () => {
    console.log('Server running on port 8000');
});
```

### Python (Flask)

```python
from flask import Flask, Response

app = Flask(__name__)

OPENAI_VERIFICATION_TOKEN = "your-verification-token-here"

@app.route('/.well-known/openai-apps-challenge')
def openai_apps_challenge():
    return Response(
        OPENAI_VERIFICATION_TOKEN,
        mimetype='text/plain'
    )
```

### Environment Variable Approach (Recommended)

```python
import os
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

app = FastAPI()

@app.get("/.well-known/openai-apps-challenge")
async def openai_apps_challenge():
    token = os.environ.get("OPENAI_VERIFICATION_TOKEN", "")
    return PlainTextResponse(content=token, media_type="text/plain")
```

---

## Additional Required Endpoints

Beyond the challenge endpoint, OpenAI may look for these `.well-known` endpoints:

### For OAuth-enabled Apps

| Endpoint | Purpose |
|----------|---------|
| `/.well-known/oauth-protected-resource` | Protected resource metadata |
| `/.well-known/oauth-protected-resource/mcp` | MCP-specific resource metadata |
| `/.well-known/openid-configuration` | OpenID Connect discovery |
| `/.well-known/oauth-authorization-server` | OAuth 2.0 metadata |

### Protected Resource Metadata Example

```json
{
  "resource": "https://your-mcp.example.com",
  "authorization_servers": ["https://auth.yourcompany.com"],
  "scopes_supported": ["read", "write"],
  "resource_documentation": "https://yourcompany.com/docs/mcp"
}
```

---

## OAuth Configuration

### Required Redirect URIs

Add these to your OAuth authorization server's allowlist:

1. **Production:** `https://chatgpt.com/connector_platform_oauth_redirect`
2. **Review:** `https://platform.openai.com/apps-manage/oauth`

### OAuth State Parameter Warning

OpenAI's OAuth state parameter is **400+ characters** of base64-encoded JSON.

```sql
-- This will break:
state VARCHAR(255)

-- Use this instead:
state TEXT
```

### OAuth 2.1 Requirements

- PKCE with S256 method (required)
- Dynamic Client Registration (DCR) support
- Resource parameter echoing
- Refresh token support (recommended)

---

## Common Issues and Solutions

### Issue 1: Verification Fails Immediately

**Cause:** Endpoint not deployed or not returning plain text

**Solution:**
```bash
# Test your endpoint
curl -v https://yourdomain.com/.well-known/openai-apps-challenge

# Should return:
# Content-Type: text/plain
# Body: your-token-here
```

### Issue 2: OAuth State Truncation

**Cause:** Database column too small for state parameter

**Solution:** Use TEXT or VARCHAR(2000) minimum for OAuth state storage

### Issue 3: 404 Errors for .well-known Endpoints

**Cause:** Server not handling .well-known paths

**Solution:** Add explicit routes for all required .well-known endpoints

### Issue 4: DNS TXT Not Found

**Cause:** DNS propagation delay or wrong record format

**Solution:**
- Wait 24 hours for propagation
- Use `@` as host name for root domain
- Verify with: `dig TXT yourdomain.com`

### Issue 5: Annotations Format Mismatch

**Cause:** Internal key naming differs from expected format

**Solution:**
```python
# Transform to OpenAI expected format
def format_tool_for_openai(tool):
    return {
        "name": tool["name"],
        "description": tool["description"],
        "inputSchema": tool["inputSchema"],
        "annotations": {
            "title": tool.get("_title", tool["name"]),
            "readOnlyHint": tool.get("_readOnlyHint", True),
            "destructiveHint": tool.get("_destructiveHint", False),
            "openWorldHint": tool.get("_openWorldHint", True)
        }
    }
```

---

## Submission Checklist

Before clicking submit, verify:

- [ ] Organization verified on OpenAI Platform
- [ ] Owner role in organization
- [ ] Light and dark mode icons uploaded
- [ ] Privacy Policy URL is live and accessible
- [ ] Terms of Service URL is live and accessible
- [ ] MCP server is publicly accessible via HTTPS
- [ ] `/.well-known/openai-apps-challenge` returns verification token as plain text
- [ ] OAuth redirect URIs include OpenAI URLs (if using OAuth)
- [ ] Database can store 500+ character OAuth state (if using OAuth)
- [ ] All tools have proper `annotations` object
- [ ] Tool justifications completed for every tool
- [ ] At least 5 positive test cases with specific prompts
- [ ] At least 3 negative test cases
- [ ] Test account credentials ready for reviewers
- [ ] Release notes written

---

## Alternative Verification Methods

### Currently Available

1. **`/.well-known/openai-apps-challenge`** - Primary method for MCP Apps
2. **DNS TXT Record** - For Builder Profile domain verification

### NOT Available

- CNAME verification
- HTML file upload
- Meta tag verification
- Email verification

OpenAI currently supports only the two methods above. No alternatives are documented.

---

## Sources

### Official Documentation

- [OpenAI Apps SDK - Authentication](https://developers.openai.com/apps-sdk/build/auth/)
- [OpenAI Apps SDK - Submit Your App](https://developers.openai.com/apps-sdk/deploy/submission/)
- [OpenAI Help Center - Domain Verification](https://help.openai.com/en/articles/8871611-domain-verification)
- [OpenAI Platform - Apps Manage](https://platform.openai.com/apps-manage)

### Developer Guides

- [How to Submit a ChatGPT App: Complete Developer Guide (2025)](https://www.adspirer.com/blog/how-to-submit-chatgpt-app)
- [Guide to Authentication for the OpenAI Apps SDK (Stytch)](https://stytch.com/blog/guide-to-authentication-for-the-openai-apps-sdk/)

### GitHub Resources

- [OpenAI Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- [Python MCP SDK Authentication](https://github.com/modelcontextprotocol/python-sdk)
- [TypeScript MCP SDK Authentication](https://github.com/modelcontextprotocol/typescript-sdk)

### Community Discussions

- [OpenAI Forum - Domain Verification](https://community.openai.com/t/solved-how-to-verify-domain-on-profile/494371)
- [OpenAI Forum - Verification Tokens](https://community.openai.com/t/verification-tokens-and-multiple-environments/276436)

---

## Search Statistics

| Metric | Value |
|--------|-------|
| Queries Executed | 15+ |
| Tools Used | WebSearch, Firecrawl, Read |
| Sources Found | 20+ |
| Information Currency | February 2026 |
| Verification | 3+ independent sources for critical facts |

---

## Summary

Domain verification for ChatGPT Apps (MCP servers) uses the `/.well-known/openai-apps-challenge` endpoint:

1. **Get token** from https://platform.openai.com/apps-manage during app submission
2. **Implement endpoint** that returns the token as plain text
3. **Deploy** before clicking submit
4. **OpenAI pings immediately** to verify ownership

This is separate from DNS TXT verification used for Builder Profile, which is required for publishing GPTs with custom actions to the GPT Store.
