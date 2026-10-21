import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalize,filterJobs,safeUrl} from '../src/jobs.mjs';
import {search,createServer} from '../server.mjs';
test('normalizes jobs, strips markup, rejects unsafe links and deduplicates',()=>{
const j={id:1,title:'AI developer',company_name:'Example',url:'https://example.com/job',description:'<b>Python</b> role'};
const rows=normalize({jobs:[j,j,{...j,id:2,url:'javascript:alert(1)'}]},'remotive');assert.equal(rows.length,1);assert.equal(rows[0].description,'Python role');assert.equal(safeUrl('data:text/html,hello'),'');assert.equal(filterJobs(rows,{query:'ai python'}).length,1);assert.equal(filterJobs(rows,{query:'security'}).length,0);
});
test('Canadian search requires server secrets',async()=>{await assert.rejects(search(new URLSearchParams('source=adzuna'),{}),/ADZUNA/);});
test('remote adapter normalizes and caches the provider feed across searches',async()=>{
 let calls=0;const request=async()=>{calls++;return {ok:true,json:async()=>({jobs:[{id:3,title:'Support analyst',url:'https://example.com/3',company_name:'Example'}]})};};
 const first=await search(new URLSearchParams('q=support'),{},request);assert.equal(first.jobs.length,1);const second=await search(new URLSearchParams('q=zzzz'),{},request);assert.equal(second.jobs.length,0);assert.equal(calls,1);
});
test('server serves assets, refuses private files and invalid methods',async()=>{
const server=createServer();
const request=(url,method='GET')=>new Promise(resolve=>{const headers={};const res={statusCode:200,setHeader(k,v){headers[k]=v;},writeHead(code){this.statusCode=code;},end(body){resolve({status:this.statusCode,body:String(body||''),headers});}};server.emit('request',{url,method},res);});
const res=await request('/');assert.equal(res.status,200);assert.match(res.body,/Job Scout/);assert.equal((await request('/.env')).status,404);assert.equal((await request('/','POST')).status,405);assert.match(res.headers['Content-Security-Policy'],/frame-ancestors 'none'/);
});
