import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('comparison presents the quality bar and anonymous proposals before settings', async () => {
  const slides = (await read('presentation/slides.md')).split(/^---\s*$/m);
  const proposals = slides.find(slide => slide.includes('成果物 A') && slide.includes('成果物 B'));
  assert.ok(proposals, 'show anonymous proposals together');
  assert.match(proposals, /品質条件[\s\S]*初期表示[\s\S]*図の文字/);
  assert.ok(proposals.indexOf('品質条件') < proposals.indexOf('成果物 A'));
  assert.doesNotMatch(proposals, /High|Max|credits/i);
  const reveal = slides.findIndex(slide => /34\.426/.test(slide) && /30\.113/.test(slide));
  assert.ok(reveal > slides.indexOf(proposals), 'reveal settings and credits after the proposals');
  assert.match(slides[reveal], /Max[\s\S]*図の文字/);
});

test('comparison states limitations and a one-variable next experiment', async () => {
  for (const path of ['presentation/slides.md', 'presentation/script.md']) {
    const text = await read(path);
    assert.match(text, /各1試行/);
    assert.match(text, /テスト案/);
    assert.match(text, /請求額/);
    assert.match(text, /同じIssue[\s\S]*プロンプト[\s\S]*effort[\s\S]*一つずつ/);
  }
});
