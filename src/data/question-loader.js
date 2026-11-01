import {bookQuestionIndex} from './question-index.js';
const loaders={
 1:()=>import('./questions/unit1.js'),2:()=>import('./questions/unit2.js'),3:()=>import('./questions/unit3.js'),
 4:()=>import('./questions/unit4.js'),5:()=>import('./questions/unit5.js'),6:()=>import('./questions/unit6.js'),
 7:()=>import('./questions/unit7.js'),8:()=>import('./questions/unit8.js'),9:()=>import('./questions/unit9.js'),
};
const cache=new Map();
function loadUnit(unit){if(!cache.has(unit))cache.set(unit,loaders[unit]().then(m=>m.default).catch(e=>{cache.delete(unit);throw e;}));return cache.get(unit);}
export async function loadConceptQuestions(node){return (await loadUnit(node.unit)).filter(q=>q.concept===node.id);}
export async function loadBookQuestions(book){const index=bookQuestionIndex[book];const all=(await Promise.all(index.units.map(loadUnit))).flat();const passages=new Set(index.passages);return all.filter(q=>passages.has(q.passage));}
