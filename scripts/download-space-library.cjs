'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const selected=JSON.parse(fs.readFileSync('tmp/nasa-library-selected.json'));
const prior=fs.existsSync('tmp/nasa-library-downloads.json')?JSON.parse(fs.readFileSync('tmp/nasa-library-downloads.json')):[];
const results=[];let next=0,done=0;
async function get(url){if(!new URL(url).hostname.endsWith('nasa.gov'))throw Error('Non NASA host');const r=await fetch(url,{signal:AbortSignal.timeout(35000)});if(!r.ok)throw Error('HTTP '+r.status);return r;}
async function download(x){const raw='tmp/nasa-originals/'+x.id+(x.id==='blackhole'?'.jpg':'.png');const cached=prior.find(y=>y.id===x.id&&!y.error);
 if(x.existing)return {...x,raw};if(cached&&fs.existsSync(raw))return {...cached,...x,sourceImage:cached.sourceImage,raw,sourceSha256:cached.sourceSha256};
 let source=x.sourceImage;
 if(x.nasaId){source=source.replace(/~(?:thumb|small|orig)\.[^.]+$/,'~medium.jpg');}
 let err;
 for(let tries=0;tries<3;tries++)try{const response=await get(source);if(!response.headers.get('content-type')?.startsWith('image/'))throw Error('Not an image');const buf=Buffer.from(await response.arrayBuffer());if(buf.length<1500)throw Error('Too small');if(buf.length>18000000)throw Error('Image is too large');fs.writeFileSync(raw,buf);return {...x,sourceImage:source,raw,sourceSha256:crypto.createHash('sha256').update(buf).digest('hex')};}catch(e){err=e;if(tries===0&&x.nasaId){try{const manifest=await(await get('https://images-api.nasa.gov/asset/'+encodeURIComponent(x.nasaId))).json();const assets=manifest.collection.items.map(z=>z.href);source=assets.find(h=>/~medium\.jpg$/.test(h))||assets.find(h=>/~large\.jpg$/.test(h))||x.sourceImage;}catch{source=x.sourceImage;}}}
 return {...x,error:err.message};
}
(async()=>{await Promise.all(Array.from({length:9},async()=>{while(next<selected.length){const x=selected[next++];try{results.push(await download(x));}catch(e){results.push({...x,error:e.message});}if(++done%40===0){fs.writeFileSync('tmp/nasa-library-downloads.json',JSON.stringify(results,null,2));console.log('Images '+done+'/'+selected.length);}}}));results.sort((a,b)=>selected.findIndex(x=>x.id===a.id)-selected.findIndex(x=>x.id===b.id));fs.writeFileSync('tmp/nasa-library-downloads.json',JSON.stringify(results,null,2));console.log('Completed: '+results.filter(x=>!x.error).length+', failed: '+results.filter(x=>x.error).length);})();
