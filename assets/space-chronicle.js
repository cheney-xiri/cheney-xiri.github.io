(function () {
  'use strict';
  const scene = document.getElementById('chronicle-scene');
  if (!scene) return;
  const section = scene.closest('section');
  const nodes = Array.from(scene.querySelectorAll('[data-chronicle-index]'));
  const stories = Array.from(section.querySelectorAll('[data-chronicle-story]'));
  if (!nodes.length || nodes.length !== stories.length) return;

  const canvas = scene.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const nav = section.querySelector('.chronicle-navigation');
  const prev = nav.querySelector('[data-chronicle-step="-1"]');
  const next = nav.querySelector('[data-chronicle-step="1"]');
  const counter = section.querySelector('#chronicle-position');
  nav.querySelector('.chronicle-years').remove();
  nav.insertBefore(counter, next);
  scene.after(nav);
  section.querySelector('.chronicle-progress').remove();
  scene.removeAttribute('title');
  scene.setAttribute('aria-label','探索星轨，可左右拖动，或用方向键切换探索事件');

  const last = nodes.length - 1;
  const clamp = value => Math.max(0, Math.min(last, value));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const eraStarts = [
    [-5000, '史前与古代观天'],
    [1500, '望远镜与近代天文学'],
    [1900, '现代宇宙学的起点'],
    [1957, '太空时代开启'],
    [1990, '空间望远镜与深空探测'],
    [2015, '引力波与多国深空探索'],
    [2025, '2025 年至今']
  ];
  const eras = eraStarts.map(([year, title]) => ({
    title,
    start: nodes.findIndex(node => Number(node.dataset.year) >= year)
  })).filter(era => era.start >= 0);
  const eraPicker = document.createElement('select');
  eraPicker.className = 'chronicle-era-picker';
  eraPicker.setAttribute('aria-label', '按时代跳转');
  eras.forEach(era => eraPicker.add(new Option(era.title, String(era.start))));
  eraPicker.addEventListener('change', () => select(Number(eraPicker.value)));
  nav.prepend(eraPicker);
  let width = 1, height = 1, step = 1, labelWidth = 110, focus = 0, selected = -1;
  let pointer, animation, frameId = 0, suppressClick = false, wheelTimer;
  let firstVisible = 0, lastVisible = -1;
  nodes.forEach(node => { node.hidden = true; });
  const colors = [[110,222,224],[110,177,247],[166,148,240],[239,162,194],[255,204,143]];
  function ink(u, opacity) {
    const t = Math.max(0, Math.min(.9999, u)) * (colors.length - 1);
    const a = colors[Math.floor(t)], b = colors[Math.ceil(t)];
    const channels = a.map((c,i) => Math.round(c + (b[i]-c) * (t % 1)));
    return 'rgba(' + channels.join(',') + ',' + opacity + ')';
  }
  // Perspective projection shared by the luminous strands and their event stars.
  function project(x, strand = 0) {
    const u = x / width;
    const angle = (u - .5) * 3.8 - .32;
    const twist = angle * .82 + .55;
    const z = .9 * Math.cos(angle) + strand * .18 * Math.cos(twist);
    const depth = 4.6 / (4.6 - z);
    const y = Math.sin(angle) + strand * .20 * Math.sin(twist);
    return { x, y:height * (.50 - .18 * y * depth + .024 * z), depth };
  }
  function drawOrbit() {
    ctx.clearRect(0,0,width,height);
    const start = 0, end = width;
    const slices = Math.ceil(width / 4);
    const palette = ctx.createLinearGradient(0,0,width,0);
    for (let i=0; i<=48; i++) {
      const p=project(start+(end-start)*i/48);
      const u=Math.max(0,Math.min(1,p.x/width));
      palette.addColorStop(u,ink(u, Math.min(1,.36+1.5*(p.depth-.8))));
    }
    ctx.strokeStyle = palette;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    function strand(offset, thickness, alpha) {
      ctx.beginPath();
      for (let i=0; i<=slices; i++) {
        const p = project(start + (end-start)*i/slices, offset);
        if (i) ctx.lineTo(p.x,p.y); else ctx.moveTo(p.x,p.y);
      }
      ctx.lineWidth = thickness;
      ctx.globalAlpha = alpha;
      ctx.stroke();
    }
    // A translucent, twisting band with fine illuminated edges. Width and
    // foreshortening come from the projected cross-section, not a flat stroke.
    strand(0,17,.055);
    for (let i=-8; i<=8; i++) strand(i/8,1.25,Math.abs(i)===8?.92:.43);
    strand(0,1.65,.95);
    ctx.globalAlpha=1;
  }
  function paint() {
    const center = width / 2;
    const first = Math.max(0, Math.ceil(focus - (center-15)/step));
    const end = Math.min(last, Math.floor(focus + (center-15)/step));
    for (let i=firstVisible; i<=lastVisible; i++) {
      if (i < first || i > end) nodes[i].hidden = true;
    }
    firstVisible = first;
    lastVisible = end;
    for (let i=first; i<=end; i++) {
      const node = nodes[i];
      const p = project(center + (i-focus)*step);
      node.hidden = false;
      const near = i === selected;
      node.style.left = p.x + 'px';
      node.style.top = p.y + 'px';
      node.style.setProperty('--diameter', (near ? 9 : 5.5*p.depth) + 'px');
      node.style.setProperty('--star-color', ink(p.x/width,1));
      node.style.setProperty('--depth-light', near ? 1 : Math.min(.96,.48 + (p.depth-.78)*1.05));
      node.style.zIndex = near ? 3 : 1;
      node.classList.toggle('label-above',i%2===1);
      // Tuck labels inward when the star is at a screen edge.
      const half = labelWidth/2;
      node.style.setProperty('--nudge', (Math.max(half+5,Math.min(width-half-5,p.x))-p.x) + 'px');
    }
  }
  function commit(index) {
    if (selected === index) return;
    if (selected >= 0) {
      stories[selected].hidden = true;
      nodes[selected].removeAttribute('aria-current');
      nodes[selected].classList.remove('is-active');
    }
    selected = index;
    stories[index].hidden = false;
    nodes[index].setAttribute('aria-current','step');
    nodes[index].classList.add('is-active');
    counter.textContent = String(index+1).padStart(2,'0')+' / '+nodes.length;
    counter.setAttribute('aria-label', nodes[index].getAttribute('aria-label')+'，第 '+(index+1)+' 个，共 '+nodes.length+' 个');
    const era = eras.findLast(item => item.start <= index);
    if (era) eraPicker.value = String(era.start);
    prev.disabled = index===0;
    next.disabled = index===last;
  }
  function frame(now) {
    frameId = 0;
    if (animation) {
      const t = Math.min(1,(now-animation.start)/animation.duration);
      focus = animation.to + (animation.from-animation.to)*Math.pow(1-t,3);
      if (t===1) animation=null;
    }
    paint();
    if (animation) queue();
  }
  function queue() { if (!frameId) frameId=requestAnimationFrame(frame); }
  function select(value) {
    clearTimeout(wheelTimer);
    const index = clamp(Math.round(value));
    commit(index);
    const distance = Math.abs(index-focus);
    if (!reduced.matches && distance > .01 && distance <= 7) {
      animation = {from:focus,to:index,start:performance.now(),duration:Math.min(520,200+Math.abs(index-focus)*60)};
    } else { animation=null; focus=index; }
    queue();
  }
  nodes.forEach((node,i) => {
    stories[i].hidden = true;
    node.removeAttribute('aria-current');
    node.classList.remove('is-active');
    node.querySelector('small').textContent = stories[i].querySelector('h3').textContent;
    node.removeAttribute('title');
    node.tabIndex=-1;
    node.addEventListener('click',event=>{ if (!suppressClick || event.detail===0) select(i); });
  });
  // The luminous track itself is a target, including the gaps between stars.
  scene.addEventListener('click', event => {
    if (suppressClick || event.target.closest('.chronicle-node')) return;
    const bounds = scene.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const index = focus + (x-width/2)/step;
    if (index >= -.4 && index <= last+.4 && Math.abs(event.clientY-bounds.top-project(x).y) <= 26) select(index);
  });
  prev.addEventListener('click',()=>select(selected-1));
  next.addEventListener('click',()=>select(selected+1));
  scene.addEventListener('keydown',event=>{
    const target={ArrowLeft:selected-1,ArrowRight:selected+1,Home:0,End:last}[event.key];
    if (target!==undefined) { event.preventDefault(); select(target); }
  });
  scene.addEventListener('pointerdown',event=>{
    if (!event.isPrimary || event.button!==0) return;
    suppressClick=false;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,time:event.timeStamp,speed:0,dragged:false};
  });
  scene.addEventListener('pointermove',event=>{
    if (!pointer || pointer.id!==event.pointerId) return;
    const dx=event.clientX-pointer.x, dy=event.clientY-pointer.y;
    if (!pointer.dragged) {
      if (Math.abs(dy)>8 && Math.abs(dy)>Math.abs(dx)) { pointer=null; return; }
      if (Math.abs(dx)<6) return;
      pointer.dragged=true;
      animation=null;
      clearTimeout(wheelTimer);
      pointer.from=focus;
      scene.setPointerCapture(event.pointerId);
      scene.classList.add('is-dragging');
    }
    const dt=Math.max(1,event.timeStamp-pointer.time);
    pointer.speed=.4*pointer.speed+.6*(pointer.lastX-event.clientX)/dt;
    pointer.time=event.timeStamp; pointer.lastX=event.clientX;
    focus=clamp(pointer.from-dx/step);
    commit(Math.round(focus));
    queue();
  });
  function release(event) {
    if (!pointer || pointer.id!==event.pointerId) return;
    const gesture=pointer;
    pointer=null;
    if (!gesture.dragged) return;
    scene.classList.remove('is-dragging');
    if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
    suppressClick=true;
    const coast=!reduced.matches && event.type==='pointerup' && event.timeStamp-gesture.time<90
      ? Math.max(-1.35,Math.min(1.35,gesture.speed*105/step)) : 0;
    select(focus + coast);
  }
  window.addEventListener('pointerup',release);
  scene.addEventListener('pointercancel',release);
  scene.addEventListener('lostpointercapture',event=>{
    // Touch starts with implicit capture on the label. Its capture-loss event
    // bubbles here when the drag transfers to the scene.
    if (event.target === scene) release(event);
  });
  scene.addEventListener('wheel', event => {
    if (pointer || event.ctrlKey) return;
    const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (!sideways && !event.shiftKey) return;
    const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width : 1;
    const destination = clamp(focus + (sideways ? event.deltaX : event.deltaY)*units/step);
    if (destination === focus) return;
    event.preventDefault();
    animation = null;
    focus = destination;
    commit(Math.round(focus));
    queue();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => select(focus), 140);
  }, {passive:false});
  function resize() {
    width=scene.clientWidth; height=scene.clientHeight;
    if (!width || !height) return;
    step = Math.min(174, Math.max(110,width/6.6));
    labelWidth = Math.min(138,Math.max(95,width/9));
    scene.style.setProperty('--label-width',labelWidth+'px');
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    if(ctx) {
      ctx.setTransform(dpr,0,0,dpr,0,0);
      drawOrbit();
    }
    queue();
  }
  reduced.addEventListener('change',()=>{if(reduced.matches)select(selected)});
  scene.dataset.renderer='orbital-ribbon';
  const requestedYear = new URLSearchParams(window.location.search).get('year');
  const initialNode = nodes.findIndex(node => node.dataset.year === requestedYear);
  focus = Math.max(0, initialNode);
  commit(focus);
  resize();
  new ResizeObserver(resize).observe(scene);
}());
