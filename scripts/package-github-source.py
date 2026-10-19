"""Package only project source/public assets, excluding runtime and private material."""
from pathlib import Path
import json
import re
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
stage = root / 'deploy' / 'github-source'
stage.mkdir(parents=True, exist_ok=True)
folders = ['about', 'admin', 'assets', 'craft', 'figures', 'writing', 'works',
           'interaction', 'journey', 'travels', 'pastimes', 'data', 'scripts', 'server', 'tests', '.github']
extensions = {'.html', '.css', '.js', '.cjs', '.mjs', '.json', '.py', '.png', '.webp',
              '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.ttf', '.mp3', '.mp4', '.yml', '.yaml'}
files = []
for folder in folders:
    for file in (root / folder).rglob('*'):
        if not file.is_file() or file.is_symlink() or file.suffix.lower() not in extensions:
            continue
        rel = file.relative_to(root)
        name = rel.as_posix()
        if name.startswith('assets/design/') or re.search(r'prompts?-|manifest-|review-|preview-', name, re.I):
            continue
        if folder == 'data' and ('prompt' in file.name or file.name.endswith('-sources.json') or file.name.startswith('lines-expansion')):
            continue
        files.append(file)
for name in ['index.html', 'books.html', 'henan.html', 'poems.json', 'admire-dark.png', 'hero-night.png',
             'interaction-desktop.png', 'mobile-hero-final.png', 'server.js', 'package.json', 'README.md', '.gitignore']:
    file = root / name
    if file.is_file():
        files.append(file)
secret = re.compile(rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[A-Z0-9]{16})')
manifest = []
for file in sorted(set(files)):
    rel = file.relative_to(root)
    payload = file.read_bytes()
    if file.suffix.lower() in {'.html', '.js', '.cjs', '.mjs', '.json', '.py', '.yml', '.yaml'} and secret.search(payload):
        raise RuntimeError('Potential secret found in ' + str(rel))
    target = stage / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(file, target)
    manifest.append({'path': rel.as_posix(), 'bytes': len(payload)})
archive = root / 'deploy' / 'cheney-source.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=5) as package:
    for item in manifest:
        package.write(stage / item['path'], item['path'])
report = {'files': len(manifest), 'sourceBytes': sum(item['bytes'] for item in manifest),
          'zipBytes': archive.stat().st_size, 'archive': str(archive),
          'excluded': ['runtime data', 'passwords', 'sessions', 'private messages', 'novel manuscripts', 'local skills', 'local settings', 'project history', 'deployment credentials']}
(root / 'deploy' / 'github-source-manifest.json').write_text(json.dumps({**report, 'filesDetail': manifest}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False))
