import {afterEach, describe, expect, it, vi} from 'vitest';
import {AudioSystem} from '../src/game/audio';
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
function harness(){
  const source={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn()};
  const context={state:'running',currentTime:0,createBufferSource:()=>({...source}),decodeAudioData:vi.fn(async()=>({})),resume:vi.fn(async()=>{context.state='running';})};
  const a=new AudioSystem();a.context=context as unknown as AudioContext;a.master={} as GainNode;
  const manifest={music:{'0':{id:0,url:'/jungle.m4a'},'16':{id:16,url:'/bonus.m4a'}},effects:{'33':{id:33,url:'/banana.m4a'}}};
  const fetcher=vi.fn(async()=>({ok:true,json:async()=>manifest,arrayBuffer:async()=>new ArrayBuffer(8)}));
  vi.stubGlobal('fetch',fetcher);
  class FakeAudio {paused=true;ended=false;volume=0;preload='';loop=false;currentTime=0;play=vi.fn(async()=>{this.paused=false;});pause(){this.paused=true;}addEventListener(){} }
  vi.stubGlobal('Audio',FakeAudio);
  return {a,context,source,fetcher};
}
describe('audio recovery across bonus scenes',()=>{
  it('returns from bonus music to the jungle with live effects and resumes a suspended context',async()=>{
    const {a,context,source}=harness();
    a.play('jungle');await flush();expect(a.inspect().trackId).toBe(0);
    a.play('bonus');await flush();expect(a.inspect().trackId).toBe(16);
    context.state='suspended';a.play('jungle');await flush();
    expect(context.resume).toHaveBeenCalled();expect(a.inspect().trackId).toBe(0);
    a.effect('banana');await flush();await flush();expect(source.start).toHaveBeenCalledOnce();a.stop();
  });
  it('retries a failed effect download instead of caching the rejection forever',async()=>{
    const {a,fetcher,source}=harness();a.play();await flush();
    fetcher.mockRejectedValueOnce(new Error('Temporary connection loss'));
    a.effect('banana');await flush();expect(source.start).not.toHaveBeenCalled();
    a.effect('banana');await flush();await flush();expect(source.start).toHaveBeenCalledOnce();a.stop();
  });
  it('retries a failed manifest and respects mute while recovering',async()=>{
    const {a,fetcher,context,source}=harness();fetcher.mockRejectedValueOnce(new Error('Offline'));
    a.play();await flush();a.play();await flush();expect(a.inspect().manifestLoaded).toBe(true);
    context.state='suspended';a.muted=true;a.wake();a.effect('banana');await flush();
    expect(context.resume).not.toHaveBeenCalled();expect(source.start).not.toHaveBeenCalled();a.stop();
  });
});
