"""Build traceable study selections from the vendored primary texts."""
from pathlib import Path
import re,json,textwrap
ROOT=Path(__file__).resolve().parents[1]
texts={p.stem:json.loads(p.read_text())['text'] for p in (ROOT/'public/books').glob('*.json')}
passages={}
def prose(id,book,start,count,title,location,context):
 blocks=[p.strip() for p in re.split(r'\n\s*\n',texts[book])]
 chosen=blocks[start:start+count]
 ps=[];omissions={};in_picture=False
 for block in chosen:
  if '[Illustration' in block:in_picture=True;omissions[len(ps)+1]='An illustration and its caption are omitted.'
  if in_picture:
   if block.rstrip().endswith(']'):in_picture=False
   continue
  ps.append(block if book=='jane-eyre' and block.startswith('“Where the Northern Ocean,') else ' '.join(block.split()))
 passages[id]=dict(id=id,book=book,title=title,type='drama' if book in ['hamlet','dolls-house'] else 'prose',location=location,context=context,paragraphs=ps,omissions=omissions,sourceBlocks=list(range(start,start+count)),note='Paragraph numbers are supplied for this selection. Source paragraph breaks are preserved; printed line wrapping is reflowed. Underscores mark emphasis in the source transcription.')
def poem(id,book,title,first,last,author=None,occurrence=0):
 t=texts[book];starts=[m.start() for m in re.finditer(re.escape(first),t)];assert len(starts)>occurrence,(id,first)
 start=starts[occurrence];end=t.find(last,start);assert end>=0,(id,last)
 raw=t[start:end+len(last)]
 lines=[]
 for line in raw.splitlines():
  if line.strip()=='[Illustration]':continue
  line=re.sub(r'\s+\d+\s*$','',line).rstrip()
  if re.match(r'^\s*\d+\.\s*$',line):continue
  if re.match(r'^\s*\[\d+\]\s*$',line):continue
  if line.strip() or (lines and lines[-1].strip()):lines.append(line)
 # Common indentation is presentation, not an additional line break.
 nonempty=[len(l)-len(l.lstrip()) for l in lines[1:] if l.strip()];indent=min(nonempty,default=0)
 lines=[l[indent:] if i and l.startswith(' '*indent) else l for i,l in enumerate(lines)]
 while lines and not lines[-1].strip():lines.pop()
 passages[id]=dict(id=id,book=book,title=title,type='poetry',location=title,context='Read the complete poem as printed in this edition before answering. The speaker is a voice constructed within the poem, not automatically the historical author.',lines=lines,note='Verse lines and stanza breaks follow this Gutenberg edition. Printed line/stanza counters are omitted; the reading view numbers verse lines, excluding blank lines.',**({'author':author} if author else {}))
