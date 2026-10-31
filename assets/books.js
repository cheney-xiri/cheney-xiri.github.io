(async function () {
  'use strict';
  await (window.CHENEY_CONTENT_READY || Promise.resolve());

  var books = [
    {"title":"毛泽东选集","meta":"毛泽东 · 文集","note":"在历史风云与现实实践之间，读一代人的思考、判断与行动。","cover":"https://cdn.weread.qq.com/weread/cover/84/3300024284/t6_3300024284.jpg","colors":["#842f2c","#d4a45d"]},
    {"title":"诗经","meta":"先秦 · 诗歌总集","note":"从草木鸟兽、田野劳作与人间情意里，听见中国诗歌最初的回响。","cover":"https://cdn.weread.qq.com/weread/cover/99/cpplatform_cxdnejsrrs6i5lpfmrzc53/t6_cpplatform_cxdnejsrrs6i5lpfmrzc531786936416.jpg","colors":["#526c58","#d9c48d"]},
    {"title":"楚辞","meta":"屈原等 · 楚辞作品集","note":"奇幻瑰丽的想象与深沉炽烈的情志，在长风与香草间舒展。","cover":"https://img4.xinhuashudian.com/bookbasepic/C/00877/97871010699831631884-fm.jpg?x-oss-process=image%2Fresize%2Cm_mfit%2Ch_750%2Cw_750","colors":["#485d79","#d6b36d"]},
    {"title":"史记","meta":"司马迁 · 纪传体通史","note":"以人物照见时代，在兴亡成败里看见选择、命运与人心。","cover":"https://cdn.weread.qq.com/weread/cover/70/cpplatform_wfgrjr9uxlj7ofmhqjesit/t6_cpplatform_wfgrjr9uxlj7ofmhqjesit1755078541.jpg","colors":["#79533d","#d5b98c"]},
    {"title":"儒林外史","meta":"吴敬梓 · 讽刺小说","note":"一卷世相长图，写尽功名场中的热闹、荒诞与清醒。","cover":"https://cdn.weread.qq.com/weread/cover/52/YueWen_30661873/t6_YueWen_30661873.jpg","colors":["#47716c","#d9c889"]},
    {"title":"人间词话","meta":"王国维 · 词学论著","note":"以境界论诗词，也借诗词照见人生审美与精神天地。","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/415/814415/t6_814415.jpg","colors":["#584f72","#d4b478"]},
    {"title":"鲁迅全集","meta":"鲁迅 · 文学作品集","note":"小说、杂文与书信并读，在锋利文字里观察时代与灵魂。","cover":"https://cdn.weread.qq.com/weread/cover/19/YueWen_827628/t6_YueWen_827628.jpg","colors":["#43535b","#c7a979"]},
    {"title":"中国文化要义","meta":"梁漱溟 · 文化论著","note":"从伦理关系与生活方式出发，追问中国社会的文化根脉。","cover":"https://cdn.weread.qq.com/weread/cover/50/YueWen_23976218/t6_YueWen_23976218.jpg","colors":["#76513e","#dfbe82"]},
    {"title":"自然哲学的数学原理","meta":"艾萨克·牛顿 · 科学经典","note":"以数学语言描述运动与引力，追随经典力学建立的思想路径。","cover":"https://cdn.weread.qq.com/weread/cover/32/YueWen_32507335/t6_YueWen_32507335.jpg","colors":["#405a74","#d0b77b"]},
    {"title":"上帝在掷骰子吗？","meta":"科普 · 量子物理","note":"从微观世界的概率与不确定性出发，认识量子理论的奇异图景。","cover":"https://cdn.weread.qq.com/weread/cover/87/YueWen_25622039/t6_YueWen_25622039.jpg","colors":["#334862","#e1a55f"]},
    {"title":"时空本原初论","meta":"哲学 · 时空思考","note":"围绕时空与存在展开追问，适合带着问题慢读、反思。","cover":"https://img.megbook.hk/upload/mall/productImages/25/38/9787519485344.jpg","colors":["#4c5668","#b7a88c"]},
    {"title":"人世间","meta":"梁晓声 · 长篇小说","note":"在普通家庭数十年的悲欢中，读见时代变迁与平凡人的韧性。","cover":"https://www.chinawriter.com.cn/NMediaFile/2022/0318/MAIN202203180818000576300162745.jpg","colors":["#8a493a","#dfb77c"]},
    {"title":"欧·亨利短篇小说集","meta":"欧·亨利 · 短篇小说","note":"纽约街巷与小人物的生活片段，常在转折处显出温情与机锋。","cover":"https://cdn.weread.qq.com/weread/cover/56/cpplatform_kmyrrmjq4m8natzgw9tuoe/t6_cpplatform_kmyrrmjq4m8natzgw9tuoe1783586893.jpg","colors":["#596f6b","#d1ae76"]},
    {"title":"大卫·科波菲尔","meta":"查尔斯·狄更斯 · 长篇小说","note":"跟随主人公走过成长、挫折与相逢，看一段漫长而温厚的人生。","cover":"https://cdn.weread.qq.com/weread/cover/26/YueWen_856072/t6_YueWen_856072.jpg","colors":["#5d6a7d","#d5b27b"]},
    {"title":"堂吉诃德","meta":"塞万提斯 · 长篇小说","note":"理想骑士闯入现实世界，以荒诞和幽默追问何为勇气与正义。","cover":"https://cdn.weread.qq.com/weread/cover/19/yuewen_34631923/t6_yuewen_346319231678861063.jpg","colors":["#8a6745","#d8bc84"]},
    {"title":"边城","meta":"沈从文 · 中篇小说","note":"湘西山水与渡口人家，写一段清澈、含蓄而令人惦念的故事。","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/628/23433628/t6_23433628.jpg","colors":["#58766f","#d3be83"]},
    {"title":"源宇宙","meta":"科幻 · 宇宙探索","note":"循着宇宙起源与文明想象展开阅读，书目版本可在阅读平台检索。","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/296/23520296/t6_23520296.jpg","colors":["#293b58","#e4ad66"]},
    {"title":"瓦尔登湖","meta":"亨利·戴维·梭罗 · 随笔","note":"在湖畔生活与四季观察中，练习简朴、独立地思考。","cover":"https://cdn.weread.qq.com/weread/cover/77/cpplatform_n2fsmg7bc2bnzhmkfxqq6q/t6_cpplatform_n2fsmg7bc2bnzhmkfxqq6q1686541831.jpg","colors":["#4b6b5a","#d4c188"]},
    {"title":"文人毛泽东","meta":"毛泽东 · 人物与文学","note":"从诗词、书法与阅读经验侧面，认识其作为写作者的一面。","cover":"https://cdn.weread.qq.com/outpic/160/3000096160.jpg","colors":["#79504a","#ddbb80"]},
    {"title":"1/2的魔法","meta":"奇幻 · 动画电影故事","note":"一段关于兄弟、勇气与告别的奇幻旅程，珍惜尚未说完的话。","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/984/33515984/t6_33515984.jpg","colors":["#50617c","#e0ad68"]},
    {"title":"禁断的魔术","meta":"东野圭吾 · 推理小说","note":"以精密机关和层层线索构成谜局，在推理中逼近人物的选择。","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/345/23557345/t6_23557345.jpg","colors":["#444e5d","#c8a36c"]},
    {"title":"宇宙","meta":"科普 · 天文学","note":"从星体、星系到宇宙尺度，展开一场关于我们身处何方的探索。","cover":"https://cdn.weread.qq.com/weread/cover/54/YueWen_39457314/t6_YueWen_39457314.jpg","colors":["#253752","#d69c59"]},
    {"title":"云边有个小卖部","meta":"张嘉佳 · 长篇小说","note":"在故乡、亲情与成长的故事里，写下温柔而复杂的人生牵绊。","cover":"https://cdn.weread.qq.com/weread/cover/15/yuewen_23233558/t6_yuewen_232335581718191242.jpg","colors":["#687c68","#e0c28a"]},
    {"title":"神墓","meta":"辰东 · 玄幻小说","note":"从神魔陵园与复生谜局起笔，铺开宏阔的东方幻想世界。","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/18/506018/t6_506018.jpg","colors":["#514867","#ca9a63"]},
    {"title":"未知的世界","meta":"探索 · 未知主题","note":"关于未知领域的阅读记录；不同版本内容可能有所差异。","cover":"https://cdn.weread.qq.com/outpic/843/3000076843.jpg","colors":["#42616a","#d7b67a"]},
    {"title":"淘气包马小跳","meta":"杨红樱 · 儿童文学","note":"从校园日常和童真视角出发，描绘一群孩子鲜活的成长故事。","cover":"https://cdn.weread.qq.com/outpic/376/3001507376.jpg","colors":["#557455","#e2c071"]},
    {"title":"遮天","meta":"辰东 · 玄幻小说","note":"以九龙拉棺开启奇幻旅程，在古老星域间书写热血与求索。","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/863/475863/t6_475863.jpg","colors":["#394965","#d7a35f"]},
    {"title":"圣墟","meta":"辰东 · 玄幻小说","note":"天地异变之后，主人公踏上追寻进化与真相的漫长旅途。","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/738/14608738/t6_14608738.jpg","colors":["#4d405d","#dca761"]},
    {"title":"世说新语","meta":"刘义庆 · 志人小说","note":"短章记录魏晋人物言行，在清谈风度与率真性情间见时代。","cover":"https://cdn.weread.qq.com/weread/cover/30/cpplatform_dmnnvjhvpr6cavs4zbmpdh/t6_cpplatform_dmnnvjhvpr6cavs4zbmpdh1773649455.jpg","colors":["#5c6874","#d4bf8e"]},
    {"title":"庄子","meta":"庄周 · 先秦哲学","note":"寓言瑰奇，想象飞扬，在逍遥与齐物中体会精神的自由。","cover":"https://cdn.weread.qq.com/weread/cover/54/YueWen_39938673/t6_YueWen_39938673.jpg","colors":["#4c705e","#d2bc82"]},
    {"title":"苏东坡传","meta":"林语堂 · 人物传记","note":"看苏轼如何在起落与迁谪之间，以旷达安顿才情与生活。","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/820/841820/t6_841820.jpg","colors":["#a25b40","#e1c38a"]},
    {"title":"万历十五年","meta":"黄仁宇 · 历史著作","note":"由一个看似平常的年份切入，观察制度、人物与历史结构。","cover":"https://cdn.weread.qq.com/weread/cover/58/cpplatform_1bj8ahmedeyax4rqazgpqx/t6_cpplatform_1bj8ahmedeyax4rqazgpqx1787653414.jpg","colors":["#73503c","#c8a873"]},
    {"title":"天工开物","meta":"宋应星 · 科技典籍","note":"记录传统社会的农作与工艺，在器物之间读见古人的经验。","cover":"https://cdn.weread.qq.com/weread/cover/75/cpplatform_vkins1c9mzkmfbt3kjlrn9/t6_cpplatform_vkins1c9mzkmfbt3kjlrn91677476708.jpg","colors":["#567467","#d8c58b"]},
    {"title":"时间简史","meta":"史蒂芬·霍金 · 科普","note":"从宇宙起源、黑洞与时间问题出发，走近现代宇宙学。","cover":"https://cdn.weread.qq.com/weread/cover/60/YueWen_694735/t6_YueWen_694735.jpg","colors":["#344b65","#daa568"]},
    {"title":"人类简史","meta":"尤瓦尔·赫拉利 · 历史","note":"以宏观视角回望人类社会的形成，重新思考文明的来路。","cover":"https://cdn.weread.qq.com/weread/cover/37/YueWen_855812/t6_YueWen_855812.jpg","colors":["#775340","#d6b77e"]},
    {"title":"平凡的世界","meta":"路遥 · 长篇小说","note":"在城乡变迁与个人奋斗之中，写普通人不甘平凡的生命力。","cover":"https://cdn.weread.qq.com/weread/cover/61/yuewen_24965201/t6_yuewen_249652011682413401.jpg","colors":["#806047","#d8b97c"]},
    {"title":"活着","meta":"余华 · 长篇小说","note":"以一个人的命运照见苦难与坚韧，平静讲述生命本身。","cover":"https://cdn.weread.qq.com/weread/cover/1/yuewen_834464/t6_yuewen_8344641758521403.jpg","colors":["#74534a","#d4b17d"]},
    {"title":"围城","meta":"钱钟书 · 长篇小说","note":"机锋与幽默交织，映出知识分子的处境和人情世态。","cover":"https://p1-tt.byteimg.com/origin/tos-cn-i-qvj2lq49k0/74b1fb292cb4483182dc07fc2d62033a.jpg","colors":["#6b586c","#d3b682"]},
    {"title":"沉默的大多数","meta":"王小波 · 随笔集","note":"以理性、幽默与独立判断，谈思想、生活和表达的自由。","cover":"https://cdn.weread.qq.com/weread/cover/85/yuewen_912825/t6_yuewen_9128251776069077.jpg","colors":["#4b6269","#d4b77e"]},
    {"title":"月亮与六便士","meta":"威廉·萨默塞特·毛姆","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"孤独是人生常态","meta":"阿图尔·叔本华","note":"书架照片中的书目。","cover":"","colors":["#526b63","#d3c49f"]},
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
    {"title":"追忆似水年华","meta":"马塞尔·普鲁斯特","note":"与书架相关的延伸书目。","cover":"","colors":["#526b63","#d3c49f"]},
    {"title":"骆驼祥子","meta":"老舍","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/18/cpplatform_9txxlmd4wetfckpcsvxhbg/t6_cpplatform_9txxlmd4wetfckpcsvxhbg1775615726.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/c4832870813abb4d1g014b78"},
    {"title":"茶馆","meta":"老舍","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/93/yuewen_29963693/t6_yuewen_299636931692676298.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/9e93220071c935ad9e91f73"},
    {"title":"四世同堂","meta":"老舍","note":"中国文学 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/729/22910729/t6_22910729.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/be432cf0715d9709be41f6e"},
    {"title":"城南旧事","meta":"林海音","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/6/cpplatform_wngdkmp68jpexrhrbzuz1t/t6_cpplatform_wngdkmp68jpexrhrbzuz1t1788314583.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/7d232900813abbfdcg015e37"},
    {"title":"呼兰河传","meta":"萧红","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/42/cpplatform_ec8uuw5oikef9vxpga6ztv/t6_cpplatform_ec8uuw5oikef9vxpga6ztv1750759808.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/25032be0813aba129g011e45"},
    {"title":"生死场","meta":"萧红","note":"中国文学 · 延伸书目","cover":"https://rescdn.qqmail.com/weread/cover/363/3300007363/t6_3300007363.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/f47326f0813ab6960g013fca"},
    {"title":"撒哈拉的故事","meta":"三毛","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/24/3300020524/t6_3300020524.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/27d32300813ab6e84g0147c8"},
    {"title":"倾城之恋","meta":"张爱玲","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/88/yuewen_22355153/t6_yuewen_223551531680770798.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/3d53237071551cd13d5e2fd"},
    {"title":"许茂和他的女儿们","meta":"周克芹","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/8/YueWen_27403446/t6_YueWen_27403446.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/9cd32f3071a224b69cd3b4f"},
    {"title":"芙蓉镇","meta":"古华","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/55/cpplatform_2dbiwt5ruhzxqcp5ww2phk/t6_cpplatform_2dbiwt5ruhzxqcp5ww2phk1688046072.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/bf032760813ab7f10g0119e6"},
    {"title":"长恨歌","meta":"王安忆","note":"中国文学 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/462/27403462/t6_27403462.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/16932d3071a224c6169398a"},
    {"title":"棋王","meta":"阿城","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/1/YueWen_25398011/t6_YueWen_25398011.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/2b632d0071838afb2b689aa"},
    {"title":"繁花","meta":"金宇澄","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/49/yuewen_35008168/t6_yuewen_350081681767510900.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/ec8320b072162ea8ec8b401"},
    {"title":"尘埃落定","meta":"阿来","note":"中国文学 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/903/34619903/t6_34619903.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/85732cf0721041ff857a70b"},
    {"title":"黄金时代","meta":"王小波","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/52/YueWen_912828/t6_YueWen_912828.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/2bd329b05dedbc2bd49b02c"},
    {"title":"沉沦","meta":"郁达夫","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/27/cpplatform_izajt72gqmzyvc8jdi2hgx/t6_cpplatform_izajt72gqmzyvc8jdi2hgx1793006144.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/ac0327b0813abc2fcg011ed2"},
    {"title":"子夜","meta":"茅盾","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/62/cpplatform_581ienetar4dcv5lbjzegu/t6_cpplatform_581ienetar4dcv5lbjzegu1685085210.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/66332f50813ab7de2g0142e2"},
    {"title":"家","meta":"巴金","note":"中国文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/96/yuewen_22177203/t6_yuewen_221772031715686358.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/e5432060715265b3e54f8ad"},
    {"title":"飘","meta":"玛格丽特·米切尔","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/57/cpplatform_gphbw2c9duvae1kcvxmhfo/t6_cpplatform_gphbw2c9duvae1kcvxmhfo1753438332.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/3d7321f0813aba291g010c9e"},
    {"title":"一九八四","meta":"乔治·奥威尔","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/29/YueWen_932111/t6_YueWen_932111.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/4ce328505e390f4ce1578b2"},
    {"title":"动物农场","meta":"乔治·奥威尔","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/86/cpplatform_e1wvnlkxez6bq6ucipa9oy/t6_cpplatform_e1wvnlkxez6bq6ucipa9oy1762742145.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/ce332d50813abab1fg014aaa"},
    {"title":"美丽新世界","meta":"阿道司·赫胥黎","note":"世界文学 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/28/41287028/t6_41287028.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/35d32ec07275fd7435d1172"},
    {"title":"变形记","meta":"弗兰茨·卡夫卡","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/26/cpplatform_5tvqwlg51zfrcaiyfidpum/t6_cpplatform_5tvqwlg51zfrcaiyfidpum1765263935.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/70932200813abae5ag01451c"},
    {"title":"城堡","meta":"弗兰茨·卡夫卡","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/43/YueWen_25658405/t6_YueWen_25658405.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/6b732d10718784256b72781"},
    {"title":"审判","meta":"弗兰茨·卡夫卡","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/42/3300010442/t6_3300010442.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/00632900813ab6a94g012c6c"},
    {"title":"雪国","meta":"川端康成","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/73/cpplatform_2u94arubg512sjvwkr4ef5/t6_cpplatform_2u94arubg512sjvwkr4ef51675254765.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/04932050813ab7900g0179b5"},
    {"title":"挪威的森林","meta":"村上春树","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/27/YueWen_25856515/t6_YueWen_25856515.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/bookDetail/52b322b0718a8a0352b88be"},
    {"title":"海边的卡夫卡","meta":"村上春树","note":"世界文学 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/942/24918942/t6_24918942.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/6eb32020717c3b9e6ebcaf6"},
    {"title":"无人生还","meta":"阿加莎·克里斯蒂","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/63/yuewen_728514/t6_yuewen_7285141680854106.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/d6332fd05b1dc2d63df8938"},
    {"title":"东方快车谋杀案","meta":"阿加莎·克里斯蒂","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/53/yuewen_728497/t6_yuewen_7284971680854100.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/603327a05b1db160313dacf"},
    {"title":"白鲸","meta":"赫尔曼·梅尔维尔","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/95/cpplatform_j53osdxtvobpwwb6c3hdfs/t6_cpplatform_j53osdxtvobpwwb6c3hdfs1691399232.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/d5532b20813ab808cg0158bc"},
    {"title":"麦田里的守望者","meta":"J. D. 塞林格","note":"世界文学 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/34/29103034/t6_29103034.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/477329b071bc13ba477bc4f"},
    {"title":"少年维特之烦恼","meta":"歌德","note":"世界文学 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/922/842922/t6_842922.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/0e5329805cdcaa0e5d7718d"},
    {"title":"远大前程","meta":"查尔斯·狄更斯","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/99/cpplatform_g5hwbju4o2zibjkvgosqmf/t6_cpplatform_g5hwbju4o2zibjkvgosqmf1781684352.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/84a326a0813abb9c4g013957"},
    {"title":"茶花女","meta":"小仲马","note":"世界文学 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/19/YueWen_23303606/t6_YueWen_23303606.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/06332f20716395b6063fa3e"},
    {"title":"复活","meta":"列夫·托尔斯泰","note":"世界文学 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/342/35239342/t6_35239342.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/e2132f507219b5aee219668"},
    {"title":"红楼梦","meta":"曹雪芹、高鹗","note":"古典与历史 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/606/316606/t6_316606.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/75032be054d4be750f9f834"},
    {"title":"西游记","meta":"吴承恩","note":"古典与历史 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/12/YueWen_139418/t6_YueWen_139418.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/b5d3224052209ab5d37e9a2"},
    {"title":"三国演义","meta":"罗贯中","note":"古典与历史 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/11/YueWen_139417/t6_YueWen_139417.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/a6632440522099a66297f67"},
    {"title":"水浒传","meta":"施耐庵","note":"古典与历史 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/35/YueWen_316612/t6_YueWen_316612.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/246323f054d4c424682e2b5"},
    {"title":"论语","meta":"孔子弟子及再传弟子","note":"古典与历史 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/60/YueWen_851459/t6_YueWen_851459.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/947326b05cfe039471b9edc"},
    {"title":"孟子","meta":"孟子及其弟子","note":"古典与历史 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/67/YueWen_860221/t6_YueWen_860221.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/2fa32a805d203d2fa987255"},
    {"title":"资治通鉴","meta":"司马光主编","note":"古典与历史 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/178/721178/t6_721178.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/c4332e305b011ac43253da2"},
    {"title":"全球通史","meta":"斯塔夫里阿诺斯","note":"古典与历史 · 延伸书目","cover":"https://cdn.weread.qq.com/outpic/629/3001032629.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/bookDetail/90a32970811e3365eg019046"},
    {"title":"理想国","meta":"柏拉图","note":"哲学与思考 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/80/YueWen_906850/t6_YueWen_906850.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/22c32a305dd66222c91ebc5"},
    {"title":"论自由","meta":"约翰·斯图亚特·密尔","note":"哲学与思考 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/60/cpplatform_ocswmrdz9jf5zvrjm5cbfa/t6_cpplatform_ocswmrdz9jf5zvrjm5cbfa1718692824.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/90432eb0813ab8148g0133a8"},
    {"title":"幸福之路","meta":"伯特兰·罗素","note":"哲学与思考 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/8/cpplatform_gwxr9thp4waku3jjdrmkmz/t6_cpplatform_gwxr9thp4waku3jjdrmkmz1775620181.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/a3d32b80813abb4d4g011629"},
    {"title":"西方哲学史","meta":"伯特兰·罗素","note":"哲学与思考 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/2/cpplatform_utq7dsy1rtddfwgiqeohdm/t6_cpplatform_utq7dsy1rtddfwgiqeohdm1745552436.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/70932ef0813ab9e31g013ae2"},
    {"title":"被讨厌的勇气","meta":"岸见一郎、古贺史健","note":"哲学与思考 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/385/25615385/t6_25615385.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/8b9329607186dc198b9bdab"},
    {"title":"活出生命的意义","meta":"维克多·弗兰克尔","note":"哲学与思考 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/22/cpplatform_hsl2ccpugksluxgua2xm52/t6_cpplatform_hsl2ccpugksluxgua2xm521788261188.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/1b532700813abbfdbg01779d"},
    {"title":"思考，快与慢","meta":"丹尼尔·卡尼曼","note":"哲学与思考 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/86/YueWen_573975/t6_YueWen_573975.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/af83263058c217af81f8979"},
    {"title":"原则","meta":"瑞·达利欧","note":"哲学与思考 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/23/YueWen_921568/t6_YueWen_921568.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/848324405e0fe08483ab6a4"},
    {"title":"时间的形状","meta":"汪诘","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/55/cpplatform_tkhprkf9wak4mmy3yub43u/t6_cpplatform_tkhprkf9wak4mmy3yub43u1782982909.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/97332d60813abbaf9g01292d"},
    {"title":"从一到无穷大","meta":"乔治·伽莫夫","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/36/yuewen_25123238/t6_yuewen_251232381693822170.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/61232470717f59a66124747"},
    {"title":"物理学的进化","meta":"阿尔伯特·爱因斯坦、利奥波德·英费尔德","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/54/YueWen_24987103/t6_YueWen_24987103.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/b0732870717d45dfb07966a"},
    {"title":"万物简史","meta":"比尔·布莱森","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/80/3300018080/t6_3300018080.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/af832e60813ab6d90g01048f"},
    {"title":"物种起源","meta":"查尔斯·达尔文","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/74/YueWen_184069/t6_YueWen_184069.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/6ae3288052cf056aeaf8d32"},
    {"title":"自私的基因","meta":"理查德·道金斯","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/60/YueWen_23665518/t6_YueWen_23665518.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/fb732f6071691b6efb7de4b"},
    {"title":"时间的秩序","meta":"卡洛·罗韦利","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/88/YueWen_26026653/t6_YueWen_26026653.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/bookDetail/b4532a30718d229db451c58"},
    {"title":"七堂极简物理课","meta":"卡洛·罗韦利","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/55/YueWen_835049/t6_YueWen_835049.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/701324605cbde9701e40e74"},
    {"title":"宇宙的结构","meta":"布莱恩·格林","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/31/YueWen_694727/t6_YueWen_694727.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/846329205a99c7846cb154e"},
    {"title":"黑洞与时间弯曲","meta":"基普·索恩","note":"科学与宇宙 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/75/YueWen_915341/t6_YueWen_915341.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/28c328405df78d28cd85142"},
    {"title":"富兰克林自传","meta":"本杰明·富兰克林","note":"传记与创作 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/847/906847/t6_906847.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/c8b320d05dd65fc8bb0693a"},
    {"title":"居里夫人传","meta":"艾芙·居里","note":"传记与创作 · 延伸书目","cover":"https://cdn.weread.qq.com/outpic/210/3001023210.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/bookDetail/74f325e0811e332b1g01019b"},
    {"title":"名人传","meta":"罗曼·罗兰","note":"传记与创作 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/54/cpplatform_ovapbbpw9bwnuv3ohwdjr2/t6_cpplatform_ovapbbpw9bwnuv3ohwdjr21749112968.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/354324f0813aba023g0100b6"},
    {"title":"梵高传：对生活的渴求","meta":"欧文·斯通","note":"传记与创作 · 延伸书目","cover":"https://cdn.weread.qq.com/outpic/353/3002226353.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/bookDetail/be132c20811e508abg01396d"},
    {"title":"论摄影","meta":"苏珊·桑塔格","note":"传记与创作 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/16/YueWen_23796296/t6_YueWen_23796296.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/82432a00716b1a48824b0a3"},
    {"title":"摄影的艺术","meta":"布鲁斯·巴恩鲍姆","note":"传记与创作 · 延伸书目","cover":"https://cdn.weread.qq.com/outpic/324/3000060324.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/bookDetail/be532ac0811e1ba90g0144a6"},
    {"title":"认识电影","meta":"路易斯·贾内梯","note":"传记与创作 · 延伸书目","cover":"https://cdn.weread.qq.com/outpic/175/3003849175.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/bookDetail/71c322a0811e78295g015e0d"},
    {"title":"设计心理学","meta":"唐纳德·诺曼","note":"传记与创作 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/39/YueWen_857353/t6_YueWen_857353.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/ad932ca05d1509ad998f4ff"},
    {"title":"写作这回事","meta":"斯蒂芬·金","note":"传记与创作 · 延伸书目","cover":"https://cdn.weread.qq.com/weread/cover/28/cpPlatform_3300003095/t6_cpPlatform_3300003095.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/a8232570813ab67b5g01534b"},
    {"title":"故事","meta":"罗伯特·麦基","note":"传记与创作 · 延伸书目","cover":"https://wfqqreader-1252317822.image.myqcloud.com/cover/797/568797/t6_568797.jpg","colors":["#526b63","#d3c49f"],"url":"https://weread.qq.com/web/reader/0473270058addd047f1f76a"}
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
