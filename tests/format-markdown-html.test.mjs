import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMarkdownHtml } from '../scripts/format-markdown-html.mjs';

test('formats embedded HTML while preserving Marp directives and fenced code', async () => {
  const input = '<!-- _class: deck -->\n\n<div><p>One</p><p>Two</p></div>\n\n```html\n<div><b>untouched</b></div>\n```\n';
  const output = await formatMarkdownHtml(input);
  assert.match(output, /<div>\n  <p>One<\/p>\n  <p>Two<\/p>\n<\/div>/);
  assert.ok(output.includes('<!-- _class: deck -->'));
  assert.ok(output.includes('```html\n<div><b>untouched</b></div>\n```'));
  assert.equal(await formatMarkdownHtml(output), output);
});

test('preserves CRLF and leaves inline HTML alone', async () => {
  const input = '# Title<br>Subtitle\r\n\r\n<div><p>Text</p></div>\r\n';
  const output = await formatMarkdownHtml(input);
  assert.ok(output.startsWith('# Title<br>Subtitle\r\n'));
  assert.doesNotMatch(output, /(?<!\r)\n/);
});
