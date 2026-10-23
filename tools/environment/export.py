"""Deterministic editable vector-paint masters; no external imagery.
Each named group can be repainted in Inkscape/Krita; collision is separate JSON.
"""
from pathlib import Path
import random, json
import cairosvg
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'assets/environments/source'; OUT=ROOT/'assets/environments/runtime'
SRC.mkdir(parents=True,exist_ok=True); OUT.mkdir(parents=True,exist_ok=True)
random.seed(1847)
DEFS='''<defs>
<linearGradient id="stone" x2=".3" y2="1"><stop stop-color="#747d75"/><stop offset=".48" stop-color="#626e67"/><stop offset="1" stop-color="#475751"/></linearGradient>
<linearGradient id="wall" x2=".2" y2="1"><stop stop-color="#879087"/><stop offset="1" stop-color="#515f59"/></linearGradient>
<radialGradient id="soil"><stop stop-color="#4a4c3d"/><stop offset="1" stop-color="#252f2b"/></radialGradient>
<radialGradient id="light"><stop stop-color="#dfab6b" stop-opacity=".23"/><stop offset="1" stop-color="#dfab6b" stop-opacity="0"/></radialGradient>
</defs>'''
def save(name,w,h,body):
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{DEFS}{body}</svg>'
    (SRC/f'{name}.svg').write_text(svg)
    cairosvg.svg2png(bytestring=svg.encode(),write_to=str(OUT/f'{name}.png'))
# Broad uneven painted planes, quiet centers and wear clustered along edges.
for k in range(6):
    pts=[(5,random.randint(4,12)),(random.randint(45,60),3),(117,random.randint(4,12)),(124,55),(120,118),(64,125),(7,119),(2,64)]
    p=' '.join(f'{x},{y}' for x,y in pts)
    body=f'<g id="underpaint"><path d="M3 12L120 8 127 121 8 128Z" fill="#242e2a"/></g><g id="stone-planes"><polygon points="{p}" fill="url(#stone)" stroke="#3b4943" stroke-width="2"/><path d="M9 14L55 8 111 13" fill="none" stroke="#a1a99a" stroke-opacity=".4" stroke-width="3"/><path d="M12 113L65 119 113 113" fill="none" stroke="#34453f" stroke-width="5" opacity=".35"/></g>'
    body+='<g id="brush-wear" opacity=".24">'
    for j in range(6):
        x=random.randrange(12,108); y=random.choice([random.randrange(12,25),random.randrange(96,115)])
        body+=f'<path d="M{x} {y}q10 -2 18 0l-5 2-14 1Z" fill="#b2b39a"/>'
    body+='</g><g id="cracks" stroke="#354740" stroke-width="1.2" fill="none">'
    if k%2==0: body+='<path d="M3 52l19 6 10 -7 11 8m-11 -8 3 -19"/>'
    if k==3: body+='<path d="M124 91l-20 -8 -8 6 -8 -14 -22 -5"/>'
    body+='</g>'
    save(f'paving-{k}',128,128,body)
save('earth',256,256,'''<g id="earth-base"><rect width="256" height="256" fill="url(#soil)"/></g><g id="broad-brushes" fill="none" stroke-linecap="round" opacity=".19"><path d="M12 49Q85 18 173 35M48 79Q153 51 243 91M-10 201Q80 155 180 182M64 244Q164 194 244 216" stroke="#7d765b" stroke-width="11"/><path d="M-5 124Q92 99 207 136M20 223Q118 193 260 242" stroke="#172a25" stroke-width="20"/></g>''')
save('moss',192,160,'''<g id="soft-olive-underpainting" fill="#3d4b36" opacity=".55"><path d="M8 91Q29 37 69 61Q112 17 141 59Q187 62 177 117Q137 150 101 126Q50 157 8 91Z"/></g><g id="moss-brushes" fill="none" stroke-linecap="round"><path d="M24 92l16 -8m-8 22 28 -12m-3 -18 21 -10m10 34 29 -18m-3 -15 16 -7m12 44 19 -12m-21 22 21 -8m-90 14 18 -7" stroke="#66734b" stroke-width="5" opacity=".45"/><path d="M42 75l10 -5m48 4 15 -5m18 46 10 -4" stroke="#89916a" stroke-width="2" opacity=".38"/></g>''')
save('rubble',192,128,'''<g id="ground-shadow" fill="#14251f" opacity=".45"><ellipse cx="95" cy="84" rx="84" ry="27"/></g><g id="stone-chips" stroke="#38483f" stroke-width="2"><path d="M22 71l20 -22 35 7 8 27 -41 8Z" fill="#5d685d"/><path d="M97 84l-8 -34 36 -18 24 17 -4 38Z" fill="#6c7569"/><path d="M149 85l8 -20 20 8 -3 19Z" fill="#566457"/><path d="M60 100l16 -9 15 14 -30 4Z" fill="#777c69"/></g><g id="edge-paint" fill="none" stroke="#a7aa91" opacity=".45" stroke-width="2"><path d="M28 69l16 -16 26 5M95 50l29 -13 19 12M159 69l14 5"/></g>''')
# Short wall module with visible south elevation, individually layered blocks.
body='<g id="shadow"><path d="M9 48L242 44 255 119 25 126Z" fill="#10251e" opacity=".5"/></g><g id="south-face"><path d="M9 42L237 39 234 97 10 102Z" fill="#354b44"/></g>'
for row in range(2):
    for col in range(4):
        x=10+col*57+(7 if row else 0); y=43+row*27
        body+=f'<path d="M{x} {y}l52 -2 -1 24 -51 2Z" fill="{["#43594d","#4b5d51","#3e5148","#536353"][(row+col)%4]}" stroke="#2a4038" stroke-width="2"/>'
