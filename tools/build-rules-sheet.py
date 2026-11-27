"""Generate the two-page US Letter reference for the tabletop edition."""
from pathlib import Path
import argparse

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path)
args = parser.parse_args()
args.output.parent.mkdir(parents=True, exist_ok=True)
pdf = canvas.Canvas(str(args.output), pagesize=letter)
pdf.setTitle('The Night Hunt — Tabletop Rules Reference')

ink = colors.HexColor('#29252B')
wine = colors.HexColor('#702C43')
gold = colors.HexColor('#A5834A')
body_style = ParagraphStyle('rules', fontName='Helvetica', fontSize=11, leading=15, textColor=ink)


def start_page(title, page):
    pdf.setFillColor(wine)
    pdf.setFont('Helvetica-Bold', 9)
    pdf.drawString(40, 753, 'THE NIGHT HUNT')
    pdf.setFont('Times-Bold', 28)
    pdf.drawString(40, 718, title)
    pdf.setStrokeColor(gold)
    pdf.line(40, 702, 572, 702)
    pdf.line(40, 43, 572, 43)
    pdf.setFont('Helvetica', 8)
    pdf.setFillColor(ink)
    pdf.drawString(40, 29, 'Tabletop playtest reference')
    pdf.drawRightString(572, 29, f'{page} / 2')
    return 685


def section(top, title, *paragraphs):
    pdf.setFillColor(wine)
    pdf.setFont('Times-Bold', 13)
    pdf.drawString(40, top, title)
    top -= 6
    for text in paragraphs:
        paragraph = Paragraph(text, body_style)
        _, height = paragraph.wrap(532, 700)
        paragraph.drawOn(pdf, 40, top - height)
        top -= height + 5
    return top - 9


top = start_page('Setup and turns', 1)
top = section(top, 'Win the hunt',
    '<b>Hunters:</b> Reduce Dracula to 0 HP. Each Hunter begins with 4 HP. '
    '<b>Dracula:</b> Reach 10 Darkness. Start at 6 HP and heal up to 8 HP.')
top = section(top, 'Set up the table',
    '<b>Choose four Hunters.</b> Shuffle each character’s starting deck and draw three cards for each. '
    'Shuffle the 32 Hunter and 16 Dracula market cards together and deal ten face up.',
    '<b>Lay out the cities in three rows.</b> London, Amsterdam, Prague / Marseille, Munich, Vienna / Madrid, Rome, Athens. '
    'A connected city is one step up, down, left, or right. If your current city also qualifies, the card says your city or a connected city.',
    '<b>Build each pile</b> from its city card. Place Hunters in selected order. Add one Brush with Darkness for every Hunter after the first in a city. '
    'Dracula secretly chooses his city last and replaces one Brush there with his identity. Shuffle the piles independently using matching opaque sleeves. '
    'Tuck each city card under its pile so its facility remains visible.')
top = section(top, 'Play a Day and a Night',
    '<b>Day:</b> The four Hunters take turns in setup order, then Dracula. '
    '<b>Night:</b> Resolve Renfield, then Wraith, if deployed. Dracula takes his turn, then the four Hunters in the same order.',
    '<b>Each turn:</b> Take one standard action and finish its choices. Hunters may pass. Dracula plays an eligible standard action if able. '
    'Played cards go to discard unless they equip, deploy, enter a city pile, or say to trash. A trashed card is out of the game.',
    '<b>Hunter movement:</b> Ready the Carriage moves one connection. At Night, add a Brush with Darkness to the destination if it is open.',
    '<b>After Night:</b> Discard unused hands, draw three each, reset facilities, and advance Maturation by one. '
    'When a personal draw pile runs out, shuffle its discard to refill it.')
top = section(top, 'Market and Equipment',
    'Follow the action card or facility. Acquired cards normally go to personal discard. When the market falls to three or fewer cards, refill toward ten. '
    'If replacing a specific slot, fill that slot first. Trashed market cards stay out.',
    '<b>Equipment:</b> One equipped card per Hunter. Equip immediately when acquired, or equip from hand as your action. '
    'Discard replaced gear. Equipment stays in play between turns.')
