import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, Group, RepeatWrapping, SRGBColorSpace } from 'three';
import type { Game } from '../game/engine';
import { ORIGINAL_TERRAIN, terrainCellSNES } from '../game/originalTerrain';
import { ORIGINAL_JUNGLE_ORIGIN } from '../game/originalJungle';
const CHUNK_COLUMNS = 16, STRIP_PIXELS = 1, FRONT = 1.6, BACK = -1.6;
function noise(seed:number) { const n=Math.sin(seed*127.1+311.7)*43758.5453; return n-Math.floor(n); }
/** Render the union of every solid metatile segment, keeping stacked shelves,
 * overhangs and tunnels. Never reduce a column to its maximum floor height.
 * One original pixel per strip, matching the collision profiles.
 */
export function createOriginalGroundGeometry(firstColumn:number,columnCount=CHUNK_COLUMNS) {
  const positions:number[]=[], uvs:number[]=[], colors:number[]=[];
  function quad(points:number[][],tint:string,seed:number) {
    const shade=new Color(tint).multiplyScalar(0.85+noise(seed)*0.3);
    for(const i of [0,1,2,0,2,3]) {
      const [x,y,z]=points[i];positions.push(x,y,z);uvs.push(x*0.7,y*0.7);
      colors.push(shade.r,shade.g,shade.b);
    }
  }
  const max=Math.min(ORIGINAL_TERRAIN.widthPixels,(firstColumn+columnCount)*32);
  for(let px=firstColumn*32;px<max;px+=STRIP_PIXELS) {
    const intervals:{bottom:number;left:number;right:number}[]=[];
    for(let row=15;row>=0;row--) {
      const left=terrainCellSNES(px,row), right=terrainCellSNES(px+STRIP_PIXELS-1,row);
      if((left?.localHeight??0)<=0 && (right?.localHeight??0)<=0)continue;
      const bottom=(15-row)*32, l=left?.floorY??bottom, r=right?.floorY??bottom,
        previous=intervals[intervals.length-1];
      if(previous && bottom<=Math.min(previous.left,previous.right)+1) {
        previous.left=Math.max(previous.left,l);previous.right=Math.max(previous.right,r);
      } else intervals.push({bottom,left:l,right:r});
    }
    const x0=px/32,x1=(px+STRIP_PIXELS)/32;
    intervals.forEach((span,i)=>{
      const y0=(span.bottom-ORIGINAL_JUNGLE_ORIGIN.y)/32,
        yl=(span.left-ORIGINAL_JUNGLE_ORIGIN.y)/32,
        yr=(span.right-ORIGINAL_JUNGLE_ORIGIN.y)/32,
        seed=Math.floor(px/12)+i*19;
      // The lowest shelf is backed by a recessed cliff, so cropped ROM
      // collision cells do not look like unrelated cubes hanging in space.
      // This backing is behind the playable slab, never in the actor corridor.
      if(i===0 && y0>-10) {
        const cliffZ=-1.8, base=-12;
        quad([[x0,base,cliffZ],[x1,base,cliffZ],[x1,y0,cliffZ],[x0,y0,cliffZ]],'#3f382b',Math.floor(px/96));
        quad([[x0,y0,cliffZ],[x1,y0,cliffZ],[x1,y0,BACK],[x0,y0,BACK]],'#4a3f2b',Math.floor(px/96));
      }
      const branch=y0>1 && yl>3;
      quad([[x0,y0,FRONT],[x1,y0,FRONT],[x1,yr,FRONT],[x0,yl,FRONT]],branch?'#674b2e':yl<-.5?'#473d30':'#776046',Math.floor(px/96)+i*19);
      quad([[x1,y0,BACK],[x0,y0,BACK],[x0,yl,BACK],[x1,yr,BACK]],branch?'#493923':'#504733',Math.floor(px/96)+i*19);
      quad([[x0,yl,FRONT],[x1,yr,FRONT],[x1,yr,BACK],[x0,yl,BACK]],branch?'#8b7842':yl<-.5?'#544732':'#657c32',Math.floor(px/96)+i*19+3);
      quad([[x0,y0,BACK],[x1,y0,BACK],[x1,y0,FRONT],[x0,y0,FRONT]],'#392e23',seed);
      if(branch && px%128===0) {
        const lower=i>0?(intervals[i-1].left-ORIGINAL_JUNGLE_ORIGIN.y)/32:-1;
        const trunkZ=-1.85, radius=.24;
        for(let side=0;side<8;side++) {
          const a=side*Math.PI/4,b=(side+1)*Math.PI/4;
          const xa=x0+Math.cos(a)*radius,za=trunkZ+Math.sin(a)*radius;
          const xb=x0+Math.cos(b)*radius,zb=trunkZ+Math.sin(b)*radius;
          quad([[xa,lower,za],[xb,lower,zb],[xb,y0+.08,zb],[xa,y0+.08,za]],'#5d472d',side);
        }
      }
      // End caps retain finite ledge silhouettes at each depth interval. The
      // neighbouring strips share edges; extra interior caps are avoided.
      if(px===firstColumn*32)quad([[x0,y0,BACK],[x0,y0,FRONT],[x0,yl,FRONT],[x0,yl,BACK]],'#564531',seed);
      if(px+STRIP_PIXELS===max)quad([[x1,y0,FRONT],[x1,y0,BACK],[x1,yr,BACK],[x1,yr,FRONT]],'#564531',seed);
    });
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new Float32BufferAttribute(uvs,2));
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
function soilTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d')!,data=ctx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const i=(y*128+x)*4, n=0.48+noise(x+y*128)*0.3+
      Math.sin(y*0.17+Math.sin(x*0.07)*1.3)*0.065;
    data.data[i]=data.data[i+1]=data.data[i+2]=Math.round(n*255);data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);const map=new CanvasTexture(canvas);
  map.wrapS=map.wrapT=RepeatWrapping;map.colorSpace=SRGBColorSpace;return map;
}
function GroundChunk({game,index,map}:{game:Game;index:number;map:CanvasTexture}) {
  const root=useRef<Group>(null), geometry=useMemo(()=>createOriginalGroundGeometry(index*CHUNK_COLUMNS),[index]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useFrame(()=>{if(root.current)root.current.visible=Math.abs(index*CHUNK_COLUMNS+CHUNK_COLUMNS/2-game.player.x)<28;});
  return <group ref={root}><mesh geometry={geometry}>
    <meshStandardMaterial map={map} bumpMap={map} bumpScale={0.035} vertexColors roughness={1}/>
  </mesh></group>;
}
export const OriginalGround=memo(function OriginalGround({game}:{game:Game}) {
  const map=useMemo(soilTexture,[]);useEffect(()=>()=>map.dispose(),[map]);
  return <>{Array.from({length:Math.ceil(169/CHUNK_COLUMNS)},(_,i)=><GroundChunk key={i} game={game} index={i} map={map}/>)}</>;
});
