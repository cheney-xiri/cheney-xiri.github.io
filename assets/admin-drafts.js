(() => {
  'use strict';
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
  function open(item,ctx){
    const chapters=window.CHENEY_ADMIN_CHAPTERS.chapters;
    if(item.kind==='page'){
      const chapter=chapters.find(c=>c.group===item.group);
      ctx.navigate(chapter?'chapter:'+chapter.key:'pages',{tool:'pages',scope:{path:item.path,...(chapter?{chapter:chapter.key,group:chapter.group}: {})}});
    }else{
      const chapter=chapters.find(c=>c.tools.some(t=>t[0]===item.collection));
      ctx.navigate(chapter?'chapter:'+chapter.key:item.collection,{tool:item.collection,selectId:item.id});
    }
  }
  function download(item){
    const url=URL.createObjectURL(new Blob([JSON.stringify({format:'cheney-local-draft-v1',exportedAt:new Date().toISOString(),...item},null,2)],{type:'application/json'}));
    const a=el('a');a.href=url;a.download='cheney-draft-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function mount(box,ctx,{compact=false}={}){
    const panel=el('section',undefined,'admin-drafts'+(compact?' is-compact':' full-panel'));
    if(!compact){box.className='workspace full';box.replaceChildren(panel);}else box.append(panel);
    const heading=el('div',undefined,'draft-heading'),copy=el('div');copy.append(el('small','本设备 · 待发布'),el('h2',compact?'接着上次编辑':'草稿与待发布'));
    heading.append(copy);if(compact)heading.append(button('查看全部草稿',()=>ctx.navigate('drafts')));panel.append(heading);
    const note=el('p','文字条目与页面草稿保存在当前浏览器。行旅、足迹和专题资料请在各自编辑页完成发布。','field-help'),content=el('div');panel.append(note,content);
    async function load(){
      content.replaceChildren(el('p','正在读取本设备草稿…','field-help'));
      try{
        const {items}=await ctx.api('/api/admin/drafts');if(ctx.isCurrent&&!ctx.isCurrent())return;
        content.replaceChildren();const tools=el('div',undefined,'draft-filters'),search=el('input'),filter=el('select'),list=el('div',undefined,'draft-list');search.type='search';search.placeholder='搜索草稿标题';search.setAttribute('aria-label','搜索草稿标题');filter.setAttribute('aria-label','筛选草稿类型');
        for(const [v,t]of [['all','全部草稿'],['entry','文字条目'],['page','页面图文'],['stale','需核对版本']]){const o=el('option',t);o.value=v;filter.append(o);}
        if(!compact){tools.append(search,filter,button('刷新列表',load));content.append(tools);}content.append(list);
        const draw=()=>{
          list.replaceChildren();let rows=items.filter(x=>x.title.toLowerCase().includes(search.value.trim().toLowerCase())&&(filter.value==='all'||(filter.value==='stale'?x.stale:x.kind===filter.value)));
          if(compact)rows=rows.slice(0,4);
          for(const item of rows){
            const row=el('article',undefined,'draft-row'),info=el('div'),state=item.stale?'线上已有新版本，请先导出保留草稿':'草稿未发布';
            info.append(el('small',(item.kind==='page'?'页面图文':ctx.meta.collections[item.collection])+' · '+state),el('h3',item.title));
            if(item.savedAt){const time=el('time','保存于 '+new Date(item.savedAt).toLocaleString('zh-CN'));time.dateTime=item.savedAt;info.append(time);}
            const actions=el('div',undefined,'site-tools');actions.append(button(item.stale?'查看线上版本':'继续编辑',()=>open(item,ctx)),button('导出草稿',()=>download(item)));row.dataset.stale=String(item.stale);row.append(info,actions);list.append(row);
          }
          if(!rows.length)list.append(el('p',items.length?'没有匹配的草稿。':'没有待发布的文字或页面草稿。进入对应章节即可开始补充。','album-empty'));
        };search.oninput=filter.onchange=draw;draw();
      }catch(e){if(ctx.isCurrent&&!ctx.isCurrent())return;content.replaceChildren(el('p','暂时无法读取草稿：'+e.message,'field-help'),button('重试',load));}
    }
    await load();
  }
  window.CHENEY_ADMIN_DRAFTS={mount};
})();
