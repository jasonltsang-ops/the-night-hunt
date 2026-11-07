import React from 'react';

export function PhaseIndicator({phase}: {phase:'day'|'night'}) {
 return <svg className={`phase-indicator phase-indicator--${phase}`} viewBox="0 0 56 56" aria-hidden="true" focusable="false">
  {phase==='day'?<>
   <circle className="phase-sun-glow" cx="28" cy="28" r="22" fill="#ffc75b" opacity=".12"/>
   <g className="phase-sun-rays" stroke="#ffc75b" strokeWidth="2" strokeLinecap="round">
    {[0,45,90,135,180,225,270,315].map(angle=><path key={angle} d="M28 6V11" transform={`rotate(${angle} 28 28)`}/>)}
   </g>
   <circle cx="28" cy="28" r="12" fill="#ffd875"/>
   <path d="M20 27a8 8 0 0 1 8-8" fill="none" stroke="#fff0b5" strokeWidth="2" strokeLinecap="round"/>
  </>:<>
   <path d="M33 9a19 19 0 1 0 13 30A17 17 0 0 1 33 9Z" fill="#dbe5f4"/>
   <path className="phase-star phase-star--first" d="m43 7 1.5 4.5L49 13l-4.5 1.5L43 19l-1.5-4.5L37 13l4.5-1.5Z" fill="#fff0bb"/>
   <path className="phase-star phase-star--second" d="m47 25 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#e8efff"/>
  </>}
 </svg>;
}
