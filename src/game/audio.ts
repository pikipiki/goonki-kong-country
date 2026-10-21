/** Audio captured from the user's identified Rev 2 ROM through its real SPC driver.
 * Asset provenance and imperfect loop-boundary limits live in /audio/manifest.json.
 * Music streams through HTMLAudio to avoid decoding minutes of PCM into mobile RAM.
 */
type Music = {id:number; name:string; url:string; seconds:number; loop:{startSeconds:number;endSeconds:number;samplePerfect:boolean}|null};
type Effect = {id:number;name:string;url:string;seconds:number};
type Manifest = {music:Record<string,Music>;effects:Record<string,Effect>;provenance:unknown};
type Context = {character?:number; animal?:string; letterIndex?:number};
const MUSIC:Record<string,number> = {title:9,map:12,jungle:0,canopy:19,mine:4,lagoon:3,snow:5,temple:6,ship:24,clear:26,gameover:15,victory:14};
const ONCE = new Set([10,15,17,18,25,26]);
export class AudioSystem {
  context?:AudioContext;
  muted=false;
  master?:GainNode;
  music?:HTMLAudioElement;
  manifest?:Manifest;
  private manifestPromise?:Promise<Manifest>;
  private buffers=new Map<number,AudioBuffer>();
  private loading=new Map<number,Promise<AudioBuffer>>();
  private voices=new Set<AudioBufferSourceNode>();
  private currentId=-1;
  private desiredId=-1;
  private generation=0;
  private active=false;
  private loopTimer?:ReturnType<typeof setInterval>;
  onError:(message:string)=>void=()=>{};
  private loadManifest() {
    this.manifestPromise ??= fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
      .then(r=>{if(!r.ok)throw new Error('Audio manifest unavailable');return r.json() as Promise<Manifest>;})
      .then(m=>{this.manifest=m;return m;});
    return this.manifestPromise;
  }
  boot() {
    try {
      this.context ??= new AudioContext();
      if(!this.master){this.master=this.context.createGain();this.master.gain.value=this.muted?0:0.6;this.master.connect(this.context.destination);}
      void this.context.resume();
      void this.loadManifest().catch(()=>this.onError('Les sons ne sont pas encore disponibles.'));
      if(this.active&&this.music&&!this.muted)void this.music.play().catch(()=>{});
    }catch{/* A browser without audio still permits playing. */}
  }
  play(scene='jungle') {
    this.active=true;
    this.desiredId=MUSIC[scene]??0;
    const generation=++this.generation;
    void this.loadManifest().then(m=>{
      if(generation!==this.generation||!this.active)return;
      const entry=m.music[String(this.desiredId)];if(!entry)return;
      if(this.currentId!==entry.id||!this.music){
        this.music?.pause();
        this.currentId=entry.id;
        this.music=new Audio(this.assetUrl(entry.url));
        this.music.preload='auto';
        this.music.loop=!entry.loop&&!ONCE.has(entry.id);
        this.music.addEventListener('timeupdate',()=>this.applyLoop(entry));
      }
      this.music.volume=this.muted?0:0.48;
      if(!this.muted)void this.music.play().catch(()=>{});
      clearInterval(this.loopTimer);
      this.loopTimer=setInterval(()=>this.applyLoop(entry),30);
    }).catch(()=>this.onError('La musique n’a pas pu être chargée.'));
  }
  private assetUrl(url:string){return `${import.meta.env.BASE_URL}${url.replace(/^\//,'')}`;}
  private applyLoop(entry:Music){
    if(!this.music||this.currentId!==entry.id||!entry.loop||!this.active)return;
    const {startSeconds,endSeconds}=entry.loop;
    const t=this.music.currentTime;
    if(t<endSeconds-0.05)return;
    const overshoot=Math.min(Math.max(0,t-endSeconds),0.06);
    try{
      this.music.pause();
      this.music.currentTime=startSeconds+overshoot;
      if(!this.muted)void this.music.play().catch(()=>{});
    }catch{
      this.music.currentTime=startSeconds;
    }
  }
  stop(){this.active=false;this.generation++;this.music?.pause();clearInterval(this.loopTimer);}
  private effectId(name:string,c:Context):number|undefined{
    const direct:Record<string,number>={
      'banana':0x21,'banana-bunch':0x22,'life':0x2F,'stomp':0x08,'bounce':0x01,
      'cannon':0x04,'enter-cannon':0x26,'rescue':0x14,'mount':0x58,'swap':0x65,
      'barrel-break':0x14,'throw':0x02,'pickup':0x11,'place':0x11,'checkpoint':0x10,'reveal':0x10,
    };
    if(name==='hurt')return c.character?0x43:0x46;
    if(name==='letter')return 0x4F+Math.min(3,c.letterIndex??0);
    if(name==='jump'&&c.animal)return c.animal==='enguarde'?0x57:0x5F;
    if(name==='roll'&&c.animal==='rambi')return 0x56;
    if(name==='roll'&&c.animal==='enguarde')return 0x57;
    // Unidentified sounds remain silent rather than being replaced by generic tones.
    return direct[name];
  }
  effect(name:string,c:Context={}){
    if(this.muted||!this.context||!this.master)return;
    const id=this.effectId(name,c);if(id===undefined)return;
    void this.loadManifest().then(async m=>{
      const entry=m.effects[String(id)];if(!entry||this.muted||!this.context)return;
      let buffer=this.buffers.get(id);
      if(!buffer){
        let pending=this.loading.get(id);
        if(!pending){pending=fetch(this.assetUrl(entry.url)).then(r=>{if(!r.ok)throw new Error('Missing effect');return r.arrayBuffer();}).then(b=>this.context!.decodeAudioData(b));this.loading.set(id,pending);}
        buffer=await pending;this.buffers.set(id,buffer);this.loading.delete(id);
      }
      if(this.muted||!this.active||!this.context||!this.master)return;
      if(this.voices.size>=12){const oldest=this.voices.values().next().value;oldest?.stop();}
      const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.master);this.voices.add(source);
      source.onended=()=>{this.voices.delete(source);source.disconnect();};source.start();
    }).catch(()=>{});
  }
  toggle(){
    this.muted=!this.muted;
    if(this.master&&this.context)this.master.gain.setTargetAtTime(this.muted?0:0.6,this.context.currentTime,0.03);
    if(this.music){this.music.volume=this.muted?0:0.48;if(!this.muted&&this.active){this.boot();void this.music.play().catch(()=>{});}}
  }
  inspect(){return {trackId:this.currentId,trackName:this.manifest?.music[String(this.currentId)]?.name,currentTime:this.music?.currentTime??0,playing:!!this.music&&!this.music.paused,loadedEffects:this.buffers.size,muted:this.muted,manifestLoaded:!!this.manifest};}
}
