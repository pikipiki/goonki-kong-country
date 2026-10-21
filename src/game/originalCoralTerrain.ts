/** Rev2 marine addressing is row-major (128-byte rows), with its own 197
 * attribute pairs and marine profile table. See coral-terrain-v2.json. */
import data from '../../reference/coral-terrain-v2.json';
import type { TerrainOrigin } from './originalTerrain';
import { CORAL_PIXELS_PER_WORLD_UNIT } from './marineScale';
export const ORIGINAL_CORAL_TERRAIN=Object.freeze({tileSizePixels:32,heightPixels:data.maxRomYExclusive-data.minRomY,widthPixels:data.widthPixels,pixelsPerWorldUnit:CORAL_PIXELS_PER_WORLD_UNIT,sourcePixelsPerUnit:32,marineOriginY:data.originY,rows:data.columns[0].length});
export const coralRomYFromWeb=(y:number)=>data.originY+y*CORAL_PIXELS_PER_WORLD_UNIT;
export const coralWebYFromRom=(y:number)=>(y-data.originY)/CORAL_PIXELS_PER_WORLD_UNIT;
export function marineBandLocal(romY:number) {const rel=romY-data.minRomY;const band=Math.floor(rel/512);return {band,local:rel-band*512};}
export function coralTerrainCellSNES(px:number,row:number) {
 if(!Number.isFinite(px)||row<0||row>=ORIGINAL_CORAL_TERRAIN.rows||px<0||px>=data.widthPixels)return null;
 const index=ORIGINAL_CORAL_TERRAIN.rows-1-row;
 const tileWord=data.columns[Math.floor(px/32)][index],tileId=tileWord&0x3fff;
 if(!tileId || tileId>=data.attributes.length)return null;
 let local=Math.floor(px)&31;if(tileWord&0x4000)local^=31;
 const attribute=data.attributes[tileId][local&16?1:0];if(attribute&0x80)local^=15;
 const profileId=attribute&63;if(!profileId||!data.profiles[profileId])return null;
 const ceiling=!!(profileId&0x20),raw=data.profiles[profileId][local&15];
 const height=ceiling?31-raw:raw;
 if((!ceiling&&height<=0)||(ceiling&&height>=32))return null;
 const base=data.minRomY+index*32;
 return {floorY:base+height,romBottom:ceiling?base+Math.max(0,height):base,romTop:ceiling?base+32:base+height,
   localHeight:height,ceiling,x:px,rowFromTop:row,tileId,tileWord,attribute,profileId,profileFlags:attribute&0xc0,correctedAttribute:attribute^(tileWord&0x4000?0x80:0)};
}
export function coralSolidSpansWorld(x:number) {
 const spans:{bottom:number;top:number}[]=[];
 for(let row=ORIGINAL_CORAL_TERRAIN.rows-1;row>=0;row--) {
  const cell=coralTerrainCellSNES(x*CORAL_PIXELS_PER_WORLD_UNIT,row);if(!cell)continue;
  const bottom=coralWebYFromRom(cell.romBottom),top=coralWebYFromRom(cell.romTop),last=spans[spans.length-1];
  if(last&&bottom<=last.top+1/CORAL_PIXELS_PER_WORLD_UNIT)last.top=Math.max(last.top,top);else spans.push({bottom,top});
 }
 return spans;
}
export function queryCoral(x:number,y:number,_origin:TerrainOrigin) {
 const spans=coralSolidSpansWorld(x).filter(s=>s.top<=y+.1).sort((a,b)=>b.top-a.top);
 return spans[0]?{floorY:spans[0].top,originalFloorY:coralRomYFromWeb(spans[0].top)}:null;
}
export function probeCoralSNES(px:number,py:number) {return queryCoral(px/CORAL_PIXELS_PER_WORLD_UNIT,coralWebYFromRom(py),{x:0,y:data.originY});}
export function ceilingCoralWorld(x:number,head:number,_origin:TerrainOrigin) {
 const spans=coralSolidSpansWorld(x).filter(s=>s.bottom>=head-.02).sort((a,b)=>a.bottom-b.bottom);
 return spans[0]?.bottom??null;
}
export function blocksCoralHorizontal(x:number,feet:number,dir:-1|1,_origin:TerrainOrigin,_options?:{swim?:boolean}) {
 return coralSolidSpansWorld(x+dir*.4).some(s=>s.top>feet+.05&&s.bottom<feet+1.55);
}
