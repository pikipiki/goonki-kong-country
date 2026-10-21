"""Read-only Rev2 level metadata extractor; stdlib only; never writes the ROM.
Tables are located by unique verified byte sequences, not presumed v1 offsets.
Semantic names use Yoshifanatic1's public DKC1 disassembly as navigation.
The tiny shape evaluator handles only the observed arithmetic height routines;
it is NOT a general SNES emulator and raises on any unsupported instruction.
"""
import argparse, collections, hashlib, json, struct, zipfile
from pathlib import Path

DEFAULT = '/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip'
EXPECTED = '628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527'
NAMES = {0:'None',1:'DonkeyKong',2:'DiddyKong',5:'Kritter/Krash',6:'Klump',9:'Rambi',10:'Expresso',11:'Winky',12:'Enguarde',13:'Squawks',14:'NutThrowingNecky',20:'BreakableWall',21:'BananaBunch',22:'KongLetter',24:'AnimalBuddyBox',25:'Zinger',26:'Klaptrap',27:'HalfTire',29:'RollingTire',31:'FloatingTire',32:'Mincer',34:'SteelKeg',35:'Barrel',36:'RopeBarrel',37:'OilDrum',38:'DKBarrel',39:'TNTBarrel',40:'OilFire',41:'Slippa',44:'ItemCache',47:'Army',48:'VerticalRope',49:'SwingingRope',52:'LifeBalloon',56:'BarrelCannon',57:'SpritePlatform',66:'Bananas',67:'Butterfly',69:'AnimalBuddyToken',70:'BlueKrusha',74:'CheckpointBarrel',75:'MiniNecky',76:'EnemySpawnBarrel',77:'Gnawty',79:'FlyingNecky',80:'MankyKong',81:'Minecart',83:'Chomps',84:'ChompsJr',85:'Bitesize',86:'Squidge',87:'Croctopus',93:'CameraObject',97:'Clambo',104:'Rockkroc',106:'ExitDoor',107:'UnderwaterExitDoor',111:'UnknownSprite6F',113:'MillstoneGnawty',115:'Sign'}
MUSIC = ['DKIslandSwing','CaveDwellerConcert','MistyMenance','AquaticAmbience','MineCartMadness','NorthernHemispheres','VoicesOfTheTemple','FearFactory','LifeInTheMines','TitleTheme','SplashScreenFanfare','IceCaveChant','SimianSegue','ForestFrenzy','CreditsConcerto','GameOver','BonusRoomBlitz','DeathMusic','Victory','TreetopRock','FunkysFugue','BadBossBoogie','CandysLoveSong','CrankysTheme','GangplankGalleon','Failure','BeatLevel']
ENVIRONMENTS = ['Jungle','Cave','Walkway','Mine','Factory','Underwater','Temple','Snow','CrystalCave','MineCartCarnage','Treehouse','Forest','DKsHouse','BananaHoardCave']

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('rom',nargs='?',default=DEFAULT)
    ap.add_argument('--output',default=str(Path(__file__).resolve().parents[1]/'reference'/'level-tables.json'))
    args=ap.parse_args(); path=Path(args.rom)
    if path.suffix.lower()=='.zip':
        with zipfile.ZipFile(path) as z:
            candidates=[n for n in z.namelist() if n.lower().endswith(('.sfc','.smc'))]
            if len(candidates)!=1: raise ValueError('Expected exactly one ROM')
            rom=z.read(candidates[0])
    else: rom=path.read_bytes()
    if len(rom)%0x8000==512: rom=rom[512:]
    sha=hashlib.sha256(rom).hexdigest()
    if sha!=EXPECTED: raise ValueError('This analysis is pinned to the supplied USA Rev2 SHA256')
    def u16(p): return struct.unpack_from('<H',rom,p)[0]
    def u24(p): return int.from_bytes(rom[p:p+3],'little')
    def hx(p): return f'0x{p:06X}'
    def snes(p): return f'${0xC00000+p:06X}'
    def locate(pattern):
        b=bytes.fromhex(pattern); p=rom.find(b)
        if p<0 or rom.find(b,p+1)>=0: raise ValueError('Missing or ambiguous signature: '+pattern)
        return p
    def evidence(p,n):return {'fileOffset':hx(p),'hiromAddress':snes(p),'signature':rom[p:p+n].hex(' ')}
    env=locate('00 00 d9 00 00 da 00 00 cb cc 05 db 00 00 e2 00 00 e9 28 17 ec 36 36 e0 e5 01 e1 88 0d e6 00 00 c3 00 62 c3 00 00 e3 a0 ed c3')
    entrance=locate('00 01 07 2a 08 2a 09 02 00 01 03 01 04 05 00 04 02 0b 0c 0e 0e 02 00 06')
    bananas=locate('e0 00 0a 01 34 01 9a 01 d8 01 16 02 48 02 f6 02 00 03 12 03')
    shape_loader=locate('ad 0b c2 85 5c b1 5c 18 65 5c 85 5c b2 5c 29 ff 00 85 5a')
    formation_shapes=0x380000+u16(bananas-2)
    assert rom[formation_shapes:formation_shapes+16]==bytes.fromhex('06 01 08 01 0b 01 0e 01 11 01 14 01 17 01 1a 01')
    spawns=locate('cc 81 cc 81 6c 84 84 84 9c 84 c4 84 d4 84 ec 84 dc 95')
    dispatcher=locate('e2 20 a9 00 8d 0c 42 c2 20 a5 3e 0a aa 7c 1e 80 a5 3e 0a aa 7c ea 81 a5 3e 0a aa 7c b6 83')
    shape=locate('47 85 4b 85 4f 85 53 85 57 85 5b 85 5f 85 63 85 67 85')
    collision=locate('00 00 45 45 c5 c5 ba 05 00 01 00 01 85 85 01 01 00 ba 01 01 01 01 4f 50')
    # Validate the actual horizontal collision address calculation and half-tile rules.
    collision_logic=locate('29 e0 01 85 96 a5 4c 29 e0 ff 85 4c a5 96 49 e0 01 4a 4a 4a 4a 18 65 4c a8')
    def script_info(pointer,depth=0,seen=()):
        if depth>8 or pointer in seen: return {'partial':True,'reason':'recursion limit'}
        pc=0x350000+pointer; state={}; animations=[]; partial=False
        for _ in range(128):
            op=u16(pc);pc+=2
            if op<0x8000:
                state[op]=u16(pc);pc+=2
            elif op==0x8000:break
            elif op==0x8200:
                child=script_info(u16(pc),depth+1,seen+(pointer,)); pc+=2
                state.update({int(k[1:],16):v for k,v in child.get('ramAssignments',{}).items()})
                animations.extend(child.get('animationIds',[]));partial|=child.get('partial',False)
            elif op in (0x8100,0x8800,0x8d00,0x8e00,0x9100,0x9500,0x9600,0x9700):
                if op==0x8100:animations.append(u16(pc))
                pc+=2
            elif op in (0x8300,0x8400,0x8500,0x8600,0x8700,0x8900,0x8a00,0x8b00,0x8c00,0x9300):pass
            elif op in (0x8f00,0x9000,0x9200):pc+=4
            elif op==0x9400:pc+=6
            else:partial=True;break
        else:partial=True
        sprite_id=state.get(0xd45)
        return {'spriteId':sprite_id,'spriteName':NAMES.get(sprite_id,'Unlabelled'),
                'animationIds':animations,'ramAssignments':{f'${k:04X}':v for k,v in sorted(state.items())},'partial':partial}
    def spawn_records(ptr):
        base=(spawns&0xff0000)+ptr; result=[]
        for i in range(1024):
            p=base+i*8;kind,x,y,script=struct.unpack_from('<4H',rom,p)
            if kind==0:
                return {'start':evidence(base,8),'terminatorOffset':hx(p),'recordCount':len(result),'records':result}
            row={'offset':hx(p),'spawnCommand':kind,'x':x,'y':y,'scriptPointer':f'${script:04X}'}
            if kind in (1,2,15):row['script']=script_info(script)
            else:row['scriptInterpretation']='Grouped spawn or native callback; not a normal B5 script.'
            result.append(row)
        raise ValueError('Unterminated spawn list')
    def formation_records(level_id):
        p=bananas+u16(bananas+level_id*2);rows=[]
        for i in range(1024):
            q=p+i*4; w=u16(q)
            if w==0:return {'start':evidence(p,min(8,q+2-p)),'recordCount':len(rows),'records':rows}
            selector=w&0x3fe
            form=formation_shapes+u16(formation_shapes+selector)
            width=rom[form];height=rom[form+1]&0x3f
            assert 0<width<=64 and 0<height<=16
            anchor_x=(u16(q+2)&0xffe0)>>2
            anchor_y=(u16(q+1)&0x1ffc)<<1
            expanded=[]
            for column in range(width):
                for row in range(height):
                    bit=column*height+row
                    if rom[form+2+bit//8]&(1<<(bit%8)):
                        # Renderer stores top-left positions in top-down space;
                        # its bitmask is scanned highest bit (last row) first.
                        # Bit0 of a column occupies the lowest active row.
                        visual_row=height-1-row
                        expanded.append({'xTopLeft':anchor_x+column*8,
                            'yTopDownTopLeft':anchor_y+visual_row*8,
                            'xCenter':anchor_x+column*8+4,
                            'ySpriteWorldCenter':(0x7000 if level_id==0x61 else 512)-(anchor_y+visual_row*8+4)})
            rows.append({'offset':hx(q),'packedRecord':rom[q:q+4].hex(' '),
              'shapePointer':snes(form),'shapeWidth':width,'shapeHeight':height,
              'expandedBananas':expanded,
              'formationSelectorByteOffset':w&0x3fe,'variant':(w&1)+1,
              'axis0FromPackedWord2':(u16(q+2)&0xffe0)>>2,
              'axis1FromPackedWord1':(u16(q+1)&0x1ffc)<<1})
        raise ValueError('Unterminated banana formation list')
    def music_for(entrance_id):
        p=(dispatcher&0xff0000)+u16(dispatcher+0x3b6+entrance_id*2)
        if rom[p]==0xa9 and rom[p+3]==0x5c:
            song=u16(p+1)
            if song<len(MUSIC):return {'routine':evidence(p,7),'musicId':song,'name':MUSIC[song]}
        return {'routine':evidence(p,8),'musicId':None,'note':'No direct LDA immediate / JML music assignment at this entry.'}
    # Only bounded scalar arithmetic used by the observed 63 height functions.
    # This reads the function bytes and constant lookup tables directly from Rev2.
    def eval_shape(pointer,a):
        pc=(shape&0xff0000)+pointer;x=0;c=0;n=False
        for _ in range(50):
            op=rom[pc];pc+=1
            if op==0x60:return a-0x10000 if a&0x8000 else a
            if op in (0xa9,0x69,0xe9,0xc9,0x29,0x49):
                value=u16(pc);pc+=2
                if op==0xa9:a=value
                elif op==0x69:
                    total=a+value+c;c=int(total>0xffff);a=total&0xffff
                elif op==0xe9:
                    total=a-value-(1-c);c=int(total>=0);a=total&0xffff
                elif op==0xc9:n=bool(((a-value)&0xffff)&0x8000);c=int(a>=value);continue
                elif op==0x29:a&=value
                elif op==0x49:a^=value
            elif op==0x0a:c=(a>>15)&1;a=(a<<1)&0xffff
            elif op==0x4a:c=a&1;a>>=1
            elif op==0x18:c=0;continue
            elif op==0x38:c=1;continue
            elif op==0xaa:x=a;continue
            elif op==0xbf:
                addr=u24(pc);pc+=3;a=u16((addr&0x3fffff)+x)
            elif op in (0x10,0x30):
                delta=rom[pc];pc+=1
                if delta>=128:delta-=256
                if (op==0x10 and not n) or (op==0x30 and n):pc+=delta
                continue
            else:raise ValueError(f'Unsupported shape instruction {op:02x} at {pc-1:06x}')
            n=bool(a&0x8000)
        raise ValueError('Shape instruction budget exceeded')
    shape_samples=[[min(31,eval_shape(u16(shape+i*2),x)) for x in range(16)] for i in range(63)]
    assert shape_samples[1]==[31]*16 and shape_samples[2]==[27]*16 and shape_samples[5]==[15]*16
    jungle_base=u24(env)&0x3fffff
    cave_base=u24(env+3)&0x3fffff
    underwater_base=u24(env+5*3)&0x3fffff
    count_table=env+0x9a
    jungle_tile_max=u16(count_table)
    cave_tile_max=u16(count_table+2)
    assert jungle_tile_max==0xea
    def env_surfaces(x, tile_base, attr_base, tile_max):
        surfaces=[]
        for row in range(16):
            col=x//32; p=tile_base+col*32+row*2; tile=u16(p);tile_id=tile&0x3fff
            if tile_id==0 or tile_id>=tile_max:continue
            local=x&31
            if tile&0x4000:local^=31
            attr=rom[attr_base+tile_id*2+(1 if local&16 else 0)]
            if attr&0x80:local^=15
            kind=attr&63
            if not kind or kind>=len(shape_samples):continue
            h=shape_samples[kind][local&15]
            if h<0:continue
            surfaces.append({'y':(15-row)*32+h,'tile':tile_id,'tileWord':f'${tile:04X}',
                             'collisionClass':attr,'rowFromTop':row})
        return surfaces
    jungle_surfaces=lambda x: env_surfaces(x,jungle_base,collision,jungle_tile_max)
    cave_attr_base=u24(env+0x70+3)&0x3fffff
    cave_surfaces=lambda x: env_surfaces(x,cave_base,cave_attr_base,cave_tile_max)
    mine_cart_base=u24(env+2*3)&0x3fffff
    mine_cart_tile_max=u16(count_table+2*2)
    mine_cart_attr_base=u24(env+0x70+2*3)&0x3fffff
    mine_cart_surfaces=lambda x: env_surfaces(x,mine_cart_base,mine_cart_attr_base,mine_cart_tile_max)
    selected={'JungleHijinxs':0x16,'JungleCheckpoint':0x25,'ReverbCave':0x17,'ReverbCheckpoint':0x19,'CoralCapers':0xbf,'CoralCheckpoint':0xc0,
              'MineCartCarnage':0x27,'MineCartCheckpoint':0x3b}
    levels={}
    for name,entry in selected.items():
        level_id=rom[entrance+entry];ptr=u16(spawns+entry*2)
        spawn=spawn_records(ptr)
        levels[name]={'entranceId':entry,'levelId':level_id,'spawnList':spawn,
          'music':music_for(entry),'bananaFormations':formation_records(level_id)}
    surfaces=[{'x':x,'surfaces':jungle_surfaces(x)} for x in range(0,0x1520,8)]
    reverb_xs=[row['x'] for row in levels['ReverbCave']['spawnList']['records']]
    cave_x_end=((max(reverb_xs)//32)+8)*32
    cave_columns=[[u16(cave_base+x*32+y*2) for y in range(16)] for x in range(cave_x_end//32)]
    cave_surface_samples=[{'x':x,'surfaces':cave_surfaces(x)} for x in range(0,cave_x_end,8)]
    cart_xs=[row['x'] for row in levels['MineCartCarnage']['spawnList']['records']]
    cart_x_end=((max(cart_xs)//32)+8)*32
    cart_columns=[[u16(mine_cart_base+x*32+y*2) for y in range(16)] for x in range(cart_x_end//32)]
    cart_surface_samples=[{'x':x,'surfaces':mine_cart_surfaces(x)} for x in range(0,cart_x_end,8)]
    canyon_columns=[[u16(jungle_base+x*32+y*2) for y in range(16)] for x in range(cave_x_end//32)]
    canyon_samples=[{'x':x,'surfaces':jungle_surfaces(x)} for x in range(0,cave_x_end,8)]
    route_envs={}
    for label,entry,expected in [('BarrelCannonCanyon',0x17,0),('MinecartMadness',0x27,2),('CoralCapers',0xbf,5)]:
        routine=(dispatcher&0xff0000)+u16(dispatcher+0x1e+entry*2)
        target=(routine&0xff0000)+u16(routine+1) if rom[routine]==0x20 else routine
        pattern=bytes([0xa9,expected,0,0x22,0x66,0x8c,0x81])
        offset=rom.find(pattern,target,target+80)
        assert offset>=0, (label,hx(target))
        route_envs[label]={'entranceId':entry,'environmentId':expected,'entryRoutine':hx(routine),'setEnvironment':evidence(offset,len(pattern))}
    output={'romSha256':sha,'method':'Unique table signatures in actual Rev2 bytes, bounded typed record decoding and arithmetic-only collision height routine evaluation.',
      'navigationSource':'https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly',
      'evidence':{'environmentPointers':evidence(env,42),'entranceLevelIds':evidence(entrance,24),'bananaRelativePointers':evidence(bananas,20),'bananaShapeRelativePointers':evidence(formation_shapes,16),'bananaShapePointerLoader':evidence(shape_loader,19),'entranceSpawnPointers':evidence(spawns,18),'environmentDispatcher':evidence(dispatcher,30),'collisionFunctionPointers':evidence(shape,18),'jungleCollisionAttributes':evidence(collision,24),'horizontalCollisionAddressing':evidence(collision_logic,26)},
      'environmentData':[{'environmentId':i,'name':name,'dataPointer':f'${u24(env+i*3):06X}','collisionTileCount':u16(count_table+i*2),'collisionAttributePointer':f'${u24(env+0x70+i*3):06X}'} for i,name in enumerate(ENVIRONMENTS)],
      'entranceToLevelId':list(rom[entrance:entrance+230]),
      'levels':levels,'routeEnvironmentEvidence':route_envs,'canyonMetatiles':{'fileOffset':hx(jungle_base),'columns':canyon_columns},'canyonCollisionSurfaceSamples':{'samples':canyon_samples},'collisionShapeSamples':shape_samples,
      'jungleCollisionAttributePairs':[[rom[collision+i*2],rom[collision+i*2+1]] for i in range(jungle_tile_max)],
      'caveCollisionAttributePairs':[[rom[cave_attr_base+i*2],rom[cave_attr_base+i*2+1]] for i in range(cave_tile_max)],
      'jungleMetatiles':{'fileOffset':hx(jungle_base),'tileSizePixels':32,'rowsPerColumn':16,'storageOrder':'column-major, row0 top, row15 bottom','columns':[[u16(jungle_base+x*32+y*2) for y in range(16)] for x in range(169)]},
      'caveMetatiles':{'fileOffset':hx(cave_base),'tileSizePixels':32,'rowsPerColumn':16,'storageOrder':'column-major, row0 top, row15 bottom','columns':cave_columns},
      'mineCartMetatiles':{'fileOffset':hx(mine_cart_base),'environmentId':2,'tileSizePixels':32,'rowsPerColumn':16,'storageOrder':'column-major, row0 top, row15 bottom','columns':cart_columns},
      'mineCartCollisionAttributePairs':[[rom[mine_cart_attr_base+i*2],rom[mine_cart_attr_base+i*2+1]] for i in range(mine_cart_tile_max)],
      'mineCartCollisionSurfaceSamples':{'sampleSpacingPixels':8,'xEndExclusive':cart_x_end,'coordinateSystem':'SNES sprite world X right; Y up from the 512px-high horizontal level floor. Walkway environment ($CB0000) with its explicit $F00000 collision attributes (entrance $27).','samples':cart_surface_samples},
      'underwaterMetatiles':{'fileOffset':hx(underwater_base),'tileSizePixels':32,'rowsPerColumn':16,'marineLevelOriginY':17960,'storageOrder':'column-major, row0 top, row15 bottom','columns':[[u16(underwater_base+x*32+y*2) for y in range(16)] for x in range(200)]},
      'jungleCollisionSurfaceSamples':{'sampleSpacingPixels':8,'xEndExclusive':0x1520,'coordinateSystem':'SNES sprite world X right; Y up from the 512px-high horizontal level floor. Per-metatile candidate tops, including interior solid tiles; NOT a single flattened walkable ground height.','samples':surfaces},
      'caveCollisionSurfaceSamples':{'sampleSpacingPixels':8,'xEndExclusive':cave_x_end,'coordinateSystem':'SNES sprite world X right; Y up from the 512px-high horizontal level floor. Cave environment ($DA0000) with cave collision attribute slice.','samples':cave_surface_samples},
      'limitations':['Not a full decompilation or an emulator. No runtime/frame-parity validation.',
       'Spawn type1/2/15 scripts decoded only for initial assignments/calls/known opcodes. Native callbacks and grouped scripts are not executed.',
       'Semantic sprite and environment names are cross-referenced labels from public V1 source; numeric IDs, coordinates, pointers, and initial assignments come from actual Rev2.',
       'Collision shape evaluation recreates observed scalar routines, not dynamic object platforms, water, hazards, camera or all collision state. Exported tops include interior solid tiles and require the original Y-dependent probe/neighbor logic to decide support.',
       'Jungle tile surface sampling range is chosen to cover its spawn coordinates; exact playable camera boundaries still require decoding.',
       'Banana formation bitmaps are expanded from column-major LSB-first streams. Centers use an 8px sprite box and Y inversion for top-down rendering space; renderer decrements draw Y by1, so exact graphic centering has a possible1px discrepancy pending runtime validation.',
       'No original sprites, textures, music, ROM chunks, or disassembly source are copied into the web game.']}
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(output,indent=2)+'\n')
    print(json.dumps({'output':str(out),'sha256':sha,'tableOffsets':{k:v['fileOffset'] for k,v in output['evidence'].items()},'levels':{k:{'entranceId':v['entranceId'],'levelId':v['levelId'],'spawns':v['spawnList']['recordCount'],'formations':v['bananaFormations']['recordCount'],'music':v['music'].get('name')} for k,v in levels.items()},'jungleSurfaceSamples':len(surfaces)},indent=2))
if __name__=='__main__':main()
