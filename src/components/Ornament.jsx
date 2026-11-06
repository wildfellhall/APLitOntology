import React from 'react';

// Original linework: petal folds, leaf veins, and hatch marks remain crisp at any size.
function Leaf({x,y,angle=0,scale=1}) {
 return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
  <path d="M0 0C-16-9-19-28-10-50C1-44 14-26 0 0Z" fill="currentColor" fillOpacity=".045"/>
  <path d="M0 0Q-5-22-10-50M-3-11l-9-9m7 1 9-10m-10 1-7-10m5 1 5-10M-7-34l-5-8" strokeWidth=".65"/>
  <path d="m-7-12-6-11m12 7 5-10m-9-4-6-10" strokeWidth=".4" opacity=".7"/>
 </g>;
}
function Rose({x,y,scale=1,angle=0}) {
 return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
  {[0,72,144,216,288].map(a=><g key={a} transform={`rotate(${a})`}>
   <path d="M-5-4C-14-10-25-17-27-29C-28-40-21-45-14-42C-8-51 2-48 7-42C17-42 23-33 17-24C12-16 3-10-5-4Z" fill="var(--paper)"/>
   <path d="M-4-10Q-17-25-15-37M0-13Q-5-27-3-37M4-17Q8-27 10-33M-10-13Q-23-27-22-32M-1-19l-6-13m13 8 6-7" strokeWidth=".65" opacity=".8"/>
  </g>)}
  {[28,100,172,244,316].map(a=><path key={a} transform={`rotate(${a})`} d="M-3 0C-15-5-18-18-9-22C-5-25 0-22 3-18C11-20 15-13 10-8C6-4 1-1-3 0Z" fill="var(--paper)" strokeWidth=".85"/>)}
  <path d="M-7 1c-6-8 2-15 9-10 7 1 8 9 1 12-7 5-13-1-9-5 3-4 8-1 6 2-2 3-5 1-4-1" fill="var(--paper)"/>
  {Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9;return <circle key={i} cx={Math.cos(a)*11} cy={Math.sin(a)*10} r=".8" fill="currentColor" stroke="none"/>;})}
 </g>;
}
export default function Ornament({className=''}) {
 return <svg className={`botanical ${className}`} viewBox="0 0 360 440" fill="none" aria-hidden="true" focusable="false">
  <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
   <g strokeWidth="1.05">
    <path d="M159 397c33-63 3-91 17-152s41-85 29-132M164 353c-5-66-69-89-59-170M174 296c50-12 83-34 90-75M184 218c-26-14-51-43-48-79M196 170c42-7 64-32 65-70M172 322c-28-2-65-26-72-57"/>
    <path d="M162 397c33-64 3-92 17-152s41-85 29-132" strokeWidth=".5"/>
    {[[164,361,-55,1.05],[170,342,70,1.1],[169,306,-30,.95],[196,286,85,.85],[229,266,25,.9],[184,251,-45,.9],[172,240,-90,.9],[148,279,-65,.85],[127,252,-35,.85],[107,216,-55,.7],[185,211,54,.9],[145,172,-25,.75],[215,164,65,.75],[246,137,25,.7],[195,148,-40,.7],[153,323,-100,.7]].map(([x,y,angle,scale],i)=><Leaf key={i} {...{x,y,angle,scale}}/>)}
    <path d="M261 102c-11-11-7-23 1-30 10 7 12 20-1 30ZM136 139c-11-9-12-20-3-28 11 5 16 18 3 28ZM99 267c-9-3-16-13-13-23 11 1 18 11 13 23Z" fill="var(--paper)"/>
    <path d="m259 100 3-23m-4 11-3-5m7 11 4-9m-131 50-1-19m-36 148-8-16" strokeWidth=".6"/>
    <Rose x={205} y={112} scale={1.04} angle={-12}/><Rose x={105} y={187} scale={.74} angle={32}/><Rose x={267} y={222} scale={.68} angle={-23}/>
    <path d="M146 379c9 1 23 7 27 12m-28-8c10 0 19 6 24 11m-10 1c-15 8-27 5-22-1 3-4 13-3 22 1 8-4 18-3 19 2 1 6-12 5-19-2Zm-3 2-12 16m17-15 10 16" strokeWidth=".8"/>
   </g>
  </g>
 </svg>;
}
export function FloralFrame(){return <span className="floral-frame" aria-hidden="true">{['nw','ne','sw','se'].map(c=><span key={c} className={`floral-corner ${c}`}/>)}</span>;}
export function FloralRule({className=''}){return <span className={`floral-rule ${className}`} aria-hidden="true"/>;}
