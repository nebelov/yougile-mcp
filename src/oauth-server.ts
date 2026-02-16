/**
 * OAuth 2.1 + MCP Server for ChatGPT App Directory
 * Hosted at you-mcp.com
 *
 * ZERO-KNOWLEDGE AUTH: User credentials NEVER touch our code.
 * Browser authenticates directly with YouGile API via transparent proxy.
 * Our server only receives the resulting API key.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAllTools } from "./tools/index.js";
import { apiKeyStore } from "./services/api.js";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { request as httpsRequest } from "node:https";
import { createHash, randomBytes } from "node:crypto";

// --- Config ---
const PORT = parseInt(process.env.PORT || "3847", 10);
const BASE_URL = process.env.BASE_URL || "https://you-mcp.com";
const OPENAI_TOKEN = process.env.OPENAI_VERIFICATION_TOKEN || "";

// --- In-memory stores ---
const clients = new Map<string, { redirectUris: string[]; name: string }>();
const authCodes = new Map<string, {
  clientId: string; redirectUri: string; codeChallenge: string;
  apiKey: string; scope: string; expiresAt: number;
}>();
const accessTokens = new Map<string, { apiKey: string; expiresAt: number }>();
const refreshTokens = new Map<string, {
  apiKey: string; clientId: string; expiresAt: number;
}>();

// --- Helpers ---
function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function genToken(): string { return randomBytes(32).toString("base64url"); }

function verifyPKCE(verifier: string, challenge: string): boolean {
  return createHash("sha256").update(verifier).digest("base64url") === challenge;
}

function parseForm(body: string): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(body)) r[k] = v;
  return r;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getLang(url: URL, req: IncomingMessage): "ru" | "en" {
  const p = url.searchParams.get("lang");
  if (p === "en") return "en";
  if (p === "ru") return "ru";
  const accept = req.headers["accept-language"] || "";
  if (/^en/i.test(accept) && !/ru/i.test(accept)) return "en";
  return "ru"; // default Russian
}

// --- i18n ---
const T = {
  ru: {
    loginTitle: "YouGile MCP — Подключение аккаунта",
    connectTitle: "Подключить YouGile к ChatGPT",
    connectSub: "Управляйте проектами, задачами и досками через ИИ",
    noticeText: 'Это <strong>независимая open-source интеграция</strong>, а не официальный продукт YouGile. Ваши данные для входа используются исключительно для аутентификации через YouGile API. Продолжая, вы соглашаетесь с <a href="/terms" target="_blank">Условиями</a> и <a href="/privacy" target="_blank">Политикой конфиденциальности</a>.',
    emailLabel: "Email YouGile",
    emailPlaceholder: "ваш@email.com",
    passwordLabel: "Пароль YouGile",
    passwordPlaceholder: "Ваш пароль от YouGile",
    connectBtn: "Подключить YouGile",
    connecting: "Подключение...",
    secTitle: "Безопасная аутентификация без хранения данных.",
    secText: 'Ваш email и пароль отправляются напрямую из браузера в YouGile API. Наш сервер выступает как прозрачный прокси и никогда не читает, не сохраняет и не логирует ваши учётные данные. Для сессии используется только полученный API-ключ. <a href="https://github.com/nebelov/yougile-mcp" target="_blank">Исходный код открыт.</a>',
    howTitle: "Как это работает?",
    how1: "Вы вводите email и пароль от YouGile выше.",
    how2: "Ваш браузер отправляет их напрямую в официальный API YouGile (через прозрачный прокси) для получения API-ключа.",
    how3: "На наш сервер отправляется только API-ключ (не пароль).",
    how4: "Наш сервер использует этот ключ для выполнения действий в YouGile, когда вы обращаетесь через ChatGPT.",
    how5: "Вам доступны 57 инструментов: проекты, доски, задачи, колонки, чаты, пользователи и многое другое.",
    how6: "Вы можете отозвать доступ в любое время, удалив API-ключ в настройках YouGile.",
    errInvalidCreds: "Неверный email или пароль.",
    errApiError: "Ошибка YouGile API. Попробуйте ещё раз.",
    errNoCompany: "Не найдена компания YouGile для этого аккаунта.",
    errKeyFailed: "Не удалось получить API-ключ.",
    errUnexpected: "Неожиданный ответ от YouGile.",
    langSwitch: "English",
    langSwitchUrl: "?lang=en",
    footerDisclaimer: "YouGile MCP &mdash; независимый open-source проект. <strong>Не связан с YouGile и не одобрен ими.</strong>",
    footerDev: "Разработчик: ИП Травин Виталий Андреевич &middot; ИНН: 553903539940 &middot; ОГРНИП: 324554300062429",
    footerLinks: '<a href="mailto:admin@0809.link">admin@0809.link</a> &middot; <a href="/privacy">Конфиденциальность</a> &middot; <a href="/terms">Условия</a> &middot; <a href="https://github.com/nebelov/yougile-mcp">GitHub</a>',
    // Privacy
    privacyTitle: "Политика конфиденциальности",
    privacyUpdated: "Последнее обновление: 16 февраля 2026 г.",
    // Terms
    termsTitle: "Условия использования",
    termsUpdated: "Последнее обновление: 16 февраля 2026 г.",
    // Root
    rootTitle: "YouGile MCP — ИИ-интеграция для управления проектами",
    rootH1: "YouGile MCP Сервер",
    rootSub: "Подключите YouGile к ChatGPT — 57 ИИ-инструментов для управления проектами",
    rootFeat1t: "Проекты и доски", rootFeat1d: "Создание, обновление, поиск и организация проектов и досок.",
    rootFeat2t: "Задачи и подзадачи", rootFeat2d: "Полное управление задачами: создание, назначение, перемещение, дедлайны, стикеры.",
    rootFeat3t: "Колонки и спринты", rootFeat3d: "Управление колонками workflow, перемещение задач между этапами.",
    rootFeat4t: "Команда и чаты", rootFeat4d: "Приглашение пользователей, управление ролями, сообщения в групповых чатах.",
    rootNote: "<strong>Не является официальным продуктом YouGile.</strong> Это независимая open-source интеграция, использующая публичный API YouGile.",
  },
  en: {
    loginTitle: "YouGile MCP — Connect your account",
    connectTitle: "Connect YouGile to ChatGPT",
    connectSub: "Manage your projects, tasks, and boards with AI",
    noticeText: 'This is an <strong>independent open-source integration</strong>, not an official YouGile product. Your credentials are used solely to authenticate with YouGile API. By proceeding, you agree to our <a href="/terms?lang=en" target="_blank">Terms</a> and <a href="/privacy?lang=en" target="_blank">Privacy Policy</a>.',
    emailLabel: "YouGile Email",
    emailPlaceholder: "your@email.com",
    passwordLabel: "YouGile Password",
    passwordPlaceholder: "Your YouGile password",
    connectBtn: "Connect YouGile",
    connecting: "Connecting...",
    secTitle: "Zero-knowledge authentication.",
    secText: 'Your email and password are sent directly from your browser to YouGile API. Our server acts as a transparent proxy and never reads, stores, or logs your credentials. Only the resulting API key is used for the session. <a href="https://github.com/nebelov/yougile-mcp" target="_blank">Verify the source code.</a>',
    howTitle: "How does this work?",
    how1: "You enter your YouGile email and password above.",
    how2: "Your browser sends them directly to YouGile's official API (via a transparent proxy) to get an API key.",
    how3: "Only the API key (not your password) is sent to our server.",
    how4: "Our server uses that key to execute YouGile actions on your behalf when you ask ChatGPT.",
    how5: "You get access to 57 tools: projects, boards, tasks, columns, chats, users, and more.",
    how6: "You can revoke access anytime by deleting the API key in YouGile settings.",
    errInvalidCreds: "Invalid email or password.",
    errApiError: "YouGile API error. Try again.",
    errNoCompany: "No YouGile company found for this account.",
    errKeyFailed: "Failed to get API key.",
    errUnexpected: "Unexpected response from YouGile.",
    langSwitch: "Русский",
    langSwitchUrl: "?lang=ru",
    footerDisclaimer: "YouGile MCP &mdash; an independent open-source project. <strong>Not affiliated with or endorsed by YouGile.</strong>",
    footerDev: "Developer: Vitaliy Travin, Individual Entrepreneur &middot; Tax ID: 553903539940 &middot; Reg: 324554300062429",
    footerLinks: '<a href="mailto:admin@0809.link">admin@0809.link</a> &middot; <a href="/privacy?lang=en">Privacy</a> &middot; <a href="/terms?lang=en">Terms</a> &middot; <a href="https://github.com/nebelov/yougile-mcp">GitHub</a>',
    privacyTitle: "Privacy Policy",
    privacyUpdated: "Last updated: February 16, 2026",
    termsTitle: "Terms of Service",
    termsUpdated: "Last updated: February 16, 2026",
    rootTitle: "YouGile MCP — AI Integration for Project Management",
    rootH1: "YouGile MCP Server",
    rootSub: "Connect YouGile project management to ChatGPT with 57 AI-powered tools",
    rootFeat1t: "Projects & Boards", rootFeat1d: "Create, update, list, and organize projects and boards.",
    rootFeat2t: "Tasks & Subtasks", rootFeat2d: "Full task management: create, assign, move, set deadlines, add stickers.",
    rootFeat3t: "Columns & Sprints", rootFeat3d: "Manage workflow columns, move tasks between stages.",
    rootFeat4t: "Team & Chats", rootFeat4d: "Invite users, manage roles, send messages in group chats.",
    rootNote: "<strong>Not an official YouGile product.</strong> This is an independent open-source integration built using YouGile's public API.",
  },
};

type Lang = "ru" | "en";
function t(lang: Lang) { return T[lang]; }

// --- Transparent proxy ---
function proxyToYougile(yougilePath: string, req: IncomingMessage, res: ServerResponse) {
  const proxyReq = httpsRequest({
    hostname: "yougile.com",
    path: `/api-v2${yougilePath}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(req.headers["content-length"] ? { "Content-Length": req.headers["content-length"] } : {}),
    },
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    proxyRes.pipe(res);
  });
  proxyReq.on("error", () => json(res, 502, { error: "YouGile API unavailable" }));
  req.pipe(proxyReq);
}

// --- Shared CSS & footer ---
const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#333;line-height:1.6}
a{color:#4a90d9;text-decoration:none}a:hover{text-decoration:underline}
.page{max-width:720px;margin:0 auto;padding:40px 24px 20px}
.page h1{font-size:24px;margin-bottom:16px;color:#1a1a1a}
.page h2{font-size:18px;margin:24px 0 8px;color:#1a1a1a}
.page p,.page li{font-size:14px;color:#555;margin-bottom:8px}
.page ul{padding-left:20px}
.ft{text-align:center;padding:24px;font-size:11px;color:#999;border-top:1px solid #eee;margin-top:40px}
.ft a{color:#999}.ft p{margin:4px 0}
.lang-sw{position:absolute;top:12px;right:16px;font-size:12px;color:#4a90d9}`;

function footer(l: Lang) {
  const i = t(l);
  return `<div class="ft"><p>${i.footerDisclaimer}</p><p>${i.footerDev}</p><p>${i.footerLinks}</p></div>`;
}

// --- Login Page ---
function loginPage(
  clientId: string, redirectUri: string, state: string,
  codeChallenge: string, scope: string, lang: Lang,
): string {
  const i = t(lang);
  const otherLang = lang === "ru" ? "en" : "ru";
  return `<!DOCTYPE html>
<html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(i.loginTitle)}</title>
<style>
${CSS}
.wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;position:relative}
.card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:36px;max-width:420px;width:100%}
.logo{text-align:center;margin-bottom:20px}
.logo svg{width:48px;height:48px}
h1{font-size:20px;text-align:center;margin-bottom:4px;color:#1a1a1a}
p.sub{font-size:14px;text-align:center;color:#666;margin-bottom:20px}
.notice{background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:12px;color:#6d4c00;line-height:1.5}
label{display:block;font-size:13px;font-weight:500;color:#333;margin-bottom:4px}
input[type=email],input[type=password]{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:15px;margin-bottom:14px;outline:none;transition:border .2s}
input:focus{border-color:#4a90d9}
button{width:100%;padding:12px;background:#4a90d9;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:500;cursor:pointer;transition:background .2s}
button:hover{background:#3a7bc8}
button:disabled{background:#aaa;cursor:not-allowed}
.err{background:#fee;border:1px solid #fcc;border-radius:8px;padding:10px;margin-bottom:14px;color:#c33;font-size:13px;text-align:center;display:none}
.how{margin-top:16px;font-size:12px;color:#888;line-height:1.6}
.how summary{cursor:pointer;font-weight:500;color:#666}
.how ul{margin-top:6px;padding-left:16px}
.how li{margin-bottom:4px}
.sec{display:flex;align-items:flex-start;gap:8px;margin-top:14px;padding:10px 12px;background:#f0f7f0;border-radius:8px;font-size:12px;color:#2e6b2e;line-height:1.5}
.sec svg{flex-shrink:0;margin-top:2px}
</style></head><body>
<div class="wrap">
<a class="lang-sw" href="?lang=${otherLang}&client_id=${esc(clientId)}&redirect_uri=${esc(redirectUri)}&state=${esc(state)}&code_challenge=${esc(codeChallenge)}&scope=${esc(scope)}">${t(otherLang === "ru" ? "ru" : "en").langSwitch === i.langSwitch ? (otherLang === "ru" ? "Русский" : "English") : T[otherLang].langSwitch}</a>
<div class="card">
<div class="logo"><svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#4a90d9"/>
<text x="24" y="32" font-size="24" fill="#fff" text-anchor="middle" font-weight="bold">Y</text></svg></div>
<h1>${i.connectTitle}</h1>
<p class="sub">${i.connectSub}</p>
<div class="notice">${i.noticeText}</div>
<div class="err" id="err"></div>
<form id="loginForm">
<label for="email">${i.emailLabel}</label>
<input type="email" id="email" required placeholder="${esc(i.emailPlaceholder)}" autofocus>
<label for="password">${i.passwordLabel}</label>
<input type="password" id="password" required placeholder="${esc(i.passwordPlaceholder)}">
<button type="submit" id="btn">${i.connectBtn}</button>
</form>
<div class="sec">
<svg width="16" height="16" viewBox="0 0 16 16" fill="#2e6b2e"><path d="M8 1a4 4 0 0 0-4 4v3H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4zm-2 4a2 2 0 1 1 4 0v3H6V5z"/></svg>
<div><strong>${i.secTitle}</strong> ${i.secText}</div>
</div>
<details class="how">
<summary>${i.howTitle}</summary>
<ul>
<li>${i.how1}</li><li>${i.how2}</li><li>${i.how3}</li>
<li>${i.how4}</li><li>${i.how5}</li><li>${i.how6}</li>
</ul>
</details>
</div>
${footer(lang)}
</div>
<script>
const MSGS=${JSON.stringify({connecting:i.connecting,connect:i.connectBtn,errInvalidCreds:i.errInvalidCreds,errApiError:i.errApiError,errNoCompany:i.errNoCompany,errKeyFailed:i.errKeyFailed,errUnexpected:i.errUnexpected})};
const CFG={clientId:"${esc(clientId)}",redirectUri:"${esc(redirectUri)}",state:"${esc(state)}",codeChallenge:"${esc(codeChallenge)}",scope:"${esc(scope)}"};
document.getElementById('loginForm').addEventListener('submit',async function(e){
  e.preventDefault();
  const btn=document.getElementById('btn'),errEl=document.getElementById('err');
  const email=document.getElementById('email').value,pw=document.getElementById('password').value;
  btn.disabled=true;btn.textContent=MSGS.connecting;errEl.style.display='none';
  try{
    const compRes=await fetch('/proxy/auth/companies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:email,password:pw})});
    if(compRes.status===401||compRes.status===403)throw new Error(MSGS.errInvalidCreds);
    if(!compRes.ok)throw new Error(MSGS.errApiError);
    const compData=await compRes.json();
    const companies=Array.isArray(compData)?compData:(compData.content||[]);
    if(!companies.length)throw new Error(MSGS.errNoCompany);
    const keyRes=await fetch('/proxy/auth/keys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:email,password:pw,companyId:companies[0].id})});
    if(!keyRes.ok)throw new Error(MSGS.errKeyFailed);
    const keyData=await keyRes.json();
    const apiKey=typeof keyData==='string'?keyData:Array.isArray(keyData)?keyData[0]:(keyData.key||null);
    if(!apiKey)throw new Error(MSGS.errUnexpected);
    const form=document.createElement('form');form.method='POST';form.action='/authorize';
    const fields={api_key:apiKey,client_id:CFG.clientId,redirect_uri:CFG.redirectUri,state:CFG.state,code_challenge:CFG.codeChallenge,scope:CFG.scope};
    for(const[k,v]of Object.entries(fields)){const input=document.createElement('input');input.type='hidden';input.name=k;input.value=v;form.appendChild(input)}
    document.body.appendChild(form);form.submit();
  }catch(err){errEl.textContent=err.message;errEl.style.display='block';btn.disabled=false;btn.textContent=MSGS.connect}
});
</script>
</body></html>`;
}

// --- Privacy Page ---
function privacyPage(lang: Lang): string {
  const i = t(lang);
  const other = lang === "ru" ? "en" : "ru";
  const body = lang === "ru" ? `
<h1>${i.privacyTitle}</h1>
<p><em>${i.privacyUpdated}</em> &middot; <a href="/privacy?lang=${other}">${T[other].langSwitch}</a></p>
<h2>1. Кто мы</h2>
<p>YouGile MCP (&laquo;Сервис&raquo;) &mdash; независимая open-source интеграция, которая подключает систему управления проектами YouGile к ИИ-ассистентам (ChatGPT и др.) через протокол MCP. <strong>Не является продуктом компании YouGile и не одобрена ею.</strong></p>
<p>Оператор: ИП Травин Виталий Андреевич. ИНН: 553903539940. ОГРНИП: 324554300062429. Контакт: <a href="mailto:admin@0809.link">admin@0809.link</a>.</p>
<h2>2. Какие данные мы собираем</h2>
<p>Мы собираем <strong>минимум данных</strong>, необходимых для работы Сервиса.</p>
<ul>
<li><strong>API-ключ YouGile:</strong> При аутентификации ваш браузер получает API-ключ от YouGile API. Ключ хранится только в оперативной памяти сервера на время сессии (макс. 1 час, обновляемый до 14 дней). Никогда не записывается на диск, в логи или базу данных.</li>
<li><strong>Email и пароль YouGile:</strong> Мы <strong>никогда</strong> не собираем, не читаем, не сохраняем и не логируем ваши учётные данные. Аутентификация использует прозрачный прокси: браузер отправляет данные напрямую в YouGile API, сервер лишь передаёт необработанные байты.</li>
<li><strong>OAuth-токены:</strong> Случайно сгенерированные токены хранятся в оперативной памяти для поддержания сессии. Удаляются по истечении срока или при перезапуске сервера.</li>
<li><strong>Логи сервера:</strong> Стандартные логи могут содержать IP-адреса, временные метки и пути запросов. Они не содержат учётных данных, API-ключей или данных YouGile.</li>
</ul>
<h2>3. Как мы используем данные</h2>
<ul>
<li>API-ключ используется исключительно для выполнения запросов к YouGile API от вашего имени.</li>
<li>Мы не анализируем, не продаём, не передаём ваши данные третьим лицам.</li>
<li>Мы не используем данные для рекламы, профилирования или аналитики.</li>
</ul>
<h2>4. Хранение и безопасность</h2>
<ul>
<li>Все данные хранятся только в оперативной памяти (RAM). Без базы данных, без постоянного хранилища.</li>
<li>Сессии автоматически очищаются каждые 5 минут. Access-токены живут 1 час, refresh-токены &mdash; 14 дней.</li>
<li>Все соединения зашифрованы через HTTPS/TLS.</li>
<li>Исходный код сервера <a href="https://github.com/nebelov/yougile-mcp">открыт</a> и доступен для аудита.</li>
</ul>
<h2>5. Сторонние сервисы</h2>
<ul>
<li><strong>YouGile API</strong> (yougile.com): API-ключ отправляется в YouGile для выполнения операций. Политика конфиденциальности YouGile применяется к данным, хранящимся в YouGile.</li>
<li><strong>ChatGPT / OpenAI:</strong> При использовании через ChatGPT, OpenAI обрабатывает ваши диалоги. Применяется политика конфиденциальности OpenAI.</li>
</ul>
<h2>6. Ваши права</h2>
<ul>
<li><strong>Отзыв доступа:</strong> удалите API-ключ в настройках YouGile в любое время.</li>
<li><strong>Удаление данных:</strong> данные хранятся только в RAM &mdash; перезапуск сервера или истечение токена удаляет всё автоматически. Также можете обратиться к нам.</li>
</ul>
<h2>7. Возрастные ограничения</h2>
<p>Сервис не предназначен для лиц младше 16 лет.</p>
<h2>8. Изменения</h2>
<p>Мы можем обновить эту политику. Изменения публикуются на этой странице.</p>
<h2>9. Контакты</h2>
<p>Вопросы: <a href="mailto:admin@0809.link">admin@0809.link</a></p>` : `
<h1>${i.privacyTitle}</h1>
<p><em>${i.privacyUpdated}</em> &middot; <a href="/privacy?lang=${other}">${T[other].langSwitch}</a></p>
<h2>1. Who We Are</h2>
<p>YouGile MCP ("the Service") is an independent open-source integration that connects YouGile project management to AI assistants like ChatGPT via the Model Context Protocol (MCP). It is <strong>not affiliated with or endorsed by YouGile</strong>.</p>
<p>Operator: Vitaliy Travin, Individual Entrepreneur. Tax ID: 553903539940. Registration: 324554300062429. Contact: <a href="mailto:admin@0809.link">admin@0809.link</a>.</p>
<h2>2. What Data We Collect</h2>
<p>We collect the <strong>minimum data necessary</strong> to provide the Service.</p>
<ul>
<li><strong>YouGile API Key:</strong> Stored in server memory only for session duration (max 1 hour, refreshable up to 14 days). Never written to disk, logs, or any database.</li>
<li><strong>YouGile Email &amp; Password:</strong> We <strong>never</strong> collect, read, store, or log your credentials. Authentication uses a zero-knowledge proxy: your browser sends credentials directly to YouGile's API through a transparent byte-level proxy.</li>
<li><strong>OAuth Tokens:</strong> Randomly generated tokens stored in memory for session maintenance. Deleted on expiration or server restart.</li>
<li><strong>Server Logs:</strong> May contain IP addresses, timestamps, and request paths. Never contain credentials, API keys, or YouGile data.</li>
</ul>
<h2>3. How We Use Your Data</h2>
<ul>
<li>Your API key is used solely to execute YouGile API requests on your behalf.</li>
<li>We do not analyze, sell, share, or transfer your data to any third parties.</li>
<li>We do not use your data for advertising, profiling, or analytics.</li>
</ul>
<h2>4. Data Storage &amp; Security</h2>
<ul>
<li>All data stored in volatile server memory (RAM) only. No database, no persistent storage.</li>
<li>Sessions cleaned every 5 minutes. Access tokens: 1 hour. Refresh tokens: 14 days.</li>
<li>All connections use HTTPS/TLS encryption.</li>
<li>Server source code is <a href="https://github.com/nebelov/yougile-mcp">open source</a>.</li>
</ul>
<h2>5. Third-Party Services</h2>
<ul>
<li><strong>YouGile API</strong> (yougile.com): Your API key is sent to YouGile for operations. YouGile's privacy policy applies.</li>
<li><strong>ChatGPT / OpenAI:</strong> OpenAI processes your conversations. OpenAI's privacy policy applies.</li>
</ul>
<h2>6. Your Rights</h2>
<ul>
<li><strong>Revoke access:</strong> Delete the API key in YouGile settings anytime.</li>
<li><strong>Data deletion:</strong> Data in RAM only &mdash; server restart or token expiration deletes everything. Contact us for immediate deletion.</li>
</ul>
<h2>7. Children</h2>
<p>Not intended for anyone under 16.</p>
<h2>8. Changes</h2>
<p>We may update this policy. Changes posted here with updated date.</p>
<h2>9. Contact</h2>
<p><a href="mailto:admin@0809.link">admin@0809.link</a></p>`;

  return `<!DOCTYPE html><html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(i.privacyTitle)} — YouGile MCP</title>
<style>${CSS}</style></head><body>
<div class="page">${body}</div>
${footer(lang)}
</body></html>`;
}

// --- Terms Page ---
function termsPage(lang: Lang): string {
  const i = t(lang);
  const other = lang === "ru" ? "en" : "ru";
  const body = lang === "ru" ? `
<h1>${i.termsTitle}</h1>
<p><em>${i.termsUpdated}</em> &middot; <a href="/terms?lang=${other}">${T[other].langSwitch}</a></p>
<h2>1. О Сервисе</h2>
<p>YouGile MCP (&laquo;Сервис&raquo;) &mdash; независимая open-source интеграция, позволяющая ИИ-ассистентам (ChatGPT и др.) взаимодействовать с вашим аккаунтом YouGile через протокол MCP.</p>
<p><strong>Важно:</strong> Сервис <strong>не связан, не одобрен и не имеет официального отношения к YouGile</strong> (yougile.com) или OpenAI. Это сторонний инструмент, созданный независимым разработчиком с использованием публичных API.</p>
<h2>2. Оператор</h2>
<p>ИП Травин Виталий Андреевич. ИНН: 553903539940. ОГРНИП: 324554300062429. Контакт: <a href="mailto:admin@0809.link">admin@0809.link</a>.</p>
<h2>3. Принятие условий</h2>
<p>Используя Сервис, вы соглашаетесь с настоящими Условиями. Если не согласны &mdash; не используйте Сервис.</p>
<h2>4. Описание Сервиса</h2>
<ul>
<li>Сервис предоставляет 57 инструментов для управления проектами, задачами, досками, колонками, пользователями, чатами и др. через ИИ-ассистентов.</li>
<li>Аутентификация выполняется через официальный API YouGile с использованием ваших учётных данных или API-ключа.</li>
<li>Используется прозрачный прокси: ваши данные отправляются напрямую в YouGile API и никогда не обрабатываются нашим сервером.</li>
</ul>
<h2>5. Ваш аккаунт и обязанности</h2>
<ul>
<li>Для использования Сервиса необходим действующий аккаунт YouGile.</li>
<li>Вы несёте ответственность за все действия, выполненные через Сервис.</li>
<li>Запрещено использовать Сервис для противоправных целей.</li>
<li>Вы обязаны обеспечивать безопасность своих учётных данных.</li>
</ul>
<h2>6. Стоимость</h2>
<p>Сервис предоставляется <strong>бесплатно</strong>. Оператор оставляет за собой право ввести платные функции с предварительным уведомлением.</p>
<h2>7. Ограничения и отказ от гарантий</h2>
<ul>
<li>Сервис предоставляется &laquo;как есть&raquo; без каких-либо гарантий.</li>
<li>Мы не гарантируем бесперебойную работу.</li>
<li>Мы не несём ответственности за потерю данных или несанкционированный доступ.</li>
<li>Мы не несём ответственности за действия ИИ-ассистентов. Всегда проверяйте действия перед подтверждением.</li>
<li>YouGile может изменить свой API, что может повлиять на работу Сервиса.</li>
</ul>
<h2>8. Интеллектуальная собственность</h2>
<p>Исходный код открыт под лицензией MIT. &laquo;YouGile&raquo; является товарным знаком соответствующего правообладателя.</p>
<h2>9. Прекращение использования</h2>
<p>Вы можете прекратить использование в любое время, удалив API-ключ в YouGile. Мы можем приостановить или прекратить работу Сервиса без уведомления.</p>
<h2>10. Ограничение ответственности</h2>
<p>В максимальной степени, допускаемой законом, оператор не несёт ответственности за косвенные, случайные или штрафные убытки.</p>
<h2>11. Применимое право</h2>
<p>Настоящие Условия регулируются применимым законодательством. Споры решаются путём переговоров, при необходимости &mdash; через арбитраж.</p>
<h2>12. Изменения</h2>
<p>Мы можем изменить Условия в любое время. Продолжение использования означает принятие изменений.</p>
<h2>13. Контакты</h2>
<p><a href="mailto:admin@0809.link">admin@0809.link</a></p>` : `
<h1>${i.termsTitle}</h1>
<p><em>${i.termsUpdated}</em> &middot; <a href="/terms?lang=${other}">${T[other].langSwitch}</a></p>
<h2>1. About the Service</h2>
<p>YouGile MCP ("the Service") is an independent, open-source integration that enables AI assistants (such as ChatGPT) to interact with your YouGile project management account via the Model Context Protocol (MCP).</p>
<p><strong>Important:</strong> This Service is <strong>not affiliated with, endorsed by, or officially connected to YouGile</strong> (yougile.com) or OpenAI.</p>
<h2>2. Operator</h2>
<p>Vitaliy Travin, Individual Entrepreneur. Tax ID: 553903539940. Registration: 324554300062429. Contact: <a href="mailto:admin@0809.link">admin@0809.link</a>.</p>
<h2>3. Acceptance of Terms</h2>
<p>By using the Service, you agree to these Terms. If you do not agree, do not use the Service.</p>
<h2>4. Description of Service</h2>
<ul>
<li>57 tools for managing YouGile projects, tasks, boards, columns, users, chats, and more via AI assistants.</li>
<li>Authentication via YouGile's official API using your credentials or API key.</li>
<li>Zero-knowledge proxy: credentials are sent directly to YouGile's API and never stored by our server.</li>
</ul>
<h2>5. Your Account &amp; Responsibilities</h2>
<ul>
<li>Valid YouGile account required.</li>
<li>You are responsible for all actions performed through the Service.</li>
<li>Do not use the Service for unlawful purposes.</li>
<li>Maintain the security of your credentials.</li>
</ul>
<h2>6. Pricing</h2>
<p>The Service is provided <strong>free of charge</strong>. Paid features may be introduced with advance notice.</p>
<h2>7. Limitations &amp; Disclaimers</h2>
<ul>
<li>Provided "as is" without warranties.</li>
<li>No guarantee of uninterrupted service.</li>
<li>Not responsible for data loss or unauthorized access.</li>
<li>Not responsible for AI assistant actions. Always review before confirming.</li>
<li>YouGile may change their API, affecting the Service.</li>
</ul>
<h2>8. Intellectual Property</h2>
<p>Source code is open source under MIT License. "YouGile" is a trademark of its respective owner.</p>
<h2>9. Termination</h2>
<p>Revoke access by deleting the API key in YouGile. We may suspend the Service at any time.</p>
<h2>10. Limitation of Liability</h2>
<p>To the maximum extent permitted by law, the operator is not liable for indirect, incidental, or punitive damages.</p>
<h2>11. Governing Law</h2>
<p>Governed by applicable international law. Disputes resolved through negotiation, then arbitration if necessary.</p>
<h2>12. Changes</h2>
<p>We may modify these Terms. Continued use constitutes acceptance.</p>
<h2>13. Contact</h2>
<p><a href="mailto:admin@0809.link">admin@0809.link</a></p>`;

  return `<!DOCTYPE html><html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(i.termsTitle)} — YouGile MCP</title>
<style>${CSS}</style></head><body>
<div class="page">${body}</div>
${footer(lang)}
</body></html>`;
}

// --- Cleanup expired tokens (every 5 min) ---
function cleanup() {
  const now = Date.now();
  for (const [k, v] of authCodes) if (now > v.expiresAt) authCodes.delete(k);
  for (const [k, v] of accessTokens) if (now > v.expiresAt) accessTokens.delete(k);
  for (const [k, v] of refreshTokens) if (now > v.expiresAt) refreshTokens.delete(k);
}

// --- Main ---
export async function startOAuthServer() {
  setInterval(cleanup, 5 * 60 * 1000);

  // Per-request MCP handler: SDK requires new transport per stateless request
  async function handleMcpRequest(req: IncomingMessage, res: ServerResponse, apiKey: string) {
    const server = new McpServer({ name: "yougile-mcp", version: "1.0.0" });
    registerAllTools(server);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    try {
      await apiKeyStore.run(apiKey, () => transport.handleRequest(req, res));
    } finally {
      await transport.close();
      await server.close();
    }
  }

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "/", BASE_URL);
    const path = url.pathname;
    const method = req.method || "GET";
    const lang = getLang(url, req);

    // Request logging
    console.error(`${method} ${path} [${req.headers["user-agent"]?.slice(0, 50) || "no-ua"}]`);

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
    if (method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    try {
      // ---- Transparent proxy (credentials NEVER enter JS) ----
      if (path === "/proxy/auth/companies" && method === "POST") return proxyToYougile("/auth/companies", req, res);
      if (path === "/proxy/auth/keys" && method === "POST") return proxyToYougile("/auth/keys", req, res);

      // ---- Well-known ----
      if (path === "/.well-known/oauth-protected-resource") {
        return json(res, 200, { resource: BASE_URL, authorization_servers: [BASE_URL], scopes_supported: ["yougile"], resource_documentation: "https://yougile.com/api-docs" });
      }
      if (path === "/.well-known/oauth-authorization-server") {
        return json(res, 200, {
          issuer: BASE_URL, authorization_endpoint: `${BASE_URL}/authorize`, token_endpoint: `${BASE_URL}/token`,
          registration_endpoint: `${BASE_URL}/register`, response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"], code_challenge_methods_supported: ["S256"],
          scopes_supported: ["yougile"], token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
        });
      }
      if (path === "/.well-known/openai-apps-challenge") {
        res.writeHead(OPENAI_TOKEN ? 200 : 404, { "Content-Type": "text/plain" });
        return res.end(OPENAI_TOKEN || "Not configured");
      }

      // ---- DCR ----
      if (path === "/register" && method === "POST") {
        const body = JSON.parse(await readBody(req));
        const cid = randomBytes(16).toString("hex");
        clients.set(cid, { redirectUris: body.redirect_uris || [], name: body.client_name || "Unknown" });
        return json(res, 201, {
          client_id: cid, client_id_issued_at: Math.floor(Date.now() / 1000),
          redirect_uris: body.redirect_uris || [], client_name: body.client_name || "Unknown",
          grant_types: ["authorization_code", "refresh_token"], token_endpoint_auth_method: "none",
        });
      }

      // ---- Authorize ----
      if (path === "/authorize" && method === "GET") {
        const q = url.searchParams;
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(loginPage(q.get("client_id") || "", q.get("redirect_uri") || "", q.get("state") || "", q.get("code_challenge") || "", q.get("scope") || "yougile", lang));
      }
      if (path === "/authorize" && method === "POST") {
        const f = parseForm(await readBody(req));
        if (!f.api_key) return json(res, 400, { error: "missing api_key" });
        const code = genToken();
        authCodes.set(code, { clientId: f.client_id, redirectUri: f.redirect_uri, codeChallenge: f.code_challenge, apiKey: f.api_key, scope: f.scope || "yougile", expiresAt: Date.now() + 10 * 60 * 1000 });
        res.writeHead(302, { Location: `${f.redirect_uri}?code=${code}&state=${f.state}` });
        return res.end();
      }

      // ---- Token ----
      if (path === "/token" && method === "POST") {
        const f = parseForm(await readBody(req));
        if (f.grant_type === "authorization_code") {
          const cd = authCodes.get(f.code);
          if (!cd || Date.now() > cd.expiresAt) { authCodes.delete(f.code); return json(res, 400, { error: "invalid_grant" }); }
          if (cd.codeChallenge && f.code_verifier && !verifyPKCE(f.code_verifier, cd.codeChallenge)) return json(res, 400, { error: "invalid_grant", error_description: "PKCE failed" });
          const at = genToken(), rt = genToken();
          accessTokens.set(at, { apiKey: cd.apiKey, expiresAt: Date.now() + 3600_000 });
          refreshTokens.set(rt, { apiKey: cd.apiKey, clientId: cd.clientId, expiresAt: Date.now() + 14 * 86400_000 });
          authCodes.delete(f.code);
          return json(res, 200, { access_token: at, token_type: "Bearer", expires_in: 3600, refresh_token: rt, scope: cd.scope });
        }
        if (f.grant_type === "refresh_token") {
          const rd = refreshTokens.get(f.refresh_token);
          if (!rd || Date.now() > rd.expiresAt) { refreshTokens.delete(f.refresh_token); return json(res, 400, { error: "invalid_grant" }); }
          const at = genToken(), rt = genToken();
          accessTokens.set(at, { apiKey: rd.apiKey, expiresAt: Date.now() + 3600_000 });
          refreshTokens.set(rt, { apiKey: rd.apiKey, clientId: rd.clientId, expiresAt: Date.now() + 14 * 86400_000 });
          refreshTokens.delete(f.refresh_token);
          return json(res, 200, { access_token: at, token_type: "Bearer", expires_in: 3600, refresh_token: rt, scope: "yougile" });
        }
        return json(res, 400, { error: "unsupported_grant_type" });
      }

      // ---- MCP ----
      if (path === "/mcp" || path.startsWith("/mcp?")) {
        const authH = req.headers.authorization;
        if (!authH?.startsWith("Bearer ")) {
          res.writeHead(401, { "Content-Type": "application/json", "WWW-Authenticate": `Bearer resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource"` });
          return res.end(JSON.stringify({ error: "unauthorized" }));
        }
        const td = accessTokens.get(authH.slice(7));
        if (!td || Date.now() > td.expiresAt) {
          accessTokens.delete(authH.slice(7));
          res.writeHead(401, { "Content-Type": "application/json", "WWW-Authenticate": `Bearer error="invalid_token"` });
          return res.end(JSON.stringify({ error: "invalid_token" }));
        }
        console.error(`  MCP auth OK, tools: 57`);
        return await handleMcpRequest(req, res, td.apiKey);
      }

      // ---- Health ----
      if (path === "/health") return json(res, 200, { status: "ok", tools: 57, clients: clients.size, sessions: accessTokens.size });

      // ---- Legal ----
      if (path === "/privacy") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(privacyPage(lang)); }
      if (path === "/terms") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(termsPage(lang)); }

      // ---- Root ----
      if (path === "/") {
        const i = t(lang);
        const other = lang === "ru" ? "en" : "ru";
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(i.rootTitle)}</title>
<style>${CSS}
.hero{text-align:center;padding:60px 24px 40px;position:relative}
.hero h1{font-size:32px;margin-bottom:12px}
.hero p{font-size:16px;color:#666;margin-bottom:8px}
.hero code{background:#f0f0f0;padding:4px 8px;border-radius:6px;font-size:14px}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;max-width:720px;margin:0 auto;padding:0 24px}
.feat{background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.feat h3{font-size:15px;margin-bottom:6px;color:#1a1a1a}
.feat p{font-size:13px;color:#666;margin:0}
.note{max-width:720px;margin:32px auto;padding:0 24px;text-align:center;font-size:13px;color:#888}
</style></head><body>
<div class="hero">
<a class="lang-sw" href="/?lang=${other}">${T[other].langSwitch}</a>
<h1>${i.rootH1}</h1>
<p>${i.rootSub}</p>
<p style="margin-top:16px">MCP URL: <code>${esc(BASE_URL)}/mcp</code></p>
</div>
<div class="features">
<div class="feat"><h3>${i.rootFeat1t}</h3><p>${i.rootFeat1d}</p></div>
<div class="feat"><h3>${i.rootFeat2t}</h3><p>${i.rootFeat2d}</p></div>
<div class="feat"><h3>${i.rootFeat3t}</h3><p>${i.rootFeat3d}</p></div>
<div class="feat"><h3>${i.rootFeat4t}</h3><p>${i.rootFeat4d}</p></div>
</div>
<div class="note">
<p>${i.rootNote}</p>
<p style="margin-top:8px">
<a href="https://github.com/nebelov/yougile-mcp">GitHub</a> &middot;
<a href="https://www.npmjs.com/package/@nebelov/yougile-mcp">npm</a> &middot;
<a href="/privacy${lang === "en" ? "?lang=en" : ""}">Privacy</a> &middot;
<a href="/terms${lang === "en" ? "?lang=en" : ""}">Terms</a>
</p></div>
${footer(lang)}
</body></html>`);
      }

      json(res, 404, { error: "Not found" });
    } catch (e: unknown) {
      console.error("Server error:", e);
      json(res, 500, { error: "Internal server error" });
    }
  });

  httpServer.listen(PORT, () => {
    console.error(`YouGile MCP OAuth Server on port ${PORT}`);
    console.error(`  MCP:    ${BASE_URL}/mcp`);
    console.error(`  OAuth:  ${BASE_URL}/authorize`);
    console.error(`  Health: ${BASE_URL}/health`);
  });
}
