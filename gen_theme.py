import re, json

def parse_config(path):
    txt = open(path, encoding='utf-8').read()
    # colors
    idx = txt.find('colors:')
    start = txt.find('{', idx)
    depth = 0; i = start
    while i < len(txt):
        if txt[i]=='{': depth+=1
        elif txt[i]=='}':
            depth-=1
            if depth==0: break
        i+=1
    colors = dict(re.findall(r'"([^"]+)"\s*:\s*"(#[0-9A-Fa-f]{6})"', txt[start+1:i]))

    def get_obj(key):
        idx = txt.find(key+':')
        if idx < 0: return {}
        start = txt.find('{', idx)
        depth=0; i=start
        while i < len(txt):
            if txt[i]=='{': depth+=1
            elif txt[i]=='}':
                depth-=1
                if depth==0: break
            i+=1
        body = txt[start+1:i]
        return body

    spacing = dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', get_obj('spacing')))
    radius = dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', get_obj('borderRadius')))
    # fontFamily
    fonts = {}
    for m in re.finditer(r'"([^"]+)"\s*:\s*\[([^\]]+)\]', get_obj('fontFamily')):
        name = m.group(1)
        vals = re.findall(r'"([^"]+)"', m.group(2))
        fonts[name] = vals[0] if vals else 'Inter'
    # fontSize
    sizes = {}
    for m in re.finditer(r'"([^"]+)"\s*:\s*\["([^"]+)",\s*\{\s*"lineHeight"\s*:\s*"([^"]+)",\s*"fontWeight"\s*:\s*"([^"]+)"\s*\}\]', get_obj('fontSize')):
        sizes[m.group(1)] = (m.group(2), m.group(3), m.group(4))
    return colors, spacing, radius, fonts, sizes

lc, ls, lr, lf, lz = parse_config('light_mode_ref/tailwind_config.txt')
dc, ds, dr, df, dz = parse_config('dark_mode_ref/tailwind_config.txt')

allkeys = sorted(set(lc)|set(dc))

def emit_theme(name, colors, spacing, radius, fonts, sizes):
    out = [f'/* {name} tokens */']
    for k in sorted(set(spacing)|set(ds)|set(ls)):
        v = spacing.get(k, ls.get(k, '0'))
        out.append(f'  --spacing-{k}: {v};')
    for k in sorted(set(radius)|set(dr)|set(lr)):
        v = radius.get(k, lr.get(k, '0.125rem'))
        out.append(f'  --radius-{k}: {v};')
    for k in sorted(set(fonts)|set(lf)|set(df)):
        v = fonts.get(k, lf.get(k, 'Inter'))
        out.append(f'  --font-{k}: "{v}", sans-serif;')
    for k in sorted(set(sizes)|set(lz)|set(dz)):
        v = sizes.get(k, lz.get(k, ('1rem','1.5rem','400')))
        out.append(f'  --text-{k}: {v[0]};')
        out.append(f'  --text-{k}--line-height: {v[1]};')
        out.append(f'  --text-{k}--font-weight: {v[2]};')
    return '\n'.join(out)

lines = [':root {']
for k in allkeys:
    lines.append(f'  --{k}: {lc.get(k, dc.get(k))};')
lines.append('}')
lines.append('.dark {')
for k in allkeys:
    lines.append(f'  --{k}: {dc.get(k, lc.get(k))};')
lines.append('}')
theme = ['@theme {']
for k in allkeys:
    theme.append(f'  --color-{k}: var(--{k});')
theme.append(emit_theme('light', lc, ls, lr, lf, lz))
theme.append('}')
darktheme = ['.dark {']
darktheme.append(emit_theme('dark', dc, ds, dr, df, dz))
darktheme.append('}')

css = '\n'.join(lines) + '\n' + '\n'.join(theme) + '\n' + '\n'.join(darktheme) + '\n'
open('frontend/src/theme_vars.css','w',encoding='utf-8').write(css)
print('written', len(css), 'bytes')
