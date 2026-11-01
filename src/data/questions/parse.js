// Source order places the keyed answer first for editorial review only.
// Display order is a stable, ID-derived permutation, never dependent on array position elsewhere.
export function parseBank(raw){
 let concept,passage;const counts={};const questions=[];
 for(const line of raw.trim().split('\n').map(x=>x.trim()).filter(Boolean)){
  if(line.startsWith('@')){[concept,passage]=line.slice(1).split('|');continue;}
  const [stem,...cells]=line.split('|');if(cells.length!==4)throw Error(`Four choices required: ${concept}: ${stem}`);
  const ordinal=counts[concept]=(counts[concept]||0)+1;
  const id=`lit-v2-${concept}-${ordinal}`;
  const choices=cells.map((s,i)=>{const [text,rationale]=s.split('~');if(!text||!rationale)throw Error(id);return {text,rationale,correct:i===0};});
  let seed=[...id].reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,17);
  const keyed=choices.shift();
  for(let i=2;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
  const offset=[...concept].reduce((a,c)=>a+c.charCodeAt(0),0)%4;
  const position=([0,2,1,3,2,0,3,1,0,2][(ordinal-1)%10]+offset)%4;
  choices.splice(position,0,keyed);
  questions.push({id,concept,passage,stem,choices:choices.map(x=>x.text),rationales:choices.map(x=>x.rationale),answer:choices.findIndex(x=>x.correct)});
 }
 return questions;
}
