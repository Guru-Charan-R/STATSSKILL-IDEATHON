main = open('frontend/src/pages/homeContentNew.js.tmp', encoding='utf-8').read()
js = open('frontend/src/pages/homeScripts.js.tmp', encoding='utf-8').read()
# write html module
out = "export const homeHtmlNew = `\n" + main.replace('`','\\`').replace('${','\\${') + "\n`;\n"
open('frontend/src/pages/homeContentNew.js','w',encoding='utf-8').write(out)
# write scripts module
out2 = "export const homeScripts = `\n" + js.replace('`','\\`').replace('${','\\${') + "\n`;\n"
open('frontend/src/pages/homeScripts.js','w',encoding='utf-8').write(out2)
print('done')