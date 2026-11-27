
from pathlib import Path
import argparse, re, subprocess
from collections import Counter
from html import escape
import json,math
from PIL import Image,ImageOps
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER
pdfmetrics.registerFont(TTFont("Georgia", "C:/Windows/Fonts/georgia.ttf"))
pdfmetrics.registerFont(TTFont("Georgia-Bold", "C:/Windows/Fonts/georgiab.ttf"))
pdfmetrics.registerFont(TTFont("Symbols", "C:/Windows/Fonts/seguisym.ttf"))
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader

parser=argparse.ArgumentParser()
parser.add_argument('art_directory', type=Path, help='Original Gothic Edition art and art-manifest.json')
parser.add_argument('new_art_directory', type=Path, help='PNGs for the three Maturation cards and two Hunter market additions')
parser.add_argument('output', type=Path)
parser.add_argument('--thumbnails', action='store_true', help='Regenerate web card illustrations')
parser.add_argument('--compact', action='store_true', help='Smaller images for the hosted print kit')
args=parser.parse_args()
assets=json.loads((args.art_directory/'art-manifest.json').read_text(encoding='utf-8-sig'))
sources={name:args.art_directory/Path(value['path']).name for name,value in assets.items()}
for name in ['Blood Rites','Blood Offering','Midnight Ritual','Careful Preparation','Traveling Merchant']:
 sources[name]=args.new_art_directory/(name+'.png')
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',
 'import * as data from "./src/data.ts"; process.stdout.write(JSON.stringify(data))']))
cards=data['cards']; cities=data['cities']; mixes=data['startingEncounterMix']

def toned_image(name):
 with Image.open(sources[name]) as original:
  im=original.convert('RGB')
 # Lift shadows and midtones while keeping highlight and color relationships.
 return im.point([round(255*(channel/255)**.78) for channel in range(256)]*3)

if args.thumbnails:
 thumbnail_dir=Path('src/card-art')
 thumbnail_dir.mkdir(parents=True,exist_ok=True)
 imports=[]
 entries=[]
 images={}
 for key,card in cards.items():
  name=card['name']
  if name not in sources:
   continue
  if name not in images:
   filename=key+'.webp'
   if not (thumbnail_dir/filename).exists():
    ImageOps.fit(toned_image(name),(300,148),centering=(.5,.36)).save(thumbnail_dir/filename,'WEBP',quality=76)
   value='image'+str(len(imports))
   imports.append(f"import {value} from './card-art/{filename}';")
   images[name]=value
  entries.append(f" {json.dumps(key)}: {images[name]},")
 Path('src/card-art.ts').write_text('/// <reference types="vite/client" />\n'+'\n'.join(imports)+'\n\nexport const cardArt: Record<string,string> = {\n'+'\n'.join(entries)+'\n};\n',encoding='utf-8')

OUT=args.output
OUT.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(OUT),pagesize=(612,792),pageCompression=1)
c.setTitle('The Night Hunt - Victorian Gothic Print Edition')
c.setAuthor('The Night Hunt')
PAPER='#F5EFDF'; INK='#29252B'; GOLD='#A5834A'; GREEN='#294F43'; WINE='#702C43'
page_names=[]; placements=[]; art_uses=[]; min_dpi=10000
image_cache={}
def box(x,y,w,h,col):
 c.setFillColor(HexColor(col));c.rect(x,y,w,h,fill=1,stroke=0)
def text(x,y,t,size=10,font='Helvetica',col=INK):
 c.setFillColor(HexColor(col));c.setFont(font,size);c.drawString(x,y,t)
def rule(x,y,xx,yy,col=GOLD,width=.4):
 c.setStrokeColor(HexColor(col));c.setLineWidth(width);c.line(x,y,xx,yy)
def para(x,top,w,t,size=10,col=INK,font='Helvetica'):
 p=Paragraph(escape(t),ParagraphStyle('copy',fontName=font,fontSize=size,leading=size*1.22,textColor=HexColor(col)))
 _,h=p.wrap(w,900);p.drawOn(c,x,top-h);return top-h
