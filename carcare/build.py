"""Validate local references and build the static site into dist/. Python 3.9+."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import shutil
ROOT = Path(__file__).resolve().parent
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src', 'href') and value: self.links.append(value)
errors = []
for page in ROOT.glob('*.html'):
    parser = Links(); parser.feed(page.read_text(encoding='utf-8'))
    for link in parser.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc or not parsed.path: continue
        target = ROOT / unquote(parsed.path)
        if not target.exists(): errors.append(f'{page.name}: missing {parsed.path}')
if errors: raise SystemExit('\n'.join(errors))
out = ROOT / 'dist'; out.mkdir(exist_ok=True)
for source in [*ROOT.glob('*.html'), ROOT/'style.css', ROOT/'app.js']:
    shutil.copy2(source, out/source.name)
shutil.copytree(ROOT/'assets', out/'assets', dirs_exist_ok=True)
print(f'Validated and built {len(list(ROOT.glob("*.html")))} pages into {out}')
