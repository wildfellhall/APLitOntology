import test from 'node:test';
import assert from 'node:assert/strict';
import {courseConfig as realConfig} from '../src/course/config.js';
import {makeConfig,normalizeCourse,addActivities,scheduleRemaining,masteryFor,recommendations,recordAnswer,completeTask,setRating,mergeCourses,calendarText,effectiveDue,addDays,preparationFor,recordLesson} from '../src/course/engine.js';
const now=new Date('2026-11-05T12:00:00Z'),today='2026-11-05';
const concepts=[{id:'a',title:'Foundation',unit:1,prerequisites:[]},{id:'b',title:'Application',unit:2,prerequisites:['a']},{id:'c',title:'Transfer',unit:2,prerequisites:['b']}];
const questions=concepts.flatMap(n=>Array.from({length:10},(_,i)=>({id:`${n.id}-${i}`,concept:n.id,answer:i%4})));
const config=makeConfig({id:realConfig.id,label:'Test',concepts,units:[{id:1,title:'One'},{id:2,title:'Two'}],questions,projects:{a:{title:'A creative project'}},textProjects:[{id:'classic',title:'A book, an argument; a revision',conceptIds:['b','c'],href:'#/project/classic',minutes:180}]});
const empty=()=>({answers:{},completed:[],drafts:{essay:'Keep my draft'},course:normalizeCourse({},config,today)});
const response=(choice,checked=true)=>config.id==='ap-language'?{selected:choice,submitted:checked}:{choice,checked};
const answerAll=(work,id,correct=10)=>questions.filter(q=>q.concept===id).reduce((w,q,i)=>recordAnswer(w,'answers',q.id,response(i<correct?q.answer:(q.answer+1)%4),config,now),work);
const enabled=()=>({...empty().course,profile:{...empty().course.profile,enabled:true,startDate:today,days:[1,3,5],minutes:45}});

