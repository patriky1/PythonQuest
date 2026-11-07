/**
 * Gera docs/privacy-policy.html (GitHub Pages) a partir de
 * src/constants/privacyPolicy.ts, para a página pública e a tela do app terem
 * sempre o mesmo texto.
 *
 * uso: npm run privacy:build
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_UPDATED_AT
} from '../src/constants/privacyPolicy.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = resolve(root, 'docs', 'privacy-policy.html');

const escape = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Transforma o e-mail de contato em link clicável.
const withLinks = (text: string) =>
  escape(text).replaceAll(
    PRIVACY_CONTACT_EMAIL,
    `<a href="mailto:${PRIVACY_CONTACT_EMAIL}">${PRIVACY_CONTACT_EMAIL}</a>`
  );

const sections = PRIVACY_POLICY_SECTIONS.map((section) => {
  const blocks = section.blocks
    .map((block) =>
      block.type === 'paragraph'
        ? `      <p>${withLinks(block.text)}</p>`
        : `      <ul>\n${block.items.map((item) => `        <li>${withLinks(item)}</li>`).join('\n')}\n      </ul>`
    )
    .join('\n');

  return `    <section>\n      <h2>${escape(section.title)}</h2>\n${blocks}\n    </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Política de Privacidade — PythonQuest</title>
  <meta name="description" content="Política de Privacidade do aplicativo PythonQuest.">
  <style>
    :root { --bg: #F5F7FB; --card: #FFFFFF; --text: #0F172A; --muted: #475569; --accent: #15803D; --link: #1D4ED8; --border: #E2E8F0; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #0F172A; --card: #1E293B; --text: #F1F5F9; --muted: #CBD5E1; --accent: #86EFAC; --link: #93C5FD; --border: #334155; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.65 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
    article { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 28px 24px; }
    h1 { margin: 0 0 4px; font-size: 28px; line-height: 1.2; }
    h2 { margin: 28px 0 8px; font-size: 19px; color: var(--accent); }
    p, li { color: var(--muted); }
    ul { padding-left: 22px; }
    li { margin: 6px 0; }
    a { color: var(--link); font-weight: 600; }
    .updated { font-size: 14px; margin: 0 0 16px; }
  </style>
</head>
<body>
  <main>
    <article>
    <h1>Política de Privacidade — PythonQuest</h1>
    <p class="updated">Última atualização: ${escape(PRIVACY_POLICY_UPDATED_AT)}</p>
    <p>${withLinks(PRIVACY_POLICY_INTRO)}</p>
${sections}
    </article>
  </main>
</body>
</html>
`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html, 'utf8');
console.log(`Gerado: ${outFile}`);
