"""Fetch the explicitly selected Gutenberg texts; preserve original files and license notices."""
from pathlib import Path
import requests,json,hashlib,re,time
ROOT=Path(__file__).resolve().parents[1]
books=[('pride-prejudice',1342,'Pride and Prejudice','Jane Austen',1813,'Novel'),('frankenstein',84,'Frankenstein','Mary Shelley',1818,'Novel'),('jane-eyre',1260,'Jane Eyre','Charlotte Brontë',1847,'Novel'),('great-expectations',1400,'Great Expectations','Charles Dickens',1861,'Novel'),('awakening',160,'The Awakening and Selected Short Stories','Kate Chopin',1899,'Novel & stories'),('yellow-wallpaper',1952,'The Yellow Wallpaper','Charlotte Perkins Gilman',1892,'Short fiction'),('poe-tales',2148,'The Works of Edgar Allan Poe, Volume 2','Edgar Allan Poe',1903,'Short fiction'),('hamlet',1524,'Hamlet','William Shakespeare',1600,'Drama'),('dolls-house',2542,'A Doll’s House','Henrik Ibsen',1879,'Drama'),('blake-songs',1934,'Songs of Innocence and of Experience','William Blake',1794,'Poetry'),('dickinson-poems',12242,'Poems: Three Series','Emily Dickinson',1890,'Poetry'),('shakespeare-sonnets',1041,'Shakespeare’s Sonnets','William Shakespeare',1609,'Poetry'),('harlem-shadows',64989,'Harlem Shadows','Claude McKay',1922,'Poetry'),('lyrical-ballads',9622,'Lyrical Ballads (1798)','William Wordsworth and Samuel Taylor Coleridge',1798,'Poetry')]
books.extend([('keats-1820',23684,'Poems Published in 1820','John Keats',1820,'Poetry'),('browning-romances',4253,'Dramatic Romances','Robert Browning',1845,'Poetry')])
books.append(('gray-poems',30357,'Select Poems of Thomas Gray','Thomas Gray',1751,'Poetry'))
manifest=[]
for slug,pg,title,author,year,genre in books:
 url=f'https://www.gutenberg.org/cache/epub/{pg}/pg{pg}.txt';path=ROOT/'public/books'/f'{slug}.txt'
 if not path.exists():
  r=requests.get(url,timeout=60);r.raise_for_status();path.write_bytes(r.content);time.sleep(.7)
 raw=path.read_bytes();text=raw.decode('utf-8-sig').replace('\r\n','\n')
 assert 'PROJECT GUTENBERG' in text.upper() and len(text)>10000,(slug,len(text))
 start=re.search(r'^\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG.*?\*\*\*\s*$',text,re.M);end=re.search(r'^\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG.*?\*\*\*\s*$',text,re.M)
 assert start and end,slug
 body=text[start.end():end.start()].strip()
 manifest.append(dict(id=slug,gutenberg=pg,title=title,author=author,year=year,genre=genre,url=f'https://www.gutenberg.org/ebooks/{pg}',downloadUrl=url,localFile=f'/books/{slug}.txt',sha256=hashlib.sha256(raw).hexdigest(),characters=len(body),checked='2026-11-01'))
 (ROOT/'public/books'/f'{slug}.json').write_text(json.dumps({'text':body},ensure_ascii=False))
 print(slug,len(body),re.search(r'Title:.*',text).group(0) if re.search(r'Title:.*',text) else '')
(ROOT/'src/data/books-manifest.js').write_text('// Full original Gutenberg files retain their license notices; JSON contains the literary body.\nexport const bookManifest = '+json.dumps(manifest,ensure_ascii=False,indent=2)+';\n')
