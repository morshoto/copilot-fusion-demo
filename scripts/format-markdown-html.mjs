import { readFile, writeFile } from 'node:fs/promises';
import MarkdownIt from 'markdown-it';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';

// Parse Markdown first so fenced code and inline HTML are never treated as blocks.
const markdown = new MarkdownIt({ html: true });

export async function formatMarkdownHtml(input) {
  const newline = input.includes('\r\n') ? '\r\n' : '\n';
  const normalized = input.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const blocks = markdown.parse(normalized, {}).filter(token =>
    token.type === 'html_block' && token.map && !token.content.trimStart().startsWith('<!--'),
  );

  // Replace from the end so earlier token line numbers remain valid.
  for (const block of blocks.reverse()) {
    const [start, end] = block.map;
    const source = lines.slice(start, end).join('\n');
    const formatted = (await format(source, { parser: 'html', printWidth: 100 })).replace(/\n$/, '');
    lines.splice(start, end - start, ...formatted.split('\n'));
  }
  return lines.join(newline);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const path = process.argv[2];
  if (!path || !/\.md$/i.test(path)) throw new Error('Pass a Markdown file path.');
  const original = await readFile(path, 'utf8');
  const formatted = await formatMarkdownHtml(original);
  if (formatted !== original) await writeFile(path, formatted, 'utf8');
}
