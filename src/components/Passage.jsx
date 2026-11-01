import React from 'react';
import {passages,bookById} from '../data/curriculum.js';
export default function Passage({id,compact=false}){
 const p=passages[id];if(!p)return <p>Selection unavailable.</p>;const b=bookById[p.book];let line=0;
 return <section className={`passage ${compact?'compact':''}`} aria-label={`Reading: ${p.title}`}><header><p className="eyebrow">{p.author||b.author} · {p.location}</p><h3>{p.title}</h3><p className="context">{p.context}</p></header>
  <div className={p.lines?'verse':'prose'}>{p.lines?p.lines.map((t,i)=>t.trim()?<div className="verse-line" key={i}><span className="line-number" aria-hidden="true">{++line}</span><span>{t}</span></div>:<div key={i} className="stanza-break" aria-hidden="true"/>):p.paragraphs.map((t,i)=><React.Fragment key={i}>{p.omissions?.[i+1]&&<p className="omission">[{p.omissions[i+1]}]</p>}<div className="prose-paragraph"><span className="line-number" aria-hidden="true">{i+1}</span><p style={t.includes('\n')?{whiteSpace:'pre-line'}:undefined}>{t}</p></div></React.Fragment>)}</div>
  {p.glossary&&<aside className="reading-glossary" aria-label="Reading notes"><h4>Reading notes</h4><dl>{p.glossary.map(g=><React.Fragment key={g.term}><dt>{g.term}</dt><dd>{g.meaning}</dd></React.Fragment>)}</dl><p className="context">{p.glossaryNote}</p></aside>}
  <details className="source-note"><summary>Text & edition</summary><p>{p.note}</p><p>{b.edition}</p><p><a href={`#/book/${b.id}/read`}>Read the complete {b.genre==='Poetry'?'volume':'text'}</a> · <a href={b.url} target="_blank" rel="noreferrer">Project Gutenberg source</a></p></details>
 </section>;
}
