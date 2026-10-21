import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, Group, RepeatWrapping, SRGBColorSpace } from 'three';
import type { Game } from '../game/engine';
import { ORIGINAL_TERRAIN } from '../game/originalTerrain';
import { terrainSolidSpans, type SolidSpan } from '../game/terrainSolids';
import { ORIGINAL_JUNGLE_ORIGIN } from '../game/originalJungle';
const CHUNK_COLUMNS = 16, STRIP_PIXELS = 1, FRONT = 1.6, BACK = -1.6;
function noise(seed:number) { const n=Math.sin(seed*127.1+311.7)*43758.5453; return n-Math.floor(n); }
/** Render the union of every solid metatile segment, keeping stacked shelves,
 * overhangs and tunnels. Never reduce a column to its maximum floor height.
 * One original pixel per strip, matching the collision profiles.
 */
export function createOriginalGroundGeometry(firstColumn:number,columnCount=CHUNK_COLUMNS) {
  const positions:number[]=[], uvs:number[]=[], colors:number[]=[];
  function quad(points:number[][],tint:string,seed:number,plane:'front'|'top'|'side'='front') {
    const shade=new Color(tint).multiplyScalar(0.94+noise(seed)*0.12);
    for(const i of [0,1,2,0,2,3]) {
      const [x,y,z]=points[i];positions.push(x,y,z);
      uvs.push((plane==='side'?z:x)*0.7,(plane==='top'?z:y)*0.7);
      colors.push(shade.r,shade.g,shade.b);
    }
  }
  // Only expose portions of a side that have empty space next to them. Chunk
  // boundaries alone are not cliff edges, and never create presentation walls.
  function exposed(span:SolidSpan,neighbours:SolidSpan[]) {
    let pieces=[span];
    for(const other of neighbours) pieces=pieces.flatMap(piece=> {
      if(other.top<=piece.bottom || other.bottom>=piece.top)return [piece];
      const remaining:SolidSpan[]=[];
      if(other.bottom>piece.bottom)remaining.push({bottom:piece.bottom,top:other.bottom});
      if(other.top<piece.top)remaining.push({bottom:other.top,top:piece.top});
      return remaining;
    });
    return pieces;
  }
  const max=Math.min(ORIGINAL_TERRAIN.widthPixels,(firstColumn+columnCount)*32);
  for(let px=firstColumn*32;px<max;px+=STRIP_PIXELS) {
    const x0=(px-ORIGINAL_JUNGLE_ORIGIN.x)/32,x1=x0+STRIP_PIXELS/32;
    const intervals=terrainSolidSpans('jungle',x0);
    const left=terrainSolidSpans('jungle',x0-1/32),right=terrainSolidSpans('jungle',x1);
    intervals.forEach((span,i)=>{
      const y0=span.bottom,top=span.top,seed=Math.floor(px/96)+i*19;
      const branch=y0>1 && top>3;
      quad([[x0,y0,FRONT],[x1,y0,FRONT],[x1,top,FRONT],[x0,top,FRONT]],branch?'#735533':'#896447',seed);
      quad([[x1,y0,BACK],[x0,y0,BACK],[x0,top,BACK],[x1,top,BACK]],branch?'#493923':'#504733',seed);
      quad([[x0,top,FRONT],[x1,top,FRONT],[x1,top,BACK],[x0,top,BACK]],branch?'#a18b53':'#729344',seed+3,'top');
      quad([[x0,y0,BACK],[x1,y0,BACK],[x1,y0,FRONT],[x0,y0,FRONT]],'#392e23',seed,'top');
      for(const face of exposed(span,left))quad([[x0,face.bottom,BACK],[x0,face.bottom,FRONT],[x0,face.top,FRONT],[x0,face.top,BACK]],'#60492f',seed,'side');
      for(const face of exposed(span,right))quad([[x1,face.bottom,FRONT],[x1,face.bottom,BACK],[x1,face.top,BACK],[x1,face.top,FRONT]],'#60492f',seed,'side');
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
    const i=(y*128+x)*4, n=0.62+noise(x+y*128)*0.2+
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
  return <group ref={root} name="jungle-ground-chunk"><mesh geometry={geometry}>
    <meshStandardMaterial map={map} bumpMap={map} bumpScale={0.035} vertexColors roughness={1}/>
  </mesh></group>;
}
export const OriginalGround=memo(function OriginalGround({game}:{game:Game}) {
  const map=useMemo(soilTexture,[]);useEffect(()=>()=>map.dispose(),[map]);
  return <>{Array.from({length:Math.ceil(169/CHUNK_COLUMNS)},(_,i)=><GroundChunk key={i} game={game} index={i} map={map}/>)}</>;
});
