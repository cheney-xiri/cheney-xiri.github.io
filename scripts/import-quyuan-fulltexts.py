"""Import public domain poem bodies from saved, inspectable source HTML."""
from pathlib import Path
from html import unescape
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'tmp/quyuan-fulltext-20261019'

def plain(fragment):
    fragment = re.sub(r'<(?:style|script)\b.*?</(?:style|script)>', '', fragment, flags=re.S)
    fragment = re.sub(r'<span[^>]*class="variant-tooltip"[^>]*>.*?</span>', '', fragment, flags=re.S)
    fragment = re.sub(r'<sup\b.*?</sup>', '', fragment, flags=re.S)
    fragment = re.sub(r'<br\s*/?>|</p>', '\n', fragment, flags=re.I)
    fragment = re.sub(r'<[^>]+>', '', fragment)
    text = unescape(fragment)
    return '\n'.join(line.strip() for line in text.splitlines() if line.strip())

def guwen(key):
    raw = (CACHE / (key + '.html')).read_text(encoding='utf-8')
    match = re.search(r'<div class="contson"[^>]*>(.*?)</div>', raw, re.S)
    if not match:
        raise ValueError('Missing original poem: ' + key)
    text = plain(match[1])
    variants = re.findall(r'[（(]([^()（）]*)[）)]', text)
    text = re.sub(r'[（(][^()（）]*[）)]', '', text)
    return text, variants

lisao, lisao_notes = guwen('lisao-guwen')
shejiang, shejiang_notes = guwen('shejiang')
jusong, jusong_notes = guwen('ju-song')
jiuge_html = (CACHE / 'jiuge.html').read_text(encoding='utf-8')

def jiuge(title):
    for section in re.split(r'(?=<h2\b)', jiuge_html):
        heading = re.search(r'<h2\b[^>]*>(.*?)</h2>', section, re.S)
        if heading and plain(heading[1]) == title:
            poem = re.search(r'<div class="poem"[^>]*>(.*?)</div>', section, re.S)
            if poem:
                return plain(poem[1])
    raise ValueError('Missing Jiuge chapter: ' + title)

tianwen_html = (CACHE / 'tianwen.html').read_text(encoding='utf-8')
parts = []
started = False
for p in re.findall(r'<p\b[^>]*>(.*?)</p>', tianwen_html, re.S):
    text = plain(p)
    if text.startswith('曰：遂古之初'):
        started = True
    if started:
        parts.append(text)
    if started and text.endswith('忠名弥彰？'):
        break
tianwen = '\n'.join(parts)
if not tianwen.endswith('忠名弥彰？'):
    raise ValueError('Tianwen ending not found')
tianwen_notes = re.findall(r'〈([^〉]+)〉', tianwen)
tianwen = re.sub(r'〈[^〉]+〉', '', tianwen)
# Line wrapping follows source punctuation and never removes poem characters.
tianwen = '\n'.join(re.findall(r'[^。！？\n]+[。！？]?', tianwen))

entries = [
    ('离骚', lisao, 'https://www.guwendao.net/shiwenv_f5714bcd33e3.aspx', '长篇抒情诗', lisao_notes),
    ('天问', tianwen, 'https://zh.wikisource.org/zh-hans/天問', '连续发问的诗篇', tianwen_notes),
    ('九歌·湘夫人', jiuge('湘夫人'), 'https://zh.wikisource.org/zh-hans/九歌#湘夫人', '祭歌', []),
    ('九歌·山鬼', jiuge('山鬼'), 'https://zh.wikisource.org/zh-hans/九歌#山鬼', '祭歌', []),
    ('九歌·国殇', jiuge('国殇'), 'https://zh.wikisource.org/zh-hans/九歌#國殤', '祭歌', []),
    ('九章·橘颂', jusong, 'https://www.gushiwen.cn/shiwenv_68fa5bcb6ef2.aspx', '咏物', jusong_notes),
    ('九章·涉江', shejiang, 'https://www.gushiwen.cn/shiwenv_05097d2057e0.aspx', '行旅与自叙', shejiang_notes),
    ('九歌·少司命', jiuge('少司命'), 'https://zh.wikisource.org/zh-hans/九歌#少司命', '祭歌', []),
]
jiuge_order = ['东皇太一', '云中君', '湘君', '湘夫人', '大司命', '少司命', '东君', '河伯', '山鬼', '国殇', '礼魂']
for title in jiuge_order:
    name = '九歌·' + title
    if not any(entry[0] == name for entry in entries):
        entries.append((name, jiuge(title), 'https://zh.wikisource.org/zh-hans/九歌', '祭歌', []))