art_focal_y={
 'Brush with Darkness': .32,
 'Unholy Strength': .68,
 'Shadow Passage': .27,
 'Renfield': .30,
 'Wooden Stake': .53,
 'Holy Water': .44,
 'Crucifix': .46,
 'Hunting Rifle': .56,
 'Silver Dagger': .49,
 'Hunting Apparel': .50,
 'Medical Kit': .52,
 'Pistol': .50,
 'Smelling Salts': .59,
}
def art(name,x,y,w,h):
 global min_dpi
 im=toned_image(name)
 # Crop original artwork to the frame, retaining native pixels without upscaling.
 ratio=w/h
 if im.width/im.height>ratio:
  iw=round(im.height*ratio); left=(im.width-iw)//2;im=im.crop((left,0,left+iw,im.height))
 else:
  ih=round(im.width/ratio)
  if name in art_focal_y:
   focal_y=art_focal_y[name]
   top=max(0,min(im.height-ih,round(im.height*focal_y-ih/2)))
  else:
   center_crop=name in cities or name in ['Fog','Call of the Night','Ready the Carriage','Travel by Train','Fast Horse','Wolf Form']
   top=round((im.height-ih)*(.5 if center_crop else .16))
  im=im.crop((0,top,im.width,top+ih))
 dpi=min(im.width/(w/72),im.height/(h/72));min_dpi=min(min_dpi,dpi)
 density=1.45 if args.compact else 5
 target=(round(w*density),round(h*density))
 if im.width>target[0] and im.height>target[1]:
  im=im.resize(target,Image.Resampling.LANCZOS)
 dpi=min(im.width/(w/72),im.height/(h/72));min_dpi=min(min_dpi,dpi)
 assert args.compact or dpi>=299,(name,dpi)
 cachekey=(name,w,h)
 if cachekey not in image_cache:
  from io import BytesIO
  encoded=BytesIO();im.save(encoded,format='JPEG',quality=72 if args.compact else 91,subsampling=2 if args.compact else 0)
  encoded.seek(0);image_cache[cachekey]=ImageReader(encoded)
 c.drawImage(image_cache[cachekey],x,y,w,h)
 art_uses.append(name)
def page(label):
 c.showPage();page_names.append(label)
def heading(title,sub):
 box(26,683,560,82,INK)
 text(43,741,'THE NIGHT HUNT',10,'Helvetica-Bold','#E4BF82')
 text(43,707,title,28,'Times-Bold','#FFFFFF')
 text(43,659,sub,10,'Helvetica','#68616A')
def safe(t):
 return t.replace('Cannot revive a Exhausted','Cannot revive an Exhausted')
heading('Illustrated print edition','Victorian Gothic art  /  US Letter  /  Color prototype')
sections=[
 ('Print at the correct size','Use US Letter (8.5 x 11 in), Actual Size / 100%, single-sided. Disable Fit to Page. Cards measure exactly 2.5 x 3.5 in along the cut grid. Player boards measure 8.5 x 5.5 in after cutting a sheet across its midpoint.'),
 ('Player boards and map','Pages 2-4 contain all five Hunters and Dracula, two boards per sheet. Pick four Hunters for a game. Page 5 is the Europe reference map. Use coins or tokens for positions, health, Darkness, and consecrated cities.'),
 ('Personal decks and market','Pages 6-10 contain five optional Hunter starter decks, one complete nine-card deck per sheet. Page 11 is Dracula’s nine-card starter deck. The shared market follows the starter decks and contains 48 cards. Shuffle its Hunter and Dracula cards together, display 10, and refill to 10 when only 3 remain.'),
 ('City piles and standard encounter supply','The remaining sheets contain setup encounters, the Dracula identity, standard encounters, and nine city cards. Use the labels at the foot of the cards to sort the set.'),
 ('Keep the hidden piles hidden','Use matching opaque-backed poker sleeves for every card that can enter a city pile, including Cultists and Szgany Bodyguards. A spare playing card behind each paper card gives it stiffness. Shuffle city piles independently. Slide the bottom half of the city card under its encounter pile after setup. By Day, spend your action and discard one card to use the facility at your city. Each facility can be used once per day across all Hunters.'),
 ('Setup and play','Hunters choose their starting cities first. Add one Brush with Darkness per additional Hunter in a city. Dracula chooses last, secretly replacing one Brush with Darkness there with his identity. Place the removed Brush in the standard encounter supply. Use the current playtest rules for full timing, combat, recovery and effects. Printed setup mixes match the local prototype.'),
]
top=626
for title,body in sections:
 text(43,top,title,14,'Times-Bold',WINE)
 top=para(43,top-10,521,body,10.5)-23
assert top>35
page('Print instructions')

