export function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function normalize(data,source){
  const seen=new Set();
  return (source==='adzuna'?data.results||[]:data.jobs||[]).map(j=>({
    id:source+':'+j.id,title:String(j.title||'Untitled role'),
    company:String(source==='adzuna'?j.company?.display_name||'Company not listed':j.company_name||'Company not listed'),
    location:String(source==='adzuna'?j.location?.display_name||'Canada':j.candidate_required_location||'Location not specified'),
    date:source==='adzuna'?j.created:j.publication_date,
    salary:source==='adzuna'?(j.salary_min?`CAD ${Math.round(j.salary_min).toLocaleString('en-CA')}+ / year${String(j.salary_is_predicted)==='1'?' (estimated)':''}`:'Salary not listed'):j.salary||'Salary not listed',
    description:String(j.description||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,500),
    url:safeUrl(source==='adzuna'?j.redirect_url:j.url),source
  })).filter(j=>j.url && !seen.has(j.id) && seen.add(j.id));
}
export function filterJobs(jobs,{query='',days=0}={}){const words=query.toLowerCase().split(/\s+/).filter(Boolean);return jobs.filter(j=>words.every(w=>(j.title+' '+j.company+' '+j.description).toLowerCase().includes(w))&&(!days||Date.parse(j.date)>=Date.now()-days*86400000));}
