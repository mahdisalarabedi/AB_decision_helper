"""Stitch the hut together: modules -> one self-contained HTML page.
Run: python3 build.py
Order matters: helpers before the parts that use them.
"""
from pathlib import Path

ROOT = Path(__file__).parent
OUT = Path('/mnt/user-data/outputs/antibiotic-helper.html')

CSS = ['styles/main.css']
JS = [
    'content/cough.js',   # foundation  — clinical data
    'content/sore-throat.js',
    'content/uti.js',
    'content/diarrhoea.js',
    'content/otitis-media.js',
    'src/engine.js',      # walls       — decision engine
    'src/ui/dom.js',      # helpers
    'src/ui/fields.js',   # inputs
    'src/ui/entry.js',    # door
    'src/ui/wizard.js',   # rooms
    'src/ui/review.js',   # review
    'src/ui/results.js',  # windows
    'src/app.js',         # frame       — state + router (last)
]

def bundle(files):
    return '\n'.join(f'/* ===== {f} ===== */\n' + (ROOT / f).read_text(encoding='utf-8') for f in files)

html = (ROOT / 'index.html').read_text(encoding='utf-8')
html = html.replace('/*{{CSS}}*/', bundle(CSS)).replace('/*{{JS}}*/', bundle(JS))
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding='utf-8')
print(f'Built {OUT} ({len(html):,} bytes)')
