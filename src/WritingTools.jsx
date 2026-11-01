import React,{useEffect,useRef,useState} from 'react';
import {CATEGORY_LABELS,MAX_ANALYSIS_CHARS,applyReplacement,highlightSegments} from './tools/analyze.js';
import {lookupWord} from './tools/thesaurus.js';
import './writing-tools.css';

const baseURL=new URL(import.meta.env.BASE_URL,document.baseURI).href;
const SAMPLE='The the narrator was described as reliable by the reader, but the details complicate that judgement. She has a unusual confidence in her account. Her conclusions are recieved without question by the other characters. When the remembered scene is examined closely, the contrast between what she notices and what she chooses to explain suggests that her certainty may protect a more fragile understanding of herself.';
const saveText=(name,text)=>{const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const closeExport=event=>{const details=event.currentTarget.closest('details');details.open=false;details.querySelector('summary').focus();};
const routeTo=id=>`#/tools/writing/${encodeURIComponent(id)}`;

export default function WritingTools({mode,draftId,work,patch,documents}){
 let requested;try{requested=decodeURIComponent(draftId||'writing-desk');}catch{requested='';}
 const selected=documents.find(d=>d.id===requested);
 return <div className="page writing-tools-page">
  <div className="tools-heading"><h1>Writing tools</h1></div>
  <nav className="tools-tabs" aria-label="Writing tools"><a href="#/tools/writing" aria-current={mode!=='thesaurus'?'page':undefined}>Writing desk</a><a href="#/tools/thesaurus" aria-current={mode==='thesaurus'?'page':undefined}>Thesaurus</a></nav>
  {mode==='thesaurus'?<section className="standalone-thesaurus"><p className="thesaurus-intro">Compare meanings and parts of speech before choosing an alternative.</p><Thesaurus/></section>:selected?<>
   {(documents.length>1||selected.href)&&<div className="document-bar"><div><label htmlFor="writing-document">Document</label><select id="writing-document" value={selected.id} onChange={e=>{location.hash=routeTo(e.target.value).slice(1);}}>{documents.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></div>{selected.href&&<a href={selected.href}>Return to assignment →</a>}</div>}
   <WritingDesk key={selected.id} document={selected} text={typeof work.drafts[selected.id]==='string'?work.drafts[selected.id]:''} onChange={value=>patch('drafts',selected.id,value)} dictionary={work.dictionary||{}} onDictionary={(word,value)=>patch('dictionary',word,value)}/>
  </>:<div className="tool-message"><p>This document could not be found. Your saved drafts are unchanged.</p><a className="button" href="#/tools/writing">Open the writing desk</a></div>}
  <Methodology/>
 </div>;
}

function useAnalysis(text,personal){
 const worker=useRef(null),sequence=useRef(0);const [retry,setRetry]=useState(0),[state,setState]=useState({busy:true,result:null,error:null,text:null});
 useEffect(()=>{
  let active=true;
  try{const w=new Worker(new URL('./tools/analysis.worker.js',import.meta.url),{type:'module'});worker.current=w;
   w.onmessage=({data})=>{if(active&&data.id===sequence.current)setState({busy:false,result:data.result||null,error:data.error||null,text:data.text});};
   w.onerror=()=>{if(active)setState({busy:false,result:null,error:'The writing checker could not load. Your draft is still saved. Retry to reconnect.',text:null});};
   return()=>{active=false;worker.current=null;w.terminate();};
  }catch{setState({busy:false,result:null,error:'The writing checker is unavailable in this browser. You can still write and export your draft.',text:null});}
 },[retry]);
 useEffect(()=>{const id=++sequence.current;setState(s=>({...s,busy:true,error:null}));const timer=setTimeout(()=>{if(worker.current)worker.current.postMessage({id,text,personal:JSON.parse(personal),base:baseURL});else setState({busy:false,result:null,error:'The checker could not start. Your draft is unchanged.',text:null});},350);return()=>clearTimeout(timer);},[text,personal,retry]);
 return {...state,refresh:()=>setRetry(n=>n+1)};
}

function WritingDesk({document:doc,text,onChange,dictionary,onDictionary}){
 const editor=useRef(null),history=useRef({past:[],future:[]}),issueRefs=useRef(new Map());
 const [,setHistoryVersion]=useState(0),[dismissed,setDismissed]=useState(new Set()),[filter,setFilter]=useState('all'),[annotated,setAnnotated]=useState(false),[side,setSide]=useState('review'),[selection,setSelection]=useState(null),[lookup,setLookup]=useState(null),[message,setMessage]=useState('');
 const personal=JSON.stringify(Object.keys(dictionary).filter(w=>dictionary[w]===true).sort());
 const analysis=useAnalysis(text,personal),result=!analysis.busy&&analysis.text===text?analysis.result:null;
 const issues=(result?.issues||[]).filter(i=>!dismissed.has(i.id));
 const visible=issues.filter(i=>filter==='all'||i.category===filter);
 const stats=result?.stats;
 const change=value=>{if(value===text)return;history.current.past.push(text);if(history.current.past.length>60)history.current.past.shift();history.current.future=[];setHistoryVersion(v=>v+1);setSelection(null);setLookup(null);setMessage('');onChange(value);};
 const undo=()=>{const h=history.current;if(!h.past.length)return;h.future.push(text);onChange(h.past.pop());setSelection(null);setLookup(null);setMessage('Revision undone.');setHistoryVersion(v=>v+1);};
 const redo=()=>{const h=history.current;if(!h.future.length)return;h.past.push(text);onChange(h.future.pop());setSelection(null);setLookup(null);setMessage('Revision restored.');setHistoryVersion(v=>v+1);};
 const locate=issue=>{setAnnotated(false);requestAnimationFrame(()=>{editor.current?.focus();editor.current?.setSelectionRange(issue.start,issue.end);});};
 const replace=(issue,value)=>{const next=applyReplacement(text,issue,value);if(next===null){setMessage('The text changed. Select it again before replacing.');return;}change(next);setMessage(value?`Replaced “${issue.excerpt}” with “${value}”.`:`Removed “${issue.excerpt}”.`);setAnnotated(false);requestAnimationFrame(()=>{editor.current?.focus();const end=issue.start+value.length;editor.current?.setSelectionRange(end,end);});};
 const selectText=e=>{const el=e.currentTarget,start=el.selectionStart,end=el.selectionEnd,excerpt=text.slice(start,end);setSelection(end>start&&excerpt.length<=80&&/^[\p{L}][\p{L}'’ -]*$/u.test(excerpt)?{start,end,excerpt}:null);};
 const openLookup=()=>{if(selection){setLookup({...selection,nonce:Date.now()});setSide('thesaurus');}};
 const report=()=>saveText(`${doc.id}-review.txt`,`${doc.label}\n\n${stats?`${stats.words} words; ${stats.sentences} sentences; ${stats.average.toFixed(1)} words per sentence.\n${stats.enoughForEstimate?`Estimated Flesch–Kincaid grade: ${stats.grade.toFixed(1)}. Flesch reading ease: ${stats.ease.toFixed(1)}.`:'Not enough text for a reading-level estimate.'}`:''}\n\nThese are pattern-based revision prompts, not an AP score or a complete grammar review.\n\n${issues.map(i=>`${CATEGORY_LABELS[i.category]}: ${i.title}\n“${i.excerpt}”\n${i.message}`).join('\n\n')}\n\nDRAFT\n\n${text}`);
 return <>
  <div className="writing-stats" aria-label="Writing statistics" aria-busy={analysis.busy}>
   <Stat label="Words" value={stats?.words}/><Stat label="Est. US grade" value={stats?.enoughForEstimate?Math.max(0,stats.grade).toFixed(1):null}/><Stat label="Long sentences" value={stats?.long}/>
  </div>
  <details className="extra-statistics"><summary>More statistics</summary><div className="writing-stats"><Stat label="Sentences" value={stats?.sentences}/><Stat label="Words / sentence" value={stats?.average.toFixed(1)}/><Stat label="Reading ease" value={stats?.enoughForEstimate?stats.ease.toFixed(1):null}/></div></details>
  <div className="desk-status" role="status">{analysis.busy?'Reviewing your text…':analysis.error?analysis.error:result?.tooLong?`Your draft is saved. Analysis supports up to ${MAX_ANALYSIS_CHARS.toLocaleString()} characters; use a shorter excerpt to review it.`:stats?.words?`${issues.length} revision ${issues.length===1?'prompt':'prompts'}.${!stats.enoughForEstimate?' Add at least 30 words and 3 sentences for a reading-level estimate.':''}`:'Write or paste a draft to begin.'}{analysis.error&&<button className="text-button" onClick={analysis.refresh}>Retry checker</button>}</div>
  <div className="writing-layout">
   <section className="manuscript" aria-labelledby="manuscript-title"><div className="manuscript-heading"><h2 id="manuscript-title">Manuscript</h2><span>Saved in this browser</span></div>
    <div className="editor-toolbar"><div><button onClick={undo} disabled={!history.current.past.length}>Undo</button><button onClick={redo} disabled={!history.current.future.length}>Redo</button></div><button aria-pressed={annotated} onClick={()=>setAnnotated(v=>!v)} disabled={!text||!!result?.tooLong}>{annotated?'Edit text':'Annotated view'}</button>{selection&&!annotated&&<button onClick={openLookup}>Look up selection</button>}</div>
    {annotated?<div className="annotated-text" aria-label="Annotated manuscript" tabIndex={0}>{highlightSegments(text,visible).map(s=>s.issue?<button key={s.start} className={`annotation ${s.issue.category}`} title={s.issue.title} onClick={()=>{setSide('review');requestAnimationFrame(()=>{const el=issueRefs.current.get(s.issue.id);el?.scrollIntoView({behavior:'smooth',block:'center'});el?.focus({preventScroll:true});});}}>{s.text}</button>:<React.Fragment key={s.start}>{s.text}</React.Fragment>)}</div>:<><label className="sr-only" htmlFor="manuscript-input">Manuscript text</label><textarea id="manuscript-input" ref={editor} value={text} onChange={e=>change(e.target.value)} onSelect={selectText} spellCheck={false} placeholder="Write or paste your draft here." onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}}}/></>}
    <div className="manuscript-footer">{!text&&doc.id==='writing-desk'&&<button onClick={()=>change(SAMPLE)}>Load sample</button>}<details className="editor-export" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();closeExport(e);}}}><summary>Export</summary><div><button disabled={!text} onClick={e=>{saveText(`${doc.id}.txt`,text);closeExport(e);}}>Export text</button><button disabled={!result||!text||result.tooLong} onClick={e=>{report();closeExport(e);}}>Export review</button></div></details></div>
    <p className="revision-message" role="status">{message}</p>
   </section>
   <aside className="writing-review" aria-label="Revision tools"><div className="review-switch"><button onClick={()=>setSide('review')} aria-pressed={side==='review'}>Review</button><button onClick={()=>setSide('thesaurus')} aria-pressed={side==='thesaurus'}>Thesaurus</button></div>
    {side==='thesaurus'?<Thesaurus seed={lookup} onReplace={lookup?word=>{let value=word;if(lookup.excerpt===lookup.excerpt.toUpperCase())value=word.toUpperCase();else if(/^[A-Z]/.test(lookup.excerpt))value=word[0].toUpperCase()+word.slice(1);replace(lookup,value);}:null}/>:<>
     <h2 className="sr-only">Revision notes</h2>
     <div className="review-filter"><label htmlFor="review-filter">Show</label><select id="review-filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All prompts ({issues.length})</option>{Object.entries(CATEGORY_LABELS).map(([key,label])=><option key={key} value={key}>{label} ({issues.filter(i=>i.category===key).length})</option>)}</select></div>
     {result?.spellingUnavailable&&<p className="tool-message">The spelling dictionary could not load. Other checks are available. <button className="text-button" onClick={analysis.refresh}>Retry dictionary</button></p>}
     {result?.total>200&&<p className="tool-message">Showing the first 200 prompts. Review a shorter excerpt for the remaining notes.</p>}
     <div className="issue-list" aria-busy={analysis.busy}>{analysis.busy?<p className="review-empty">Reviewing…</p>:visible.map(issue=><article className={`revision-note ${issue.category}`} key={issue.id} ref={el=>{if(el)issueRefs.current.set(issue.id,el);else issueRefs.current.delete(issue.id);}} tabIndex={-1}>
      <span className="note-category">{CATEGORY_LABELS[issue.category]}</span><h3>{issue.title}</h3><button className="issue-excerpt" aria-label={`Locate: ${issue.excerpt}`} title="Locate this text in the manuscript" onClick={()=>locate(issue)}>“{issue.excerpt.length>160?issue.excerpt.slice(0,160)+'…':issue.excerpt}”</button><p>{issue.message}</p>
      {issue.replacements.length>0&&<div className="replacement-options">{issue.replacements.map((word,i)=><button key={i} onClick={()=>replace(issue,word)} aria-label={word?`Replace ${issue.excerpt} with ${word}`:`Remove ${issue.excerpt}`}>{word?`Use “${word}”`:'Remove phrase'}</button>)}</div>}
      <div className="note-actions"><button onClick={()=>setDismissed(v=>new Set([...v,issue.id]))}>Dismiss</button>{issue.category==='spelling'&&<button onClick={()=>onDictionary(issue.excerpt.toLowerCase(),true)}>Add to dictionary</button>}</div>
     </article>)}{result&&!result.tooLong&&!visible.length&&<p className="review-empty">{text?'No prompts in this view. A human reader can still help with meaning, evidence, and structure.':'Your revision notes will appear here.'}</p>}</div>
     {dismissed.size>0&&<button className="text-button restore-notes" onClick={()=>setDismissed(new Set())}>Restore dismissed notes ({dismissed.size})</button>}
    </>}
   </aside>
  </div>
  {JSON.parse(personal).length>0&&<details className="personal-dictionary"><summary>Personal dictionary ({JSON.parse(personal).length})</summary><p>Added words are accepted in every draft on this device. Capitalized names and acronyms are skipped automatically.</p><div>{JSON.parse(personal).map(word=><button key={word} onClick={()=>onDictionary(word,false)} aria-label={`Remove ${word} from personal dictionary`}>{word} ×</button>)}</div></details>}
 </>;
}
function Stat({label,value}){return <div><strong>{value??'—'}</strong><span>{label}</span></div>;}

