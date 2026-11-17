"""Publish the reviewed plain-text variants without composing new wording."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
catalog = json.loads((ROOT / 'scripts/data/profile-gemini-copy.json').read_text())
items = [row for row in catalog['items'] if row['kind'] == 'Plain-text block']
assert len(items) == 11
for language, field, relative in [
    ('en', 'english', 'profile/summary.txt'),
    ('th', 'thai', 'th/profile/summary.txt'),
]:
    target = ROOT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text('\n\n'.join(row[field] for row in items) + '\n')
print('Built both plain-text profiles from the approved Gemini review.')