portrait_keys=['portrait-godalming','portrait-harker','portrait-helsing','portrait-seward','portrait-mina','portrait-dracula']
hunter_profiles={
 'Lord Godalming':('The Patron','After losing Lucy, Arthur puts his fortune and connections behind the hunt. He keeps the group supplied and hits hard when it counts.'),
 'Jonathan Harker':('The Courier','Jonathan survived Dracula’s castle and knows what the Count can do. He keeps the Hunters moving and gets warnings to them in time.'),
 'Van Helsing':('The Scholar','A physician and scholar, Van Helsing recognizes what took Lucy. He shares what he knows and prepares the group for a showdown.'),
 'Dr. Seward':('The Physician','Seward saw medicine fail to save Lucy. He joins the hunt to stop the Count and keeps his companions on their feet.'),
 'Mina Harker':('The Strategist','Mina helps piece together the Count’s trail and fights to protect the people she loves. She uses her connection to Dracula to guide the group.'),
}
hunter_actions=[
 ('Play a card','Play a card from your hand for its standard action.'),
 ('Trade','With a conscious Hunter in your city, discard one card, then trade a different hand card or equipped item.'),
 ('Use a city facility · Day only','Discard one card to use your city’s facility once per day, shared by all Hunters.'),
 ('Counter an Ally','Trash matching equipped gear at the Ally’s city.'),
]
for k,name in enumerate([*data['hunters'],'Count Dracula']):
 y=396 if k%2==0 else 0; drac=k==5
 color=WINE if drac else GREEN
 box(26,y+24,560,348,PAPER)
 box(26,y+24,186,348,color)
 art(portrait_keys[k],26,y+186,186,186)
 text(40,y+156,name,19 if len(name)<17 else 17,'Times-Bold','#F5E8CD')
 if drac:
  text(40,y+135,'The Undead Count',11,'Helvetica-Bold','#E4CFA6')
  bio_bottom=para(40,y+122,158,'Dracula spreads his curse westward from Transylvania. As his Allies spread his influence, new vampires mature and add to his Darkness.',9.4,'#F5E8CD')
  assert bio_bottom>y+65
  text(40,y+45,'Base Strength 2 Day / 3 Night',9,'Helvetica-Bold','#F5E8CD')
  text(236,y+340,'HIT POINTS',10,'Helvetica-Bold',WINE)
  for j in range(data['defaults']['draculaHP']+1):
   xx=248+j*37
   c.setStrokeColor(HexColor(WINE));c.circle(xx,y+315,10,stroke=1,fill=0)
   text(xx-3,y+312,str(j),9,col=WINE)
  hp_bottom=para(236,y+291,324,f"Start at {data['draculaStartingHP']} HP. Heal up to {data['defaults']['draculaHP']} HP. Dracula wins showdown ties.",10)
  assert hp_bottom>y+254
  text(236,y+254,'TOTAL DARKNESS',10,'Helvetica-Bold',WINE)
  for j in range(11):
   xx=247+j*30
   c.setStrokeColor(HexColor(GOLD));c.circle(xx,y+229,9,stroke=1,fill=0)
   text(xx-(5 if j==10 else 2.5),y+226,str(j),8,col=WINE)
  darkness_bottom=para(236,y+207,324,'Start at 0. Gain 2 per Dark Ally deployed and lose 1 when it is removed. Gain 1 permanent Darkness per Hunter exhaustion and 3 per vampire matured. Win at 10.',10)
  assert darkness_bottom>y+143
  text(236,y+143,'VAMPIRE MATURATION',10,'Helvetica-Bold',WINE)
  for j in range(8):
   xx=247+j*30
   c.setStrokeColor(HexColor(GOLD));c.circle(xx,y+123,8,stroke=1,fill=0)
   text(xx-2.5,y+120,str(j),8,col=WINE)
  para(236,y+104,324,'Start at 0. Advance 1 after each full Day/Night cycle. Some market cards advance it faster. At 7, a vampire matures: gain 3 permanent Darkness, reset the track, and carry over any extra progress.',10)
 else:
  archetype,profile=hunter_profiles[name]
  text(40,y+135,archetype,11,'Helvetica-Bold','#E4CFA6')
  bio_bottom=para(40,y+122,158,profile,9.4,'#F5E8CD')
  assert bio_bottom>y+61,(name,bio_bottom-y)
  text(40,y+45,'Base Strength 1',9,'Helvetica-Bold','#F5E8CD')
  text(236,y+340,'HIT POINTS',10,'Helvetica-Bold',GREEN)
  for j in range(5):
   xx=248+j*38
   c.setStrokeColor(HexColor(GREEN));c.circle(xx,y+314,11,stroke=1,fill=0)
   text(xx-3,y+311,str(j),9,col=GREEN)
  c.setStrokeColor(HexColor('#867A65'));c.circle(448,y+314,8,stroke=1,fill=0)
  text(445.5,y+311.5,'5',8,col='#69616B')
  text(236,y+289,'Start at 4 HP. Use 5 only if your maximum HP increases.',9,col='#69616B')
  rule(236,y+275,562,y+275)
  text(236,y+256,'ON YOUR TURN',10,'Helvetica-Bold',GREEN)
  text(236,y+241,'Take one standard action or pass.',9,col='#69616B')
  top=y+223
  for index,(action,description) in enumerate(hunter_actions):
   text(236,top,action,11,'Times-Bold',WINE)
   top=para(236,top-5,324,description,9.2)
   if index<len(hunter_actions)-1:
    top-=17
  assert top>y+69,(name,top-y)
  text(236,y+66,'EQUIPMENT  /  ONE SLOT',9,'Helvetica-Bold',GREEN)
  c.setStrokeColor(HexColor('#B49A70'));c.rect(236,y+33,326,23,stroke=1,fill=0)
  reminder_bottom=para(244,y+54,310,'Equip from hand as your action or immediately when acquired. Discard any gear you replace.',8.3)
  assert reminder_bottom>=y+33
 if k%2:
  rule(18,396,594,396)
  page('Player boards')

