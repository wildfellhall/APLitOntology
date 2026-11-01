import {lemmaCandidates,normalizeEntry,shardKey} from './lexicon-key.js';
const cache=new Map();
let manifestPromise;
async function loadJSON(url){const response=await fetch(url);if(!response.ok)throw new Error('The local dictionary could not be loaded. Please retry.');return response.json();}
export async function lookupWord(query,base){
 const normalized=normalizeEntry(query);
 if(!normalized||normalized.length>80||!/[a-z]/.test(normalized)||!/^[a-z0-9 '\-]+$/.test(normalized))return {query:normalized,word:null,senses:[],invalid:true};
 if(!manifestPromise)manifestPromise=loadJSON(new URL('lexicon/manifest.json',base)).catch(e=>{manifestPromise=null;throw e;});
 const manifest=await manifestPromise;
 for(const candidate of lemmaCandidates(normalized)){
  const shard=shardKey(candidate);if(!manifest.shards.includes(shard))continue;
  if(!cache.has(shard))cache.set(shard,loadJSON(new URL(`lexicon/${shard}.json`,base)).catch(e=>{cache.delete(shard);throw e;}));
  const data=await cache.get(shard);
  if(Object.hasOwn(data.entries,candidate))return {query:normalized,word:candidate,senses:data.entries[candidate],invalid:false};
 }
 return {query:normalized,word:null,senses:[],invalid:false};
}
