import re
h = open('light_mode_ref/code.html', encoding='utf-8').read()
# main content
m = re.search(r'<main[^>]*>(.*?)</main>', h, re.S)
main = m.group(1) if m else ''
open('frontend/src/pages/homeContentNew.js.tmp', 'w', encoding='utf-8').write(main)
# scripts at bottom: find all <script> not src
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', h, re.S)
js = '\n'.join(scripts)
open('frontend/src/pages/homeScripts.js.tmp', 'w', encoding='utf-8').write(js)
print('main len', len(main), 'scripts len', len(js))