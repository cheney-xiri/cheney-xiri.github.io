(function () {
  'use strict';

  // 十七座省辖市，以及单列介绍的济源。
  var cities = [
    { name:'南阳', epithet:'卧龙与伏牛 · 从这里出发', intro:'南阳在河南西南，伏牛山的山色、丹江的水与历史人物的故事在这里交汇。城中可沿卧龙岗追寻诸葛亮文化，到医圣祠读张仲景的医学记忆；向西进入山地，还能在老界岭与丹江边看见另一面的南阳。若是第一次来，不妨从一处人文古迹出发，再把余下的时间交给山水。', spots:[['卧龙岗文化园','在武侯祠一带读三国故事'],['医圣祠','认识张仲景与中医药文化'],['内乡县衙','看保存完整的古代县衙建筑'],['老界岭','登伏牛山看云海与林色'],['丹江大观苑','沿丹江湖看渠首山水']] },
    { name:'郑州', epithet:'商都与黄河', intro:'河南省会，也是许多人认识中原的第一站。城中可以读商都遗址和博物馆，往西走到登封，又能从嵩山的山路走进古代建筑与武术文化。', spots:[['河南博物院','从器物与展陈读中原文明'],['嵩山少林寺','在登封看古刹与山岳'],['只有河南·戏剧幻城','用沉浸戏剧重遇黄河与土地']] },
    { name:'开封', epithet:'宋都烟火', intro:'北宋东京的故事仍在城墙、街市和水系间流转。白天适合慢看古城，夜里则可在演艺与灯火里感受开封活泼的一面。', spots:[['清明上河园','走入宋代市井画卷'],['开封府','看包公故事与府衙文化'],['万岁山武侠城','看演出、逛江湖主题街区']] },
    { name:'洛阳', epithet:'千年古都', intro:'伊洛之间积累了厚重的都城记忆。石窟、古寺、城址彼此相望；春天还能沿着花事与街巷，看到这座古都明朗鲜活的日常。', spots:[['龙门石窟','沿伊河看石刻艺术'],['白马寺','探访古寺院落'],['洛邑古城','夜游古城与街巷']] },
    { name:'平顶山', epithet:'伏牛山色', intro:'城市向西南延伸进山地，适合把行程交给自然。鲁山的峰林与温泉、汝州的古寺，让山水游里也有一段可慢读的文化路。', spots:[['尧山','登山看峰林与云海'],['中原大佛景区','看佛教造像与山间景观'],['汝州风穴寺','在古寺里赏建筑与山林']] },
    { name:'安阳', epithet:'甲骨之城', intro:'在安阳，甲骨文让古老的文字重新可见。除了殷墟与博物馆，向林州出发还能遇到红旗渠和太行山的高崖峡谷。', spots:[['殷墟博物馆','读商代都城与甲骨文'],['中国文字博物馆','看汉字如何演变'],['红旗渠','走近山间水渠与建设故事']] },
    { name:'鹤壁', epithet:'淇水古城', intro:'淇河穿城而过，浚县的古城和山景保留着另一种缓慢的节奏。适合留半天在街巷走走，再去看河畔与山上的开阔景色。', spots:[['浚县古城','逛古城街巷与民俗'],['大伾山','登山看古迹与城景'],['淇河','沿水岸散步观景']] },
    { name:'新乡', epithet:'太行山前', intro:'新乡往北便是南太行，山崖、瀑布和峡谷连成适合徒步与观景的去处。城市与山之间的距离不远，短途出游也容易安排。', spots:[['八里沟','沿峡谷看瀑布与山色'],['万仙山·郭亮村','看崖上村落与挂壁公路'],['宝泉大峡谷','在水边步道感受太行']] },
    { name:'焦作', epithet:'山水与太极', intro:'焦作的太行南麓有峡谷、溪瀑，也有太极拳的故事。可以把一天交给云台山，再用一段时间去陈家沟了解拳术从何而来。', spots:[['云台山','游红石峡与山间水景'],['青天河','乘船或沿岸看峡谷湖光'],['陈家沟','了解太极拳文化']] },
    { name:'濮阳', epithet:'龙源与杂技', intro:'濮阳有深厚的史前文化线索，也把杂技发展为鲜明的城市名片。适合先从博物馆和遗址认识城市，再走进剧场看一场表演。', spots:[['濮阳博物馆','认识濮阳历史与“中华第一龙”'],['戚城文物景区','在城址遗存中看古代故事'],['杂技文化旅游园区','感受濮阳的杂技艺术']] },
    { name:'许昌', epithet:'魏都旧事', intro:'三国的故事给许昌留下独特的城市气质。城内的历史街区和楼阁适合步行，往鄢陵走又能在花木与园林间换一种心情。', spots:[['曹魏古城','漫步魏都主题街区'],['春秋楼','看关羽故事与古建'],['鄢陵花博园','在花木间悠闲游逛']] },
    { name:'漯河', epithet:'沙澧之间', intro:'沙河与澧河在这里交汇，漯河适合沿河慢走，也适合从许慎的故里了解汉字学。小城的节奏不急，河岸、园林和文化园可以串成轻松的一天。', spots:[['许慎文化园','认识《说文解字》与文字学'],['沙澧河风景区','沿河骑行、看水岸夜色'],['南街村','看地方村落与特色街区']] },
    { name:'三门峡', epithet:'黄河向东', intro:'黄河在豫西留下辽阔河湾，也留下仰韶文化与古关隘的线索。冬日观天鹅、平日访古关或地坑院，是这座城截然不同的三种打开方式。', spots:[['天鹅湖国家城市湿地公园','冬季观赏越冬天鹅'],['函谷关','探访古关与老子文化'],['陕州地坑院','看地下院落与民居智慧']] },
    { name:'商丘', epithet:'归德古城', intro:'商丘是一座适合从城门慢慢走进去的城市。古城、书院与汉文化遗迹分布在城内外，既能看旧时街巷，也能继续往永城寻一段汉代故事。', spots:[['商丘古城','看归德府城与古街'],['应天书院','访北宋书院旧址'],['芒砀山汉文化景区','探访汉梁王陵与汉文化']] },
    { name:'信阳', epithet:'山水茶乡', intro:'大别山脉与湖泊让信阳呈现出清润的南方气息。登山、环湖和品茶可以放在同一趟旅程里，慢慢体会豫南的山色与生活。', spots:[['鸡公山','看山间建筑与避暑风景'],['南湾湖','乘船赏湖岛与水色'],['信阳毛尖茶山','走进茶园看采茶制茶']] },
    { name:'周口', epithet:'羲皇故都', intro:'周口的文化线索从伏羲传说延伸到老子故里，也落在沙颍河畔的日常街巷。走古迹之外，不妨留一点时间看庙宇、河景与地方小吃。', spots:[['太昊陵','探访伏羲文化与古庙会'],['老子故里旅游区','到鹿邑了解老子文化'],['周口关帝庙','看会馆建筑与漕运往事']] },
    { name:'驻马店', epithet:'天中山色', intro:'豫南山地与平原在驻马店相接。嵖岈山的奇石与步道适合户外行走，老乐山、宿鸭湖又分别提供山林和湿地的不同风景。', spots:[['嵖岈山','攀山看奇石与峰林'],['老乐山','走山间步道赏林色'],['宿鸭湖湿地','看开阔湖面与鸟类']] },
    { name:'济源', epithet:'愚公移山', intro:'济源单列于十七座省辖市之外。这里的王屋山与愚公移山故事紧密相连，黄河、峡谷和猕猴栖息的山林也为短途旅行留下许多路线。', spots:[['王屋山','循愚公移山故事登山'],['黄河小浪底','看黄河水利景观'],['五龙口','走山谷步道看猕猴']] }
  ];

  var grid = document.getElementById('henan-grid');
  var search = document.getElementById('henan-search');
  var count = document.getElementById('henan-count');
  var empty = document.getElementById('henan-empty');
  if (!grid) return;

  var nodes = cities.map(function (city, index) {
    var card = document.createElement('article');
    card.className = 'henan-card';
    card.dataset.search = (city.name + ' ' + city.epithet + ' ' + city.intro + ' ' + city.spots.map(function (s) { return s.join(' '); }).join(' ')).toLocaleLowerCase();
    var panel = document.createElement('div');
    panel.className = 'henan-card-panel';

    var upper = document.createElement('div');
    upper.className = 'henan-card-upper';
    var number = document.createElement('span'); number.className = 'henan-card-number'; number.textContent = String(index + 1).padStart(2, '0');
    var seal = document.createElement('span'); seal.className = 'henan-card-seal'; seal.textContent = '豫'; seal.setAttribute('aria-hidden', 'true');
    upper.append(number, seal);
    var heading = document.createElement('h3'); heading.textContent = city.name;
    var epithet = document.createElement('p'); epithet.className = 'henan-card-epithet'; epithet.textContent = city.epithet;
    var intro = document.createElement('p'); intro.className = 'henan-card-intro'; intro.textContent = city.intro;
    var label = document.createElement('p'); label.className = 'henan-card-spots-label'; label.textContent = (city.spots.length === 5 ? '五处好去处' : '三处好去处');
    var spots = document.createElement('ul'); spots.className = 'henan-card-spots';
    city.spots.forEach(function (spot) {
      var item = document.createElement('li');
      var name = document.createElement('strong'); name.textContent = spot[0];
      var detail = document.createElement('span'); detail.textContent = spot[1];
      item.append(name, detail); spots.appendChild(item);
    });
    var end = document.createElement('a');
    end.className = 'henan-card-end';
    end.href = 'https://www.baidu.com/s?wd=' + encodeURIComponent('河南' + city.name + '市 城市介绍');
    end.target = '_blank';
    end.rel = 'noopener noreferrer';
    end.setAttribute('aria-label', '在百度查看' + city.name + '的城市介绍');
    end.innerHTML = '在百度读这座城';
    panel.append(upper, heading, epithet, intro, label, spots, end);
    card.appendChild(panel); grid.appendChild(card);
    return card;
  });

  if (search) search.addEventListener('input', function () {
    var term = search.value.trim().toLocaleLowerCase();
    var shown = 0;
    nodes.forEach(function (node) {
      var match = !term || node.dataset.search.indexOf(term) !== -1;
      node.hidden = !match;
      if (match) shown++;
    });
    if (count) count.textContent = term ? '找到 ' + shown + ' 座相关城市' : '共 18 座城市';
    if (empty) empty.hidden = shown !== 0;
  });

  var toTop = document.getElementById('henan-to-top');
  if (toTop) {
    var updateTop = function () { toTop.classList.toggle('is-visible', window.scrollY > 700); };
    window.addEventListener('scroll', updateTop, { passive:true });
    toTop.addEventListener('click', function () { window.scrollTo({ top:0, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
    updateTop();
  }
})();
