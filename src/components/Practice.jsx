import React,{useEffect,useState} from 'react';
import {essayRubric,practiceNotice} from '../data/framework.js';
import {loadConceptQuestions} from '../data/question-loader.js';
import {essayDirections} from '../data/content-helpers.js';
import Passage from './Passage.jsx';
export function Question({q,work,patch}){
 const saved=work.answers[q.id]||{};const [choice,setChoice]=useState(saved.choice??null);const checked=!!saved.checked;
 return <article className="question"><h3>{q.stem}</h3><fieldset disabled={checked}><legend className="sr-only">Choose the best answer</legend>{q.choices.map((text,i)=><label className={`choice ${checked&&i===q.answer?'correct':''}`} key={i}><input type="radio" name={q.id} checked={choice===i} onChange={()=>{setChoice(i);patch('answers',q.id,{choice:i,checked:false});}}/><span className="choice-letter">{'ABCD'[i]}</span><span>{text}</span></label>)}</fieldset>
  {!checked?<button className="button" disabled={choice===null} onClick={()=>patch('answers',q.id,{choice,checked:true})}>Check answer</button>:<div className="answer-feedback" aria-live="polite"><p><strong>{saved.choice===q.answer?'Correct.':'Review this question.'}</strong> The best answer is {'ABCD'[q.answer]}.</p><ol className="rationales" type="A">{q.rationales.map((r,i)=><li key={i}><strong>{i===q.answer?'Best answer. ':''}</strong>{r}</li>)}</ol><button className="text-button" onClick={()=>{setChoice(null);patch('answers',q.id,{choice:null,checked:false});}}>Try again</button></div>}
 </article>;
}
export function Draft({id,label='Your draft',work,patch,rows=14}){return <div className="draft"><label htmlFor={id}>{label}</label><textarea id={id} rows={rows} value={work.drafts[id]||''} onChange={e=>patch('drafts',id,e.target.value)} spellCheck="true"/><div className="draft-bottom"><span>Saved on this device · {(work.drafts[id]||'').trim().split(/\s+/).filter(Boolean).length} words</span><a href={`#/tools/writing/${encodeURIComponent(id)}`}>Open in writing tools</a></div></div>;}
export function QuestionSet({questions:qs,work,patch}){
 const [index,setIndex]=useState(0);const q=qs[index];const completed=qs.filter(q=>work.answers[q.id]?.checked).length;
 return <><div className="question-nav"><label htmlFor="question-number">Question <select id="question-number" value={index} onChange={e=>setIndex(Number(e.target.value))}>{qs.map((q,i)=><option key={q.id} value={i}>{i+1} of {qs.length}{work.answers[q.id]?.checked?' · reviewed':''}</option>)}</select></label><span>{completed} reviewed</span><div><button aria-label="Previous question" disabled={!index} onClick={()=>setIndex(i=>i-1)}>←</button><button aria-label="Next question" disabled={index===qs.length-1} onClick={()=>setIndex(i=>i+1)}>→</button></div></div>{q&&<div className="practice-spread"><Passage id={q.passage}/><Question key={q.id} q={q} work={work} patch={patch}/></div>}</>;
}
export function Essay({frq,id,work,patch}){
 return <><section className="essay-task"><p className="eyebrow">{frq.type==='poetry'?'Poetry analysis':frq.type==='prose'?'Prose-fiction analysis':'Literary argument'} · Suggested time: 40 minutes</p><h2>Essay assignment</h2><p>{frq.prompt}</p><p>{essayDirections}</p></section>{frq.passage&&<details className="essay-passage"><summary>Read the selection</summary><Passage id={frq.passage}/></details>}<details className="planning"><summary>Plan & self-review</summary><ol><li>Identify the task’s central relationship or tension.</li><li>State a defensible interpretation that answers it.</li><li>Choose details that develop different parts of your reasoning.</li><li>Account for a detail that complicates the claim.</li></ol><Draft id={`${id}-plan`} label="Planning notes" work={work} patch={patch} rows={7}/><div className="essay-rubric">{essayRubric.map(r=><section key={r.title}><h3>{r.title} <span>{r.points}</span></h3><p>{r.text}</p></section>)}</div><p className="quiet">This teaching guide paraphrases the AP categories. Consult the <a href="https://apcentral.collegeboard.org/media/pdf/ap26-sg-english-literature.pdf">official scoring guidelines</a> for complete task-specific decisions. Creative projects use their separate 100-point rubrics.</p></details><Draft id={`${id}-essay`} work={work} patch={patch}/></>;
}
export function useQuestions(load,key){
 const [state,setState]=useState({questions:[],error:false,loading:true});const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setState({questions:[],error:false,loading:true});load().then(questions=>{if(active)setState({questions,error:false,loading:false});}).catch(()=>{if(active)setState({questions:[],error:true,loading:false});});return()=>{active=false;};},[key,attempt]);
 return {...state,retry:()=>setAttempt(n=>n+1)};
}
export function QuestionLoading({state}){return state.error?<p role="alert">The question set could not be loaded. <button onClick={state.retry}>Try loading again</button></p>:<p role="status">Opening question set…</p>;}
export default function Practice({node,lesson,work,patch}){
 const state=useQuestions(()=>loadConceptQuestions(node),node.id);const [mode,setMode]=useState('mcq');
 return <><div className="practice-mode"><button aria-pressed={mode==='mcq'} onClick={()=>setMode('mcq')}>Multiple choice</button><button aria-pressed={mode==='essay'} onClick={()=>setMode('essay')}>Essay</button></div>{mode==='mcq'?<><p className="quiet">{practiceNotice}</p>{state.loading||state.error?<QuestionLoading state={state}/>:<QuestionSet key={node.id} questions={state.questions} work={work} patch={patch}/>}</>:<Essay frq={lesson.frq} id={node.id} work={work} patch={patch}/>}</>;
}
