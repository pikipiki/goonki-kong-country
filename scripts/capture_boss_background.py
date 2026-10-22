#!/usr/bin/env python3
"""Capture the supplied Rev2 ship room without OBJ sprites using the pinned analysis core.

Controlled emulator setup, not normal play. Does not modify the ROM. No core,
state or cart is distributed in the game. The exact core digest guards the
analysis-only C structure field offset used to hide OBJ before background capture.
"""
import argparse,ctypes as C,hashlib,json
from pathlib import Path
from snes_probe import SnesProbe
EXPECTED_CORE='fcd68e24de690b15aec70d8f898b604717f1c4151cdf8426384c4d9ee742fb83'

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--core',required=True,type=Path);ap.add_argument('--map-state',required=True,type=Path)
 ap.add_argument('--rom',default='/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip');ap.add_argument('--output',required=True,type=Path)
 args=ap.parse_args();assert hashlib.sha256(args.core.read_bytes()).hexdigest()==EXPECTED_CORE,'Unverified core structure layout'
 p=SnesProbe(args.core,args.rom,args.output)
 try:
  p.load(args.map_state);p.write16(0x3e,0x68,'Controlled direct boss-stage entry for evidence; not normal play.')
  p.run(2,['B']);p.run(180);p.screenshot(args.output/'boss-rom-reference.png')
  assert p.u16(0x3e)==0x68 and p.u16(0x523)==24,'Boss room not entered'
  # offsetof(SSettings,BG_Forced)=76 from the exact core headers + clang offsetof.
  settings=(C.c_uint8*128).in_dll(p.lib,'Settings');previous=settings[76];settings[76]=previous|0x10
  p.run(1);p.screenshot(args.output/'boss-background.png')
  report={'romSha256':p.rom_sha,'coreSha256':EXPECTED_CORE,'mapStateSha256':hashlib.sha256(args.map_state.read_bytes()).hexdigest(),'method':'Load supplied analysis map state, force entrance0x68, pressB2frames+wait180. Then filterOBJ viaSettings.BG_Forced bit0x10 for1frame. Controlledentry/renderfilter, not ordinary play.','settingsBgForcedOffset':76,'settingsBefore':previous,'settingsAfter':settings[76],'patches':p.patches,'state':p.state()}
  (args.output/'boss-background-capture.json').write_text(json.dumps(report,indent=2)+'\n')
 finally:p.close()
if __name__=='__main__':main()
