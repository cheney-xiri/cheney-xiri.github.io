'use strict';
const fs=require('node:fs');const queries=['globular cluster','star cluster','galaxy cluster','Chandra'];
let next=0;const jobs=queries.flatMap(q=>[2,3,4,5,6,7].map(page=>({q,page})));
(async()=>{await Promise.all(Array.from({length:5},async()=>{while(next<jobs.length){const {q,page}=jobs[next++],file='tmp/wp-'+q.replace(/ /g,'-')+'-'+page+'.json';if(fs.existsSync(file))continue;try{const r=await fetch('https://science.nasa.gov/wp-json/wp/v2/media?per_page=100&page='+page+'&search='+encodeURIComponent(q),{signal:AbortSignal.timeout(45000)});const json=await r.json();if(Array.isArray(json))fs.writeFileSync(file,JSON.stringify(json));console.log(q,page,r.status,json.length);}catch(e){console.log(q,page,e.message);}}}));})();
