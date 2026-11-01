import {syllable} from 'syllable';
export const MAX_ANALYSIS_CHARS=100000;
export const CATEGORY_LABELS={grammar:'Grammar & mechanics',spelling:'Spelling',complexity:'Sentence complexity',style:'Style choices'};
const WORD=/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*(?:[-‐‑][\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*)*/gu;
export function wordsIn(text){return [...text.matchAll(WORD)].map(m=>({text:m[0],start:m.index,end:m.index+m[0].length}));}
const abbreviations=/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|U\.S|U\.K)\.$/i;
export function sentencesIn(text){
 const segments=[];let start=0;
 for(const match of text.matchAll(/[.!?]+["'”’\])]*(?=\s|$)|\n+/g)){
  const end=match.index+match[0].length,part=text.slice(start,end),rest=text.slice(end);
  if(!match[0].includes('\n')&&rest.trim()&&(abbreviations.test(part.trim())||/\b[A-Z]\.$/.test(part.trim())))continue;
  if(wordsIn(part).length){const leading=part.length-part.trimStart().length,trailing=part.length-part.trimEnd().length;segments.push({text:part.trim(),start:start+leading,end:end-trailing});}
  start=end;
 }
 const part=text.slice(start);if(wordsIn(part).length)segments.push({text:part.trim(),start:start+part.length-part.trimStart().length,end:text.length-(part.length-part.trimEnd().length)});
 return segments;
}
export function readingScores({words,sentences,syllables}){
 if(!words||!sentences)return {grade:null,ease:null};
 return {grade:.39*(words/sentences)+11.8*(syllables/words)-15.59,ease:206.835-1.015*(words/sentences)-84.6*(syllables/words)};
}
const wordy=[
 ['in order to','to'],['due to the fact that','because'],['at this point in time','now'],['in the event that','if'],['a large number of','many'],['a small number of','few'],['on a daily basis','daily'],['for the purpose of','for'],['has the ability to','can'],['have the ability to','can'],['in spite of the fact that','although'],['with regard to','about'],['with respect to','about'],['in close proximity to','near'],['prior to','before'],['subsequent to','after'],['each and every','each'],['whether or not','whether'],['the reason why is because','the reason is'],['it is important to note that',''],
];
const nonAdverbs=new Set(['family','friendly','unfriendly','lovely','lively','lonely','ugly','holy','silly','early','only','likely','unlikely','elderly','daily','weekly','monthly','yearly','assembly','supply','apply','reply','imply','multiply','fly','july','italy']);
const participles='written|seen|given|taken|made|built|known|chosen|shown|found|told|sent|brought|bought|caught|taught|held|kept|left|lost|paid|read|said|sold|understood|won|broken|driven|drawn|grown|eaten|hidden|done|heard|led|set|put|cut';
const passive=new RegExp(`\\b(?:am|is|are|was|were|be|been|being)\\s+(?:(?:not|[a-z]+ly)\\s+){0,2}(?:${participles}|[a-z]{3,}ed)\\b`,'gi');
function preserveCase(original,replacement){if(!replacement)return '';if(original===original.toUpperCase()&&original.length>1)return replacement.toUpperCase();return /^[A-Z]/.test(original)?replacement[0].toUpperCase()+replacement.slice(1):replacement;}
export function articleFor(word){
 const raw=word.replace(/[’']/g,'');
 if(/^[A-Z]+$/.test(raw)){if(/^(MBA|MRI|FBI|HTML|XML|MLA|NHS|NSA|MP|MFA|FAQ|FDA)$/.test(raw))return 'an';return null;}
 const w=raw.toLowerCase();
 if(/^(honest|honor|honour|hour|heir|x-ray)/.test(w))return 'an';
 if(/^(one(?:$|-)|once|uni(?:vers|form|on|que|corn|t(?:$|ed|s|ary))|use(?:$|r|ful|less)|usual|ubiquit|util|uten|utopi|euro|ewe|eu(?:log|phem|calypt|nuch))/.test(w))return 'a';
 if(/^(herb|historic)/.test(w))return null;
 return /^[aeiou]/.test(w)?'an':'a';
}
export function analyzeText(text){
 if(text.length>MAX_ANALYSIS_CHARS)return {tooLong:true,issues:[],stats:null,sentences:[]};
 const words=wordsIn(text),sentences=sentencesIn(text).map(s=>({...s,words:wordsIn(s.text).length}));
 const totalSyllables=words.reduce((sum,w)=>sum+Math.max(1,syllable(w.text)),0);
 const scores=readingScores({words:words.length,sentences:sentences.length,syllables:totalSyllables});
 const issues=[];
 const add=(rule,category,start,end,title,message,replacements=[])=>{
  if(end<=start)return;
  const excerpt=text.slice(start,end);issues.push({id:`${rule}:${start}:${excerpt}`,rule,category,start,end,excerpt,title,message,replacements:replacements.map(r=>preserveCase(excerpt,r))});
 };
 // Mechanical patterns are deliberately narrow; dialect and quoted language require judgment.
 for(let i=1;i<words.length;i++){
  const a=words[i-1],b=words[i],gap=text.slice(a.end,b.start);
  if(a.text.toLowerCase()===b.text.toLowerCase()&&/^\s+$/.test(gap)&&!['had','that'].includes(a.text.toLowerCase()))add('repeated-word','grammar',a.start,b.end,'Repeated word','Check whether the repetition is intentional. If it is accidental, keep one occurrence.',[a.text]);
  if(/^(a|an)$/i.test(a.text)&&/^\s+$/.test(gap)){
   const needed=articleFor(b.text);
   if(needed&&needed!==a.text.toLowerCase())add('article','grammar',a.start,a.end,'Check the article',`“${b.text}” usually takes “${needed}” in standard English. The choice depends on sound, not just the first letter.`,[needed]);
  }
 }
 for(const m of text.matchAll(/\bi\b/g))add('pronoun-i','grammar',m.index,m.index+1,'Capitalize the pronoun','Use “I” for the personal pronoun. Keep the lowercase form if this is a variable or a quotation.',['I']);
 for(const m of text.matchAll(/\b(could|should|would|must|might)\s+of\b(?!\s+(?:course|necessity)\b)/gi))add('modal-have','grammar',m.index,m.index+m[0].length,'Use “have” after this modal','The construction uses “have,” often heard as the contraction “’ve.”',[m[1]+' have']);
 for(const m of text.matchAll(/\balot\b/gi))add('a-lot','grammar',m.index,m.index+m[0].length,'Write “a lot” as two words','In standard English, this phrase is written as two words.',['a lot']);
 const fixes={'i is':'I am','i has':'I have','you is':'you are','you was':'you were','you has':'you have','we is':'we are','we was':'we were','we has':'we have','they is':'they are','they was':'they were','they has':'they have','he are':'he is','she are':'she is','it are':'it is','he have':'he has','she have':'she has','it have':'it has','he do':'he does','she do':'she does','it do':'it does','these is':'these are','those is':'those are'};
 for(const m of text.matchAll(/\b(I|you|we|they|he|she|it|these|those)\s+(is|are|was|has|have|do)\b/gi)){
  const before=text.slice(Math.max(0,m.index-100),m.index);
  if(/\b(?:should|would|could|may|might|must|can|will|shall|do|does|did)\s+$/i.test(before)||/\b(?:suggest|recommend|request|insist|demand|require|propose)(?:s|ed)?\s+(?:that\s+)?$/i.test(before))continue;
  const replacement=fixes[m[1].toLowerCase()+' '+m[2].toLowerCase()];if(replacement)add('agreement','grammar',m.index,m.index+m[0].length,'Check subject–verb agreement','This pronoun usually takes a different verb form in standard written English. Preserve intentional quotation or dialect.',[replacement]);
 }
 for(const m of text.matchAll(/[\p{L}\p{N}][ \t]+([,.;:!?])/gu)){const start=m.index+1;add('space-before-punctuation','grammar',start,m.index+m[0].length,'Space before punctuation','A space is usually unnecessary immediately before this punctuation mark.',[m[1]]);}
 for(const m of text.matchAll(/[,;](?=[\p{L}])/gu))add('space-after-punctuation','grammar',m.index,m.index+1,'Space after punctuation','Separate the next word from this punctuation mark.',[m[0]+' ']);
 for(const s of sentences){
  const cues=[...s.text.matchAll(/\b(?:although|because|whereas|unless|while|when|which|whose|if|since)\b/gi)].length;
  if(s.words>=25)add('long-sentence','complexity',s.start,s.end,s.words>=35?'Very long sentence':'Long sentence',`${s.words} words. Check whether the main clause stays clear and the details earn their place. A deliberate periodic or cumulative sentence may be effective.`);
  else if(s.words>=15&&cues>=3)add('clause-cues','complexity',s.start,s.end,'Several clause cues',`${cues} words may introduce dependent or related clauses. Check the hierarchy of ideas; this is a pattern estimate, not a grammatical parse.`);
 }
 for(const m of text.matchAll(passive))add('possible-passive','style',m.index,m.index+m[0].length,'Possible passive construction','Check whether the receiver of the action should be foregrounded. Naming the actor may help; a passive construction can also be intentional. Some adjective phrases share this pattern.');
 for(const w of words)if(w.text.length>4&&/ly$/i.test(w.text)&&!nonAdverbs.has(w.text.toLowerCase()))add('adverb','style',w.start,w.end,'Possible adverb','Consider whether this modifier adds a needed distinction or repeats what the verb already conveys. Keep it when the meaning depends on it.');
 for(const [phrase,replacement] of wordy){const re=new RegExp('\\b'+phrase.replace(/ /g,'\\s+')+'\\b','gi');for(const m of text.matchAll(re))add('wordy-phrase','style',m.index,m.index+m[0].length,'Consider a more direct phrase',replacement?`“${replacement}” may carry the same meaning more directly. Check context before replacing.`:'This introduction may be removable. Keep it if it performs a necessary rhetorical function.',[replacement]);}
 const long=sentences.filter(s=>s.words>=25).length,veryLong=sentences.filter(s=>s.words>=35).length;
 const stats={words:words.length,sentences:sentences.length,paragraphs:text.trim()?text.trim().split(/\n\s*\n/).length:0,syllables:totalSyllables,average:sentences.length?words.length/sentences.length:0,long,veryLong,grade:scores.grade,ease:scores.ease,enoughForEstimate:words.length>=30&&sentences.length>=3,passives:issues.filter(i=>i.rule==='possible-passive').length,adverbs:issues.filter(i=>i.rule==='adverb').length};
 return {tooLong:false,stats,sentences,issues:issues.sort((a,b)=>a.start-b.start||a.end-b.end)};
}
export function spellingIssues(text,spell,personal=[]){
 const known=new Set(personal.map(w=>w.toLowerCase())),cache=new Map(),issues=[];
 for(const w of wordsIn(text)){
  if(issues.length>=60)break;
  const normalized=w.text.replaceAll('’',"'");
  if(!/^[a-z]+(?:'[a-z]+)*$/i.test(normalized)||normalized.length>40||normalized.length<2||known.has(normalized.toLowerCase()))continue;
  // Capitalized names and acronyms are left to the writer; lowercase dictionary checks remain available.
  if(/^[A-Z]/.test(normalized)||spell.correct(normalized)||spell.correct(normalized.toLowerCase()))continue;
  if(!cache.has(normalized))cache.set(normalized,spell.suggest(normalized).slice(0,4));
  issues.push({id:`spelling:${w.start}:${w.text}`,rule:'spelling',category:'spelling',start:w.start,end:w.end,excerpt:w.text,title:'Check spelling',message:'This word is not recognized by the US English dictionary. It may be a name, specialist term, or another valid spelling.',replacements:cache.get(normalized)});
 }
 return issues;
}
export function applyReplacement(text,issue,replacement){if(text.slice(issue.start,issue.end)!==issue.excerpt)return null;return text.slice(0,issue.start)+replacement+text.slice(issue.end);}
export function highlightSegments(text,issues){
 const valid=issues.filter(i=>i.start>=0&&i.end<=text.length&&i.end>i.start),bounds=[...new Set([0,text.length,...valid.flatMap(i=>[i.start,i.end])])].sort((a,b)=>a-b);
 const priority={grammar:0,spelling:1,style:2,complexity:3};
 return bounds.slice(0,-1).map((start,i)=>{const end=bounds[i+1],active=valid.filter(x=>x.start<=start&&x.end>=end).sort((a,b)=>priority[a.category]-priority[b.category]||(a.end-a.start)-(b.end-b.start));return {text:text.slice(start,end),start,end,issue:active[0]||null};});
}
