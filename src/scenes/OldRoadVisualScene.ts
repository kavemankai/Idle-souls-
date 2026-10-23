import Phaser from 'phaser';
import { FACINGS, type Action, type Facing } from '../contracts/presentation';
import { paintOldRoad, ENVIRONMENT_TEXTURES } from '../presentation/environment';
import { ActorRenderer } from '../presentation/actorRenderer';
import { VisualSequence, type Composition } from '../presentation/visualSequence';
declare const __BUILD_SHA__: string;
export class OldRoadVisualScene extends Phaser.Scene {
  viewer = new VisualSequence();
  private actors: ActorRenderer[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private proxy!: Phaser.GameObjects.Graphics;
  private pivotLabel!: Phaser.GameObjects.Text;
  private debug = false;
  private reduced = false;
  private status!: HTMLElement;
  private calibration = false;
  constructor() { super('OldRoad'); }
  preload() {
    ENVIRONMENT_TEXTURES.forEach(key => this.load.image(key,`environments/runtime/${key}.png`));
    ['adventurer','sentry','mireling','mannequin'].forEach(key => this.load.atlas(key,`characters/runtime/${key}.png`,`characters/runtime/${key}.json`));
    ['slash','heavy','impact','landing'].forEach(key => this.load.image(`fx-${key}`,`vfx/runtime/${key}.png`));
  }
  create() {
    paintOldRoad(this);
    const initialParams=new URLSearchParams(location.search);
    if(initialParams.get('floor')==='dark') this.children.list.forEach(o=>{if(o instanceof Phaser.GameObjects.Image || o instanceof Phaser.GameObjects.TileSprite)o.setTint(0x667c78);});
    this.actors=['adventurer','sentry','mireling'].map(kind=>new ActorRenderer(this,kind));
    this.proxy=this.add.graphics().setDepth(999);
    this.pivotLabel=this.add.text(0,0,'',{fontFamily:'monospace',fontSize:'9px',color:'#efdfb9',backgroundColor:'#172b25dd',padding:{x:4,y:4}}).setDepth(1100).setVisible(false);
    const params=new URLSearchParams(location.search);
    this.calibration=['calibration','silhouette','attacks'].includes(params.get('scene')??'');
    if(['traversal','sentry','mireling','mixed'].includes(params.get('composition')??'')) this.viewer.composition=params.get('composition') as Composition;
    if(['idle','walk','guard','light','heavy','bash','leap','dodge','reaction','sequence'].includes(params.get('action')??'')) this.viewer.action=params.get('action') as Action;
    if(FACINGS.includes(params.get('facing') as Facing)) this.viewer.facing=params.get('facing') as Facing;
    if(params.has('t') && Number.isFinite(Number(params.get('t'))) && Number(params.get('t'))>=0) {this.viewer.time=Number(params.get('t'));this.viewer.paused=true;}
    this.debug=params.has('debug');this.reduced=params.has('reduced');
    if(this.calibration) {if(params.get('scene')==='silhouette') this.makeSilhouette();else if(params.get('scene')==='attacks')this.makeAttacks(params);else this.makeCalibration();}
    this.makeHUD();this.layout();
    this.scale.on('resize',this.layout,this);
    this.keys=this.input.keyboard!.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-G',()=>{this.viewer.action='guard';this.syncControls();});
    this.input.keyboard!.on('keydown-J',()=>{this.viewer.action='light';this.syncControls();});
    this.input.keyboard!.on('keydown-K',()=>{this.viewer.action='heavy';this.syncControls();});
    this.input.keyboard!.on('keydown-SPACE',()=>{this.viewer.paused=!this.viewer.paused;this.syncControls();});
    this.input.keyboard!.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    this.events.once('shutdown',()=>document.querySelector('#hud')?.remove());
    window.__VISUAL_READY__=true;
  }
  private makeAttacks(params: URLSearchParams) {
    this.children.removeAll(true);this.actors=[];
    const kind=['adventurer','sentry','mireling'].includes(params.get('actor')??'')?params.get('actor')!:'adventurer';
    const action=params.get('clip')??'light';
    for(let row=0;row<3;row++) FACINGS.forEach((facing,col)=>{
      const x=(col-3.5)*80,y=(row-1)*115;
      const name=`${kind}__${action}__${facing}__0${row}`;
      const exists=this.textures.get(kind).has(name);
      this.add.rectangle(x,y,77,108,exists?0x3e5146:0x3c3730,.7);
      if(exists)this.add.sprite(x,y,kind,name).setScale(.8);
      this.add.text(x,y-46,`${facing} / ${['windup','active','recovery'][row]}`,{fontSize:'8px',color:'#e2dec9'}).setOrigin(.5);
      if(!exists)this.add.text(x,y,'NOT AUTHORED',{fontSize:'7px',color:'#d8b886'}).setOrigin(.5);
      this.add.line(0,0,x-4,y,x+4,y,0xd8b875).setOrigin(0);
    });
  }
  private makeSilhouette() {
    this.children.removeAll(true);this.actors=[];
    for(let row=0;row<2;row++) {
      for(let col=0;col<3;col++) {
        const x=(col-1)*120,y=(row-.5)*135;
        this.add.rectangle(x,y,116,124,row?0x293a35:0x788174);
        this.add.image(x,y,'paving-2').setDisplaySize(110,116).setTint(row?0x435852:0xb9c0ac).setAlpha(.6);
        const kind=['adventurer','sentry','mireling'][col];
        this.add.sprite(x,y,kind,`${kind}__${kind==='mireling'?'walk':'guard'}__NE__01`).setScale(.7);
      }
    }
  }
  private makeCalibration() {
    this.children.removeAll(true);this.actors=[];
    this.cameras.main.setBackgroundColor('#1d2b28');
    for(let row=0;row<4;row++) {
      const actor=['mannequin','adventurer','sentry','mireling'][row];
      FACINGS.forEach((facing,col)=>{
        const x=(col-3.5)*80,y=(row-1.5)*105;
        this.add.rectangle(x,y,77,98,row%2?0x384a40:0x68746a,.6);
        const action=actor==='mireling'?'walk':'guard';
        this.add.sprite(x,y+4,actor,`${actor}__${action}__${facing}__01`).setScale(.8);
        this.add.text(x,y-43,`${facing}`,{fontSize:'10px',color:'#e2dec9'}).setOrigin(.5);
        this.add.text(x,y+40,actor,{fontSize:'9px',color:'#e2dec9'}).setOrigin(.5);
        this.add.line(0,0,x-4,y+4,x+4,y+4,0xd8b875).setOrigin(0);
      });
    }
  }
  private makeHUD() {
    const hud=document.createElement('div');hud.id='hud';if(this.calibration) hud.classList.add('calibration');
    hud.innerHTML=`<header><div class="brand"><span class="sigil">♜</span><div><span class="eyebrow">A VISUAL STUDY · 01</span><h1>Idle Souls</h1></div></div><div class="location"><span class="tiny-line"></span><span>OLD ROAD</span><span class="muted">/</span><span class="muted">Outer Road</span></div><span class="study-badge"><i></i> VISUAL-ONLY</span></header>
    <section class="scene-title"><p class="eyebrow">O1 &nbsp; / &nbsp; ASHEN RELIQUARY · PROPOSED</p><h2>${this.calibration?'The eight bearings':'Where the road remembers.'}</h2><p>${this.calibration?'Fixed +75° orthographic · actor yaw only':'Worn stone. Quiet ruins. Something still keeping watch.'}</p></section>
    <aside class="field-note"><span class="eyebrow">FIELD NOTE &nbsp; 001</span><p>A road between refuge<br>and the unknown.</p><div class="legend"><i class="hero-dot"></i> Adventurer <i class="sentry-dot"></i> Sentry <i class="mire-dot"></i> Mireling</div></aside>
    <section class="workbench" aria-label="Visual playback controls"><div class="bench-heading"><span class="eyebrow">ANIMATION STUDY</span><button id="pause" aria-label="Pause visual playback"></button></div><div class="controls"><label>Composition<select id="composition"><option value="traversal">Solo adventurer</option><option value="sentry">Sentry study</option><option value="mireling">Mireling study</option><option value="mixed">Mixed composition</option></select></label><label>Pose<select id="action"><option value="sequence">Exhibition sequence</option>${['idle','walk','guard','light','heavy','bash','leap','dodge','reaction'].map(a=>`<option value="${a}">${a==='bash'?'Sentry bash':a==='leap'?'Mireling leap':a[0].toUpperCase()+a.slice(1)}</option>`).join('')}</select></label><label>Facing<select id="facing">${FACINGS.map(f=>`<option>${f}</option>`).join('')}</select></label></div><div class="toggles"><button id="proxy" aria-pressed="${this.debug}">Feet & proxies</button><button id="reduced" aria-pressed="${this.reduced}">Reduced FX</button><a href="${this.calibration?'?':'?scene=calibration'}">${this.calibration?'Old Road ↗':'Compass sheet ↗'}</a></div><p id="status" aria-live="off"></p></section>
    <div class="touch-move" aria-label="Visual movement"><button data-move="0,-1" aria-label="Move north">↑</button><div><button data-move="-1,0" aria-label="Move west">←</button><button data-move="0,1" aria-label="Move south">↓</button><button data-move="1,0" aria-label="Move east">→</button></div></div>
    <footer><span class="desktop-help">WASD / arrows to move &nbsp; · &nbsp; G guard &nbsp; J light &nbsp; K heavy</span><span>Visual movement · no collision or combat</span><span id="build">${__BUILD_SHA__} · PHASER ${Phaser.VERSION}</span></footer>`;
    document.body.append(hud);this.status=hud.querySelector('#status')!;
    const select=(id:string,fn:(v:string)=>void)=>hud.querySelector<HTMLSelectElement>(`#${id}`)!.addEventListener('change',e=>fn((e.target as HTMLSelectElement).value));
    select('composition',v=>{this.viewer.composition=v as Composition;});
    select('action',v=>{this.viewer.action=v as Action;});select('facing',v=>{this.viewer.facing=v as Facing;});
    hud.querySelector('#pause')!.addEventListener('click',()=>{this.viewer.paused=!this.viewer.paused;this.syncControls();});
    hud.querySelector('#proxy')!.addEventListener('click',e=>{this.debug=!this.debug;(e.currentTarget as HTMLElement).setAttribute('aria-pressed',String(this.debug));});
    hud.querySelector('#reduced')!.addEventListener('click',e=>{this.reduced=!this.reduced;(e.currentTarget as HTMLElement).setAttribute('aria-pressed',String(this.reduced));});
    hud.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(b=>{
      b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);this.touch=b.dataset.move!.split(',').map(Number);});
      ['pointerup','pointercancel','lostpointercapture'].forEach(event=>b.addEventListener(event,()=>{this.touch=[0,0];}));
    });
    this.syncControls();
    if(this.calibration) this.status.textContent='Source frame 2 · fixed +75° orthographic · no mirroring';
  }
  private touch=[0,0];
  private syncControls() {
    for(const id of ['composition','action','facing'] as const) document.querySelector<HTMLSelectElement>(`#${id}`)!.value=this.viewer[id];
    document.querySelector('#pause')!.textContent=this.viewer.paused?'Play':'Pause';
    document.querySelector('#pause')!.setAttribute('aria-label',this.viewer.paused?'Play visual playback':'Pause visual playback');
  }
  private layout() {
    const w=this.scale.width,h=this.scale.height,portrait=w<600 && h>w;
    const zoom=this.calibration?Math.min((w-28)/650,(h-230)/440):portrait?1.18:Math.max(1.08,Math.min((w-100)/700,(h-200)/440));
    const camera=this.cameras.main;
    camera.setZoom(Math.max(.55,zoom));
    // Scene focus sits in the free area above the bottom study controls.
    camera.setViewport(0,portrait?85:h<500?57:65,w,portrait?h-320:h<500?h-90:h-115);
    camera.centerOn(portrait?this.viewer.hero.x+65:30,portrait?0:h<500?20:0);
    document.documentElement.style.setProperty('--scene-zoom',String(zoom));
  }
  update(_time:number,delta:number) {
    if(!this.keys) return;
    const inForm=['SELECT','INPUT'].includes(document.activeElement?.tagName??'');
    const dx=this.touch[0]+(inForm?0:Number(this.keys.RIGHT.isDown||this.keys.D.isDown)-Number(this.keys.LEFT.isDown||this.keys.A.isDown));
    const dy=this.touch[1]+(inForm?0:Number(this.keys.DOWN.isDown||this.keys.S.isDown)-Number(this.keys.UP.isDown||this.keys.W.isDown));
    this.viewer.update(delta,dx,dy);
    if(this.scale.width<600 && this.scale.height>this.scale.width && !this.calibration) this.cameras.main.centerOn(this.viewer.hero.x+65,this.viewer.hero.y-35);
    if(this.calibration) return;
    const snapshot=this.viewer.read(Boolean(dx||dy));
    const results=snapshot.actors.map((actor,i)=>this.actors[i].draw(actor,this.debug,this.reduced));
    this.proxy.clear();
    if(this.debug) {
      this.proxy.lineStyle(1,0xdfb978,.85).strokeCircle(10,-125,27);
      this.proxy.lineStyle(1,0x9cae97,.5).strokeRect(-240,-220,480,440);
      this.proxy.lineStyle(1,0xd8c496,.6).strokeRect(-267,-217,245,45).strokeRect(123,-217,114,45).strokeRect(-267,169,245,45).strokeRect(123,169,114,45);
    }
    const hero=snapshot.actors[0];
    this.pivotLabel.setVisible(this.debug).setPosition(hero.x+17,hero.y+14).setText(`world feet (${Math.round(950+hero.x)}, ${Math.round(1750+hero.y)})\nr13 proposed proxy · not sword bounds`);
    this.status.textContent=results[0].missing?`${hero.action} ${hero.facing}: view unavailable · showing idle`:`${hero.action} / ${hero.phase} · ${hero.facing} · ${Math.round(results[0].width)}px silhouette`;
    window.__VISUAL_STATE__={source:snapshot.source,hero,zoom:this.cameras.main.zoom,build:__BUILD_SHA__,viewport:[this.scale.width,this.scale.height],missing:results.map(r=>r.missing)};
  }
}
declare global { interface Window { __VISUAL_READY__: boolean; __VISUAL_STATE__: unknown } }
