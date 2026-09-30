import {appendFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const origin='https://eskisehir-masasi.ozgurarc.chatgpt.site';
const token=process.env.CMS_SERVICE_TOKEN;
const output=async(k,v)=>{if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`${k}=${v}\n`)};
async function request(path,options={}){const r=await fetch(origin+path,{...options,redirect:'error',signal:AbortSignal.timeout(30000),headers:{'OAI-Sites-Authorization':`Bearer ${token}`,...options.headers}});if(!r.ok)throw Error(`CMS response ${r.status}`);return r}
if(process.argv[2]==='ack'){
 if(!token||!process.env.CMS_RELEASE_ID)throw Error('Publisher configuration missing');
 await request('/api/publisher/ack',{method:'POST',headers:{'Content-Type':'application/json','X-CMS-Publisher':'github-actions'},body:JSON.stringify({id:process.env.CMS_RELEASE_ID,status:process.env.CMS_PUBLISH_STATUS,runUrl:`https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,message:process.env.CMS_PUBLISH_STATUS==='published'?'GitHub Pages yayını tamamlandı.':'Yayın tamamlanamadı. Ayrıntılar için GitHub işlem kaydını açın.'})});
}else{
 if(!token){console.log('CMS connection not configured; source build only.');await output('changed',process.env.GITHUB_EVENT_NAME==='schedule'?'false':'true');process.exit(0)}
 const r=await request('/api/publisher/latest');if(!r.headers.get('content-type')?.includes('application/json'))throw Error('CMS did not return JSON');const {release}=await r.json();
 if(!release){await output('changed',process.env.GITHUB_EVENT_NAME==='schedule'?'false':'true');process.exit(0)}
 const rebuild=process.env.GITHUB_EVENT_NAME!=='schedule'||release.status==='queued';
 if(!rebuild){await output('changed','false');process.exit(0)}
 const s=release.snapshot;if(!Array.isArray(s.articles)||!Array.isArray(s.categories)||!s.settings||!s.pages)throw Error('Invalid content snapshot');
 await output('release_id',release.id);
 for(const [name,data] of Object.entries({articles:s.articles,categories:s.categories,pages:s.pages,settings:s.settings,live:s.live,videos:s.videos}))await writeFile(resolve('data',name+'.json'),JSON.stringify(data,null,2));
 await mkdir('public/uploads',{recursive:true});
 for(const id of release.media){if(!/^[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(id))throw Error('Invalid media key');const file=await request('/api/publisher/media?release='+encodeURIComponent(release.id)+'&id='+encodeURIComponent(id));const bytes=new Uint8Array(await file.arrayBuffer());if(bytes.length>8*1024*1024)throw Error('Media exceeds limit');await writeFile(resolve('public/uploads',id),bytes)}
 await output('changed','true');console.log(`Imported ${s.articles.length} published articles; release ${release.id}`);
}