heading('Europe','One connection joins cities directly above, below, left or right.')
for i,(city,m) in enumerate(zip(cities,mixes)):
 x=30+i%3*186;y=491-i//3*157
 if i%3<2:rule(x+168,y+62,x+186,y+62,GOLD,2)
 if i//3<2:rule(x+84,y,x+84,y-32,GOLD,2)
 box(x,y,168,125,PAPER);art(city,x,y+55,168,70)
 box(x,y+103,168,22,GREEN);text(x+8,y+109,city,15,'Times-Bold','#FFFFFF')
 top=y+46
 for kind,count in m.items():
  if count:
   text(x+8,top,f"{count}  {data['encounterNames'][kind]}",8.3)
   top-=12
 facility=data['facilities'][i]
 if facility:text(x+8,top,facility['name'],8.3,'Helvetica-Bold',GREEN)
text(43,125,'CONSECRATED CITIES',10,'Helvetica-Bold',WINE)
para(43,110,520,'Mark a city when its pile reaches zero. Hunters can enter without adding Night travel encounters. Cultists may enter as an encounter and the city stays consecrated. Dracula cannot finish movement there.',10)
page('Europe reference')

def rules_markup(description):
 alternatives=re.split(r'\s+(?:OR|Or)\s+',description)
 paragraphs=[]
 styled=[]
 previous_phase=None
 for index,alternative in enumerate(alternatives):
  if index:
   styled.append('<b>OR</b>')
  lines=re.split(r'\n|(?<=[.!?])\s+(?=(?:Day|Night): )',alternative)
  for line in lines:
   match=re.match(r'^(Day|Night|Day or Night)[:.] (.*)$',line)
   if line.startswith('Combat: '):
    styled.append('<font name="Symbols">⚔</font>: '+escape(line[8:]))
    continue
   label,separator,body=line.partition(': ')
   if label in ('When investigated','On deployment','Start of Night','Start of Dracula’s Night turn','Counter') and separator:
    styled.append(f'<b>{escape(label)}:</b> {escape(body)}')
    continue
   if not match:
    styled.append(escape(line))
    continue
   phase,rule_text=match.groups()
   if previous_phase in ('Day','Night') and phase in ('Day','Night') and previous_phase!=phase:
    paragraphs.append('<br/>'.join(styled))
    styled=[]
   previous_phase=phase
   sun='<font name="Symbols" color="#88612E">☀</font>' if 'Day' in phase else ''
   moon='<font name="Symbols" color="#533F87">☾</font>' if 'Night' in phase else ''
   styled.append(sun+moon+': '+escape(rule_text))
 paragraphs.append('<br/>'.join(styled))
 return paragraphs