jiuzhang_html = (CACHE / 'jiuzhang.html').read_text(encoding='utf-8')
jiuzhang_html = jiuzhang_html[jiuzhang_html.index('<p>惜诵以致愍'):]
jiuzhang_parts = re.split(r'<dl><dd><span style="font-size: 120%;">(.*?)</span></dd></dl>', jiuzhang_html)
jiuzhang_order = []
for index in range(0, len(jiuzhang_parts) - 1, 2):
    title = plain(jiuzhang_parts[index + 1])
    jiuzhang_order.append(title)
    name = '九章·' + title
    if any(entry[0] == name for entry in entries):
        continue
    original = plain(jiuzhang_parts[index])
    original = '\n'.join(re.findall(r'[^。！？\n]+[。！？]?', original))
    entries.append((name, original, 'https://zh.wikisource.org/zh-hans/楚辭/九章', '抒情诗', []))
if len(jiuzhang_order) != 9:
    raise ValueError('Expected nine Jiuzhang chapters')
order = ['离骚', '天问'] + ['九歌·' + title for title in jiuge_order] + ['九章·' + title for title in jiuzhang_order]
entries.sort(key=lambda entry: order.index(entry[0]))
minimums = {'离骚': 2400, '天问': 1500, '九歌·湘夫人': 200, '九歌·山鬼': 180,
            '九歌·国殇': 120, '九章·橘颂': 140, '九章·涉江': 350, '九歌·少司命': 150,
            '九歌·礼魂': 25}
path = ROOT / 'data/figures.json'
backup = CACHE / 'figures-before.json'
if not backup.exists():
    shutil.copy2(path, backup)
people = json.loads(path.read_text(encoding='utf-8'))
qu = next(p for p in people if p['slug'] == 'qu')
manifest = []
existing = {item['title']: item for item in qu['reader']['items']}
items = []
for title, text, url, kind, variants in entries:
    minimum = minimums.get(title, 50)
    chars = len(re.findall(r'[\u3400-\u9fff\U00020000-\U0002ffff]', text))
    if chars < minimum or '……' in text or '\ufffd' in text or '.mw-parser-output' in text or '编辑' in text:
        raise ValueError('Incomplete original: ' + title)
    item = existing.get(title, {'title': title, 'text': ''})
    item.pop('excerpt', None)
    item['fullText'] = text
    item['kicker'] = kind + ' / 全文'
    item['source'] = ['《' + title + '》原文底本', url]
    item['reference'] = '原文按所据底本完整收录，简体显示；通假、异文和校注不混入正文。'
    items.append(item)
    manifest.append({'title': title, 'source': url, 'characters': chars,
                     'lines': len(text.splitlines()), 'first': text.splitlines()[0],
                     'last': text.splitlines()[-1], 'variantNotes': variants,
                     'sha256': hashlib.sha256(text.encode()).hexdigest()})
qu['reader']['title'] = '楚辞原文'
qu['reader']['items'] = items
qu['reader']['intro'] = '二十二篇完整原文，含《离骚》《天问》及《九歌》《九章》各篇。长篇可展开阅读全文。'
items[0]['text'] = '整首诗以自叙为线索，把修养、遭遇、政治理想与神游想象交织起来。诗中的“我”既有对自身选择的坚持，也有反复思量与犹疑；现实处境与想象中的远游在长诗中相互映照。'
guoshang = next(item for item in items if item['title'] == '九歌·国殇')
guoshang['text'] = guoshang['text'].replace('末句有“魂魄毅兮”等异文。', '本页所据底本的末句为“魂魄毅兮为鬼雄”，另有不同异文。')
path.write_text(json.dumps(people, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(CACHE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'data/quyuan-text-sources.json').write_text(json.dumps({'updated':'2026-10-19', 'scope':'屈原页的二十二篇完整原文', 'rights':'古代原作，公有领域；未导入现代译文或现代赏析', 'method':'提取原文正文，移除网站导航、脚注和行内校注，保留底本文字与标点并调整换行。', 'works':manifest}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps([{'title': p['title'], 'characters': p['characters'], 'lines': p['lines']} for p in manifest], ensure_ascii=True))
