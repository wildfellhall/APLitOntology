export function lesson(id,definition,importance,passage,steps,worked,pitfall,task,response,terms,frq){
 return {id,definition,importance,passage,steps,worked,pitfall,practice:{task,response},terms,frq};
}
export function project(id,title,artifact,brief,topics,stages,criteria){
 const weights=[20,25,15,15,15,10];
 return {id,title,artifact,brief,topics,time:'Five to eight work sessions, plus reading',stages,rubric:criteria.map((c,i)=>({criterion:c[0],points:weights[i],levels:[{label:'Accomplished',range:`${Math.ceil(weights[i]*.9)}–${weights[i]}`,description:c[1]},{label:'Developing',range:`${Math.ceil(weights[i]*.7)}–${Math.ceil(weights[i]*.9)-1}`,description:c[2]},{label:'Beginning',range:`1–${Math.ceil(weights[i]*.7)-1}`,description:c[3]},{label:'Not yet demonstrated',range:'0',description:'The required evidence for this criterion is absent.'}]}))};
}
export const essayDirections='Develop a defensible interpretation, support it with specific evidence, and explain how that evidence advances your reasoning. Use clear sentences and conventions that help readers follow the argument. Avoid retelling the work in place of analysis.';