# Prose selections remain continuous; no omitted prose is silently joined.
prose('pip-marsh','great-expectations',8,16,'Pip in the churchyard','Chapter I','An older Pip recounts his childhood encounter with a stranger in the marshes. Notice both the child’s experience and the language of retrospective telling.')
prose('pip-satis','great-expectations',427,23,'The stopped room','Chapter VIII','Pip has been brought to Miss Havisham’s house. Estella leaves him at a door; he enters a room lit by candles rather than daylight.')
prose('pip-shame','great-expectations',457,22,'Learning to be ashamed','Chapter VIII','Pip plays cards with Estella while Miss Havisham watches. The account connects social judgment with a change in how he sees himself.')
prose('bennet-opening','pride-prejudice',139,37,'The Bennets discuss a new neighbor','Chapter I','A wealthy unmarried man has rented a nearby estate. The narrator introduces a conversation between Mr. and Mrs. Bennet about the news.')
prose('elizabeth-letter','pride-prejudice',1415,8,'Elizabeth reconsiders her judgment','Chapter XXXVI','After rejecting Darcy’s proposal, Elizabeth reads his account of his conduct toward Bingley and Wickham. She reassesses the evidence for her earlier judgments.')
prose('jane-window','jane-eyre',next(i for i,p in enumerate(re.split(r'\n\s*\n',texts['jane-eyre'])) if p.startswith('There was no possibility')),18,'Jane at the window','Chapter I','The young Jane lives with her aunt and cousins at Gateshead. Her older narrating self recalls a winter afternoon when she withdrew from their company.')
prose('creation','frankenstein',147,7,'The creature awakens','Chapter 5','Victor recounts to Walton the night on which his experiment produced a living creature. The selection moves from anticipated success to his immediate response.')
prose('creature-claim','frankenstein',307,13,'A demand to be heard','Chapter 10','Victor encounters the creature in the mountains after a death in his family. Both speak within Victor’s retrospective narrative, which Walton records.')
prose('creature-books','frankenstein',405,7,'The creature reads','Chapter 15','The creature recounts to Victor how books shaped his sense of himself. His account is nested inside Victor’s account to Walton.')
prose('wallpaper-opening','yellow-wallpaper',2,30,'A summer residence','Opening selection','An unnamed first-person narrator describes the house she and her husband John have rented for the summer. She writes privately about her health, surroundings, and disagreements.')
prose('wallpaper-pattern','yellow-wallpaper',119,28,'Reading the pattern','Middle selection','After spending time in the upstairs room, the narrator becomes increasingly absorbed in its wallpaper. Her husband’s account of her condition differs from hers.')
prose('wallpaper-ending','yellow-wallpaper',231,38,'The room at the end','Closing selection','Near the end of the stay, the narrator locks herself in the upstairs room. This is the story’s ending and reveals its final events.')
prose('edna-sea','awakening',105,7,'The beginning of awareness','Chapter VI','Edna Pontellier has both resisted and followed an impulse to go to the beach. The narrator pauses to consider the uncertain beginnings of her awareness.')
prose('edna-swim','awakening',219,13,'Learning to swim','Chapter X','During a seaside holiday, Edna swims independently for the first time. The passage traces the changing quality of that experience.')
prose('silk-stockings','awakening',1350,14,'An unexpected purchase','A Pair of Silk Stockings, opening selection','Mrs. Sommers unexpectedly possesses fifteen dollars. She initially plans practical purchases for her children before entering a department store.')
prose('nora-opening','dolls-house',10,34,'Nora and Torvald at home','Act I, opening selection','Nora returns with Christmas shopping. Torvald speaks from his study before entering the room. English translation by R. Farquharson Sharp; stage directions are part of the text.')
prose('nora-duty','dolls-house',1245,30,'The terms of duty','Act III, selected dialogue','Nora has announced that she intends to leave. She and Torvald dispute the duties, authorities, and expectations that define their relationship. Translation by R. Farquharson Sharp.')
prose('nora-reckoning','dolls-house',1212,29,'A marriage reconsidered','Act III, selected dialogue','After a crisis concerning Nora’s secret loan, she and Torvald discuss the foundations of their marriage. This late scene reveals developments from the whole play. Translation by R. Farquharson Sharp.')

prose('pip-demand','great-expectations',33,16,'A coerced promise','Chapter I','Pip has encountered a threatening stranger in the churchyard. The man has an iron on his leg; Pip has just explained that his sister is married to the blacksmith.')
prose('ball-contrast','pride-prejudice',223,13,'Two guests at the assembly','Chapter III','Bingley and Darcy attend a local ball. The narrator reports the community’s first impressions and a conversation Elizabeth overhears.')
prose('bennet-visit','pride-prejudice',183,27,'A visit disclosed','Chapter II','Mr. Bennet has previously insisted that he will not visit the wealthy new neighbor. The chapter opens by telling readers something his family does not yet know.')
prose('jane-rebellion','jane-eyre',58,14,'A child resists','Chapter I, closing selection','John Reed has discovered Jane reading behind a curtain. Jane is an orphan dependent on the Reed household; the retrospective narrator describes the encounter and the adults’ response.')

# Locate three complete short-story openings by textual markers, avoiding contents listings.
for id,first,count,title in [('tell-tale','True!—nervous',8,'The Tell-Tale Heart'),('usher','During the whole of a dull',4,'The Fall of the House of Usher'),('amontillado','The thousand injuries of Fortunato',17,'The Cask of Amontillado')]:
 blocks=[' '.join(p.split()) for p in re.split(r'\n\s*\n',texts['poe-tales'])];ix=next(i for i,p in enumerate(blocks) if p.lower().startswith(first.lower()))
 prose(id,'poe-tales',ix,count,title+' · opening',title,'The first-person narrator presents an account of events. Distinguish what the narrator asserts from what the wording allows a reader to infer.')