top = section(top, 'Hunter alternatives',
    '<b>Trade:</b> Share a city with another conscious Hunter. Discard one card, then exchange a different hand card or equipped item. '
    'Signature cards cannot be traded. <b>Facility:</b> By Day, discard one card to use your city’s facility. Once per city per Day, shared across all Hunters. '
    '<b>Counter:</b> Trash matching equipped gear at the Ally’s city as your action.')
assert top > 52, top
pdf.showPage()

top = start_page('Movement and showdowns', 2)
top = section(top, 'Hidden movement',
    '<b>Move Dracula:</b> Privately choose an open destination within range. Swap Dracula’s identity with one chosen encounter in that city, '
    'then shuffle both piles. After combat, swap his revealed identity and return the chosen encounter to the pile he left.',
    '<b>Bluff:</b> Privately choose two open cities within range of each other. Swap one non-Dracula encounter from each pile and shuffle both. '
    'Dracula stays where he is. Reveal only what the card says. Shadow Passage and Wolf Form announce the two cities while keeping the choice private.')
top = section(top, 'Investigate and consecrate',
    'Investigate the top encounter at your city. Brush with Darkness deals 1 damage and Tragic Accident deals 2. Fog makes the Hunter discard a random card. '
    'Remove Fog by Day or shuffle it back at Night. Revealing Dracula through investigation starts a showdown.',
    '<b>Open city:</b> Any city that has not been consecrated. An empty city becomes consecrated and loses its Allies. Hunters may still enter and use its facility. Dracula may not move there. Cultists may still enter its pile. '
    'If Dracula’s identity is the last encounter, wait until the showdown ends to check for consecration.',
    '<b>Facility exceptions:</b> Amsterdam’s reveal never resolves the encounter. If Vienna’s move ends in an open city, Dracula chooses one Brush with Darkness, '
    'Fog, or Tragic Accident and shuffles it into the destination.')
top = section(top, 'Resolve a showdown',
    'All conscious Hunters in the city join. Each may choose one combat card or pass, in this order: Godalming, Harker, Seward, Van Helsing, Mina. Dracula chooses last. '
    'Planned Ambush ends the showdown early. Resolve Unholy Strength’s disarm before Hunter Equipment combat abilities.',
    'Add the Hunters’ base 1 each, equipped bonuses, and chosen combat cards. Dracula starts with 2 Str by Day or 3 by Night, '
    'then adds his combat card and applicable Ally bonuses. Dracula wins ties. The losing side takes the difference. If Dracula loses, he takes it all. '
    'If Hunters lose, divide damage evenly and let Dracula assign any remainder. Vampire Bride adds 2 damage when Dracula wins in her city.',
    'A surviving Dracula may use his chosen escape effect. Mist secretly places his identity in one open connected city and shuffles a Brush with Darkness into the city he left and each other open connected city. Bats uses Move Dracula and announces its destination. '
    'If Dracula stays, shuffle his identity back into his city.')
top = section(top, 'Exhaustion, Darkness, and Maturation',
    'At 0 HP, a Hunter loses all Equipment and non-basic cards, skips their next scheduled turn, and returns at full HP on the following turn. '
    'Dracula gains 1 permanent Darkness per exhaustion. The basic cards are Ready the Carriage, Visit the Market, Investigate, and A Lucky Find.',
    '<b>Dark Ally:</b> Deploy in an open city for +2 Darkness. Lose 1 Darkness when the Ally is removed. Wraith can share its city with one other Ally. '
    '<b>Maturation:</b> Start at zero. After each full Day/Night cycle, advance one. Some market cards advance it faster. At seven, gain 3 permanent Darkness, '
    'reset, and carry any excess forward.')
assert top > 52, top
pdf.showPage()
pdf.save()