function Thesaurus({seed=null,onReplace=null}){
 const [query,setQuery]=useState(seed?.excerpt||''),[state,setState]=useState({status:'idle'}),[part,setPart]=useState('all'),[limit,setLimit]=useState(12),[copied,setCopied]=useState('');const request=useRef(0);
 const search=async value=>{const id=++request.current;setQuery(value);setState({status:'loading'});setPart('all');setLimit(12);setCopied('');try{const result=await lookupWord(value,baseURL);if(id===request.current)setState({status:'ready',...result});}catch{if(id===request.current)setState({status:'error'});}};
 useEffect(()=>{if(seed?.excerpt)search(seed.excerpt);return()=>{request.current++;};},[seed?.nonce]);
 const senses=state.senses?.filter(s=>part==='all'||s.pos===part)||[];
 const targetMatches=!!onReplace&&state.query===seed?.excerpt.toLowerCase().trim();
 const copy=async word=>{try{await navigator.clipboard.writeText(word);setCopied(`Copied “${word}”.`);}catch{setCopied('Clipboard access is unavailable. Select the word and copy it manually.');}};
 return <div className="thesaurus-panel">
  <form className="word-search" onSubmit={e=>{e.preventDefault();search(query);}}><label htmlFor={onReplace?'selection-word':'lookup-word'}>Word or phrase</label><div><input id={onReplace?'selection-word':'lookup-word'} value={query} maxLength={80} onChange={e=>setQuery(e.target.value)} placeholder="e.g. deliberate" autoComplete="off"/><button className="button dark" type="submit" disabled={!query.trim()}>Look up</button></div></form>
  <div role="status" className="dictionary-status">{state.status==='loading'?'Consulting the dictionary…':state.status==='error'?'The dictionary could not load. Use Look up to retry.':state.status==='ready'&&state.invalid?'Enter an English word or short phrase, using letters, spaces, apostrophes, or hyphens.':state.status==='ready'&&!state.senses.length?`No alternatives found for “${state.query}”. Try its base form or a related word.`:state.status==='idle'?'Search by meaning, then compare the alternatives.':null}</div>
  {state.status==='ready'&&state.senses.length>0&&<>
   <div className="dictionary-result-title"><h2>{state.word}</h2><span>{state.senses.length} {state.senses.length===1?'sense':'senses'} with alternatives</span></div>
   {state.word!==state.query&&<p className="dictionary-note">Showing the base form “{state.word}” for “{state.query}”. Adjust tense or number to fit your sentence.</p>}
   {targetMatches&&<p className="dictionary-note">Use an alternative to replace the selected text. Check its meaning and grammatical form first.</p>}
   <div className="review-filter"><label htmlFor="word-part">Part of speech</label><select id="word-part" value={part} onChange={e=>{setPart(e.target.value);setLimit(12);}}><option value="all">All parts of speech</option>{[...new Set(state.senses.map(s=>s.pos))].map(pos=><option key={pos} value={pos}>{pos}</option>)}</select></div>
   <ol className="word-senses">{senses.slice(0,limit).map(s=><li key={s.id}><span className="sense-part">{s.pos}</span><p className="sense-definition">{s.definition}</p>{s.examples.length>0&&<p className="sense-example">“{s.examples[0]}”</p>}<div className="synonyms">{s.synonyms.map(word=><button key={word} title={targetMatches?`Replace selection with ${word}`:`Look up ${word}`} aria-label={targetMatches?`Replace selection with ${word}`:`Look up ${word}`} onClick={()=>targetMatches?onReplace(word):search(word)}>{word}</button>)}</div>{!targetMatches&&<button className="text-button copy-alternatives" onClick={()=>copy(s.synonyms.join(', '))}>Copy alternatives</button>}</li>)}</ol>
   {senses.length>limit&&<button className="button more-senses" onClick={()=>setLimit(v=>v+12)}>Show more meanings ({senses.length-limit})</button>}
  </>}
  <p role="status" className="copy-status">{copied}</p>
  <p className="dictionary-credit">WordNet 3.1, Princeton University. <a href={new URL('licenses/WordNet-3.1.txt',baseURL).href} target="_blank" rel="noreferrer">License</a>.</p>
 </div>;
}