printed=[]
def add(key,group):
 card=cards[key]
 desc=safe(card['description'])
 combat=(('strength' in card and not card.get('equipment')) or card.get('escape') or card.get('combatEffect') or 'endsShowdownDamage' in card or card.get('trashStrength') or card.get('discardStrength'))
 printed.append(dict(name=card['name'],description=desc,side=card['side'],group=group,timing='Equipment' if card.get('equipment') else 'Dark Ally' if card.get('ally') else card['timing'],combat=combat,standard=not combat or card['side']=='dracula' or key in ['combat','signature-2-1'] or card.get('item'),art=card['name'],equipment=card.get('equipment'),item=card.get('item'),ally=card.get('ally'),quote='“Tell me what I am to do, and I shall not falter!”' if key=='signature-0-1' else None))
basic=['travel','travel','supply','supply','investigate','investigate','combat']
for i,name in enumerate(data['hunters']):
 for key in basic+data['signatures'][i]:add(key,name+' starter')
for key in ['d-0','d-0','d-fog','d-fog','d-2','d-2','d-3','d-3','d-4']:add(key,'Dracula starter')
for key in data['hunterMarket']+data['draculaMarket']:add(key,'Shared market')
encounters={
 'encounter':('Deal 1 damage to the investigating Hunter. Remove this encounter.',sum(m['encounter'] for m in mixes),18,'Brush with Darkness'),
 'fog':('The investigating Hunter discards 1 random card. Remove Fog by Day or shuffle it back into this city pile at Night.',sum(m['fog'] for m in mixes),4,'Fog'),
 'damaging':('Deal 2 damage to the investigating Hunter. Remove this encounter.',sum(m['damaging'] for m in mixes),4,'Tragic Accident'),
 'dracula':('Dracula has been discovered. Begin a showdown with the conscious Hunters in this city.',1,0,'portrait-dracula'),
}
def encounter(kind,group):
 desc,_,_,key=encounters[kind]
 return dict(name=data['encounterNames'][kind],description=desc,side='encounter',group=group,timing='Resolve on investigation',art=key)
for kind,(_,starting,spare,_) in encounters.items():
 for j in range(starting+spare):printed.append(encounter(kind,'Setup' if j<starting else 'Standard Encounter'))
printed.extend([None]*(-len(printed)%9))
for city,m,facility in zip(cities,mixes,data['facilities']):
 starting_cards=[f"{count} {data['encounterNames'][kind]}" for kind,count in m.items() if count]
 printed.append(dict(name=city,starting_cards=starting_cards,facility=facility,side='location',group='City card',art=city))
for kind in ['encounter','damaging']:
 for _ in range(18):printed.append(encounter(kind,'Standard Encounter'))

location_effects={
 'London':'Heal 1 HP.',
 'Amsterdam':'Reveal the top encounter, then shuffle.',
 'Prague':'Move 1 connection.',
 'Marseille':'Trash hunter market card, refill.',
 'Vienna':'Move 1 Connection, add encounter.',
 'Madrid':'Acquire a Hunter market card.',
 'Rome':'Draw one card.',
 'Athens':'Trash another card from your hand.',
}

def location_body(card,x,y,color):
 facility=card['facility']
 style=ParagraphStyle('location-rules',fontName='Georgia',fontSize=9,leading=10.4,alignment=TA_CENTER,textColor=HexColor(INK))
 if facility:
  title=f'<font name="Symbols" color="#88612E">☀</font>: <font name="Georgia-Bold">{escape(facility["name"])}</font>'
  effect=escape(location_effects[card['name']])
  body=Paragraph(f'{title}<br/>{effect}',style)
  _,height=body.wrap(154,900)
  assert height<=22,(card['name'],height)
  body.drawOn(c,x+13,y+221-height)
 else:
  c.setFont('Georgia',9)
  c.setFillColor(HexColor('#69616B'))
  c.drawCentredString(x+90,y+206,'No facility')
 art(card['art'],x+3,y+73,174,123)
 rule(x+10,y+73,x+170,y+73,color)
 encounters_markup='<br/>'.join(escape(line) for line in card['starting_cards'])
 setup=Paragraph(f'<b>Starting Encounters</b><br/>{encounters_markup}<br/>+1 Brush per additional starting hunter.',ParagraphStyle('location-setup',parent=style,fontSize=9.3,leading=11.3))
 _,height=setup.wrap(168,900)
 assert height<=58,(card['name'],height)
 setup.drawOn(c,x+6,y+68-height)

