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
test('print downloads have no preview and choose location when supported',()=>{
 assert.ok(!page.includes('PrintPreview'));
 assert.ok(!page.includes('<iframe'));
 assert.equal((page.match(/onClick=\{\(\)=>preparePrintSave\(/g)||[]).length,2);
 assert.ok(page.includes('showSaveFilePicker({suggestedName:file.name})'));
 assert.ok(page.includes('r.body.pipeTo(writable)'));
 assert.ok(page.includes('e.name==="AbortError"'));
});
