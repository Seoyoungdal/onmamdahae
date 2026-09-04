import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
const config=readFileSync(new URL('../next.config.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
test('score images are reduced below the request-body safety threshold',()=>{
 assert.ok(page.includes('const target=850*1024'));
 assert.ok(page.includes('blob.size>950*1024'));
 assert.ok(config.includes('bodySizeLimit: "20mb"'));
});
test('batch upload continues after third image fails and uses one request at a time',async()=>{
 const source=page.slice(page.indexOf(' async function uploadScores('),page.indexOf(' async function',page.indexOf(' async function uploadScores(')+2));
 const js=ts.transpile(source,{target:ts.ScriptTarget.ES2022});
 let songs=[],errors=[],active=0,maxActive=0;
 const factory=new Function('selected','uploadBusy','setUploadErrors','setDownloading','fitForTablet','fetch','setSongs','flash',js+';return uploadScores;');
 const upload=factory({id:13},{current:false},e=>errors=e,()=>{},async file=>{if(file.name==='3.png')throw new Error('bad image');return file},async(_url,{body})=>{active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,2));active--;return Response.json({id:Number(body.get('title')),service_id:13,title:body.get('title'),version:1})},fn=>songs=fn(songs),()=>{});
 const files=[1,2,3,4,5].map(n=>new File(['image'],`${n}.png`,{type:'image/png'}));
 const failed=await upload(files);
 assert.equal(songs.length,4);assert.equal(maxActive,1);assert.deepEqual(failed,[files[2]]);assert.match(errors[0],/3.png: bad image/);
});
test('sharing encodes service and bootstrap opens the matching service',()=>{
 assert.ok(page.includes('url.searchParams.set("service",String(selected.id))'));
 assert.ok(page.includes('searchParams.get("service")'));
 assert.ok(page.includes('setSelected(shared)'));
 assert.ok(page.includes('const failed=await onSave(files)'));
});
test('multiple singers can be entered and rendered together',()=>{
 assert.ok(page.includes('싱어 이름 (여러 명은 쉼표 또는 줄바꿈으로 구분)'));
 assert.ok(page.includes('name.split(/[,\\n]/)'));
 assert.ok(page.includes('source.filter(a=>a.part===part).map(a=>a.name)'));
 assert.ok(page.includes('names.join(", ")'));
});
test('whole-score labels and action button dimensions match',()=>{
 assert.ok(page.includes('>전체 악보</b>'));
 assert.ok(page.includes('>전체 악보 원본 업로드</button>'));
 assert.ok(page.includes('>전체 악보 다운로드</button>'));
 assert.ok(css.includes('.print-actions>button,.print-actions>a'));
 assert.ok(css.includes('height:46px'));
 assert.ok(css.includes('font-size:12px!important'));
});
