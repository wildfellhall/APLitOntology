import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {courseConfig as config} from '../src/course/config.js';
import {localDate,addDays,masteryFor,effectiveDue,preparationFor} from '../src/course/engine.js';
const lang=config.id==='ap-language',base=process.env.TEST_URL||`http://127.0.0.1:${lang?4175:4176}/`,key=lang?'commonplace-work-v1':'commonplace-literature-v1';
if(!/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+\/$/.test(base))throw Error('Tests require a local port.');
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(10000);
const errors=[],audits=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))requests.push(r.url());});
const go=async path=>{await page.goto(base+path);const parts=path.slice(2).split('/');const title=parts[0]==='course'?/^(My course|Create your course)$/:parts[0]==='map'?'Concept map':parts[0]==='concept'?config.byId[parts[1]].title:['workspace','notebook'].includes(parts[0])?'My workspace':null;if(title)await expect(page.locator('h1')).toHaveText(title);else await page.locator('h1').waitFor();};
const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const axe=async label=>{const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();audits.push({label,violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});};
const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`test-results/course-${name}.png`,fullPage:true});};
const task=id=>page.locator(`[data-task-id="${id}"]`);
try{
 await go('#/');
 const oldQuestion=Object.values(config.questionById).at(-1),oldNode=oldQuestion.concept;
 const oldAnswer=lang?{selected:oldQuestion.answer,submitted:true}:{choice:oldQuestion.answer,checked:true};
 await page.evaluate(({key,oldNode,oldQuestion,oldAnswer})=>localStorage.setItem(key,JSON.stringify({saved:[oldNode],completed:[],answers:{[oldQuestion.id]:oldAnswer},drafts:{[`${oldNode}-essay`]:'An existing essay that must survive course setup.'}})),{key,oldNode,oldQuestion,oldAnswer});
 await page.reload();await go('#/course');await axe('setup');
 const days=page.locator('.study-days input');for(let i=0;i<7;i++)await days.nth(i).uncheck();await page.getByRole('button',{name:'Create my course',exact:true}).click();await expect(page.getByRole('alert')).toContainText('at least one study day');
 for(const name of ['Monday','Wednesday','Friday'])await page.getByRole('checkbox',{name,exact:true}).check();
 await page.getByLabel('Minutes per study day',{exact:true}).fill('45');await page.getByRole('button',{name:'Create my course',exact:true}).click();await expect(page.locator('h1')).toHaveText('My course');
 let w=await saved();expect(w.answers[oldQuestion.id]).toEqual(oldAnswer);expect(w.drafts[`${oldNode}-essay`]).toContain('must survive');expect(w.saved).toContain(oldNode);expect(w.course.tasks).toHaveLength(4);
 const root=config.activities[w.course.tasks[0].activityId].nodeId,initialDates=w.course.tasks.map(t=>t.sessions);expect(w.course.tasks[3].sessions).toHaveLength(6);await page.reload();expect((await saved()).course.tasks.map(t=>t.sessions)).toEqual(initialDates);await axe('dashboard');await shot('desktop');
 // Lesson and checked-question evidence flows back automatically into the plan.
 await page.getByRole('link',{name:'Continue assignment',exact:false}).click();await expect(page.locator('h1')).toHaveText(config.byId[root].title);await page.getByRole('button',{name:lang?'Mark complete':'Mark lesson complete',exact:true}).click();await go('#/course');expect((await saved()).course.tasks[0].status).toBe('done');
 await go(`#/concept/${root}/practice`);
 for(const [i,q] of config.questions[root].entries()){
  if(lang){await page.locator('.question-index button').nth(i).click();await page.locator('.question-card .answer-option').nth(i<8?q.answer:(q.answer+1)%4).click();}else{await page.locator('#question-number').selectOption(String(i));await page.locator('.choice input').nth(i<8?q.answer:(q.answer+1)%4).check();}
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
 }
 await go('#/course');w=await saved();expect(w.course.tasks[1].status).toBe('done');expect(masteryFor(root,w,config).state).toBe('practicing');expect(w.course.tasks.map(t=>t.sessions)).toEqual(initialDates);
 const essay=w.course.tasks.find(t=>t.activityId===`essay:${root}`),project=w.course.tasks.find(t=>t.activityId===`project:${root}`);
 await task(essay.id).getByRole('link',{name:'Open assignment',exact:false}).click();await expect(page.getByLabel(lang?'Your essay draft':'Your draft',{exact:true})).toBeVisible();await go('#/course');
 // Application requires a reflection; the resulting mastery is transparent and overridable.
 await task(essay.id).getByRole('button',{name:'Mark complete',exact:true}).click();await task(essay.id).getByRole('button',{name:'Save completion',exact:true}).click();await expect(task(essay.id).getByRole('alert')).toContainText('at least 20 characters');
 await task(essay.id).getByLabel('Completion & self-review',{exact:true}).fill('My revised claim accounts for the strongest contrasting detail in the passage.');await axe('completion');await task(essay.id).getByRole('button',{name:'Save completion',exact:true}).click();w=await saved();expect(masteryFor(root,w,config).state).toBe('secure');
 await go(`#/map/${root}`);await page.getByLabel('Your mastery assessment',{exact:true}).selectOption('review');await page.getByRole('combobox',{name:'Mastery',exact:true}).selectOption('review');expect(await page.locator(lang?'.graph-node':'.map-node').count()).toBe(1);await expect(page.locator(lang?'.graph-node':'.map-node')).toHaveAttribute('data-mastery','review');await axe('mastery-map');
 await go('#/course');expect((await saved()).course.tasks.map(t=>t.sessions)).toEqual(initialDates);await expect(page.locator('.course-recommendation').filter({hasText:`Review: ${config.byId[root].title}`})).toBeVisible();
 // Custom dates can be overdue; editing an estimate preserves the deadline but replans sessions.
 await task(project.id).getByText('Dates & options',{exact:true}).click();await task(project.id).getByLabel('Custom due date',{exact:true}).fill(addDays(localDate(),-1));await task(project.id).getByLabel('Estimated study minutes',{exact:true}).fill('90');await task(project.id).getByRole('button',{name:'Save task changes',exact:true}).click();await expect(task(project.id).locator('.course-due')).toContainText('Overdue');await expect(task(project.id).locator('.course-note')).toContainText('before the estimated final session');w=await saved();expect(w.course.tasks.find(t=>t.id===project.id).sessions).toHaveLength(2);const customDue=effectiveDue(w.course.tasks.find(t=>t.id===project.id));await page.reload();await expect(task(project.id).locator('.course-due')).toContainText('Overdue');
 await page.getByText('Course settings',{exact:true}).click();await page.getByLabel('Minutes per study day',{exact:true}).fill('60');await page.getByRole('button',{name:'Save & reschedule remaining work',exact:true}).click();expect(effectiveDue((await saved()).course.tasks.find(t=>t.id===project.id))).toBe(customDue);await axe('settings');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export due dates to calendar',exact:true}).click();await(await download).saveAs('test-results/course.ics');const ics=await readFile('test-results/course.ics','utf8');expect(ics).toContain('BEGIN:VCALENDAR');expect(ics).toContain(customDue.replaceAll('-',''));
 // A standalone text project can be planned from its own page with the needed preparation.
 const classic=Object.values(config.activities).find(a=>a.kind==='classic'),before=await saved(),prep=preparationFor(classic,before,config);await go(classic.href);await page.getByRole('button',{name:'Add to study plan',exact:true}).click();await expect(page.getByRole('link',{name:'In your study plan',exact:false})).toBeVisible();w=await saved();for(const id of prep)expect(w.course.tasks.some(t=>t.activityId===id&&t.status==='planned')).toBe(true);const ids=w.course.tasks.filter(t=>t.status==='planned').map(t=>t.activityId);expect(new Set(ids).size).toBe(ids.length);
 await go('#/course');await page.getByText('Completed work (3)',{exact:true}).click();await page.getByRole('button',{name:'Reopen assignment',exact:true}).last().click();expect((await saved()).course.tasks.filter(t=>t.status==='done')).toHaveLength(2);
 // Export preserves course data and pre-existing drafts. Literature imports also merge it.
 await go(lang?'#/notebook':'#/workspace');const out=page.waitForEvent('download');await page.getByRole('button',{name:lang?'Export all my work':'Export my work',exact:true}).click();await(await out).saveAs('test-results/course-workspace.json');const backup=JSON.parse(await readFile('test-results/course-workspace.json','utf8')),exported=lang?backup:backup.work;expect(exported.course.profile.enabled).toBe(true);expect(exported.course.ratings[root].state).toBe('review');expect(exported.drafts[`${oldNode}-essay`]).toContain('must survive');
 if(!lang){const incoming=structuredClone(backup);incoming.work.course.ratings[root].state='secure';await page.getByLabel('Import workspace file').setInputFiles({name:'course.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});await expect(page.locator('main [role="status"]')).toContainText('Imported saved work');expect((await saved()).course.ratings[root].state).toBe('review');}
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const route of ['#/course','#/library',`#/concept/${root}/practice/essay`,'#/map']){await go(route);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),`overflow ${width} ${route}`).toBe(false);}await go('#/course');if(width===390){await shot('mobile');await axe('mobile-dashboard');await page.getByText('Course settings',{exact:true}).click();await axe('mobile-settings');}}
 expect(errors).toEqual([]);expect(requests).toEqual([]);expect(audits.flatMap(r=>r.violations.map(v=>`${r.label}: ${v.id} ${JSON.stringify(v.nodes)}`))).toEqual([]);
 console.log(JSON.stringify({course:config.id,workflows:'setup, migration, recommendations, question evidence, mastery, dates, rescheduling, projects, calendar, history, export, responsive layouts',audits:audits.length,errors},null,2));
}finally{await writeFile('test-results/course-accessibility.json',JSON.stringify(audits,null,2));await browser.close();}
