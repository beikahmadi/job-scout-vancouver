const $=id=>document.getElementById(id);
let jobs=[],view='all',requestId=0;
let saved;
try{saved=JSON.parse(localStorage.getItem('jobscout-v1')||'{}');if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};}catch{saved={};}
function persist(){try{localStorage.setItem('jobscout-v1',JSON.stringify(saved));}catch{$('status').textContent='Browser storage is unavailable. Your shortlist will last only for this visit.';}}
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function render(){
  $('saved-count').textContent=Object.keys(saved).length;
  $('all').setAttribute('aria-pressed',view==='all');$('saved').setAttribute('aria-pressed',view==='saved');
  $('heading').textContent=view==='all'?'Opportunities for you':'Your next moves';
  const days=Number($('days').value);
  const list=(view==='saved'?Object.values(saved).map(x=>x.job).filter(Boolean):jobs).filter(j=>!days||Date.parse(j.date)>=Date.now()-days*86400000);
  $('count').textContent=list.length+' jobs';$('results').replaceChildren();
  if(!list.length && !$('status').textContent)$('status').textContent=view==='saved'?'Save a promising job to start your shortlist.':'No matches. Try a broader search or another date filter.';
  for(const j of list){
    const card=el('article',undefined,'card'),top=el('div',undefined,'top');top.append(el('span',(j.company||'?').slice(0,1),'monogram'),el('span',j.company,'company'));
    const save=el('button',saved[j.id]?'Saved ✓':'Save +','save');save.setAttribute('aria-label',(saved[j.id]?'Remove saved job: ':'Save job: ')+j.title);save.onclick=()=>{if(saved[j.id])delete saved[j.id];else saved[j.id]={job:j,status:'Saved'};persist();$('status').textContent='';render();};top.append(save);
    card.append(top,el('h3',j.title),el('div',j.location,'meta'),el('div',j.salary,'salary'),el('p',j.description,'summary'));
    if(saved[j.id]){const row=el('label',undefined,'tracking');row.append(el('span','Application status'));const select=el('select');for(const s of ['Saved','Applied','Interview','Offer','Closed']){const o=el('option',s);o.value=s;select.append(o);}select.value=saved[j.id].status;select.onchange=()=>{saved[j.id].status=select.value;persist();};row.append(select);card.append(row);}
    const bottom=el('div',undefined,'card-bottom');const d=new Date(j.date);bottom.append(el('span','Source: '+(j.source==='adzuna'?'Adzuna':'Remotive')+' · '+(isNaN(d)?'Date unavailable':d.toLocaleDateString())));
    const url=safeUrl(j.url);if(url){const a=el('a','View posting ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';bottom.append(a);}card.append(bottom);$('results').append(card);
  }
}
async function search(event){event?.preventDefault();view='all';const id=++requestId;$('search-button').disabled=true;$('status').textContent='Looking for your next opportunity…';$('notice').textContent='';jobs=[];render();try{
  const p=new URLSearchParams({q:$('query').value,source:$('source').value,location:$('location').value});
  const response=await fetch('/api/jobs?'+p);const data=await response.json();if(id!==requestId)return;if(!response.ok)throw new Error(data.error||'Search failed.');jobs=data.jobs;$('notice').textContent=data.notice;$('status').textContent='';render();
}catch(e){if(id===requestId){$('status').textContent=e.message;render();}}finally{if(id===requestId)$('search-button').disabled=false;}}
$('search').onsubmit=search;$('source').onchange=()=>{$('location-field').hidden=$('source').value!=='adzuna';};
for(const button of document.querySelectorAll('[data-query]'))button.onclick=()=>{$('query').value=button.dataset.query;search();};
$('all').onclick=()=>{view='all';$('status').textContent='';render();};$('saved').onclick=()=>{view='saved';$('status').textContent='';render();};$('days').onchange=()=>{$('status').textContent='';render();};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),shortlist:Object.values(saved)},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='job-scout-shortlist.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render();search();
