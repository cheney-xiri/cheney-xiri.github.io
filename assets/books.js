(async function () {
  'use strict';
  await (window.CHENEY_CONTENT_READY || Promise.resolve());

  var books = [
    { title: '毛泽东选集', meta: '毛泽东 · 文集', note: '在历史风云与现实实践之间，读一代人的思考、判断与行动。', cover: 'https://cdn.weread.qq.com/weread/cover/84/3300024284/t6_3300024284.jpg', colors: ['#842f2c', '#d4a45d'] },
    { title: '诗经', meta: '先秦 · 诗歌总集', note: '从草木鸟兽、田野劳作与人间情意里，听见中国诗歌最初的回响。', cover: 'https://cdn.weread.qq.com/weread/cover/99/cpplatform_cxdnejsrrs6i5lpfmrzc53/t6_cpplatform_cxdnejsrrs6i5lpfmrzc531786936416.jpg', colors: ['#526c58', '#d9c48d'] },
    { title: '楚辞', meta: '屈原等 · 楚辞作品集', note: '奇幻瑰丽的想象与深沉炽烈的情志，在长风与香草间舒展。', cover: 'https://img4.xinhuashudian.com/bookbasepic/C/00877/97871010699831631884-fm.jpg?x-oss-process=image%2Fresize%2Cm_mfit%2Ch_750%2Cw_750', colors: ['#485d79', '#d6b36d'] },
    { title: '史记', meta: '司马迁 · 纪传体通史', note: '以人物照见时代，在兴亡成败里看见选择、命运与人心。', cover: 'https://cdn.weread.qq.com/weread/cover/70/cpplatform_wfgrjr9uxlj7ofmhqjesit/t6_cpplatform_wfgrjr9uxlj7ofmhqjesit1755078541.jpg', colors: ['#79533d', '#d5b98c'] },
    { title: '儒林外史', meta: '吴敬梓 · 讽刺小说', note: '一卷世相长图，写尽功名场中的热闹、荒诞与清醒。', cover: 'https://cdn.weread.qq.com/weread/cover/52/YueWen_30661873/t6_YueWen_30661873.jpg', colors: ['#47716c', '#d9c889'] },
    { title: '人间词话', meta: '王国维 · 词学论著', note: '以境界论诗词，也借诗词照见人生审美与精神天地。', cover: 'https://wfqqreader-1252317822.image.myqcloud.com/cover/415/814415/t6_814415.jpg', colors: ['#584f72', '#d4b478'] },
    { title: '鲁迅全集', meta: '鲁迅 · 文学作品集', note: '小说、杂文与书信并读，在锋利文字里观察时代与灵魂。', cover: 'https://cdn.weread.qq.com/weread/cover/19/YueWen_827628/t6_YueWen_827628.jpg', colors: ['#43535b', '#c7a979'] },
    { title: '中国文化要义', meta: '梁漱溟 · 文化论著', note: '从伦理关系与生活方式出发，追问中国社会的文化根脉。', cover: 'https://cdn.weread.qq.com/weread/cover/50/YueWen_23976218/t6_YueWen_23976218.jpg', colors: ['#76513e', '#dfbe82'] },
    { title: '自然哲学的数学原理', meta: '艾萨克·牛顿 · 科学经典', note: '以数学语言描述运动与引力，追随经典力学建立的思想路径。', cover: 'https://cdn.weread.qq.com/weread/cover/32/YueWen_32507335/t6_YueWen_32507335.jpg', colors: ['#405a74', '#d0b77b'] },
    { title: '上帝在掷骰子吗？', meta: '科普 · 量子物理', note: '从微观世界的概率与不确定性出发，认识量子理论的奇异图景。', cover: 'https://cdn.weread.qq.com/weread/cover/87/YueWen_25622039/t6_YueWen_25622039.jpg', colors: ['#334862', '#e1a55f'] },
    { title: '时空本原初论', meta: '哲学 · 时空思考', note: '围绕时空与存在展开追问，适合带着问题慢读、反思。', cover: 'https://img.megbook.hk/upload/mall/productImages/25/38/9787519485344.jpg', colors: ['#4c5668', '#b7a88c'] },
    { title: '人世间', meta: '梁晓声 · 长篇小说', note: '在普通家庭数十年的悲欢中，读见时代变迁与平凡人的韧性。', cover: 'https://www.chinawriter.com.cn/NMediaFile/2022/0318/MAIN202203180818000576300162745.jpg', colors: ['#8a493a', '#dfb77c'] },
    { title: '欧·亨利短篇小说集', meta: '欧·亨利 · 短篇小说', note: '纽约街巷与小人物的生活片段，常在转折处显出温情与机锋。', cover: 'https://cdn.weread.qq.com/weread/cover/56/cpplatform_kmyrrmjq4m8natzgw9tuoe/t6_cpplatform_kmyrrmjq4m8natzgw9tuoe1783586893.jpg', colors: ['#596f6b', '#d1ae76'] },
    { title: '大卫·科波菲尔', meta: '查尔斯·狄更斯 · 长篇小说', note: '跟随主人公走过成长、挫折与相逢，看一段漫长而温厚的人生。', cover: 'https://cdn.weread.qq.com/weread/cover/26/YueWen_856072/t6_YueWen_856072.jpg', colors: ['#5d6a7d', '#d5b27b'] },
    { title: '堂吉诃德', meta: '塞万提斯 · 长篇小说', note: '理想骑士闯入现实世界，以荒诞和幽默追问何为勇气与正义。', cover: 'https://cdn.weread.qq.com/weread/cover/19/yuewen_34631923/t6_yuewen_346319231678861063.jpg', colors: ['#8a6745', '#d8bc84'] },
    { title: '边城', meta: '沈从文 · 中篇小说', note: '湘西山水与渡口人家，写一段清澈、含蓄而令人惦念的故事。', cover: 'https://wfqqreader-1252317822.image.myqcloud.com/cover/628/23433628/t6_23433628.jpg', colors: ['#58766f', '#d3be83'] },
    { title: '源宇宙', meta: '科幻 · 宇宙探索', note: '循着宇宙起源与文明想象展开阅读，书目版本可在阅读平台检索。', cover: 'https://wfqqreader-1252317822.image.myqcloud.com/cover/296/23520296/t6_23520296.jpg', colors: ['#293b58', '#e4ad66'] },
    { title: '瓦尔登湖', meta: '亨利·戴维·梭罗 · 随笔', note: '在湖畔生活与四季观察中，练习简朴、独立地思考。', cover: 'https://cdn.weread.qq.com/weread/cover/77/cpplatform_n2fsmg7bc2bnzhmkfxqq6q/t6_cpplatform_n2fsmg7bc2bnzhmkfxqq6q1686541831.jpg', colors: ['#4b6b5a', '#d4c188'] },
    { title: '文人毛泽东', meta: '毛泽东 · 人物与文学', note: '从诗词、书法与阅读经验侧面，认识其作为写作者的一面。', cover: 'https://cdn.weread.qq.com/outpic/160/3000096160.jpg', colors: ['#79504a', '#ddbb80'] },
    { title: '1/2的魔法', meta: '奇幻 · 动画电影故事', note: '一段关于兄弟、勇气与告别的奇幻旅程，珍惜尚未说完的话。', cover: 'https://wfqqreader-1252317822.image.myqcloud.com/cover/984/33515984/t6_33515984.jpg', colors: ['#50617c', '#e0ad68'] },
    { title: '禁断的魔术', meta: '东野圭吾 · 推理小说', note: '以精密机关和层层线索构成谜局，在推理中逼近人物的选择。', cover: 'https://wfqqreader-1252317822.image.myqcloud.com/cover/345/23557345/t6_23557345.jpg', colors: ['#444e5d', '#c8a36c'] },
    { title: '宇宙', meta: '科普 · 天文学', note: '从星体、星系到宇宙尺度，展开一场关于我们身处何方的探索。', cover: 'https://cdn.weread.qq.com/weread/cover/54/YueWen_39457314/t6_YueWen_39457314.jpg', colors: ['#253752', '#d69c59'] },
    { title: '云边有个小卖部', meta: '张嘉佳 · 长篇小说', note: '在故乡、亲情与成长的故事里，写下温柔而复杂的人生牵绊。', cover: 'https://cdn.weread.qq.com/weread/cover/15/yuewen_23233558/t6_yuewen_232335581718191242.jpg', colors: ['#687c68', '#e0c28a'] },
    { title: '神墓', meta: '辰东 · 玄幻小说', note: '从神魔陵园与复生谜局起笔，铺开宏阔的东方幻想世界。', cover: 'https://wfqqreader-1252317822.image.myqcloud.com/cover/18/506018/t6_506018.jpg', colors: ['#514867', '#ca9a63'] },
    { title: '未知的世界', meta: '探索 · 未知主题', note: '关于未知领域的阅读记录；不同版本内容可能有所差异。', cover: 'https://cdn.weread.qq.com/outpic/843/3000076843.jpg', colors: ['#42616a', '#d7b67a'] },
    { title: '淘气包马小跳', meta: '杨红樱 · 儿童文学', note: '从校园日常和童真视角出发，描绘一群孩子鲜活的成长故事。', cover: 'https://cdn.weread.qq.com/outpic/376/3001507376.jpg', colors: ['#557455', '#e2c071'] },
    { title: '遮天', meta: '辰东 · 玄幻小说', note: '以九龙拉棺开启奇幻旅程，在古老星域间书写热血与求索。', cover: 'https://wfqqreader-1252317822.image.myqcloud.com/cover/863/475863/t6_475863.jpg', colors: ['#394965', '#d7a35f'] },
    { title: '圣墟', meta: '辰东 · 玄幻小说', note: '天地异变之后，主人公踏上追寻进化与真相的漫长旅途。', cover: 'https://wfqqreader-1252317822.image.myqcloud.com/cover/738/14608738/t6_14608738.jpg', colors: ['#4d405d', '#dca761'] },
    { title: '世说新语', meta: '刘义庆 · 志人小说', note: '短章记录魏晋人物言行，在清谈风度与率真性情间见时代。', cover: 'https://cdn.weread.qq.com/weread/cover/30/cpplatform_dmnnvjhvpr6cavs4zbmpdh/t6_cpplatform_dmnnvjhvpr6cavs4zbmpdh1773649455.jpg', colors: ['#5c6874', '#d4bf8e'] },
    { title: '庄子', meta: '庄周 · 先秦哲学', note: '寓言瑰奇，想象飞扬，在逍遥与齐物中体会精神的自由。', cover: 'https://cdn.weread.qq.com/weread/cover/54/YueWen_39938673/t6_YueWen_39938673.jpg', colors: ['#4c705e', '#d2bc82'] },
    { title: '苏东坡传', meta: '林语堂 · 人物传记', note: '看苏轼如何在起落与迁谪之间，以旷达安顿才情与生活。', cover: 'https://wfqqreader-1252317822.image.myqcloud.com/cover/820/841820/t6_841820.jpg', colors: ['#a25b40', '#e1c38a'] },
    { title: '万历十五年', meta: '黄仁宇 · 历史著作', note: '由一个看似平常的年份切入，观察制度、人物与历史结构。', cover: 'https://cdn.weread.qq.com/weread/cover/58/cpplatform_1bj8ahmedeyax4rqazgpqx/t6_cpplatform_1bj8ahmedeyax4rqazgpqx1787653414.jpg', colors: ['#73503c', '#c8a873'] },
    { title: '天工开物', meta: '宋应星 · 科技典籍', note: '记录传统社会的农作与工艺，在器物之间读见古人的经验。', cover: 'https://cdn.weread.qq.com/weread/cover/75/cpplatform_vkins1c9mzkmfbt3kjlrn9/t6_cpplatform_vkins1c9mzkmfbt3kjlrn91677476708.jpg', colors: ['#567467', '#d8c58b'] },
    { title: '时间简史', meta: '史蒂芬·霍金 · 科普', note: '从宇宙起源、黑洞与时间问题出发，走近现代宇宙学。', cover: 'https://cdn.weread.qq.com/weread/cover/60/YueWen_694735/t6_YueWen_694735.jpg', colors: ['#344b65', '#daa568'] },
    { title: '人类简史', meta: '尤瓦尔·赫拉利 · 历史', note: '以宏观视角回望人类社会的形成，重新思考文明的来路。', cover: 'https://cdn.weread.qq.com/weread/cover/37/YueWen_855812/t6_YueWen_855812.jpg', colors: ['#775340', '#d6b77e'] },
    { title: '平凡的世界', meta: '路遥 · 长篇小说', note: '在城乡变迁与个人奋斗之中，写普通人不甘平凡的生命力。', cover: 'https://cdn.weread.qq.com/weread/cover/61/yuewen_24965201/t6_yuewen_249652011682413401.jpg', colors: ['#806047', '#d8b97c'] },
    { title: '活着', meta: '余华 · 长篇小说', note: '以一个人的命运照见苦难与坚韧，平静讲述生命本身。', cover: 'https://cdn.weread.qq.com/weread/cover/1/yuewen_834464/t6_yuewen_8344641758521403.jpg', colors: ['#74534a', '#d4b17d'] },
    { title: '围城', meta: '钱钟书 · 长篇小说', note: '机锋与幽默交织，映出知识分子的处境和人情世态。', cover: 'https://p1-tt.byteimg.com/origin/tos-cn-i-qvj2lq49k0/74b1fb292cb4483182dc07fc2d62033a.jpg', colors: ['#6b586c', '#d3b682'] },
    { title: '沉默的大多数', meta: '王小波 · 随笔集', note: '以理性、幽默与独立判断，谈思想、生活和表达的自由。', cover: 'https://cdn.weread.qq.com/weread/cover/85/yuewen_912825/t6_yuewen_9128251776069077.jpg', colors: ['#4b6269', '#d4b77e'] },
    {"title":"月亮与六便士","meta":"威廉·萨默塞特·毛姆","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"孤独是人生常态","meta":"季羡林","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"刀锋","meta":"威廉·萨默塞特·毛姆","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"追风筝的人","meta":"卡勒德·胡赛尼","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"你当像鸟飞往你的山","meta":"塔拉·韦斯特弗","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"百年孤独","meta":"加西亚·马尔克斯","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"霍乱时期的爱情","meta":"加西亚·马尔克斯","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"了不起的盖茨比","meta":"菲茨杰拉德","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"热牛奶","meta":"黛博拉·利维","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"窄门","meta":"安德烈·纪德","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"理智与情感","meta":"简·奥斯汀","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"西西弗神话","meta":"阿尔贝·加缪","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"面纱","meta":"威廉·萨默塞特·毛姆","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"双城记","meta":"查尔斯·狄更斯","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"荒原狼","meta":"赫尔曼·黑塞","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"小妇人","meta":"路易莎·梅·奥尔科特","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"安娜·卡列尼娜","meta":"列夫·托尔斯泰","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"人类群星闪耀时","meta":"斯蒂芬·茨威格","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"老人与海","meta":"欧内斯特·海明威","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"罗生门","meta":"芥川龙之介","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"简·爱","meta":"夏洛蒂·勃朗特","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"人间草木","meta":"汪曾祺","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"包法利夫人","meta":"居斯塔夫·福楼拜","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"文城","meta":"余华","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"第七天","meta":"余华","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"呐喊","meta":"鲁迅","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"晚熟的人","meta":"莫言","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"古文观止","meta":"吴楚材、吴调侯选编","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"红尘万丈","meta":"作者待核对","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"人生海海","meta":"麦家","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"怀念狼","meta":"贾平凹","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"秦腔","meta":"贾平凹","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"极花","meta":"贾平凹","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"高兴","meta":"贾平凹","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"老生","meta":"贾平凹","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"带灯","meta":"贾平凹","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"废都","meta":"贾平凹","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"古炉","meta":"贾平凹","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"局外人","meta":"阿尔贝·加缪","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"鼠疫","meta":"阿尔贝·加缪","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"魏晋南北朝","meta":"作者待核对","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"白夜行","meta":"东野圭吾","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"新参者","meta":"东野圭吾","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"解忧杂货店","meta":"东野圭吾","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"恶意","meta":"东野圭吾","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"秘密","meta":"东野圭吾","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"嫌疑人X的献身","meta":"东野圭吾","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"圣女的救济","meta":"东野圭吾","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"红手指","meta":"东野圭吾","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"兄弟","meta":"余华","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"解密","meta":"麦家","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"沧浪之水","meta":"阎真","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"生死疲劳","meta":"莫言","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"蛙","meta":"莫言","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"丰乳肥臀","meta":"莫言","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"檀香刑","meta":"莫言","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"红树林","meta":"莫言","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"生命册","meta":"李佩甫","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"南渡北归","meta":"岳南","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"哲学的故事","meta":"威尔·杜兰特","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"武则天传","meta":"作者待核对","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"杜甫传","meta":"冯至","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"海底两万里","meta":"儒勒·凡尔纳","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"羊脂球","meta":"居伊·德·莫泊桑","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"人间失格","meta":"太宰治","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"高老头","meta":"巴尔扎克","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"呼啸山庄","meta":"艾米莉·勃朗特","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"伊甸之东","meta":"约翰·斯坦贝克","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"愤怒的葡萄","meta":"约翰·斯坦贝克","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"罪与罚","meta":"陀思妥耶夫斯基","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"巴黎圣母院","meta":"维克多·雨果","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"枕草子","meta":"清少纳言","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"许三观卖血记","meta":"余华","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"在细雨中呼喊","meta":"余华","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"白鹿原","meta":"陈忠实","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"额尔古纳河右岸","meta":"迟子建","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"遥远的救世主","meta":"豆豆","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"一句顶一万句","meta":"刘震云","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"受戒","meta":"汪曾祺","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"我们仨","meta":"杨绛","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"人生","meta":"路遥","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"我与地坛","meta":"史铁生","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"文化苦旅","meta":"余秋雨","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"中国历代政治得失","meta":"钱穆","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"乡土中国","meta":"费孝通","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"三体","meta":"刘慈欣","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"星空的琴弦","meta":"汪诘","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"傲慢与偏见","meta":"简·奥斯汀","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"悲惨世界","meta":"维克多·雨果","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"基督山伯爵","meta":"大仲马","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"战争与和平","meta":"列夫·托尔斯泰","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"卡拉马佐夫兄弟","meta":"陀思妥耶夫斯基","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"悉达多","meta":"赫尔曼·黑塞","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"克拉拉与太阳","meta":"石黑一雄","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"不能承受的生命之轻","meta":"米兰·昆德拉","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"沉思录","meta":"马可·奥勒留","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"苏菲的世界","meta":"乔斯坦·贾德","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"果壳中的宇宙","meta":"史蒂芬·霍金","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"宇宙的琴弦","meta":"布莱恩·格林","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"献给阿尔吉侬的花束","meta":"丹尼尔·凯斯","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"小王子","meta":"安托万·德·圣埃克苏佩里","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"追忆似水年华","meta":"马塞尔·普鲁斯特","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]}
  ];

  if (window.CHENEY_CONTENT_STATE?.books) books = window.CHENEY_CONTENT_STATE.books.filter(x=>x.data).sort((a,b)=>a.data.order-b.data.order).map(x=>({title:x.data.title,meta:x.data.author,note:x.data.summary,cover:x.data.cover,url:x.data.url}));
  var shelf = document.getElementById('book-shelf');
  var total = document.getElementById('book-total');
  if (!shelf) return;
  var fullCatalog = document.body.dataset.bookCatalog === 'all';
  var displayedBooks = fullCatalog ? books : books.slice(0, 6);

  function makeCard(book, index) {
    var url = book.url || 'https://weread.qq.com/web/search/books?keyword=' + encodeURIComponent(book.title);
    var item = document.createElement('li');
    item.hidden = !fullCatalog && index >= 6;
    item.dataset.search = (book.title + ' ' + book.meta).toLocaleLowerCase();
    var link = document.createElement('a');
    link.className = 'book-link';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', '打开《' + book.title + '》');

    var cover = document.createElement('span');
    cover.className = 'book-cover' + (book.cover ? '' : ' no-cover');
    if (book.cover) {
      var image = document.createElement('img');
      image.className = 'book-cover-image';
      image.src = book.cover;
      image.alt = book.title + '封面';
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      cover.appendChild(image);
    } else {
      var missing = document.createElement('span');
      missing.className = 'cover-missing';
      missing.textContent = book.title; missing.setAttribute('aria-label', '文字书签');
      cover.appendChild(missing);
    }

    var body = document.createElement('span');
    body.className = 'book-body';
    var title = document.createElement('span');
    title.className = 'book-title'; title.textContent = book.title;
    var meta = document.createElement('span');
    meta.className = 'book-meta'; meta.textContent = book.meta;
    var note = document.createElement('span');
    note.className = 'book-note'; note.textContent = book.note;
    body.append(title, meta, note);
    link.append(cover, body);
    item.appendChild(link);
    return item;
  }

  displayedBooks.forEach(function (book, index) { shelf.appendChild(makeCard(book, index)); });
  if (total) total.textContent = fullCatalog ? '全卷共录 ' + books.length + ' 册' : '共录 ' + books.length + ' 册 · 首页先览六种书影';
  if (fullCatalog) {
    var search = document.getElementById('book-search');
    if (search) search.addEventListener('input', function () {
      var query = search.value.trim().toLocaleLowerCase();
      var matched = 0;
      Array.prototype.forEach.call(shelf.children, function (item) {
        var visible = !query || item.dataset.search.indexOf(query) !== -1;
        item.hidden = !visible;
        if (visible) matched++;
      });
      if (total) total.textContent = query ? '检索到 ' + matched + ' 册' : '全卷共录 ' + books.length + ' 册';
    });
  }
})();
