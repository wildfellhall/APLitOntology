import React from 'react';
import spray from '../assets/botanical-spray.svg';
import corner from '../assets/filigree-corner.svg';
import flourish from '../assets/filigree-flourish.svg';
import initial from '../assets/filigree-initial.svg';

// Original vector engravings. All decoration is excluded from interaction and reading order.
export default function Ornament({className=''}) {
 return <img className={`decoration botanical ${className}`} src={spray} alt="" aria-hidden="true" width="360" height="410"/>;
}
export function Flourish({className=''}) {
 return <img className={`decoration flourish ${className}`} src={flourish} alt="" aria-hidden="true" width="300" height="170"/>;
}
export function IllustratedInitial({children}) {
 return <span className="illustrated-initial"><img className="decoration initial-drawing" src={initial} alt="" aria-hidden="true"/><span>{children}</span></span>;
}
export function PageTitle({children}) {
 const text=React.Children.toArray(children).join('');
 return <h1 className="illustrated-title"><IllustratedInitial>{text[0]}</IllustratedInitial>{text.slice(1)}</h1>;
}
export function PageFrame() {
 return <div className="decoration botanical-border" aria-hidden="true">
  <span className="border-rule"/>
  <span className="border-vine border-vine-left"/><span className="border-vine border-vine-right"/>
  <span className="border-garland border-garland-top"/><span className="border-garland border-garland-bottom"/>
  {['nw','ne','sw','se'].map(position=><img key={position} className={`border-corner border-corner-${position}`} src={corner} alt=""/>)}
 </div>;
}
export function PageTail() {
 return <div className="decoration page-tail" aria-hidden="true"><Flourish/></div>;
}
export function FloralFrame() {
 return <span className="decoration floral-frame" aria-hidden="true">{['nw','ne','sw','se'].map(position=><img key={position} className={`floral-corner ${position}`} src={corner} alt=""/>)}</span>;
}
export function FloralRule({className=''}) {
 return <Flourish className={`floral-rule ${className}`}/>;
}
