"""Copy generated portrait originals and encode WebP without cropping or resizing."""
from pathlib import Path
import hashlib
import json
import re
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'assets' / 'ink' / 'mobile'
INPUT = ROOT / 'tmp' / 'mobile-ink-20261019' / 'generation-files.json'
SOURCES = Path('C:/Users/Cheney/.codex/generated_images').resolve()

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    entries = json.loads(INPUT.read_text(encoding='utf-8'))
    output = []
    for key, value in entries.items():
        if not re.fullmatch('[a-z-]+', key):
            raise ValueError(f'Invalid asset name: {key}')
        source = Path(value).resolve()
        if not source.is_relative_to(SOURCES):
            raise ValueError(f'Unexpected source folder: {source}')
        original = DEST / f'{key}-v1.png'
        webp = DEST / f'{key}-v1.webp'
        if original.exists() and sha(original) != sha(source):
            raise ValueError(f'Original already exists with different content: {key}')
        if not original.exists():
            shutil.copy2(source, original)
        with Image.open(original) as art:
            width, height = art.size
            if height < width * 1.6:
                raise ValueError(f'Not a phone portrait composition: {key} {art.size}')
            if not webp.exists():
                art.save(webp, 'WEBP', quality=84, method=6)
        with Image.open(webp) as encoded:
            if encoded.size != (width, height):
                raise ValueError(f'Encoding changed dimensions: {key}')
        output.append({'id': key, 'original': original.name, 'webp': webp.name,
                       'width': width, 'height': height, 'bytes': webp.stat().st_size,
                       'sha256': sha(original)})
    (DEST / 'manifest-20261019.json').write_text(json.dumps({
        'date': '2026-10-19', 'mode': 'built-in image_gen',
        'processing': 'format encoding only; no crop, resize or recoloring',
        'assets': output,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'copied': len(output), 'webpBytes': sum(x['bytes'] for x in output)}))

if __name__ == '__main__':
    main()
