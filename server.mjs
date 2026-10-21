import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {normalize, filterJobs} from './src/jobs.mjs';
const cache = new Map();
export async function search(params, env=process.env, request=fetch) {
  const source=params.get('source') || 'remotive';
  if (!['remotive','adzuna'].includes(source)) throw new Error('Unknown job source.');
  const query=(params.get('q')||'').slice(0,100);
  const location=(params.get('location')||'Vancouver').slice(0,100);
  const key=JSON.stringify([source,query,location]);
  if(cache.has(key) && cache.get(key).expires>Date.now()) return cache.get(key).data;
  let url;
  if(source==='adzuna') {
    if(!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) throw new Error('Canadian search needs ADZUNA_APP_ID and ADZUNA_APP_KEY in your server .env file. Remote search works without keys.');
    url=new URL('https://api.adzuna.com/v1/api/jobs/ca/search/1');
    url.search=new URLSearchParams({app_id:env.ADZUNA_APP_ID,app_key:env.ADZUNA_APP_KEY,what:query,where:location,results_per_page:'50',sort_by:'date',distance:'35'});
  } else url=new URL('https://remotive.com/api/remote-jobs');
  // Fetch Remotive once per hour; filter its cached response locally.
  const feedKey=source==='remotive'?'remotive-feed':key;
  let raw=cache.get(feedKey);
  if(!raw || raw.expires<Date.now()) {
    const response=await request(url,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
    if(!response.ok) throw new Error('The job provider is unavailable. Please try again later.');
    raw={data:await response.json(),expires:Date.now()+3600000};
    if(cache.size>100) cache.clear();
    cache.set(feedKey,raw);
  }
  const jobs=filterJobs(normalize(raw.data,source),{query:source==='remotive'?query:''});
  const data={jobs,source,notice:source==='remotive'?'Remote jobs from Remotive. Listings are delayed by 24 hours. Location labels describe employer restrictions; verify Canadian eligibility.':'Canadian jobs from Adzuna, within 35 km of your chosen location. Results are limited to the latest 50 matches.',fetchedAt:new Date().toISOString()};
  cache.set(key,{data,expires:raw.expires});
  return data;
}
export function createServer(){return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'");
  const url=new URL(req.url,'http://localhost');
  if(req.method!=='GET'){res.writeHead(405);return res.end();}
  if(url.pathname==='/api/jobs'){
    res.setHeader('Content-Type','application/json');
    try {res.end(JSON.stringify(await search(url.searchParams)));}
    catch {res.statusCode=502;res.end(JSON.stringify({error: url.searchParams.get('source')==='adzuna' && (!process.env.ADZUNA_APP_ID||!process.env.ADZUNA_APP_KEY)?'Canadian search requires Adzuna keys in the server .env file. Choose Remote jobs for key-free search.':'Job search could not connect. Please try again later.'}));}
    return;
  }
  const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
  if(!files[url.pathname]){res.writeHead(404);return res.end('Not found');}
  res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html');
  try{res.end(await readFile(new URL('./public/'+files[url.pathname],import.meta.url)));}catch{res.writeHead(500);res.end('Unable to load app');}
});}
if(process.argv[1]===fileURLToPath(import.meta.url)) createServer().listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log('Job Scout: http://localhost:3000'));
