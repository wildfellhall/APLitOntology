export const masteryStates = {
  new: 'Not started', learning: 'Learning', practicing: 'Practicing', secure: 'Secure', review: 'Needs review',
};
export const kindLabels = {learn:'Lesson',practice:'Question set',essay:'Essay',project:'Concept project',classic:'Text project',review:'Review'};
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const timestamp = value => typeof value==='string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : '';
const safeKey = id => !['__proto__','prototype','constructor'].includes(id);
export function localDate(now=new Date()) { return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }
export function validDate(value) { return typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value>='1900-01-01' && value<='2199-12-31' && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value; }
export function addDays(date,days) { const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10); }
export function formatDate(date) { return validDate(date)?new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`)):''; }
export function defaultProfile(today=localDate()) { return {enabled:false,startDate:today,days:[1,3,5],minutes:45,focusUnit:'all',targetDate:''}; }
export function normalizeCourse(raw,config,today=localDate()) {
  raw=safeObject(raw);const p=safeObject(raw.profile),defaults=defaultProfile(today);
  const days=Array.isArray(p.days)?[...new Set(p.days.filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort():defaults.days;
  const profile={enabled:p.enabled===true,startDate:validDate(p.startDate)?p.startDate:today,days:days.length?days:defaults.days,minutes:Number.isInteger(p.minutes)&&p.minutes>=15&&p.minutes<=180?p.minutes:45,focusUnit:config.units.some(u=>String(u.id)===String(p.focusUnit))?String(p.focusUnit):'all',targetDate:validDate(p.targetDate)?p.targetDate:''};
  const ratings={};for(const [id,r] of Object.entries(safeObject(raw.ratings)))if(Object.hasOwn(config.byId,id)&&r&&Object.hasOwn(masteryStates,r.state))ratings[id]={state:r.state,updatedAt:timestamp(r.updatedAt),note:typeof r.note==='string'?r.note.slice(0,3000):''};
  const attempts={};for(const [id,a] of Object.entries(safeObject(raw.attempts)))if(Object.hasOwn(config.questionById,id)&&a&&typeof a.firstCorrect==='boolean')attempts[id]={firstCorrect:a.firstCorrect,lastCorrect:!!a.lastCorrect,count:Number.isInteger(a.count)?Math.max(1,Math.min(10000,a.count)):1,lastAt:timestamp(a.lastAt)};
  const used=new Set();const tasks=[];
  for(const t of Array.isArray(raw.tasks)?raw.tasks:[]){
    if(!t||typeof t.id!=='string'||!safeKey(t.id)||t.id.length>240||used.has(t.id)||!Object.hasOwn(config.activities,t.activityId))continue;
    used.add(t.id);tasks.push({id:t.id,activityId:t.activityId,status:['planned','done','dismissed'].includes(t.status)?t.status:'planned',addedAt:timestamp(t.addedAt),completedAt:timestamp(t.completedAt),reflection:typeof t.reflection==='string'?t.reflection.slice(0,10000):'',minutes:Number.isInteger(t.minutes)&&t.minutes>=15&&t.minutes<=6000?t.minutes:config.activities[t.activityId].minutes,sessions:Array.isArray(t.sessions)?[...new Set(t.sessions.filter(validDate))].sort():[],customDue:validDate(t.customDue)?t.customDue:''});
  }
  const normalized={version:1,profile,ratings,attempts,tasks};
  return tasks.some(t=>t.status==='planned'&&!t.sessions.length)?scheduleRemaining(normalized,today):normalized;
}
export function makeConfig({id,label,concepts,units,questions,projects,textProjects=[]}) {
  const byId=Object.fromEntries(concepts.map(n=>[n.id,n]));const questionById={};const byConcept=Object.fromEntries(concepts.map(n=>[n.id,[]]));
  for(const q of questions){if(!byConcept[q.concept])continue;questionById[q.id]=q;byConcept[q.concept].push(q);}
  const activities={};
  for(const n of concepts){
    for(const [kind,minutes,title,href] of [
      ['learn',20,n.title,`#/concept/${n.id}/learn`],['practice',30,`Practice: ${n.title}`,`#/concept/${n.id}/practice`],
      ['essay',60,`Essay: ${n.title}`,`#/concept/${n.id}/practice/essay`],['review',25,`Review: ${n.title}`,`#/concept/${n.id}/learn`],
      ['project',270,projects[n.id]?.title||n.title,`#/concept/${n.id}/project`],
    ])activities[`${kind}:${n.id}`]={id:`${kind}:${n.id}`,kind,minutes,title,href,nodeId:n.id,conceptIds:[n.id],unit:n.unit};
  }
  for(const p of textProjects)activities[`classic:${p.id}`]={id:`classic:${p.id}`,kind:'classic',minutes:p.minutes||900,title:p.title,href:p.href,nodeId:null,conceptIds:p.conceptIds.filter(id=>byId[id]),unit:null};
  return {id,label,concepts,byId,units,questions:byConcept,questionById,activities};
}
export function quizEvidence(id,work,config) {
  const questions=config.questions[id]||[];let checked=0,correct=0,firstCorrect=0,tracked=0,latest='';
  for(const q of questions){const response=work.answers?.[q.id];const submitted=config.id==='ap-language'?response?.submitted:response?.checked;const choice=config.id==='ap-language'?response?.selected:response?.choice;
    if(submitted&&Number.isInteger(choice)){checked++;if(choice===q.answer)correct++;}
    const a=work.course?.attempts?.[q.id];if(a){tracked++;if(a.firstCorrect)firstCorrect++;if(a.lastAt>latest)latest=a.lastAt;}
  }
  return {checked,correct,total:questions.length,firstCorrect,tracked,latest};
}
export function masteryFor(id,work,config) {
  const course=work.course||{};const quiz=quizEvidence(id,work,config);const rating=course.ratings?.[id];
  const records=(course.tasks||[]).filter(t=>t.status==='done'&&config.activities[t.activityId]?.conceptIds.includes(id));
  const application=records.some(t=>['essay','project','classic'].includes(config.activities[t.activityId].kind)&&t.reflection.trim().length>=20);
  const lesson=work.completed?.includes(id)||records.some(t=>config.activities[t.activityId].kind==='learn');
  let state='new',reason='No lesson or practice evidence yet.';
  if(lesson){state='learning';reason='The lesson has been marked complete.';}
  if(quiz.checked||records.some(t=>config.activities[t.activityId].kind==='practice')){state='practicing';reason='Practice is underway; apply the concept in writing next.';}
  if(quiz.checked>=5&&quiz.correct/quiz.checked<.6){state='review';reason='The latest checked answers suggest reviewing the lesson and explanations.';}
  if(quiz.total>=8&&quiz.checked===quiz.total&&quiz.correct/quiz.total>=.8&&application){state='secure';reason='Strong current practice results and a completed application with self-review.';}
  if(rating){state=rating.state;reason='Your self-assessment. Practice evidence remains visible below.';}
  const ready=state==='secure'||(!['new','review'].includes(state)&&quiz.checked>=8&&quiz.correct/quiz.checked>=.8);
  return {state,label:masteryStates[state],reason,quiz,application,lesson,ready,manual:!!rating,updatedAt:rating?.updatedAt||quiz.latest||records.at(-1)?.completedAt||''};
}
export function masteryMap(work,config) { return Object.fromEntries(config.concepts.map(n=>[n.id,masteryFor(n.id,work,config)])); }
export function recordAnswer(work,group,id,value,config,now=new Date()) {
  const next={...work,[group]:{...work[group],[id]:value}};if(group!=='answers'||!config.questionById[id])return next;
  const checked=config.id==='ap-language'?value?.submitted:value?.checked;const choice=config.id==='ap-language'?value?.selected:value?.choice;
  const previous=work.answers?.[id];const wasChecked=config.id==='ap-language'?previous?.submitted:previous?.checked;
  if(!checked||wasChecked||!Number.isInteger(choice))return next;
  const course=normalizeCourse(work.course,config);const old=course.attempts[id];const correct=choice===config.questionById[id].answer;
  course.attempts[id]={firstCorrect:old?.firstCorrect??correct,lastCorrect:correct,count:(old?.count||0)+1,lastAt:now.toISOString()};next.course=course;const nodeId=config.questionById[id].concept;const quiz=quizEvidence(nodeId,next,config);if(quiz.total&&quiz.checked===quiz.total)next.course={...course,tasks:course.tasks.map(t=>t.status==='planned'&&t.activityId===`practice:${nodeId}`?{...t,status:'done',completedAt:now.toISOString()}:t)};return next;
}
function focusIds(config,unit) {
  if(unit==='all')return new Set(config.concepts.map(n=>n.id));
  const ids=new Set();function visit(id){if(ids.has(id)||!config.byId[id])return;ids.add(id);config.byId[id].prerequisites.forEach(visit);}
  config.concepts.filter(n=>String(n.unit)===String(unit)).forEach(n=>visit(n.id));return ids;
}
export function recommendations(work,config,today=localDate()) {
  const course=normalizeCourse(work.course,config,today),states=masteryMap({...work,course},config),scope=focusIds(config,course.profile.focusUnit);
  const planned=new Set(course.tasks.filter(t=>t.status==='planned').map(t=>t.activityId));const done=new Set(course.tasks.filter(t=>t.status==='done').map(t=>t.activityId));
  const candidates=config.concepts.filter(n=>scope.has(n.id)).map((n,index)=>{
    const m=states[n.id];const missing=n.prerequisites.filter(id=>!states[id]?.ready);const unlocks=config.concepts.filter(x=>x.prerequisites.includes(n.id)).length;
    const dueReview=m.state==='secure'&&m.updatedAt&&m.updatedAt.slice(0,10)<=addDays(today,-14);
    let kind=m.state==='review'?'review':m.state==='secure'?'review':!m.lesson&&!m.quiz.checked?'learn':!m.ready?'practice':'essay';
    if(kind==='review'&&done.has(`review:${n.id}`)&&course.tasks.some(t=>t.activityId===`review:${n.id}`&&t.completedAt>m.updatedAt))kind=m.state==='secure'?'essay':'practice';
    if(m.state==='secure'&&!dueReview)return null;
    const activity=config.activities[`${kind}:${n.id}`];
    return {activity,missing,score:(m.state==='review'?120:0)+(m.quiz.checked?30:0)+unlocks*2-index/100-missing.length*200,reason:missing.length?`Prepare with ${missing.map(id=>config.byId[id].title).join(', ')}.`:m.state==='review'?(m.manual?'Your self-assessment calls for another review before further application.':`${m.quiz.correct} of ${m.quiz.checked} checked answers are correct. Revisit the reasoning before another application.`):dueReview?'Return to a previously secure concept after a break.':m.ready?'Practice suggests readiness for an essay that applies this concept.':kind==='learn'?`A foundation for ${unlocks||'further'} connected ${unlocks===1?'concept':'concepts'}.`:m.quiz.checked?`Continue the set: ${m.quiz.checked} of ${m.quiz.total} questions checked.`:'Move from the completed lesson to passage-based practice.'};
  }).filter(Boolean).sort((a,b)=>a.score-b.score).reverse();
  const study=candidates.filter(r=>!r.missing.length&&!planned.has(r.activity.id));
  const available=study;
  const anchor=candidates.find(r=>!r.missing.length)?.activity.nodeId||config.concepts.find(n=>scope.has(n.id))?.id;
  const projectNodes=[anchor,...config.concepts.filter(n=>scope.has(n.id)&&states[n.id].ready).map(n=>n.id)].filter(Boolean);
  const project=[...new Set(projectNodes)].map(id=>config.activities[`project:${id}`]).find(a=>!planned.has(a.id)&&!done.has(a.id));
  const extras=Object.values(config.activities).filter(a=>a.kind==='classic'&&!planned.has(a.id)&&!done.has(a.id)).map(a=>({activity:a,score:a.conceptIds.filter(id=>states[id]?.ready).length})).filter(r=>r.activity.conceptIds.length>0&&r.score>=Math.min(2,r.activity.conceptIds.length)).sort((a,b)=>b.score-a.score);
  return {study:available.slice(0,5),projects:[...(project?[{activity:project,reason:states[project.nodeId].ready?'Apply a practiced concept through creation, analysis, and reflection.':'Plan the lesson and question set before this extended application.'}]:[]),...extras.slice(0,1).map(r=>({...r,reason:`Connect ${r.score} practiced concepts in a source-based project. Reserve time for the source reading.`}))],states};
}
export function effectiveDue(task) { return task.customDue||task.sessions.at(-1)||''; }
function sessionDates(start,count,days) {const dates=[];let cursor=start;for(let i=0;dates.length<count&&i<40000;i++,cursor=addDays(cursor,1))if(days.includes(new Date(`${cursor}T12:00:00Z`).getUTCDay()))dates.push(cursor);return dates;}
export function scheduleRemaining(course,today=localDate()) {
  let cursor=[course.profile.startDate,today].sort().at(-1);
  const tasks=course.tasks.map(t=>{if(t.status!=='planned')return t;const sessions=sessionDates(cursor,Math.ceil(t.minutes/course.profile.minutes),course.profile.days);cursor=addDays(sessions.at(-1),1);return {...t,sessions};});
  return {...course,tasks};
}
export function addActivities(course,activityIds,config,today=localDate(),now=new Date()) {
  const active=new Set(course.tasks.filter(t=>t.status==='planned').map(t=>t.activityId));const tasks=[...course.tasks];
  const finalDates=tasks.filter(t=>t.status==='planned').flatMap(t=>t.sessions);let cursor=[course.profile.startDate,today,...finalDates.map(d=>addDays(d,1))].sort().at(-1);
  for(const activityId of activityIds){const a=config.activities[activityId];if(!a||active.has(activityId))continue;const sessions=sessionDates(cursor,Math.ceil(a.minutes/course.profile.minutes),course.profile.days);cursor=addDays(sessions.at(-1),1);
    let serial=1;while(tasks.some(t=>t.id===`${activityId}:${serial}`))serial++;
    tasks.push({id:`${activityId}:${serial}`,activityId,status:'planned',addedAt:now.toISOString(),completedAt:'',reflection:'',minutes:a.minutes,sessions,customDue:''});active.add(activityId);
  }
  return {...course,tasks};
}
export function preparationFor(activity,work,config) {
  const ids=[];const visited=new Set();const states=masteryMap(work,config);
  function prepare(id){if(visited.has(id)||!config.byId[id]||states[id].ready)return;visited.add(id);for(const p of config.byId[id].prerequisites)if(!states[p].ready)prepare(p);if(!states[id].lesson&&!states[id].quiz.checked)ids.push(`learn:${id}`);if(!states[id].ready)ids.push(`practice:${id}`);}
  if(['project','classic','essay'].includes(activity.kind))activity.conceptIds.forEach(prepare);
  return [...new Set([...ids,activity.id])];
}
export function starterActivities(work,config) {
  const rec=recommendations(work,config);const first=rec.study[0]?.activity;
  if(!first)return rec.projects.slice(0,1).map(r=>r.activity.id);
  const n=first.nodeId;const state=rec.states[n];const result=[];
  if(first.kind==='review')result.push(first.id);
  if(!state.lesson&&!state.quiz.checked)result.push(`learn:${n}`);
  if(!state.ready)result.push(`practice:${n}`);
  result.push(`essay:${n}`,`project:${n}`);return [...new Set(result)];
}
export function setRating(course,id,state,note='',now=new Date()) {const ratings={...course.ratings};if(state==='auto')delete ratings[id];else if(masteryStates[state])ratings[id]={state,note,updatedAt:now.toISOString()};return {...course,ratings};}
export function completeTask(course,id,reflection='',now=new Date()) {
  return {...course,tasks:course.tasks.map(t=>t.id===id?{...t,status:'done',completedAt:now.toISOString(),reflection}:t)};
}
export function mergeCourses(local,incoming,config) {
  const a=normalizeCourse(local,config),b=normalizeCourse(incoming,config);const tasks=new Map(b.tasks.map(t=>[t.id,t]));a.tasks.forEach(t=>tasks.set(t.id,t));
  return {...a,profile:a.profile.enabled?a.profile:b.profile,ratings:{...b.ratings,...a.ratings},attempts:{...b.attempts,...a.attempts},tasks:[...tasks.values()]};
}
export function calendarText(course,config) {
  const escape=s=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Commonplace//Personal study plan//EN','CALSCALE:GREGORIAN'];
  for(const t of course.tasks.filter(t=>t.status==='planned'&&validDate(effectiveDue(t)))){const a=config.activities[t.activityId],due=effectiveDue(t);lines.push('BEGIN:VEVENT',`UID:${encodeURIComponent(t.id)}@${config.id}.commonplace.local`,`DTSTAMP:${(timestamp(t.addedAt)||new Date().toISOString()).replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z')}`,`DTSTART;VALUE=DATE:${due.replaceAll('-','')}`,`DTEND;VALUE=DATE:${addDays(due,1).replaceAll('-','')}`,`SUMMARY:${escape(a.title)}`,`DESCRIPTION:${escape(`${kindLabels[a.kind]} · personal study deadline. ${t.sessions.length} planned study sessions.`)}`,'END:VEVENT');}
  lines.push('END:VCALENDAR');return lines.map(line=>{const chunks=[];let rest=line;while(new TextEncoder().encode(rest).length>70){let i=1;while(new TextEncoder().encode(rest.slice(0,i+1)).length<=70)i++;chunks.push(rest.slice(0,i));rest=' '+rest.slice(i);}chunks.push(rest);return chunks.join('\r\n');}).join('\r\n')+'\r\n';
}

export function recordLesson(work,id,config,now=new Date()) {
 const course=normalizeCourse(work.course,config);return {...work,course:{...course,tasks:course.tasks.map(t=>t.status==='planned'&&t.activityId===`learn:${id}`?{...t,status:'done',completedAt:now.toISOString()}:t)}};
}