# Shakespeare’s sonnets preserve the transcription’s fourteen verse lines.
t=texts['shakespeare-sonnets'];heads=list(re.finditer(r'(?m)^([IVXLCDM]+)\s*$',t))
for number in [12,18,29,30,55,60,65,73,116,130,138,146]:
 start=heads[number-1].end();end=heads[number].start() if number<len(heads) else len(t);body=t[start:end].strip();lines=[s.rstrip() for s in body.splitlines() if s.strip()];assert len(lines)==14,(number,len(lines))
 passages[f'sonnet-{number}']=dict(id=f'sonnet-{number}',book='shakespeare-sonnets',title=f'Sonnet {number}',type='poetry',location=f'Sonnet {number}',context='Read the complete fourteen-line poem. Distinguish the speaker, the person or idea addressed, and the claims the poem develops.',lines=lines,note='Line numbers follow the fourteen verse lines of this transcription. Indentation of the closing couplet is preserved.')
poem('lamb','blake-songs','The Lamb','Little lamb, who made thee?','    Little lamb, God bless thee!',occurrence=0)
# The last line repeats, so extend to the second closing blessing.
p=passages['lamb'];p['lines'].append('    Little lamb, God bless thee!')
poem('tyger','blake-songs','The Tiger (often titled The Tyger)','Tiger, tiger, burning bright','Dare frame thy fearful symmetry?')
poem('london','blake-songs','London','I wander through each chartered street','And blights with plagues the marriage hearse.')
poem('poison-tree','blake-songs','A Poison Tree','I was angry with my friend:','My foe outstretched beneath the tree.')
poem('sick-rose','blake-songs','The Sick Rose','O rose, thou art sick!','Does thy life destroy.')
poem('garden-love','blake-songs','The Garden of Love','I went to the Garden of Love,','And binding with briars my joys and desires.')
poem('chimney-innocence','blake-songs','The Chimney-Sweeper · Innocence','When my mother died I was very young,','So, if all do their duty, they need not fear harm.')
poem('chimney-experience','blake-songs','The Chimney-Sweeper · Experience','A little black thing among the snow,','Who made up a heaven of our misery.’')
poem('harlem-dancer','harlem-shadows','The Harlem Dancer','Applauding youths laughed with young prostitutes','I knew her self was not in that strange place.')
poem('america','harlem-shadows','America','Although she feeds me bread of bitterness,','Like priceless treasures sinking in the sand.')
poem('tropics','harlem-shadows','The Tropics in New York','Bananas ripe and green, and ginger-root,','I turned aside and bowed my head and wept.')
poem('must-die','harlem-shadows','If We Must Die','If we must die, let it not be like hogs','Pressed to the wall, dying, but fighting back!')
poem('coming-north','harlem-shadows','To One Coming North','At first you’ll joy to see the playful snow,','By the miraculous sun turned glad and warm.')
poem('white-city','harlem-shadows','The White City','I will not toy with it nor bend an inch.','Are sweet like wanton loves because I hate.')
poem('duchess','browning-romances','My Last Duchess',"That's my last Duchess painted on the wall,",'Which Claus of Innsbruck cast in bronze for me!')
poem('porphyria','browning-romances',"Porphyria’s Lover",'The rain set early in to-night,','And yet God has not said a word!')
poem('nightingale','keats-1820','Ode to a Nightingale','My heart aches, and a drowsy numbness pains','Fled is that music:--Do I wake or sleep?')
poem('urn','keats-1820','Ode on a Grecian Urn',"Thou still unravish'd bride of quietness,",'Ye know on earth, and all ye need to know.')
poem('autumn','keats-1820','To Autumn','Season of mists and mellow fruitfulness,','And gathering swallows twitter in the skies.')
poem('melancholy','keats-1820','Ode on Melancholy','No, no, go not to Lethe, neither twist',"And be among her cloudy trophies hung.")
poem('hope','dickinson-poems','Hope', 'Hope is the thing with feathers', 'It asked a crumb of me.')
poem('carriage','dickinson-poems','The Chariot', 'Because I could not stop for Death,', 'Were toward eternity.')
poem('liquor','dickinson-poems','I Taste a Liquor Never Brewed', 'I taste a liquor never brewed,', 'Leaning against the sun!')
poem('slant-light','dickinson-poems','A Certain Slant of Light', "There's a certain slant of light,", 'On the look of death.')
poem('brain','dickinson-poems','The Brain', 'The brain is wider than the sky,', 'As syllable from sound.')
poem('funeral','dickinson-poems','I Felt a Funeral in My Brain', 'I felt a funeral in my brain,', 'Wrecked, solitary, here.')
poem('seven','lyrical-ballads','We Are Seven','A simple child, dear brother Jim,','And said, “Nay, we are seven!”',author='William Wordsworth')
poem('reply','lyrical-ballads','Expostulation and Reply','“Why William, on that old grey stone,','And dream my time away.”',author='William Wordsworth')
poem('tables-turned','lyrical-ballads','The Tables Turned','Up! up! my friend, and clear your looks,','That watches and receives.',author='William Wordsworth')
poem('harlem-shadows','harlem-shadows','Harlem Shadows','I hear the halting footsteps of a lass','In Harlem wandering from street to street.')
poem('outcast','harlem-shadows','Outcast','For the dim regions whence my fathers came','Under the white man’s menace, out of time.')
poem('fly','dickinson-poems','Dying','I heard a fly buzz when I died;','I could not see to see.')
poem('gray-elegy-opening','gray-poems','Elegy Written in a Country Churchyard: opening','The curfew tolls the knell of parting day,','The paths of glory lead but to the grave.')
passages['gray-elegy-opening'].update(location='Elegy: opening nine quatrains',context='Read the opening of Gray’s Elegy as printed in this edition. The speaker stands in a rural churchyard at evening and turns from the landscape toward the people buried there. The complete poem is available in the linked volume.',note='Verse and stanza divisions follow the Gutenberg edition. Printed line counters and illustration markers are omitted. The selection ends after the ninth quatrain; no verse is omitted within it.')

