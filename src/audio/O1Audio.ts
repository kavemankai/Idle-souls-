import type { ActorView } from '../contracts/presentation';
import type { SimFight, SimEvent, SimFighter } from '../combat/simApi';

export const TRACKS = [
 { id:'whispers', title:'Whispers in the Fog' },
 { id:'town_ruins', title:'Town in Ruins' },
 { id:'cathedral', title:'Cathedral in the Forest' },
 { id:'pursuit', title:'Determined Pursuit' },
 { id:'boss', title:'Epic Boss Battle' },
] as const;
export type TrackId = typeof TRACKS[number]['id'];
export const CUE_IDS = [
 'step_hero','step_sentry','step_mireling','sword_swing','heavy_swing','sword_hit',
 'shield_block','perfect_block','parry','stagger','mireling_bite','mireling_death',
 'sentry_death','hero_death','dodge','ui_select','ui_dispatch','ui_success','ui_failure','threshold'
] as const;
export type CueId = typeof CUE_IDS[number];

export function classifyCombatEvent(e: Pick<SimEvent,'text'|'kind'>): CueId | null {
 const t=e.text.toLowerCase();
 if (/perfect block/.test(t)) return 'perfect_block';
 if (/parried/.test(t)) return 'parry';
 if (/blocks|blocked/.test(t)) return 'shield_block';
 if (/guard broken|breaks .+ guard|staggered|interrupts/.test(t)) return 'stagger';
 if (/dodged|rolled through/.test(t)) return 'dodge';
 if (/is down|falls|defeated/.test(t)) return /mireling/.test(t)?'mireling_death':/sentry/.test(t)?'sentry_death':'hero_death';
 if (/hit by| hits | glances off |took [0-9]+/.test(t)) return 'sword_hit';
 return null;
}

/** No gameplay state is written from this audio-only director. */
export class O1Audio {
 private enabled=false;
 private musicEl: HTMLAudioElement | null=null;
 private windEl: HTMLAudioElement | null=null;
 private sounds=new Set<HTMLAudioElement>();
 private track:TrackId='whispers';
 private musicGain=.45;
 private sfxGain=.6;
 private state='ready';
 private fight:SimFight|null=null;
 private eventsRead=0;
 private actions=new Map<string,number>();
 private lastStep=new Map<string,{x:number,y:number,at:number}>();
 private elapsed=0;
 private ended=false;

 get isEnabled(){return this.enabled;}
 get selectedTrack(){return this.track;}
 enable(){
  if(this.enabled)return;
  this.enabled=true;
  this.musicEl=new Audio('/audio/music/'+this.track+'.ogg');
  this.musicEl.loop=true;this.musicEl.preload='none';
  this.windEl=new Audio('/audio/ambience/wind.ogg');
  this.windEl.loop=true;this.windEl.preload='none';
  this.applyVolume();
  void this.musicEl.play().catch(()=>{});
  void this.windEl.play().catch(()=>{});
 }
 disable(){
  this.enabled=false;this.musicEl?.pause();this.windEl?.pause();
  this.musicEl=null;this.windEl=null;
  for(const a of this.sounds){a.pause();a.src='';}
  this.sounds.clear();
 }
 toggle(){if(this.enabled)this.disable();else this.enable();}
 setTrack(value:string){
  if(!TRACKS.some(t=>t.id===value))return;
  this.track=value as TrackId;
  if(!this.enabled)return;
  this.musicEl?.pause();
  this.musicEl=new Audio('/audio/music/'+this.track+'.ogg');
  this.musicEl.loop=true;this.musicEl.preload='none';
  this.applyVolume();void this.musicEl.play().catch(()=>{});
 }
 setLevels(music:number,sfx:number){
  this.musicGain=Math.max(0,Math.min(1,music));
  this.sfxGain=Math.max(0,Math.min(1,sfx));
  this.applyVolume();
 }
 private applyVolume(){
  const duck=this.state==='fighting'?.55:this.state==='defeated'?.2:1;
  if(this.musicEl)this.musicEl.volume=this.musicGain*duck*.65;
  if(this.windEl)this.windEl.volume=this.musicGain*.20;
 }
 play(cue:CueId,gain=1){
  if(!this.enabled||!this.sfxGain||this.sounds.size>=12)return;
  const audio=new Audio('/audio/cues/'+cue+'.ogg');
  audio.volume=Math.min(1,this.sfxGain*gain);audio.preload='none';
  this.sounds.add(audio);
  const remove=()=>{this.sounds.delete(audio);};
  audio.addEventListener('ended',remove,{once:true});
  audio.addEventListener('error',remove,{once:true});
  void audio.play().catch(remove);
 }
 reset(){
  this.fight=null;this.eventsRead=0;this.actions.clear();this.lastStep.clear();
  this.elapsed=0;this.state='ready';this.ended=false;this.applyVolume();
 }
 update(deltaMs:number,state:string,fight:SimFight|null,actors:readonly ActorView[]){
  this.elapsed+=Math.max(0,Math.min(100,deltaMs));
  if(this.state!==state){
   this.state=state;this.applyVolume();
   if(this.enabled&&state==='fighting')this.play('ui_select',.25);
   if(this.enabled&&state==='completed'&&!this.ended){this.play('threshold',.65);this.ended=true;}
   if(this.enabled&&state==='defeated'&&!this.ended){this.play('ui_failure',.45);this.ended=true;}
  }
  if(fight!==this.fight){this.fight=fight;this.eventsRead=0;this.actions.clear();}
  if(fight&&this.enabled){
   for(const event of fight.events.slice(this.eventsRead)){
    const cue=classifyCombatEvent(event);
    if(cue)this.play(cue,cue==='sword_hit'?.5:.65);
   }
   this.eventsRead=fight.events.length;
   const fighters:[string,SimFighter][]=[['hero',fight.p],['enemy',fight.enemies[0]]];
   for(const [id,f] of fighters){
    if(!f||!f.act||f.dead)continue;
    const k=id+':'+f.act.id;
    if(this.actions.get(k)===f.actInst)continue;
    this.actions.set(k,f.actInst);
    if(f.act.kind==='dodge')this.play('dodge',.26);
    else if(f.act.kind==='attack')this.play(f.act.id==='bite'?'mireling_bite':f.act.id==='heavy'||f.act.id==='bash'?'heavy_swing':'sword_swing',.45);
   }
  }
  if(!this.enabled)return;
  for(const a of actors){
   if(!a.visible||a.action!=='walk'){this.lastStep.delete(a.id);continue;}
   const prev=this.lastStep.get(a.id);
   if(prev&&Math.hypot(a.x-prev.x,a.y-prev.y)>1&&this.elapsed-prev.at>=280){
    const cue=a.kind==='mireling'?'step_mireling':a.kind==='sentry'?'step_sentry':'step_hero';
    this.play(cue,a.kind==='mireling'?.17:.24);
    this.lastStep.set(a.id,{x:a.x,y:a.y,at:this.elapsed});
   }else if(!prev)this.lastStep.set(a.id,{x:a.x,y:a.y,at:this.elapsed});
  }
 }
 destroy(){this.disable();}
}