body+='<g id="capstone" fill="url(#wall)" stroke="#3b5045" stroke-width="2"><path d="M6 17L64 9 68 43 9 51Z"/><path d="M68 10L125 12 126 43 70 44Z"/><path d="M130 13L181 8 183 41 130 43Z"/><path d="M187 9L232 16 244 39 186 42Z"/></g><g id="edge-glaze" fill="none" stroke="#aab09b" opacity=".5" stroke-width="2"><path d="M12 20l49 -7M75 14l46 2M134 16l43 -4M191 13l37 7"/></g>'
save('wall',256,128,body)
save('pillar',240,280,'''<g id="shadow"><ellipse cx="135" cy="232" rx="83" ry="28" fill="#0f251e" opacity=".5"/></g><g id="plinth"><path d="M45 184L120 159 194 184 189 231 119 254 47 228Z" fill="#3c5148" stroke="#263f34" stroke-width="3"/><path d="M45 184L121 160 193 184 119 212Z" fill="#778275"/><path d="M54 185L119 166 181 185 119 205Z" fill="#929684"/></g><g id="shaft"><path d="M76 69L121 53 165 69 160 188 120 203 80 188Z" fill="#566b5d" stroke="#354b41" stroke-width="3"/><path d="M76 69L120 82 120 202 80 188Z" fill="#697b67"/><path d="M88 83L95 85 98 184 91 183Z" fill="#b0b49a" opacity=".25"/><path d="M135 83l9 -3 -4 106 -7 3Z" fill="#263f34" opacity=".3"/></g><g id="broken-cap"><path d="M62 46L99 26 119 39 141 23 177 45 174 76 122 95 65 77Z" fill="#788676" stroke="#394f42" stroke-width="3"/><path d="M63 46L99 26 119 39 141 23 177 45 122 66Z" fill="#a4aa91"/><path d="M120 39l-10 13 12 14M141 24l-5 22 12 9" fill="none" stroke="#657761" stroke-width="3"/></g><g id="moss" stroke="#738251" stroke-width="7" opacity=".6"><path d="M65 210l33 12m39 -20 28 -10M73 74l21 7"/></g>''')
save('marker',160,240,'''<g id="shadow"><ellipse cx="90" cy="208" rx="48" ry="18" fill="#0c211a" opacity=".5"/></g><g id="standing-stone"><path d="M51 205L48 79 69 28 102 21 119 65 114 207Z" fill="#687a69" stroke="#344d3d" stroke-width="4"/><path d="M51 78L69 28 101 22 98 195 57 204Z" fill="#8a947b"/><path d="M63 84l34 -8M66 95l27 -6M70 111l18 -3" stroke="#3c5743" stroke-width="3"/><path d="M75 136v35m-13 -17 24 -3" stroke="#bcc0a0" stroke-width="3" opacity=".5"/><path d="M61 46l8 -13 21 -7" fill="none" stroke="#c1c2a5" stroke-width="3" opacity=".4"/></g>''')
save('warm-light',512,512,'<g id="light-wash"><circle cx="256" cy="256" r="256" fill="url(#light)"/></g>')
# Paintable 2D effects: presentation examples only; no hit geometry.
fxsrc=ROOT/'assets/vfx/source'; fxout=ROOT/'assets/vfx/runtime'
fxsrc.mkdir(parents=True,exist_ok=True);fxout.mkdir(parents=True,exist_ok=True)
for name,shape in {
 'slash':'<path d="M29 96Q73 14 158 42Q99 31 54 106Z" fill="#ede8d3" opacity=".85"/><path d="M38 99Q90 35 151 42" fill="none" stroke="#fff9e6" stroke-width="2"/>',
 'heavy':'<path d="M92 155L22 44Q96 4 169 44Z" fill="#d9a064" opacity=".16" stroke="#e1ad70" stroke-width="3"/><path d="M65 58l28 -14 28 14m-43 21 15 -8 15 8" fill="none" stroke="#f4c28b" stroke-width="4"/>',
 'impact':'<path d="M96 29l6 46 22 -19 -14 31 43 9 -43 5 19 25 -29 -15 -7 43 -5 -44 -25 16 18 -26 -37 -5 38 -6 -12 -22 22 14Z" fill="#e2c48e"/>',
 'landing':'<ellipse cx="96" cy="96" rx="58" ry="39" fill="none" stroke="#cbd7ad" stroke-width="3" stroke-dasharray="9 6"/><path d="M96 43l-7 13h14Z" fill="#e0e3b9"/>'
}.items():
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><g id="{name}-paint">{shape}</g></svg>'
 (fxsrc/f'{name}.svg').write_text(svg); cairosvg.svg2png(bytestring=svg.encode(),write_to=str(fxout/f'{name}.png'))
(ROOT/'assets/environments/runtime/props.json').write_text(json.dumps({'status':'VISUAL-ONLY proposed proxies; no collision engine','origin':[950,1750],'clearFloor':[480,440],'pillar':{'x':10,'y':-125,'radius':27,'movement':'proposed-blocking','sight':'unverified','projectiles':'unverified'}},indent=2)+'\n')
print('Exported modular SVG paint masters, environment PNGs, independent VFX and proposed proxy metadata')
