import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {catalog,catalogById,lessons,lessonById,questions,questionsByConcept,projects,classicalProjects,books,bookById,passages,edges,skills,bookAssignments} from '../src/data/index.js';
const words=s=>s.trim().split(/\s+/).length;
test('Every concept has substantial instruction and exactly ten exclusive questions',()=>{
 assert.equal(catalog.length,90);assert.equal(lessons.length,90);assert.equal(questions.length,900);
 assert.equal(new Set(questions.map(q=>q.id)).size,900);
 assert.equal(new Set(questions.map(q=>q.stem.toLowerCase().replace(/\W/g,''))).size,900);
 for(const n of catalog){const l=lessonById[n.id];assert.ok(l,n.id);assert.ok(words(l.definition+' '+l.importance)>=70,n.id);assert.equal(l.steps.length,3);assert.equal(Object.keys(l.worked).length,4);assert.ok(l.practice.task&&l.practice.response&&l.pitfall&&l.terms.length>=2);assert.ok(passages[l.passage]);for(const p of l.companions)assert.ok(passages[p]);assert.ok(l.frq.prompt.length>100);assert.ok(['prose','poetry','argument'].includes(l.frq.type));if(l.frq.type!=='argument')assert.ok(passages[l.frq.passage]);assert.equal(questionsByConcept[n.id].length,10,n.id);for(const code of n.skills)assert.ok(skills[code],code);}
 assert.equal(new Set(catalog.flatMap(n=>n.skills)).size,31);
});
test('Questions have four distinct options, explanations, and stable balanced keys',()=>{
 for(const q of questions){assert.ok(passages[q.passage],q.id);assert.equal(q.choices.length,4);assert.equal(q.rationales.length,4);assert.equal(new Set(q.choices).size,4,q.id);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);for(const r of q.rationales)assert.ok(r.length>=25,q.id);}
 for(const n of catalog){const counts=[0,0,0,0];questionsByConcept[n.id].forEach(q=>counts[q.answer]++);assert.ok(counts.every(n=>n===2||n===3),n.id);}
});
test('Every concept and volume has a distinct complete project and a 100-point rubric',()=>{
 assert.equal(projects.length,90);assert.equal(classicalProjects.length,17);const all=[...projects,...classicalProjects];assert.equal(new Set(all.map(p=>p.id)).size,107);assert.equal(new Set(all.map(p=>p.title)).size,107);
 for(const n of catalog)assert.ok(projects.some(p=>p.id===n.id),n.id);
 for(const b of books)assert.equal(classicalProjects.filter(p=>p.book===b.id).length,1,b.id);
 for(const p of all){assert.equal(p.topics.length,3,p.id);assert.equal(p.stages.length,6,p.id);for(const s of p.stages)assert.ok(s.instructions.length>90&&s.submit.length>10,p.id);assert.equal(p.rubric.length,6);assert.equal(p.rubric.reduce((n,r)=>n+r.points,0),100);for(const r of p.rubric){assert.equal(r.levels.length,4);for(const l of r.levels)assert.ok(l.description.length>25);}}
});
test('Prerequisites form a valid acyclic progression; graph endpoints and reasons exist',()=>{
 const visited=new Set(),active=new Set();function visit(id){assert.ok(!active.has(id),`Cycle at ${id}`);if(visited.has(id))return;active.add(id);for(const p of catalogById[id].prerequisites){assert.ok(catalogById[p]);visit(p);}active.delete(id);visited.add(id);}catalog.forEach(n=>visit(n.id));
 for(const e of edges){assert.ok(catalogById[e.source]&&catalogById[e.target]);assert.notEqual(e.source,e.target);assert.ok(e.reason?.length>15||e.description?.length>15||e.label?.length>5);}
 assert.equal(visited.size,90);
});
test('Full Gutenberg files retain licenses and match acquisition hashes',async()=>{
 assert.equal(books.length,17);
 for(const b of books){const raw=await readFile(new URL(`../public/books/${b.id}.txt`,import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),b.sha256,b.id);assert.match(raw.toString(),/FULL PROJECT GUTENBERG LICENSE|THE FULL PROJECT GUTENBERG LICENSE/i);const body=JSON.parse(await readFile(new URL(`../public/books/${b.id}.json`,import.meta.url),'utf8'));assert.ok(body.text.length>5000,b.id);assert.ok(b.edition.length>50);assert.ok(b.url.startsWith('https://www.gutenberg.org/ebooks/'));}
});
test('Study passages and book assignments preserve source and genre boundaries',()=>{
 assert.equal(Object.keys(passages).length,97);
 for(const p of Object.values(passages)){assert.ok(bookById[p.book]);assert.ok(p.context&&p.location&&p.note);assert.ok((p.lines||p.paragraphs).length>0);if(p.sourceBlocks)assert.ok(p.sourceBlocks.every((n,i,a)=>!i||n===a[i-1]+1));}
 for(const [id,p] of Object.entries(passages)){if(id.startsWith('sonnet-'))assert.equal(p.lines.filter(s=>s.trim()).length,14,id);}
 assert.equal(passages['gray-elegy-opening'].lines.filter(s=>s.trim()).length,36);
 assert.equal(passages.carriage.lines.filter(s=>s.trim()).length,20);
 for(const b of books){assert.ok(bookAssignments[b.id]?.length,b.id);assert.ok(questions.some(q=>passages[q.passage].book===b.id),b.id);for(const f of bookAssignments[b.id]){if(f.passage){assert.equal(passages[f.passage].book,b.id);if(f.type==='poetry')assert.equal(passages[f.passage].type,'poetry');}else assert.equal(f.type,'argument');}}
});
test('Repository README remains completely blank',async()=>{assert.equal((await readFile(new URL('../README.md',import.meta.url))).length,0);});
