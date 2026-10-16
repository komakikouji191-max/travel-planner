"""Optional read-only network verification of the pinned public demo image bytes."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request

manifest = json.loads(Path('docs/remote-media-verification.json').read_text())
def verify(item):
    with urllib.request.urlopen(item['url'], timeout=30) as response:
        payload = response.read()
        assert response.status == 200
        assert response.headers.get('content-type', '').startswith('image/')
        assert hashlib.sha256(payload).hexdigest() == item['sha256'], item['file']
    return item['file']
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    for name in pool.map(verify, manifest['files']):
        print('PASS HTTPS, image type and SHA256:', name)
