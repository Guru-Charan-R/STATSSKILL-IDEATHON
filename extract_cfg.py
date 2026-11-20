import re
for f in ['dark_mode_ref/code.html','light_mode_ref/code.html']:
    h = open(f, encoding='utf-8').read()
    m = re.search(r'<script id="tailwind-config">(.*?)</script>', h, re.S)
    cfg = m.group(1) if m else ''
    open(f.replace('code.html','tailwind_config.txt'), 'w', encoding='utf-8').write(cfg)
    print('===', f, 'len', len(cfg))