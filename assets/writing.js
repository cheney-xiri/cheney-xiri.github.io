(async () => {
  'use strict';
  await (window.CHENEY_CONTENT_READY || Promise.resolve());
  const library=document.querySelector('[data-library]');
  if(library){
    const field=library.querySelector('[data-essay-search]');
    const filters=[...library.querySelectorAll('[data-filter]')];
    const entries=[...library.querySelectorAll('[data-essay]')];
    let category='全部';
    const update=()=>{
      const q=field.value.trim().toLocaleLowerCase();let visible=0;
      for(const item of entries){item.hidden=!((category==='全部'||category===item.dataset.category)&&item.dataset.search.toLocaleLowerCase().includes(q));if(!item.hidden)visible++;}
      library.querySelector('[data-essay-count]').textContent=(q||category!=='全部'?'找到 ':'共 ')+visible+' 篇';
      library.querySelector('[data-essay-empty]').hidden=visible!==0;
      filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
    };
    filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;update();}));
    field.addEventListener('input',update);
    library.querySelector('[data-essay-reset]').addEventListener('click',()=>{category='全部';field.value='';update();field.focus();});
    update();
  }
  const lines=[...document.querySelectorAll('[data-line]')];
  const draw=document.querySelector('[data-draw]');
  const lineSearch=document.querySelector('[data-line-search]');
  if(lineSearch){
    const updateLines=()=>{
      const q=lineSearch.value.trim().toLocaleLowerCase();let count=0;
      for(const item of lines){item.hidden=!item.textContent.toLocaleLowerCase().includes(q);if(!item.hidden)count++;}
      document.querySelectorAll('.wen-line-group').forEach(g=>{g.hidden=![...g.querySelectorAll('[data-line]')].some(item=>!item.hidden);});
      document.querySelector('[data-line-count]').textContent=q?'找到 '+count+' 则':'共 '+lines.length+' 则 · 诗词与话语';
      document.querySelector('[data-line-empty]').hidden=count!==0;
    };
    lineSearch.addEventListener('input',updateLines);
    document.querySelector('[data-line-reset]').addEventListener('click',()=>{lineSearch.value='';updateLines();lineSearch.focus();});
  }
  if(draw){
    let current=0;
    draw.addEventListener('click',()=>{
      current=(current+1+Math.floor(Math.random()*(lines.length-1)))%lines.length;
      const selected=lines[current];
      document.querySelector('[data-picked]').textContent=selected.querySelector('[data-line-text]').textContent;
      document.querySelector('[data-picked-category]').textContent=selected.dataset.category;
    });
  }
  for(const button of document.querySelectorAll('[data-copy]')){
    button.addEventListener('click',async()=>{
      const text=button.closest('[data-line]').querySelector('[data-line-text]').textContent;
      const status=document.querySelector('[data-copy-status]');
      let copied=false;
      try{await navigator.clipboard.writeText(text);copied=true;}catch{
        const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();
        try{copied=document.execCommand('copy');}catch{}field.remove();button.focus();
      }
      status.textContent=copied?'已复制：'+text:'复制未完成，请选中句子手动复制。';
      button.textContent=copied?'已复制':'请手动复制';
      setTimeout(()=>{button.textContent='复制';},1800);
    });
  }
})();
