import NSpell from 'nspell';
import {analyzeText,spellingIssues} from './analyze.js';
let dictionary;
const read=async url=>{const r=await fetch(url);if(!r.ok)throw new Error('Dictionary request failed');return r.text();};
async function getDictionary(base){if(!dictionary)dictionary=Promise.all([read(new URL('lexicon/en.aff',base)),read(new URL('lexicon/en.dic',base))]).then(([aff,dic])=>NSpell(aff,dic)).catch(error=>{dictionary=null;throw error;});return dictionary;}
self.onmessage=async({data:{id,text,personal,base}})=>{
 try{
  const result=analyzeText(text);let spellingUnavailable=false;
  if(!result.tooLong&&result.stats.words){try{const spell=await getDictionary(base);const found=spellingIssues(text,spell,personal);result.issues.push(...found.filter(s=>!result.issues.some(i=>i.category==='grammar'&&i.start<=s.start&&i.end>=s.end)));}catch{spellingUnavailable=true;}}
  const total=result.issues.length;result.issues.sort((a,b)=>a.start-b.start||a.end-b.end);result.issues=result.issues.slice(0,200);
  self.postMessage({id,text,result:{...result,total,spellingUnavailable}});
 }catch{self.postMessage({id,error:'The local analysis could not finish. Your draft is unchanged.'});}
};
