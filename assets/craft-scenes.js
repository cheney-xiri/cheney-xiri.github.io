(function () {
  'use strict';

  const skill = document.body.dataset.craftSkill;
  const portfolio = document.querySelector('.craft-detail-portfolio');
  if (!portfolio) return;

  document.querySelectorAll('.craft-detail-path, .craft-detail-focus, .craft-detail-switcher').forEach(node => node.remove());

  const scenes = {
    writing: `
      <section class="craft-scene scene-writing" aria-labelledby="scene-title">
        <div class="scene-writing-index"><span>文心 · 写作</span><strong>从一句话<br>到一篇文章</strong><p>观察 / 构思 / 落笔 / 修订</p></div>
        <div class="scene-writing-paper">
          <header><span>写作手记 · 篇章的来处</span><span>01 / 03</span></header>
          <h2 id="scene-title">把想说的事，<br>写得更清楚。</h2>
          <p class="scene-writing-intro">一篇文章可以从一个问题、一段经历或一个难忘的细节开始。这里记录的是写作的路径；真正的文章，会收在下方的文稿区。</p>
          <ol class="scene-writing-lines">
            <li><b>01</b><strong>起笔</strong><span>先找到最想说的那一件事。</span></li>
            <li><b>02</b><strong>成篇</strong><span>让材料和段落围绕它展开。</span></li>
            <li><b>03</b><strong>改稿</strong><span>删去多余，留下准确的语气。</span></li>
          </ol>
        </div>
      </section>`,
    poetry: `
      <section class="craft-scene scene-poetry" aria-labelledby="scene-title">
        <div class="scene-poetry-heading"><span>诗笺 · 未题之卷</span><h2 id="scene-title">诗从何处来</h2><p>不预写你的诗。先为意象、声律和诗稿留出各自的位置。</p></div>
        <div class="scene-poetry-scroll">
          <div class="scene-poetry-seal" aria-hidden="true">诗</div>
          <div class="scene-poetry-column"><small>其一</small><h3>见景</h3><p>一处光影、一段路、一种忽然生出的情绪，都是起点。</p></div>
          <div class="scene-poetry-column"><small>其二</small><h3>寻声</h3><p>让意象、停顿与句读互相照应，读来有自己的节奏。</p></div>
          <div class="scene-poetry-column"><small>其三</small><h3>成章</h3><p>定稿与吟诵可分别收录，保留诗在纸上和声音里的模样。</p></div>
        </div>
      </section>`,
    photography: `
      <section class="craft-scene scene-photo" aria-labelledby="scene-title">
        <div class="scene-photo-heading"><div><span>取景簿 · 光影练习</span><h2 id="scene-title">从一张，到一组</h2></div><p>以下图片用于展示影像页面的编排方式，并非个人摄影作品。你的照片可在下方影集单独收录。</p></div>
        <div class="scene-photo-board">
          <figure class="scene-photo-large"><img src="../assets/craft-photography.webp" alt="摄影主题示意图" loading="lazy"><figcaption>01 / 画面的主角</figcaption></figure>
          <figure><img src="../assets/travel-covers/luoyang.jpg" alt="洛阳城市影像示意图" loading="lazy"><figcaption>02 / 地点与光</figcaption></figure>
          <figure><img src="../assets/travel-covers/dalian.jpg" alt="大连城市影像示意图" loading="lazy"><figcaption>03 / 组图的呼应</figcaption></figure>
        </div>
      </section>`,
    go: ``,
    dizi: `
      <section class="craft-scene scene-dizi" aria-labelledby="scene-title">
        <div class="scene-dizi-head"><span>竹音 · 气息与旋律</span><h2 id="scene-title">一息之间，有长有短。</h2><p>笛子的记录适合从曲目、练习难点和片段回听展开，让声音的变化看得见。</p></div>
        <div class="scene-dizi-phrase" aria-label="长音与换气的节奏示意"><span>起音</span><i></i><i></i><i></i><em>换气</em><i></i><i></i><span>收音</span></div>
        <div class="scene-dizi-panels"><article><small>01 · 气息</small><h3>让长音站稳</h3><p>留意起音、持续与收音是否平顺。</p></article><article><small>02 · 指法</small><h3>让转换清楚</h3><p>将难点拆成短句，慢练后再连起来。</p></article><article><small>03 · 曲目</small><h3>让乐句说话</h3><p>曲目、笛调、练习片段可逐一归档。</p></article></div>
      </section>`,
    guitar: `
      <section class="craft-scene scene-guitar" aria-labelledby="scene-title">
        <div class="scene-guitar-head"><div><span>弦歌 · 和弦与节拍</span><h2 id="scene-title">从手指到旋律</h2></div><p>用和弦图与节奏轴组织练习。个人曲目和弹奏录音，日后可放进下方的练习记录。</p></div>
        <div class="scene-guitar-stage"><div class="scene-guitar-chords" aria-label="四个常见和弦的六弦到一弦指法"><div class="scene-guitar-chord"><b>C</b><span>明亮的开端</span><i>× 3 2 0 1 0</i></div><div class="scene-guitar-chord"><b>G</b><span>向前的张力</span><i>3 2 0 0 0 3</i></div><div class="scene-guitar-chord"><b>Am</b><span>柔和的转折</span><i>× 0 2 2 1 0</i></div><div class="scene-guitar-chord"><b>F</b><span>落回的余韵</span><i>1 3 3 2 1 1</i></div></div><div class="scene-guitar-rhythm"><span>节拍练习</span><strong>↓　↓ ↑　↑ ↓ ↑</strong><p>先听稳拍子，再把和弦接成完整的乐句。</p><small>指法数字从六弦到一弦；× 不弹，0 为空弦。</small></div></div>
      </section>`
  };

  const depth = {
    writing: `<section class="craft-depth depth-writing" aria-labelledby="depth-title"><div><span>写作案头</span><h2 id="depth-title">一篇文章的骨架</h2><p>写作时可以先写下中心句，再把真正支持它的细节排出来。开头不必急着概括一切；从具体场景进入，读者更容易跟上思路。</p></div><div class="depth-writing-check"><h3>改稿时再问三件事</h3><ol><li>这段是否说了新的内容？</li><li>例子是否比判断更具体？</li><li>末尾是否回应了开头的问题？</li></ol></div></section>`,
    poetry: `<section class="craft-depth depth-poetry" aria-labelledby="depth-title"><div><span>诗笺旁注</span><h2 id="depth-title">写下，也留白</h2></div><p>诗可以从实景入手：先记看见的颜色、听见的声音，再决定哪一个意象值得留下。句子读出声时，停顿和轻重会告诉你哪些字仍需斟酌。</p><div class="depth-poetry-words"><span>景</span><span>情</span><span>声</span><span>韵</span></div></section>`,
    photography: `<section class="craft-depth depth-photo" aria-labelledby="depth-title"><div><span>影集编排</span><h2 id="depth-title">让照片之间有关系</h2></div><ol><li><b>起景</b><span>用一张宽阔的画面交代地点。</span></li><li><b>走近</b><span>让人物、建筑或细节成为主角。</span></li><li><b>转折</b><span>换一个时间或视角，改变观看节奏。</span></li><li><b>收束</b><span>选一张有余韵的照片结束。</span></li></ol></section>`,
    go: `<section class="craft-depth depth-go" aria-labelledby="depth-title"><div><span>对局之后</span><h2 id="depth-title">复盘，比胜负更长久</h2><p>记录一局棋，不必保存每一步。找到判断改变的地方，写清当时看到了什么、漏掉了什么，就能留下有价值的棋记。</p></div><ol><li>哪一步改变了全局方向？</li><li>攻守转换时，轻重判断是否准确？</li><li>若重下一次，最想换哪一手？</li></ol></section>`,
    dizi: `<section class="craft-depth depth-dizi" aria-labelledby="depth-title"><div><span>练习札记</span><h2 id="depth-title">听见细小的进步</h2><p>可按曲目记录笛调、速度和换气位置。把难吹的乐句单独留下，再听前后两次录音，比较音准、连贯度与音色。</p></div><div class="depth-dizi-flow"><span>长音</span><i></i><span>音阶</span><i></i><span>乐句</span><i></i><span>回听</span></div></section>`,
    guitar: `<section class="craft-depth depth-guitar" aria-labelledby="depth-title"><div><span>练曲路径</span><h2 id="depth-title">先稳节拍，再添情绪</h2><p>一首曲子可以拆开练：先确认和弦按得清楚，再用慢速接好转换，最后加入轻重和完整段落。回听录音时，注意节拍是否一直向前。</p></div><div class="depth-guitar-steps"><b>和弦</b><b>转换</b><b>节拍</b><b>完整弹奏</b></div></section>`
  };

  const more = {
    writing: `<section class="craft-more more-writing" aria-labelledby="more-title"><div class="craft-more-head"><span>已经写下的篇目</span><h2 id="more-title">从文存继续读</h2><a href="../writing/index.html" target="_blank" rel="noopener noreferrer">浏览全卷目录</a></div><div class="more-writing-list"><a href="../writing/write-to-think.html" target="_blank" rel="noopener noreferrer"><small>文章 01</small><strong>怎样看待努力与结果之间的落差</strong><span>承认付出，也辨认机会、条件与偶然分别影响了什么。</span></a><a href="../writing/short-by-thinking.html" target="_blank" rel="noopener noreferrer"><small>文章 02</small><strong>如何理解自信与承认不足</strong><span>一个人可以有信心，也可以说这件事我还不懂。</span></a><a href="../writing/edit-next-day.html" target="_blank" rel="noopener noreferrer"><small>文章 03</small><strong>如何面对不被理解的选择</strong><span>解释值得认真，选择也不能永远等待所有人的认可。</span></a></div></section>`,
    poetry: `<section class="craft-more more-poetry" aria-labelledby="more-title"><div class="craft-more-head"><span>诗稿的三种读法</span><h2 id="more-title">纸上、口中、心里</h2></div><div class="more-poetry-list"><article><b>读画面</b><p>诗里的景物不必多。若每一句都在添新的意象，读者反而难以停留；挑出最有力量的一处，让其他句子为它让路。</p></article><article><b>读声音</b><p>把初稿慢慢读出声，听一听哪里自然停顿，哪里为了押韵而勉强。声音顺了，诗意往往也更清楚。</p></article><article><b>读余意</b><p>结尾未必需要说尽。保留一点可回想的空间，让读者从最后一句再回到开头。</p></article></div><p class="more-poetry-note">未来可按诗题、写作缘起、定稿与吟诵录音整理个人诗稿。</p></section>`,
    photography: `<section class="craft-more more-photo" aria-labelledby="more-title"><div class="craft-more-head"><span>与足迹相连</span><h2 id="more-title">城市也是取景框</h2><a href="../travels/index.html" target="_blank" rel="noopener noreferrer">查看全部足迹</a></div><div class="more-photo-cities"><a href="../travels/city.html?city=luoyang" target="_blank" rel="noopener noreferrer"><img src="../assets/travel-covers/luoyang.jpg" alt="洛阳城市示意影像" loading="lazy"><strong>洛阳</strong><span>从古城与街巷寻找层次</span></a><a href="../travels/city.html?city=dalian" target="_blank" rel="noopener noreferrer"><img src="../assets/travel-covers/dalian.jpg" alt="大连城市示意影像" loading="lazy"><strong>大连</strong><span>看海边的光线如何改变画面</span></a><a href="../travels/city.html?city=zhengzhou" target="_blank" rel="noopener noreferrer"><img src="../assets/travel-covers/zhengzhou.jpg" alt="郑州城市示意影像" loading="lazy"><strong>郑州</strong><span>让城市线条与人群形成对照</span></a></div><p class="more-photo-note">城市配图仅作页面示意；个人摄影作品仍以你实际上传的照片为准。</p></section>`,
    go: `<section class="craft-more more-go" aria-labelledby="more-title"><div class="craft-more-head"><span>棋理札记</span><h2 id="more-title">把一局棋读成几个问题</h2></div><div class="more-go-grid"><article><b>势与地</b><p>眼前的实地和远处的影响如何取舍？先认清每一块棋的价值，再决定争夺的方向。</p></article><article><b>厚与薄</b><p>局部是否留下弱棋，会改变下一手的选择。补强有时比抢先更重要。</p></article><article><b>先与后</b><p>一手棋若迫使对方回应，就可能改变整盘节奏；复盘时值得单独标出来。</p></article></div></section>`,
    dizi: `<section class="craft-more more-dizi" aria-labelledby="more-title"><div class="craft-more-head"><span>笛声的练习顺序</span><h2 id="more-title">从一个音，到一支曲</h2></div><div class="more-dizi-table"><div><b>长音</b><p>听起音是否干净、尾音是否散。把气息练稳，后面的旋律才有支撑。</p></div><div><b>连音</b><p>手指转换时，保持气流连贯，让两个音之间没有不必要的断裂。</p></div><div><b>乐句</b><p>先标出换气的位置，再处理强弱与速度；不要让换气打断句子的意思。</p></div><div><b>回听</b><p>对照不同时间的短录音，观察音色、音准与节奏的变化。</p></div></div></section>`,
    guitar: `<section class="craft-more more-guitar" aria-labelledby="more-title"><div class="craft-more-head"><span>弦上练习</span><h2 id="more-title">让伴奏有起伏</h2></div><div class="more-guitar-bars"><article><small>VERSE · 主歌</small><strong>留出空间</strong><p>节拍稳定时，先用较轻的力度建立旋律的底色。</p></article><article><small>CHORUS · 副歌</small><strong>推向前方</strong><p>增加扫弦的密度与强度，让段落之间有明显的变化。</p></article><article><small>ENDING · 尾声</small><strong>慢慢收住</strong><p>把速度和音量收回来，让最后一个和弦有自然的余韵。</p></article></div><p class="more-guitar-note">这些是练习编排示意，不代表已收录你的具体曲目。</p></section>`
  };

  const wrapper = document.createElement('div');
  wrapper.innerHTML = (scenes[skill] || '') + (depth[skill] || '') + (more[skill] || '');
  while (wrapper.firstElementChild) portfolio.before(wrapper.firstElementChild);
  const archiveKickers = {writing:'文稿 · 归档',poetry:'诗稿 · 归档',photography:'影像 · 归档',go:'棋记 · 归档',dizi:'清音 · 归档',guitar:'弦歌 · 归档'};
  portfolio.querySelector('.craft-portfolio-heading p').textContent = archiveKickers[skill];

})();
