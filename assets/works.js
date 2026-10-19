(() => {
  'use strict';
  const browser=document.querySelector('[data-character-browser]');
  if(!browser)return;
  const tabs=[...browser.querySelectorAll('[role="tab"]')];
  const panels=[...browser.querySelectorAll('[role="tabpanel"]')];
  const activate=(tab,focus=false)=>{
    tabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1});
    panels.forEach(panel=>{panel.hidden=panel.id!==tab.getAttribute('aria-controls')});
    if(focus)tab.focus();
  };
  const media=matchMedia('(max-width:540px)');
  const orientation=()=>browser.querySelector('[role="tablist"]').setAttribute('aria-orientation',media.matches?'horizontal':'vertical');
  orientation();media.addEventListener('change',orientation);
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else if(event.key===(media.matches?'ArrowRight':'ArrowDown'))next=(index+1)%tabs.length;
      else if(event.key===(media.matches?'ArrowLeft':'ArrowUp'))next=(index+tabs.length-1)%tabs.length;
      if(next!==undefined){event.preventDefault();activate(tabs[next],true)}
    });
  });
})();
