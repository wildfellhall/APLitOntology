import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,unlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {normalizeEntry,shardKey} from '../src/tools/lexicon-key.js';
const root=new URL('../',import.meta.url),dir=new URL('public/lexicon/',root),licenses=new URL('public/licenses/',root);
const read=p=>readFileSync(new URL(p,root),'utf8');
const fingerprint=createHash('sha256').update(read('scripts/build-lexicon.mjs')+read('src/tools/lexicon-key.js')+read('node_modules/wordnet-db/package.json')+read('node_modules/dictionary-en/package.json')).digest('hex');
const manifestFile=new URL('manifest.json',dir);
if(existsSync(manifestFile)&&JSON.parse(readFileSync(manifestFile,'utf8')).fingerprint===fingerprint){console.log('Local writing dictionaries are ready.');process.exit(0);}
mkdirSync(dir,{recursive:true});mkdirSync(licenses,{recursive:true});
// Only replace the generated files owned by this script.
for(const name of readdirSync(dir))if(/^(?:[a-z_]{2}\.json|manifest\.json|en\.(?:aff|dic))$/.test(name))unlinkSync(new URL(name,dir));
const raw=read('node_modules/wordnet-db/dict/data.adj');
const license=raw.split('\n').filter(l=>/^\s+\d+ /.test(l)).map(l=>l.replace(/^\s+\d+ /,'').trimEnd()).join('\n').trim();
if(!license.includes('Copyright 2011')||!license.includes('Permission to use'))throw new Error('WordNet license missing');
writeFileSync(new URL('WordNet-3.1.txt',licenses),license+'\n');
for(const [source,target] of [['dictionary-en/license','dictionary-en.txt'],['nspell/license','nspell.txt'],['syllable/license','syllable.txt'],['wordnet-db/LICENSE','wordnet-db.txt']])writeFileSync(new URL(target,licenses),read('node_modules/'+source).replace(/\r\n/g,'\n').split('\n').map(line=>line.trimEnd()).join('\n'));
for(const ext of ['aff','dic'])writeFileSync(new URL(`en.${ext}`,dir),read('node_modules/dictionary-en/index.'+ext));
const entries=new Map();let senses=0;
for(const [file,pos] of [['noun','noun'],['verb','verb'],['adj','adjective'],['adv','adverb']]){
 const synsets=new Map();
 for(const line of read(`node_modules/wordnet-db/dict/data.${file}`).split('\n')){
  if(!/^\d{8} /.test(line))continue;
  const split=line.indexOf('|'),tokens=line.slice(0,split).trim().split(/\s+/),count=parseInt(tokens[3],16);
  const words=Array.from({length:count},(_,i)=>tokens[4+i*2].replace(/\((?:a|p|ip)\)$/,'').replace(/_/g,' '));
  const gloss=line.slice(split+1).trim();
  const firstExample=gloss.search(/;\s*"/);
  const definition=firstExample<0?gloss:gloss.slice(0,firstExample);
  const examples=[...gloss.matchAll(/"([^"]+)"/g)].map(m=>m[1]);
  synsets.set(tokens[0],{id:`${file}-${tokens[0]}`,pos,definition,examples,words});
 }
 // Index ordering preserves WordNet's sense ordering within each part of speech.
 for(const line of read(`node_modules/wordnet-db/dict/index.${file}`).split('\n')){
  if(!line||/^\s/.test(line))continue;
  const tokens=line.trim().split(/\s+/),word=normalizeEntry(tokens[0]),count=Number(tokens[2]),pointers=Number(tokens[3]);
  if(!word||!Number.isInteger(count)||count<1)continue;
  const offsets=tokens.slice(6+pointers,6+pointers+count),list=entries.get(word)||[];
  for(const offset of offsets){const s=synsets.get(offset);if(!s)throw new Error(`Unresolved sense ${file}:${offset}`);const synonyms=[...new Set(s.words.filter(w=>normalizeEntry(w)!==word))];if(!synonyms.length)continue;list.push({id:s.id,pos,definition:s.definition,examples:s.examples,synonyms});senses++;}
  if(list.length)entries.set(word,list);
 }
}
const shards=new Map();
for(const [word,definitions] of [...entries].sort(([a],[b])=>a.localeCompare(b))){const key=shardKey(word);if(!shards.has(key))shards.set(key,Object.create(null));shards.get(key)[word]=definitions;}
let bytes=0;
for(const [key,words] of shards){const output=JSON.stringify({source:'WordNet 3.1; original data reorganized by Commonplace',license,entries:words});writeFileSync(new URL(key+'.json',dir),output);bytes+=Buffer.byteLength(output);}
writeFileSync(manifestFile,JSON.stringify({fingerprint,source:'WordNet 3.1',entries:entries.size,senses,shards:[...shards.keys()].sort(),bytes,license:'../licenses/WordNet-3.1.txt'}));
console.log(`Built ${entries.size.toLocaleString()} thesaurus entries in ${shards.size} small lookup files (${(bytes/1024/1024).toFixed(1)} MB total).`);
