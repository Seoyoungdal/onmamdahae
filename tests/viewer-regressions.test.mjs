import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
test('viewer does not invoke Home-scoped image normalizer',()=>{
 const viewer=page.split('function ScoreViewer(')[1].split('async function mergePersonalDrawing')[0];
 assert.ok(!viewer.includes('normalizeImageBlob('));
 assert.ok(viewer.includes('setSrc(items[index]?.url'));
});
test('mobile playlist explicitly overrides hidden outline controls',()=>assert.match(css,/\.detail-actions \.playlist-link\{display:inline-flex!important/));
test('both print sections open closable in-app preview',()=>{
 assert.equal((page.match(/onClick=\{\(\)=>setPrintPreview\(`/g)||[]).length,2);
 assert.ok(page.includes('← 콘티로 돌아가기'));
 assert.ok(page.includes('preview=1'));
});
