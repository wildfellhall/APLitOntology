import {writeFile,mkdir} from 'node:fs/promises';
import {catalog,lessons,questions,projects,classicalProjects,books,edges,skills,units,sources,passages,bookAssignments} from '../src/data/index.js';
await mkdir(new URL('../public/',import.meta.url),{recursive:true});
await writeFile(new URL('../public/ontology.json',import.meta.url),JSON.stringify({course:'AP English Literature and Composition',version:1,units,skills,concepts:catalog,edges,lessons,questions,projects,classicalProjects,books,passages,bookAssignments,sources},null,2));
console.log(`Exported ${catalog.length} concepts, ${lessons.length} lessons, ${questions.length} questions, ${projects.length+classicalProjects.length} projects.`);
const bookQuestionIndex=Object.fromEntries(books.map(b=>{const qs=questions.filter(q=>passages[q.passage].book===b.id);return [b.id,{count:qs.length,units:[...new Set(qs.map(q=>catalog.find(c=>c.id===q.concept).unit))],passages:[...new Set(qs.map(q=>q.passage))]}];}));
await writeFile(new URL('../src/data/question-index.js',import.meta.url),'// Generated question metadata; bodies load only when practice is opened.\nexport const bookQuestionIndex='+JSON.stringify(bookQuestionIndex)+';\n');