counts=Counter(p['group'] for p in printed if p)
assert counts['Shared market']==48
for i,p in enumerate(printed):
 slot=i%9
 if p:
  x=36+slot%3*180;y=18+(2-slot//3)*252
  color='#28804C' if p.get('equipment') else '#BB354D' if p.get('ally') else GREEN if p['side']=='hunter' else WINE if p['side']=='dracula' else '#38566C' if p['side']=='location' else '#88612E'
  label='Equipment' if p.get('equipment') else 'Ally' if p.get('ally') else p['side'].capitalize()
  box(x+3,y+3,174,246,PAPER)
  is_location=p['side']=='location'
  box(x+3,y+(225 if is_location else 215),174,24 if is_location else 34,color)
  title_size=13.5
  while pdfmetrics.stringWidth(p['name'],'Georgia-Bold',title_size)>158:
   title_size-=.25
  c.setFont('Georgia-Bold',title_size)
  c.setFillColor(HexColor('#FFF0D6'))
  c.drawCentredString(x+90,y+(233 if is_location else 227),p['name'])
  if is_location:
   location_body(p,x,y,color)
  else:
   body_size=8.6 if p.get('equipment') else 9.3
   style=ParagraphStyle('card-body',fontName='Georgia',fontSize=body_size,leading=body_size*1.23,alignment=TA_CENTER,textColor=HexColor(INK))
   paragraphs=[Paragraph(markup,style) for block in p['description'].split('\n\n') for markup in rules_markup(block)]
   heights=[paragraph.wrap(154,900)[1] for paragraph in paragraphs]
   phase_gap=4
   bodyheight=sum(heights)+phase_gap*(len(heights)-1)
   timing=p['timing']
   marks=[]
   if not isinstance(timing,str):
    if p['standard'] and not re.search(r'(?:^| OR |\n)(Day|Night|Day or Night)[:.]',p['description']):
     marks.extend(('☀','#88612E') if t=='day' else ('☾','#533F87') for t in timing)
    if p['combat'] and not p['description'].startswith('Combat: '):
     marks.append(('⚔',INK))
   timing_space=24 if isinstance(timing,str) or marks else 5
   max_art_height=139 if p.get('equipment') or p.get('item') else 112 if p.get('ally') else 96
   artheight=min(max_art_height,185-timing_space-bodyheight)
   assert artheight>=47,(p['name'],artheight)
   art(p['art'],x+3,y+215-artheight,174,artheight)
   if isinstance(timing,str):
    c.setFont('Helvetica-Bold',9.5 if p.get('equipment') else 7.5)
    c.setFillColor(HexColor(color))
    c.drawCentredString(x+90,y+202-artheight,timing)
   elif marks:
    c.setFont('Symbols',11)
    for index,(mark,color) in enumerate(marks):
     c.setFillColor(HexColor(color))
     c.drawCentredString(x+90+(index-(len(marks)-1)/2)*16,y+201-artheight,mark)
   text_top=y+215-artheight-timing_space
   assert text_top-bodyheight>=y+30-0.01,(p['name'],bodyheight)
   for paragraph,height in zip(paragraphs,heights):
    paragraph.drawOn(c,x+13,text_top-height)
    text_top-=height+phase_gap
   if p.get('quote'):
    quote_style=ParagraphStyle('card-quote',fontName='Times-Italic',fontSize=8.6,leading=10,alignment=TA_CENTER,textColor=HexColor(INK))
    quote=Paragraph(escape(p['quote'])+'<br/>— Arthur Holmwood, <i>Dracula</i>, Ch. 16',quote_style)
    _,quote_height=quote.wrap(154,900)
    assert text_top+phase_gap>=y+30+quote_height
    quote.drawOn(c,x+13,y+30)
   rule(x+10,y+23,x+170,y+23,color)
   text(x+10,y+12,p['group'],7.2,'Helvetica-Bold',color)
  placements.append(dict(name=p['name'],page=len(page_names)+1,x=x,y=y,width=180,height=252,art=p['art']))
 if slot==8 or i==len(printed)-1:
  for j in range(4):
   rule(36+j*180,18,36+j*180,774,'#A99C86')
   rule(36,18+j*252,576,18+j*252,'#A99C86')
  page('Card sheet')
c.save()
reader=PdfReader(str(OUT))
assert len(reader.pages)==len(page_names)
assert len(placements)==sum(counts.values())
assert all((float(p.mediabox.width),float(p.mediabox.height))==(612,792) for p in reader.pages)
assert sum(page.extract_text().count('Shared market') for page in reader.pages)>=48
assert 'VAMPIRE MATURATION' in reader.pages[3].extract_text()
print(OUT, len(reader.pages), 'pages /',len(placements),'cards /',len(set(art_uses)),'illustrations / minimum',round(min_dpi),'DPI')