function Methodology(){return <details className="tools-methodology"><summary>How these tools work</summary><div>
 <section><h2>Readability & complexity</h2><p>Flesch–Kincaid estimates a US school grade from words per sentence and syllables per word. Flesch reading ease uses the same counts; higher scores generally indicate easier reading. Scores can fall outside the usual ranges. Negative grade estimates display as 0.0. Estimates appear after 30 words and 3 sentences and are less reliable for short excerpts, quotations, names, and technical vocabulary.</p><p>Sentence boundaries and syllables are estimated. A line break can end a sentence. Sentences of 25 or more words are marked long; 35 or more are marked very long. Clause cues, possible passive constructions, and possible adverbs invite review. They do not measure the quality of an argument or predict an AP score.</p><p>Formula: grade = 0.39 × words/sentences + 11.8 × syllables/words − 15.59. Reading ease = 206.835 − 1.015 × words/sentences − 84.6 × syllables/words.</p><p>References: <a href="https://github.com/words/flesch-kincaid">Flesch–Kincaid</a>, <a href="https://github.com/words/flesch">Flesch reading ease</a>, <a href="https://github.com/words/syllable">syllable estimates</a>.</p></section>
 <section><h2>Grammar & vocabulary</h2><p>The checker recognizes a limited set of patterns: repeated words, selected subject–verb agreement, a/an, modal + have, capitalization of I, and punctuation spacing. It cannot comprehensively check grammar, interpret meaning, or evaluate literary interpretation. Quotations, dialect, and intentional rhetorical patterns require your judgment.</p><p>Spelling uses a US English dictionary with <a href="https://github.com/wooorm/nspell">nspell</a>. Names and acronyms beginning with capitals are skipped. Up to 60 spelling notes and 200 total notes appear per review. Analysis is limited to 100,000 characters; longer drafts remain saved.</p><p>The thesaurus groups synonyms by WordNet meaning and part of speech. Inflected queries may fall back to a base form; examples belong to the entire sense, not necessarily every alternative. It is not a complete usage dictionary.</p><p>Tools run on your device; dictionary files load from this site as needed. There are no draft uploads or third-party lookup requests. Save a copy with Export text or My workspace before clearing browser data.</p><p><a href="https://wordnet.princeton.edu/">WordNet</a> · <a href={new URL('licenses/dictionary-en.txt',baseURL).href}>Spelling dictionary license</a> · <a href={new URL('licenses/nspell.txt',baseURL).href}>nspell license</a> · <a href={new URL('licenses/syllable.txt',baseURL).href}>syllable license</a></p></section>
 </div></details>;}