test('migration rejects malformed imported records and restores missing schedules',()=>{
 const raw=JSON.parse('{"ratings":{"__proto__":{"state":"secure"},"constructor":{"state":"secure"},"a":{"state":"secure","updatedAt":"bad"}},"tasks":[{"id":"bad","activityId":"constructor"},{"id":"valid","activityId":"learn:a","sessions":["invalid"]}],"profile":{"enabled":true,"days":[9],"minutes":0,"startDate":"9999-01-01"}}');
 const n=normalizeCourse(raw,config,today);assert.deepEqual(n.profile.days,[1,3,5]);assert.equal(n.profile.startDate,today);assert.equal(n.profile.minutes,45);assert.deepEqual(Object.keys(n.ratings),['a']);assert.equal(n.ratings.a.updatedAt,'');assert.equal(n.tasks.length,1);assert.deepEqual(n.tasks[0].sessions,['2026-11-06']);assert.equal({}.state,undefined);
});
test('lesson completion and ten correct answers are not independent proof of application',()=>{
 let w=empty();assert.equal(masteryFor('a',w,config).state,'new');w.completed=['a'];assert.equal(masteryFor('a',w,config).state,'learning');w=answerAll(w,'a',8);assert.equal(masteryFor('a',w,config).state,'practicing');assert.equal(masteryFor('a',w,config).ready,true);
 w.course=addActivities(enabled(),['essay:a'],config,today,now);w.course=completeTask(w.course,w.course.tasks[0].id,'Short',now);assert.equal(masteryFor('a',w,config).state,'practicing');w.course=completeTask(w.course,w.course.tasks[0].id,'My revision uses two details to defend a qualified interpretation.',now);assert.equal(masteryFor('a',w,config).state,'secure');
});
test('weak practice requests review; a manual rating can be removed',()=>{
 let w=answerAll(empty(),'a',3);assert.equal(masteryFor('a',w,config).state,'review');w.course=setRating(w.course,'a','secure','',now);assert.equal(masteryFor('a',w,config).state,'secure');assert.equal(masteryFor('a',w,config).manual,true);w.course=setRating(w.course,'a','auto');assert.equal(masteryFor('a',w,config).state,'review');
});
test('first attempts survive retries; checking the last question completes only that planned set',()=>{
 let w=empty();w.course=addActivities(enabled(),['practice:a','practice:b'],config,today,now);w=recordAnswer(w,'answers','a-0',response(1),config,now);w=recordAnswer(w,'answers','a-0',response(0,false),config,now);w=recordAnswer(w,'answers','a-0',response(0),config,now);assert.equal(w.course.attempts['a-0'].firstCorrect,false);assert.equal(w.course.attempts['a-0'].lastCorrect,true);assert.equal(w.course.attempts['a-0'].count,2);
 for(const q of questions.filter(q=>q.concept==='a'&&q.id!=='a-0'))w=recordAnswer(w,'answers',q.id,response(q.answer),config,now);
 assert.equal(w.course.tasks[0].status,'done');assert.equal(w.course.tasks[1].status,'planned');assert.equal(w.drafts.essay,'Keep my draft');assert.equal(w.course.attempts['a-0'].firstCorrect,false);
});
test('recommendations respect prerequisites, focus ancestors, and planned work',()=>{
 let w=empty();w.course.profile.focusUnit='2';assert.deepEqual(recommendations(w,config,today).study.map(r=>r.activity.id),['learn:a']);w.course=addActivities(w.course,['learn:a'],config,today,now);assert.equal(recommendations(w,config,today).study.length,0);w.course=setRating(w.course,'a','secure','',now);assert.deepEqual(recommendations(w,config,today).study.map(r=>r.activity.id),['learn:b']);
 assert.deepEqual(preparationFor(config.activities['project:c'],empty(),config),['learn:a','practice:a','learn:b','practice:b','learn:c','practice:c','project:c']);
});
test('old secure concepts return for review and known text skills yield text projects',()=>{
 const w=empty();for(const n of concepts)w.course=setRating(w.course,n.id,'secure','',new Date('2026-10-01T12:00:00Z'));const rec=recommendations(w,config,today);assert.ok(rec.study.every(r=>r.activity.kind==='review'));assert.ok(rec.projects.some(r=>r.activity.id==='classic:classic'));
});
test('study days and multi-session projects determine dates; additions do not move old dates',()=>{
 let c=addActivities(enabled(),['learn:a','essay:a','project:a'],config,today,now);assert.deepEqual(c.tasks[0].sessions,['2026-11-06']);assert.deepEqual(c.tasks[1].sessions,['2026-11-09','2026-11-11']);assert.equal(c.tasks[2].sessions.length,6);assert.equal(effectiveDue(c.tasks[2]),'2026-11-25');const before=structuredClone(c.tasks);c=addActivities(c,['project:a','learn:b'],config,today,now);assert.deepEqual(c.tasks.slice(0,3),before);assert.equal(c.tasks.length,4);assert.equal(effectiveDue(c.tasks[3]),'2026-11-27');
 c=completeTask(c,c.tasks[0].id,'',now);c.tasks[1].customDue='2026-11-01';const done=structuredClone(c.tasks[0]);c=scheduleRemaining(c,'2026-12-01');assert.deepEqual(c.tasks[0],done);assert.equal(effectiveDue(c.tasks[1]),'2026-11-01');assert.equal(c.tasks[1].sessions[0],'2026-12-02');
 assert.equal(addDays('2028-02-28',1),'2028-02-29');assert.equal(addDays('2026-11-01',1),'2026-11-02');
});
test('lesson route completion is reflected in the plan',()=>{const w=empty();w.course=addActivities(enabled(),['learn:a','learn:b'],config,today,now);const next=recordLesson(w,'a',config,now);assert.deepEqual(next.course.tasks.map(t=>t.status),['done','planned']);assert.equal(masteryFor('a',next,config).state,'learning');});
test('workspace merge preserves local edits and brings in other course records',()=>{
 let a=addActivities(enabled(),['learn:a'],config,today,now);a=setRating(a,'a','review','local',now);let b=addActivities(enabled(),['learn:b'],config,today,now);b=setRating(b,'a','secure','incoming',now);b=setRating(b,'b','practicing','incoming',now);b.profile.minutes=90;const m=mergeCourses(a,b,config);assert.equal(m.profile.minutes,45);assert.equal(m.ratings.a.note,'local');assert.equal(m.ratings.b.state,'practicing');assert.equal(m.tasks.length,2);
});
test('calendar export includes only active deadlines, proper all-day boundaries, and escapes',()=>{
 let c=addActivities(enabled(),['classic:classic','learn:a'],config,today,now);c=completeTask(c,c.tasks[1].id,'',now);const due=effectiveDue(c.tasks[0]);const text=calendarText(c,config);assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,1);assert.ok(text.includes(`DTSTART;VALUE=DATE:${due.replaceAll('-','')}`));assert.ok(text.includes(`DTEND;VALUE=DATE:${addDays(due,1).replaceAll('-','')}`));assert.ok(text.includes('A book\\, an argument\\; a revision'));assert.ok(text.endsWith('\r\n'));assert.ok(text.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
});
test('every live concept has its actual question evidence and all assignment routes',()=>{
 for(const n of realConfig.concepts){assert.equal(realConfig.questions[n.id].length,10,n.id);for(const kind of ['learn','practice','essay','project','review']){const a=realConfig.activities[`${kind}:${n.id}`];assert.equal(a.nodeId,n.id);assert.ok(a.href.startsWith(`#/concept/${n.id}/`));}assert.ok(realConfig.activities[`essay:${n.id}`].href.endsWith('/practice/essay'));}
 for(const a of Object.values(realConfig.activities).filter(a=>a.kind==='classic')){assert.ok(a.conceptIds.length,a.id);assert.ok(a.conceptIds.every(id=>realConfig.byId[id]));}
});

test('an already practiced project skill does not add redundant prerequisite lessons',()=>{const w=empty();w.course=setRating(w.course,'c','secure','',now);assert.deepEqual(preparationFor(config.activities['project:c'],w,config),['project:c']);});