prose('walton-ambition','frankenstein',next(i for i,p in enumerate(re.split(r'\n\s*\n',texts['frankenstein'])) if p.startswith('You will rejoice to hear')),6,'Walton writes to his sister','Letter 1','Robert Walton writes to Margaret Saville about his planned Arctic expedition. His letters form the outer narrative of the novel.')
poem('hamlet-question','hamlet','To be, or not to be','To be, or not to be, that is the question:', 'Be all my sins remember’d.')
passages['hamlet-question'].update(type='verse-drama',location='Act III, scene i',context='Hamlet speaks after Claudius and Polonius have withdrawn to observe his encounter with Ophelia. This selection is Hamlet’s speech, ending as he addresses her. Read the surrounding scene in the full play to consider the uncertain privacy of his speech.')
poem('hamlet-fortinbras','hamlet','Hamlet considers Fortinbras','How all occasions do inform against me,', 'My thoughts be bloody or be nothing worth.')
passages['hamlet-fortinbras'].update(type='verse-drama',location='Act IV, scene iv',context='After speaking with a captain about Fortinbras’s military expedition, Hamlet remains alone and compares that action with his own delay.')
prose('walton-editor','frankenstein',743,6,'Walton records and judges the story','Walton, in continuation: August 26','Victor has completed his narrative. Walton writes to his sister about hearing it, checking parts of it, and preparing the record that the reader has just encountered.')
prose('darcy-playfulness','pride-prejudice',2460,16,'The lovers explain their beginning','Chapter LX','Elizabeth and Darcy are engaged after earlier misunderstandings and an unsuccessful proposal. Lady Catherine, Darcy’s aunt, had tried to prevent their marriage; they now discuss how the engagement came about.')
prose('jane-redroom','jane-eyre',93,9,'Jane in the red-room','Chapter II','After John Reed strikes Jane and she resists him, the adults confine her in the red-room. The older Jane recounts how the room and the family’s treatment shaped the child’s thoughts.')
prose('nora-bond','dolls-house',408,30,'The disputed signature','Act I','Nora secretly borrowed money from Krogstad to finance travel needed for her husband’s health. Krogstad, whose employment at the bank is threatened, questions the signature on the bond. His account of law is a character’s claim within the play, not legal guidance.')
prose('collins-letter','pride-prejudice',649,11,'A peace-making gentleman','Chapter XIII','Mr. Bennet reads aloud a letter from Mr. Collins, the clergyman who is expected to inherit Longbourn under the estate’s entail. The family then discusses its writer. Mr. Bennet briefly interrupts the reading with “There, Mrs. Bennet.”')
prose('wallpaper-writing','yellow-wallpaper',40,26,'Writing interrupted','Early journal entries','The narrator has been discouraged from writing during a summer stay arranged for her health. The selection preserves the abrupt transition between a concealed entry and a later resumption; no prose is omitted between them.')
prose('wallpaper-light','yellow-wallpaper',150,29,'The pattern in changing light','Middle journal entries','The narrator increasingly watches the wallpaper and perceives a woman behind its surface pattern. Her account links changes of light, habits of rest, surveillance, and the paper’s spreading sensory presence.')
prose('nora-departure','dolls-house',1292,29,'The final departure','Act III: ending','Nora has told Helmer that she must leave to examine her life and beliefs independently. This selection includes the play’s final exchange and final stage direction. It reveals the ending.')
prose('jane-horizon','jane-eyre',912,5,'Beyond the visible horizon','Chapter XII','Jane works as Adèle’s governess at Thornfield. Her older narrating self recalls her desire for a wider life and the sounds she then attributed to Grace Poole. That attribution is Jane’s understanding at this point, not independent confirmation of the sound’s source.')
prose('masque-rooms','poe-tales',511,5,'Rooms against the plague','The Masque of the Red Death: opening','During a devastating fictional pestilence, Prince Prospero withdraws with selected courtiers to an enclosed abbey. The narrator describes their precautions and the spaces prepared for a masked celebration. The selection contains descriptions of disease and death.')
prose('creature-final','frankenstein',789,4,'Walton hears the creature','Walton, in continuation: final encounter','After Victor’s death, Walton encounters the creature beside his body. The creature has acknowledged murders and described his own misery. Walton responds through his loyalty to Victor, and the creature answers. This late selection reveals major outcomes.')
prose('joe-departure','great-expectations',1799,12,'Joe takes his leave','Chapter XXVII','Joe, the blacksmith who helped raise Pip, visits him in London after Pip’s change in prospects. The visit has been awkward. Joe brings a message from Miss Havisham that Estella has returned, then prepares to leave.')
poem('hamlet-prayer','hamlet','A prayer and a postponed revenge','O, my offence is rank, it smells to heaven;', 'Words without thoughts never to heaven go.')
passages['hamlet-prayer'].update(type='verse-drama',location='Act III, scene iii',context='Claudius has sent Polonius to overhear Hamlet’s meeting with Gertrude. Alone, Claudius speaks about his murder of his brother, Hamlet’s father. Hamlet enters after Claudius has knelt. The opening speech belongs to Claudius.',note='The text preserves verse lines, speaker labels, and stage directions. Numbered nonblank rows are supplied for this reading selection; they are not the line numbers of a critical edition.')
poem('hamlet-arras','hamlet','Behind the arras','POLONIUS.\nHe will come straight. Look you lay home to him,', 'That it is proof and bulwark against sense.')
passages['hamlet-arras'].update(type='verse-drama',location='Act III, scene iv',context='Polonius arranges to hide behind a curtain (an arras) while Gertrude confronts Hamlet. Hamlet has just left Claudius kneeling. Read the stage directions as evidence of what the audience knows before the characters act.',note='The text preserves verse lines, speaker labels, and stage directions. Numbered nonblank rows are supplied for this reading selection; they are not the line numbers of a critical edition.')
prose('pip-benefactor','great-expectations',2569,10,'The source of Pip’s expectations','Chapter XXXIX','The transported convict whom Pip helped as a child has returned to England. Pip has believed that Miss Havisham was arranging his future. The stranger now asks about Pip’s income and guardian; the revelation overturns that belief.')
prose('pip-recognition','great-expectations',3585,1,'A changed recognition','Chapter LIV','After an attempted escape, the injured Magwitch is in custody. Pip reflects on the man he formerly regarded with repugnance. Read this later moment beside the revelation in Chapter XXXIX.')
prose('creature-cottage','frankenstein',340,8,'Learning beside the cottage','Chapter 12','The creature tells Victor about secretly observing a family after villagers drove him away. His account is framed by Victor’s narrative to Walton; it presents his developing understanding of human relations.')
prose('edna-tuesday','awakening',468,24,'The Tuesday reception','Chapter XVII','Back in New Orleans, Edna changes a long-established social routine. The narrator and the dinner conversation explain the household’s expectations. The passage includes period racial classifications and unequal domestic labor; read these as features of the represented social order, not neutral descriptions of people’s worth.')
prose('jane-equality','jane-eyre',2258,20,'Jane claims equality','Chapter XXIII','Jane believes that Rochester intends to marry Blanche Ingram and send her away from Thornfield. Rochester is her employer. Their exchange moves from that anticipated separation toward a proposal whose meaning Jane initially distrusts.')
prose('bennet-endings','pride-prejudice',2492,6,'Lives after the marriages','Chapter LXI, opening','Elizabeth and Jane have married Darcy and Bingley. The final chapter turns to the continuing lives of the family. This selection stops before Lydia’s letter, which can be read in the complete novel.')
prose('walton-crew','frankenstein',758,10,'The crew asks to return','Walton, in continuation: September 5–7','Walton’s ship is trapped in Arctic ice. Members of the crew ask him to promise to return south if the ice opens. Victor is ill aboard the ship. Walton records the dispute and, in the September 7 entry, his decision.')
prose('darcy-proposal','pride-prejudice',1365,13,'The first proposal','Chapter XXXIV','Darcy visits Elizabeth at Hunsford and proposes. Elizabeth believes that he wronged Wickham and separated Bingley from Jane. Her later reassessment has not yet occurred.')
prose('victor-final','frankenstein',774,5,'Victor’s final advice','Walton, in continuation: September 12','After Walton agrees to return to England, Victor attempts to continue his pursuit but collapses. Walton records Victor’s last reflections and his death. This selection reveals the novel’s late events.')
hamlet_blocks=re.split(r'\n\s*\n',texts['hamlet'])
hamlet_start=next(i for i,p in enumerate(hamlet_blocks) if p.startswith('HAMLET.\nSpeak the speech'))
prose('hamlet-players','hamlet',hamlet_start,6,'Hamlet instructs the players','Act III, scene ii','Hamlet has arranged a performance intended to test Claudius’s response to a represented murder. Before it begins, he discusses acting with the players. The speeches here are prose, not verse; paragraph numbers do not represent dramatic line numbers.')
passages['creature-books']['glossary']=[{'term':'Paradise Lost','meaning':'Milton’s epic presents Adam, Eve, Satan, and their relations to a creator. The creature states how he compares his own situation with figures in the poem.'},{'term':'Werter','meaning':'The novel now commonly titled The Sorrows of Young Werther. The creature describes his emotional response to its account of feeling and suffering.'},{'term':'Plutarch’s Lives','meaning':'Biographical narratives of Greek and Roman figures. The creature identifies the civic and moral ideals he finds in them.'}]
passages['creature-books']['glossaryNote']='Editorial identifications of the books named in the passage. Questions depend on the creature’s stated responses, not prior knowledge of the source works.'
passages['nightingale']['glossary']=[
 {'term':'Lethe','meaning':'A river of forgetting in classical mythology; “Lethe-wards” suggests movement toward oblivion.'},
 {'term':'Dryad','meaning':'A tree-associated nymph in classical mythology.'},
 {'term':'Flora','meaning':'The Roman goddess of flowers.'},
 {'term':'Hippocrene','meaning':'A spring associated with the Muses and poetic inspiration.'},
 {'term':'Bacchus and his pards','meaning':'The god of wine and the leopards imagined drawing his chariot.'},
 {'term':'Ruth','meaning':'A biblical figure whom this poem imagines as homesick among strangers. The proposed connection to the bird’s song is introduced by “Perhaps.”'},
]
passages['nightingale']['glossaryNote']='Editorial glosses for this practice selection. Classical references are explained in the notes of the linked Gutenberg volume; the Ruth gloss identifies the situation presented in the poem. No prior mythological knowledge is required for the questions.'
(ROOT/'src/data/passages.js').write_text('// Verified selections from vendored Gutenberg texts; generated by scripts/build-passages.py.\nexport const passages = '+json.dumps(passages,ensure_ascii=False,indent=2)+';\n')
for id,p in passages.items():print(id,len(p.get('paragraphs',p.get('lines',[]))),len(' '.join(p.get('paragraphs',p.get('lines',[]))).split()))
