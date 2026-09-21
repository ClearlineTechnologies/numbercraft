/* Numbercraft — hand-built offline game. No accounts, trackers or dependencies. */
(function(){
'use strict';
const E=window.Numbercraft,$=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId=Object.fromEntries(E.courses.map(c=>[c.id,c]));
const colors={arithmetic:'var(--amber)',algebra:'var(--blue)',geometry:'var(--violet)'};
const KEY='numbercraft.progress.v1', dayKey=(date=new Date())=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
const defaults=()=>({version:1,xp:0,answered:0,clean:0,sessions:0,skills:{},facts:{},days:{},settings:{sound:false,motion:false,target:10},lastSkill:'count',badges:[],runBest:0,modes:[]});
let state=defaults(),storageOK=true,screen='home',track='arithmetic',skillChoice='count',difficulty=0,session=null,lesson=null,audioCtx=null,toastTimer;
const modes={
 engine:{name:'Answer Engine',tag:'YOU ARE THE CALCULATOR',description:'A keypad with one missing part: you supply the answer. Think, type, check. Take all the time you need.',art:'7|×|8|?',className:'',symbol:'⌨'},
 signal:{name:'Signal Sort',tag:'COMPARE & CONNECT',description:'Calculate the question, then route its result below, equal to, or above the target. A different way to use the same skill.',art:'<|=|>|?',className:'signal',symbol:'⇄'},
 match:{name:'Circuit Match',tag:'FIND THE CONNECTIONS',description:'Connect three questions to three answers. Complete three boards to light the circuit. Every match is a calculation.',art:'A|↔|B|✓',className:'match',symbol:'⋈'},
 rush:{name:'Recall Run',tag:'AN OPTIONAL 90-SECOND CHALLENGE',description:'Build fluency when you feel ready. Make as many answers as you can in 90 seconds. Pause whenever you need; no lost lives.',art:'0|1|:|30',className:'rush',symbol:'◴'}
};
const badges=[
 ['first','✧','First spark','Finish your first question.',()=>state.answered>=1],
 ['ten','✦','Getting started','Answer 10 questions.',()=>state.answered>=10],
 ['hundred','❖','Steady builder','Answer 100 questions.',()=>state.answered>=100],
 ['thousand','✺','A thousand steps','Answer 1,000 questions.',()=>state.answered>=1000],
 ['return','↺','Welcome back','Practise on 3 different days.',()=>Object.keys(state.days).length>=3],
 ['week','☷','A lasting habit','Practise on 7 different days.',()=>Object.keys(state.days).length>=7],
 ['three','△','Three dimensions','Try all three learning paths.',()=>Object.keys(E.tracks).every(t=>E.courses.some(c=>c.track===t&&state.skills[c.id]?.attempts))],
 ['arcade','◈','Game explorer','Play all four game modes.',()=>Object.keys(modes).every(m=>state.modes.includes(m))],
 ['recall','◎','Remembered','Recall 5 facts after a day away.',()=>Object.values(state.facts).filter(f=>f.level>=3).length>=5],
 ['table','×','Multiplication groove','20 unassisted multiplication answers.',()=>(state.skills.tables?.clean||0)>=20],
 ['study','◇','Pathfinder','Practise 20 different skills.',()=>Object.keys(state.skills).filter(id=>state.skills[id].attempts>0).length>=20],
 ['summit','⌂','Observatory keeper','Reach 5,000 XP.',()=>state.xp>=5000]
];
function finite(v,min=0,max=1e9){return typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):min;}
function validate(data){
 if(!data||data.version!==1||!data.skills||!data.facts||!data.settings)throw Error('This is not a Numbercraft backup.');
 const s=defaults();
 for(const k of ['xp','answered','clean','sessions','runBest'])s[k]=Math.floor(finite(data[k]));
 s.settings={sound:data.settings.sound===true,motion:data.settings.motion===true,target:[5,10,20].includes(data.settings.target)?data.settings.target:10};
 s.lastSkill=byId[data.lastSkill]?data.lastSkill:'count';
 s.badges=Array.isArray(data.badges)?data.badges.filter(b=>badges.some(a=>a[0]===b)):[];
 s.modes=Array.isArray(data.modes)?data.modes.filter(m=>modes[m]):[];
 for(const [id,v] of Object.entries(data.skills)){
  if(!byId[id]||!v||typeof v!=='object')continue;
  s.skills[id]={attempts:Math.floor(finite(v.attempts)),clean:Math.floor(finite(v.clean)),levels:[0,1,2].map(i=>Math.floor(finite(v.levels?.[i]))),recent:Array.isArray(v.recent)?v.recent.slice(-20).map(Boolean):[],bestTime:finite(v.bestTime,0,1e8),days:Array.isArray(v.days)?v.days.filter(d=>/^\d{4}-\d\d-\d\d$/.test(d)).slice(-365):[]};
 }
 for(const [d,v] of Object.entries(data.days||{}))if(/^\d{4}-\d\d-\d\d$/.test(d))s.days[d]=Math.floor(finite(v));
 for(const [key,f] of Object.entries(data.facts)){
  const q=f?.q;
  if(!q||!byId[q.skill]||typeof q.stem!=='string'||q.stem.length>800||!Number.isFinite(q.answer)||!Array.isArray(q.steps)||!E.correct(q,q.displayAnswer))continue;
  if(key!==q.key||key.length>1400||!key.startsWith(q.skill+'|'))continue;
  let visual;
  if(q.visual&&['dots','join','remove','groups','polygon','rectangle','triangle','circle'].includes(q.visual.kind)){
   visual={kind:q.visual.kind};
   for(const k of ['a','b','n'])if(Number.isFinite(q.visual[k]))visual[k]=finite(q.visual[k],0,1000);
  }
  s.facts[key]={q:{skill:q.skill,key,stem:q.stem,answer:q.answer,displayAnswer:String(q.displayAnswer).slice(0,80),steps:q.steps.slice(0,10).map(x=>String(x).slice(0,600)),hint:String(q.hint||'').slice(0,600),difficulty:Math.floor(finite(q.difficulty,0,2)),visual},level:Math.floor(finite(f.level,0,5)),due:finite(f.due,0,1e15),last:finite(f.last,0,1e15)};
 }
 return s;
}
try{const raw=localStorage.getItem(KEY);if(raw)state=validate(JSON.parse(raw));}catch(err){storageOK=false;}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch(err){storageOK=false;}
 $('#save-state').textContent=storageOK?'Progress saved on this device':'Session only · export a backup';
 updateHUD();
}
function dueFacts(id){return Object.values(state.facts).filter(f=>f.due<=Date.now()&&(!id||f.q.skill===id)).sort((a,b)=>a.due-b.due);}
function updateHUD(){
 $('#xp-count').textContent=state.xp.toLocaleString();
 $('#level-label').textContent='Level '+(1+Math.floor(state.xp/200));
 $('#due-count').textContent=dueFacts().length;
 $('#save-state').textContent=storageOK?'Progress saved on this device':'Session only · export a backup';
}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000);}
function sound(good=true){
 if(!state.settings.sound)return;
 try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();
 const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),t=audioCtx.currentTime;osc.type='sine';osc.frequency.setValueAtTime(good?523:220,t);osc.frequency.exponentialRampToValueAtTime(good?784:180,t+.15);gain.gain.setValueAtTime(.07,t);gain.gain.exponentialRampToValueAtTime(.001,t+.25);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(t);osc.stop(t+.26);}catch(err){}
}
function skillStats(id){return state.skills[id]||{attempts:0,clean:0,levels:[0,0,0],recent:[],bestTime:0,days:[]};}
function suggestedLevel(id){const s=skillStats(id);return s.levels[0]<8?0:s.levels[1]<8?1:2;}
function skillProgress(id){return Math.min(100,Math.round(skillStats(id).clean/20*100));}
function recommended(){
 const last=byId[state.lastSkill]||byId.count,list=E.courses.filter(c=>c.track===last.track);
 return list.find(c=>skillStats(c.id).clean<20||skillStats(c.id).levels[1]<8)||last;
}
function scene(){
 const stage=Math.min(5,Math.floor(state.xp/1000)),lit=state.xp>0;
 return '<svg viewBox="0 0 360 280" role="img" aria-label="An observatory being restored as you earn XP">'+
 '<defs><linearGradient id="island" x2="0" y2="1"><stop stop-color="#3a5b51"/><stop offset="1" stop-color="#1b3539"/></linearGradient><radialGradient id="glow"><stop stop-color="#d3f18c" stop-opacity=".3"/><stop offset="1" stop-color="#d3f18c" stop-opacity="0"/></radialGradient></defs>'+
 '<circle cx="182" cy="123" r="115" fill="url(#glow)"/><g fill="#a2b9b1"><circle cx="48" cy="63" r="2"/><circle cx="282" cy="42" r="2"/><circle cx="310" cy="115" r="2"/><circle cx="95" cy="27" r="1.5"/><circle cx="237" cy="17" r="1.5"/></g>'+
 '<ellipse cx="178" cy="240" rx="138" ry="15" fill="#0c1c23" opacity=".5"/><path d="M45 185 180 148 316 186 277 224 175 248 78 222Z" fill="url(#island)" stroke="#527364"/><path d="M45 185 180 220 316 186M180 220 175 248" stroke="#6a8866" fill="none"/>'+
 '<path d="M118 116 181 97 247 118 247 180 182 202 118 183Z" fill="#446456" stroke="#86a179"/><path d="M181 97 181 202 247 180 247 118Z" fill="#304d49"/>'+
 '<path d="M108 118 Q114 40 180 41 Q251 42 258 119 L181 143Z" fill="#728e69" stroke="#b3c899"/><path d="M180 42 Q205 55 207 134 L181 143 165 136 Q146 69 180 42" fill="#345554"/>'+
 '<path d="M144 78 228 41 241 59 159 100Z" fill="#a5b49a" stroke="#d6e0b7"/><ellipse cx="235" cy="49" rx="9" ry="12" transform="rotate(-26 235 49)" fill="#142e36" stroke="#d3f18c" stroke-width="3"/>'+
 '<path d="M147 190 147 163 Q158 150 169 164 L169 197" fill="'+(lit?'#d3f18c':'#1a3238')+'"/><path d="M207 151 227 144 227 166 207 173Z" fill="'+(stage>0?'#efd19a':'#19343c')+'"/>'+
 '<path d="M158 200 135 216 179 227 198 209" stroke="#a0ad7a" stroke-width="5" fill="none"/>'+
 (stage>0?'<path d="M70 182 79 143 89 182Z" fill="#a1b880"/><path d="M270 183 283 132 295 183Z" fill="#819d65"/>':'')+
 (stage>1?'<path d="M79 146V125M284 136V106" stroke="#b5c39c" stroke-width="3"/><path d="M80 125 102 130 80 139M285 106 308 113 285 123" fill="#d3f18c"/>':'')+
 (stage>2?'<circle cx="108" cy="204" r="5" fill="#e8cd83"/><circle cx="250" cy="204" r="5" fill="#e8cd83"/>':'')+
 (stage>3?'<path d="M244 46 320 9 310 65Z" fill="#d3f18c" opacity=".12"/><path d="M20 97 32 92 44 98 32 104Z" fill="#c5b2ef"/>':'')+
 (stage>4?'<path d="M55 35 60 47 72 51 60 55 55 67 51 55 39 51 51 47Z" fill="#e8f6b8"/><circle cx="306" cy="79" r="6" fill="#95ccea"/>':'')+'</svg>';
}
function intro(kicker,title,copy,extra=''){return '<div class="page-intro"><div><div class="eyebrow">'+kicker+'</div><h1>'+title+'</h1><p>'+copy+'</p></div>'+extra+'</div>';}
function renderHome(){
 const next=recommended(),today=state.days[dayKey()]||0,practised=Object.values(state.skills).filter(s=>s.attempts).length;
 $('#home-view').innerHTML=intro('A LITTLE EVERY DAY','Small steps. Real understanding.','Start where you are. Build something that stays.')+
 '<div class="hero"><div><span class="pill">YOUR NEXT SMALL STEP</span><h1>'+esc(state.answered?next.title:'Every mind starts with one number.')+'</h1><p>'+esc(state.answered?next.about:'Learn the idea, try it yourself, and return until it feels familiar. Your observatory grows with you.')+'</p><div class="hero-actions"><button class="button primary" data-lesson="'+next.id+'">'+(state.answered?'Continue learning':'Start from the beginning')+' <span>→</span></button><button class="text-button" data-nav="arcade">Explore the game room ↗</button></div></div><div class="observatory">'+scene()+'<span class="scene-caption">'+['AN OBSERVATORY OF YOUR OWN','LIGHTS ON · 1,000 XP','RAISE THE FLAGS · 2,000 XP','LIGHT THE PATH · 3,000 XP','A CLEARER SKY · 4,000 XP','OBSERVATORY RESTORED'][Math.min(5,Math.floor(state.xp/1000))]+'</span></div></div>'+
 '<div class="today-row"><div class="metric"><div class="metric-label">Today’s small promise</div><div class="metric-value">'+today+' <small>/ '+state.settings.target+' questions</small></div><div class="progress-track"><div style="width:'+Math.min(100,today/state.settings.target*100)+'%"></div></div></div><div class="metric"><div class="metric-label">Skills explored</div><div class="metric-value">'+practised+' <small>/ '+E.courses.length+'</small></div></div><div class="metric"><div class="metric-label">Days you showed up</div><div class="metric-value">'+Object.keys(state.days).length+' <small>no streak to lose</small></div></div></div>'+
 '<div class="section-head"><h2>Three paths. One foundation.</h2><span>Every lesson is open</span></div><div class="path-cards">'+Object.entries(E.tracks).map(([id,t],i)=>'<button class="path-card" data-track="'+id+'" style="--accent:'+colors[id]+'"><span class="card-arrow">↗</span><div class="path-symbol">'+['+ − × ÷','ƒ(x)','△'][i]+'</div><h3>'+t.title+'</h3><p>'+t.subtitle+'</p><span class="path-count">'+E.courses.filter(c=>c.track===id).length+' skills · from the beginning →</span></button>').join('')+'</div>'+
 '<div class="bottom-note"><b>↺</b><p><strong>Remembering is part of the game.</strong><br>Questions you need come back for another visit. Hints are always available. There are no lost lives.</p></div>';
}
function renderJourney(){
 const list=E.courses.filter(c=>c.track===track);
 $('#journey-view').innerHTML=intro('YOUR LEARNING PATHS','Build from the ground up.','Follow the order, or open any lesson. Start with Gentle and take your time.')+
 '<div class="track-tabs">'+Object.entries(E.tracks).map(([id,t])=>'<button class="track-tab '+(track===id?'active':'')+'" data-track="'+id+'" style="--accent:'+colors[id]+'">'+t.title+'</button>').join('')+'</div>'+
 E.tiers.map((name,tier)=>'<div style="--accent:'+colors[track]+'"><div class="tier-head"><span class="tier-no">0'+(tier+1)+'</span><h3>'+name+'</h3></div><div class="skill-grid">'+list.filter(c=>c.tier===tier).map(c=>{
  const s=skillStats(c.id),pct=skillProgress(c.id),due=dueFacts(c.id).length;
  return '<button class="skill-card '+(c.id===recommended().id?'current':'')+'" data-lesson="'+c.id+'"><span class="skill-num">'+String(list.indexOf(c)+1).padStart(2,'0')+' / '+E.tracks[track].title.toUpperCase()+'</span><span class="skill-star">'+(pct===100?'✦':s.attempts?'•':'')+'</span><h4>'+c.title+'</h4><span class="skill-state">'+(due?due+' questions ready to revisit':s.clean>=20?'Practised · keep returning':s.attempts?s.clean+' unassisted answers':'Learn · try · remember')+'</span><div class="tiny-progress"><i style="width:'+pct+'%"></i></div></button>';
 }).join('')+'</div></div>').join('')+
 '<div class="bottom-note"><b>✦</b><p>Fill each skill bar with 20 unassisted answers. This is practice progress, not proof of permanent mastery. Your review queue keeps working afterward.</p></div>';
}
function renderArcade(){
 $('#arcade-view').innerHTML=intro('THE GAME ROOM','Same skill. A new way to play.','Choose a topic and make it yours. Every mode makes new rounds.')+
 '<div class="arcade-intro"><div class="arcade-selects"><label class="field">LEARNING PATH<select id="arcade-track">'+Object.entries(E.tracks).map(([id,t])=>'<option value="'+id+'" '+(id===track?'selected':'')+'>'+t.title+'</option>').join('')+'</select></label><label class="field">SKILL<select id="arcade-skill"><option value="mix">Mix skills I have practised</option>'+E.courses.filter(c=>c.track===track).map(c=>'<option value="'+c.id+'" '+(c.id===skillChoice?'selected':'')+'>'+c.title+'</option>').join('')+'</select></label><label class="field">QUESTION LEVEL<select id="arcade-level">'+['Gentle · small steps','Steady · more variety','Stretch · larger challenges'].map((s,i)=>'<option value="'+i+'" '+(i===difficulty?'selected':'')+'>'+s+'</option>').join('')+'</select></label></div></div>'+
 '<div class="game-grid">'+Object.entries(modes).map(([id,m])=>'<article class="game-card"><div class="game-art '+m.className+'" aria-hidden="true">'+m.art.split('|').map((s,i)=>'<span class="'+(i===3?'accent':'')+'">'+esc(s)+'</span>').join('')+'</div><div class="tag-line">'+m.tag+'</div><h2>'+m.name+'</h2><p>'+m.description+'</p><button class="button secondary" data-game="'+id+'">Play '+m.name+' <span>→</span></button></article>').join('')+
 '<div class="bottom-note"><b>?</b><p>New to a topic? <button class="text-button" id="arcade-lesson">Open its lesson first →</button><br>Unfamiliar symbols are explained in the lesson. Fractions such as 3/4 are accepted.</p></div>';
 $('#arcade-skill').value=skillChoice;
}
function renderJournal(){
 const due=dueFacts(),ready={};due.forEach(f=>ready[f.q.skill]=(ready[f.q.skill]||0)+1);
 const days=Array.from({length:28},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(27-i));return d;});
 $('#journal-view').innerHTML=intro('YOUR FIELD JOURNAL','Look how far you have come.','Every return counts. Keep the useful things close.')+
 '<div class="journal-grid"><div class="journal-panel"><div class="eyebrow">BRING IT BACK</div><h3>'+due.length+' questions ready for review</h3>'+(due.length?'<button class="button primary" data-review="all">Start a review →</button><div>'+Object.entries(ready).slice(0,6).map(([id,n])=>'<div class="review-row"><div>'+byId[id].title+'<span>'+n+' scheduled '+(n===1?'question':'questions')+'</span></div><button data-review="'+id+'">Revisit</button></div>').join('')+'</div>':'<p>You are up to date. Practise a new skill, or revisit a favourite whenever you like.</p>')+'</div><div class="journal-panel"><div class="eyebrow">THE LAST FOUR WEEKS</div><h3>A little is still something.</h3><div class="calendar">'+days.map(d=>'<div class="day '+(state.days[dayKey(d)]?'active ':'')+(dayKey(d)===dayKey()?'today':'')+'" title="'+dayKey(d)+': '+(state.days[dayKey(d)]||0)+' questions">'+d.getDate()+'</div>').join('')+'</div><p>'+state.answered.toLocaleString()+' questions answered · '+state.clean.toLocaleString()+' without help.<br>'+state.sessions+' sessions completed. Best Recall Run: '+state.runBest+'.</p><p>Reviews become less frequent after successful recall. Misses return sooner.</p></div></div>'+
 '<div class="section-head"><h2>Marks of progress</h2><span>'+state.badges.length+' / '+badges.length+' earned</span></div><div class="badges">'+badges.map(([id,icon,title,desc])=>'<div class="badge '+(state.badges.includes(id)?'earned':'')+'"><span class="medallion">'+icon+'</span><b>'+title+'</b><small>'+desc+'</small></div>').join('')+'</div>'+
 '<div class="section-head"><h2>Your lesson library</h2><span>'+E.courses.length+' skills, always open</span></div><label class="visually-hidden" for="library-search">Find a lesson</label><input class="library-search" id="library-search" placeholder="Find a lesson…"><div class="lesson-library" id="lesson-library"></div>';
 renderLibrary('');
}
function renderLibrary(query){$('#lesson-library').innerHTML=E.courses.filter(c=>(c.title+' '+c.about+' '+c.track).toLowerCase().includes(query.toLowerCase())).map(c=>'<button class="lesson-link" data-lesson="'+c.id+'">'+c.title+'<small>'+E.tracks[c.track].title+' · '+E.tiers[c.tier]+'</small></button>').join('')||'<p class="empty">No lesson matches that search.</p>';}
function navigate(to){
 if(session){session=null;}
 screen=to;all('.view').forEach(v=>v.hidden=v.id!==to+'-view');
 all('.nav').forEach(b=>b.classList.toggle('active',b.dataset.nav===to));
 $('#location-label').textContent=({home:'YOUR BASECAMP',journey:'LEARNING PATHS',arcade:'THE GAME ROOM',journal:'FIELD JOURNAL',play:'IN THE WORKSHOP',result:'SESSION COMPLETE'})[to];
 ({home:renderHome,journey:renderJourney,arcade:renderArcade,journal:renderJournal}[to]||(()=>{}))();
 updateHUD();window.scrollTo({top:0,behavior:'instant'});
}
function visual(q,compact=false){
 const v=q.visual;if(!v)return '';
 const dots=(n,cls='')=>Array.from({length:Math.min(70,n)},()=>'<i class="dot '+cls+'"></i>').join('');
 let content='',label='';
 if(v.kind==='dots'){label='Count the dots';content=v.a?'<div class="dot-group">'+dots(v.a)+'</div>':'<div class="zero-set">An empty group</div>';}
 if(v.kind==='join'){label='Two groups to join';content='<div class="dot-group">'+(dots(v.a)||'0')+'</div><span class="operator">+</span><div class="dot-group">'+(dots(v.b,'blue')||'0')+'</div>';}
 if(v.kind==='remove'){label='A group with some crossed out';content='<div class="dot-group">'+dots(v.a-v.b)+dots(v.b,'removed')+'</div>';}
 if(v.kind==='groups'){label=v.a+' equal groups';content=Array.from({length:Math.min(v.a,20)},()=>'<div class="dot-group">'+dots(v.b)+'</div>').join('');}
 if(['polygon','rectangle','triangle','circle'].includes(v.kind)){
  let shape='';
  if(v.kind==='polygon'){
   const n=Math.max(3,Math.min(8,v.n));const pts=Array.from({length:n},(_,i)=>{const angle=-Math.PI/2+i*2*Math.PI/n+(n===4?Math.PI/4:0);return (110+Math.cos(angle)*51)+','+(66+Math.sin(angle)*51);}).join(' ');
   shape='<polygon points="'+pts+'" fill="#c5b2ef22" stroke="#c5b2ef" stroke-width="3"/>';label='A polygon; count its straight sides';
  }
  if(v.kind==='rectangle'){shape='<rect x="37" y="22" width="148" height="85" rx="1" fill="#95ccea15" stroke="#95ccea" stroke-width="3"/><text x="110" y="17">'+v.a+'</text><text x="205" y="70">'+v.b+'</text>';label='Rectangle with labelled side lengths; diagram not to scale';}
  if(v.kind==='triangle'){shape='<path d="'+(v.a?'M40 108 180 108 40 26Z':'M35 108 190 108 97 22Z')+'" fill="#c5b2ef15" stroke="#c5b2ef" stroke-width="3"/>'+(v.a?'<path d="M40 96H52V108" stroke="#a5b9c4" fill="none"/><text x="110" y="127">'+v.a+'</text><text x="24" y="71">'+v.b+'</text>':'');label='Triangle diagram; not to scale';}
  if(v.kind==='circle'){shape='<circle cx="110" cy="67" r="49" fill="#c5b2ef15" stroke="#c5b2ef" stroke-width="3"/><path d="M110 67H159" stroke="#d3f18c" stroke-width="2"/><circle cx="110" cy="67" r="3" fill="#d3f18c"/><text x="135" y="60">'+v.a+'</text>';label='Circle with radius labelled';}
  content='<svg viewBox="0 0 225 138" aria-hidden="true" style="fill:#d5e0d9;font:14px Segoe UI,sans-serif;text-anchor:middle">'+shape+'</svg>';
 }
 return '<div class="visual '+(compact?'compact':'')+'" role="img" aria-label="'+esc(label)+'">'+content+'</div>'+(!compact&&['rectangle','triangle','circle'].includes(v.kind)?'<p class="diagram-caption">Illustration · not to scale</p>':'');
}
const notes={
 count:'You can touch or point at the dots while saying 1, 2, 3… Say one number per dot. The final number tells you how many there are. If the group is empty, enter 0.',
 add:'When adding 8 + 3, you do not have to begin at 1. Start at 8 and take three steps: 9, 10, 11. Later you can make ten: 8 + 2 + 1 = 11.',
 subtract:'For 9 − 6 you can count back six, or ask how far it is from 6 to 9: 7, 8, 9 is three steps. Both methods give 3.',
 groups:'Three groups of two means two objects in each of three groups. It is 2 + 2 + 2. Multiplication is a shorter way to write this repeated addition.',
 tables:'Start with ×2 (double), ×5 (half of ×10), and ×10. Build ×4 by doubling twice. For ×8, double three times. For 8 × 7: double 7 → 14 → 28 → 56. Pick a strategy, then practise recalling the result.',
 division:'The total comes first: 12 ÷ 3 = 4. You can share twelve into three groups, or count how many groups of three fit in twelve. Use multiplication to check: 3 × 4 = 12.',
 'fraction-add':'The bottom number names the size of the pieces. Halves and thirds are different sizes. Rewrite both in sixths: one half is three sixths, one third is two sixths. Now 3/6 + 2/6 = 5/6.',
 variables:'A letter is a placeholder for a number. When x is 4, every x in that expression becomes 4. A number beside a letter means multiplication: 3x means 3 × x.',
 'one-step':'The equals sign means both sides have the same value. An equation is like a balanced scale: do the same operation to both sides to keep it balanced.',
 quadratics:'A root is a value of x that makes the expression zero. If (x − 2)(x − 5) = 0, one factor must be zero: x = 2 or x = 5. The larger root is 5.',
 shapes:'A side is one straight edge. A corner is where two sides meet; its mathematical name is a vertex. A triangle has three sides and three corners. A square has four equal sides and four right angles. A circle has a curved boundary, with no straight sides.',
 perimeter:'Perimeter is a trip around the outside. A rectangle has two long sides and two short sides. Add all four lengths. Units measure length; square units measure area.',
 area:'Area measures the surface inside a shape. Imagine covering it with square tiles. A rectangle three tiles across and two tiles high covers six square tiles.',
 angles:'An angle measures a turn between two rays that meet. A full turn is 360 degrees (360°). Half a turn is 180°, a straight line. A quarter turn is 90°, a right angle.',
 'triangle-area':'Perpendicular means meeting at 90°, like the corner of a square. A triangle takes half the area of a rectangle with the same base and perpendicular height. A slanted side is not always the height.',
 'circle-area':'The radius runs from the centre to the boundary. The diameter is twice the radius. π, pronounced “pi”, is a number approximately 3.14159. Here you enter only the number multiplying π, keeping the answer exact.',
 trig:'In a right triangle, the hypotenuse is opposite the 90° angle. Relative to another angle θ (theta), the opposite side faces it; the adjacent side touches it and is not the hypotenuse. Sine, cosine and tangent are ratios of these lengths.',
 derivatives:'A derivative gives the instantaneous rate of change: the slope at one point on a curve. f′ means “the derivative of f”. For x², that slope is 2x; at x = 3 it is 6.',
 integrals:'A definite integral accumulates signed area under a curve between two bounds. An antiderivative reverses differentiation. Evaluate the antiderivative at the upper bound, then subtract its value at the lower bound.',
 limits:'A limit asks what value an expression approaches near a point. It may exist even when the expression is undefined exactly at that point. Cancel a common factor only for values where that factor is nonzero, then take the limit.',
 determinants:'A matrix is a rectangular arrangement of numbers. A 2×2 matrix has two rows and two columns. Its determinant is a signed area scale factor. A determinant of zero means its transformation collapses area.',
 eigenvalues:'An eigenvector is a nonzero vector whose direction stays on the same line under a matrix transformation. Its eigenvalue is the scale factor, including sign. For a triangular matrix, the eigenvalues are its diagonal entries.',
 curvature:'A straight line has zero curvature. A circle of radius r has curvature 1/r. For y = ax² at the vertex x = 0, the tangent is horizontal and the curvature is 2|a|. These rounds practise that case.'
};
function openLesson(id,inPlay=false){
 if(!byId[id])return;
 lesson={id,d:inPlay&&session?session.q?.difficulty??difficulty:suggestedLevel(id),inPlay,step:0,q:null};
 lesson.q=E.generate(id,lesson.d);renderLesson();$('#lesson-dialog').showModal();
}
function renderLesson(){
 const c=byId[lesson.id],list=E.courses.filter(v=>v.track===c.track),prev=list[list.indexOf(c)-1],q=lesson.q;
 $('#lesson-content').innerHTML='<div class="dialog-head"><span class="eyebrow">'+E.tracks[c.track].title.toUpperCase()+' · '+E.tiers[c.tier].toUpperCase()+'</span><button class="icon-button" data-close="lesson-dialog" aria-label="Close lesson">×</button></div><h2 id="lesson-title">'+c.title+'</h2><p>'+esc(c.about)+'</p>'+
 '<div class="lesson-section"><h3>The idea</h3><p>'+esc(notes[c.id]||c.example)+'</p></div><div class="lesson-section"><h3>A rule to keep</h3><p>'+esc(c.rule)+'</p></div>'+
 '<details class="notation"><summary>Symbols & words, in plain language</summary><p>+ add · − subtract · × multiply · ÷ divide · = same value · &lt; less than · &gt; greater than · ≤ less than or equal to.</p><p>a/b means a divided by b. x² means x × x. x^3 means x × x × x. √ means the nonnegative square root. Brackets group an operation. A coefficient is a number multiplying a variable.</p><p>∑ means a sum. ∫ is an integral. f′ and f″ are first and second derivatives. θ names an angle; π is pi. A scalar is one number; a vector is a list of coordinates.</p></details>'+
 '<div class="worked-example"><span class="eyebrow">WATCH ONE, STEP BY STEP</span><div class="question">'+esc(q.stem)+'</div>'+visual(q)+
 (lesson.step?'<ol>'+q.steps.slice(0,lesson.step).map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>':'<p class="muted">Think about where you would begin, then reveal one step.</p>')+
 (lesson.step>=q.steps.length?'<strong>Answer: '+esc(q.displayAnswer)+'</strong>':'')+
 '<div class="example-controls"><button class="button secondary" id="example-step">'+(lesson.step>=q.steps.length?'Another example ↻':'Show the next step →')+'</button></div></div>'+
 '<div class="lesson-levels" aria-label="Question difficulty">'+['Gentle','Steady','Stretch'].map((s,i)=>'<button data-lesson-level="'+i+'" class="'+(lesson.d===i?'active':'')+'">'+s+'</button>').join('')+'</div>'+
 '<div class="lesson-actions"><button class="button primary" id="lesson-start">'+(lesson.inPlay?'Return to my question':'Try it myself')+' →</button>'+(prev&&!lesson.inPlay?'<button class="button ghost" data-lesson="'+prev.id+'">Earlier: '+prev.title+'</button>':'')+'</div>';
}
function pickQuestion(exclude=[]){
 const s=session,ids=s.ids;
 let q;
 const retry=s.retry.findIndex(v=>v.at<=s.records.length&&!exclude.includes(v.q.key));
 if(retry>=0)q=s.retry.splice(retry,1)[0].q;
 if(!q&&s.review){
  const f=s.reviewQueue.find(f=>!s.used.includes(f.q.key)&&!exclude.includes(f.q.key));
  if(f)q=f.q;
 }
 if(!q&&s.records.length%3===2){
  const due=dueFacts().find(f=>ids.includes(f.q.skill)&&!s.used.includes(f.q.key)&&!exclude.includes(f.q.key));
  if(due)q=due.q;
 }
 if(!q){
  let tries=0;
  do{const id=ids[Math.floor(Math.random()*ids.length)];q=E.generate(id,s.d);}while((exclude.includes(q.key)||s.used.slice(-3).includes(q.key))&&++tries<80);
 }
 s.used.push(q.key);return q;
}
function start(mode,id=skillChoice,review=false){
 if(!modes[mode])return;
 const ids=id==='mix'?E.courses.filter(c=>c.track===track&&skillStats(c.id).attempts>0).map(c=>c.id):[id];
 if(!ids.length)ids.push(E.courses.find(c=>c.track===track).id);
 const reviewQueue=review?dueFacts(id==='all'?undefined:id):[];
 if(review&&!reviewQueue.length){toast('You are up to date. Try a lesson or a favourite skill.');return;}
 const actualIds=review?[...new Set(reviewQueue.map(f=>f.q.skill))]:ids;
 navigate('play');
 session={mode,ids:actualIds,d:difficulty,review,reviewQueue,goal:mode==='match'?9:review?Math.min(8,reviewQueue.length):8,records:[],used:[],retry:[],xp:0,combo:0,remaining:90000,paused:false,clock:performance.now(),q:null,helped:false,solved:false,elapsed:0,selected:null,board:[],matches:[]};
 if(!review)state.lastSkill=actualIds[0];
 save();newRound();
}
function newRound(){
 const s=session;if(!s)return;
 if(s.mode!=='rush'&&s.records.length>=s.goal){finish();return;}
 s.helped=false;s.solved=false;s.elapsed=0;s.clock=performance.now();
 if(s.mode==='match'){
  s.board=[];s.matches=[];s.selected=null;s.boardHelp={};
  let attempts=0;
  while(s.board.length<3&&attempts++<200){
   const q=pickQuestion(s.board.map(x=>x.key));
   if(!s.board.some(v=>Math.abs(v.answer-q.answer)<1e-7))s.board.push(q);
  }
  s.answers=E.shuffle(s.board.map((q,i)=>({i,value:q.displayAnswer})));
  s.q=s.board[0];
 }else{
  s.q=pickQuestion();
  if(s.mode==='signal'){
   s.relation=[-1,0,1][Math.floor(Math.random()*3)];
   s.target=s.q.answer-s.relation*(1+Math.floor(Math.random()*5));
   if(byId[s.q.skill].tier===0&&s.q.answer>=0){s.target=Math.max(0,s.target);s.relation=Math.sign(s.q.answer-s.target);}
   s.targetLabel=s.relation===0?s.q.displayAnswer:(Number.isInteger(s.q.answer)?E.fmt(s.target):fractionOffset(s.q.displayAnswer,Math.round(s.target-s.q.answer)));
  }
 }
 renderPlay();window.scrollTo({top:0,behavior:'instant'});
}
function fractionOffset(value,offset){
 if(!value.includes('/'))return E.fmt(E.parseAnswer(value)+offset);
 const [a,b]=value.split('/').map(Number);return (a+offset*b)+'/'+b;
}
function renderPlay(){
 const s=session;if(!s)return;const m=modes[s.mode],q=s.q,c=byId[q.skill];
 $('#play-view').innerHTML='<div class="play-header"><div><div class="eyebrow">'+(s.review?'A GOOD TIME TO REMEMBER':m.tag)+'</div><h2>'+m.name+(s.review?' · Review':'')+'</h2></div><div class="play-stats"><span><b id="session-xp">'+s.xp+'</b> XP</span>'+(s.mode==='rush'?'<span class="timer" id="timer">1:30</span><button class="button ghost" id="pause-game">Pause</button>':'<span id="round-count">'+s.records.length+' / '+s.goal+'</span>')+'<button class="button ghost" id="end-session">Finish</button></div></div>'+
 '<div class="play-layout"><div class="game-stage"><div class="stage-top"><span class="question-kind">'+(s.mode==='match'?'CONNECT THE THREE PAIRS':c.title.toUpperCase())+'</span><span>'+['GENTLE','STEADY','STRETCH'][q.difficulty]+'</span></div><div class="stage-main" id="stage-main">'+
 (s.mode==='match'?renderBoard():renderQuestion())+
 '<div id="feedback" class="feedback" role="status" aria-live="polite"></div><div id="next-area"></div></div><div class="play-tools"><button id="hint-button">◌ Give me a hint</button><button id="teach-button">▤ Teach me this step</button><button id="play-lesson">↗ Open the lesson</button></div></div>'+
 '<aside class="play-sidebar"><div class="sidecard"><div class="eyebrow">A SMALL SESSION</div><h3 id="side-heading">'+(s.mode==='rush'?'A little faster, when ready.':'One answer at a time.')+'</h3><div class="session-dots">'+Array.from({length:s.mode==='rush'?Math.max(8,s.records.length):s.goal},(_,i)=>'<i class="'+(s.records[i]?(s.records[i].clean?'done':'helped'):'')+'"></i>').join('')+'</div><p>Mint: recalled independently.<br>Amber: learned with help.<br>Both move you forward.</p></div><div class="sidecard"><div class="eyebrow">YOUR TOOLBOX</div><h3>Understanding comes first.</h3><p>Use a hint. Open the lesson. Write on paper if you like. A worked solution is one tap away.</p></div><p class="side-note">Type a number, decimal or fraction (like 3/4). This keypad never calculates for you.</p></aside></div>';
 if(s.mode!=='match'&&s.mode!=='signal')$('#answer').focus({preventScroll:true});
 updateTimer();
}
function renderQuestion(){
 const s=session,q=s.q;
 return '<div class="question '+(q.stem.length<19?'short':'')+'">'+esc(q.stem)+'</div>'+visual(q)+
 (s.mode==='signal'?'<div class="target-value"><small>COMPARE YOUR RESULT WITH THIS TARGET</small><strong>'+esc(s.targetLabel)+'</strong></div><div class="comparison"><button data-compare="-1" aria-label="Result is less than target">&lt;<small>Less</small></button><button data-compare="0" aria-label="Result equals target">=<small>Equal</small></button><button data-compare="1" aria-label="Result is greater than target">&gt;<small>Greater</small></button></div>':
 '<label class="answer-label" for="answer">YOUR ANSWER</label><input id="answer" class="answer-input" inputmode="text" autocomplete="off" spellcheck="false" maxlength="50" placeholder="Type it here…" aria-describedby="answer-format"><span id="answer-format" class="visually-hidden">Enter a number, decimal, or fraction. Press Enter to check.</span>'+
 '<div class="keypad">'+['7','8','9','4','5','6','1','2','3','±','0','.','/','⌫','Clear'].map(k=>'<button data-key="'+k+'" class="'+(['±','/','⌫','Clear'].includes(k)?'utility':'')+'" aria-label="'+({'±':'Change sign','/':'Fraction slash','⌫':'Delete last digit'}[k]||k)+'">'+k+'</button>').join('')+'</div><div class="submit-row"><button class="button primary" id="check-answer">Check my answer →</button><button class="button ghost" id="skip-question">Pass</button></div>');
}
function renderBoard(){
 const s=session;
 return '<p class="muted">Choose a question on the left, then its answer on the right.</p><div class="match-columns"><div class="match-col">'+s.board.map((q,i)=>'<button class="match-card '+(s.matches.includes(i)?'matched':s.selected===i?'selected':'')+'" data-match-question="'+i+'" '+(s.matches.includes(i)?'disabled':'')+' aria-pressed="'+(s.selected===i)+'">'+(s.matches.includes(i)?'✓ ':'')+esc(q.stem)+visual(q,true)+'</button>').join('')+'</div><div class="match-col">'+s.answers.map(a=>'<button class="match-card answer '+(s.matches.includes(a.i)?'matched':'')+'" data-match-answer="'+a.i+'" '+(s.matches.includes(a.i)?'disabled':'')+'>'+esc(a.value)+'</button>').join('')+'</div></div>';
}
function feedback(text,kind=''){const f=$('#feedback');f.className='feedback '+kind;f.textContent=text;}
function markHelp(){
 if(!session)return;session.helped=true;
 if(session.mode==='match')session.boardHelp[session.selected??0]=true;
}
function record(q,clean,skipped=false){
 const s=session,now=Date.now(),today=dayKey(),old=state.facts[q.key];
 const stats=skillStats(q.skill);stats.attempts++;if(clean){stats.clean++;stats.levels[q.difficulty]++;}
 stats.recent=[...stats.recent,clean].slice(-20);
 if(!stats.days.includes(today))stats.days.push(today);
 if(clean&&(stats.bestTime===0||s.elapsed<stats.bestTime))stats.bestTime=Math.round(s.elapsed);
 state.skills[q.skill]=stats;
 // An early repeat reinforces the fact without promoting it through multiple time intervals.
 const schedule=clean&&old&&old.due>now?{level:old.level,due:old.due,last:now}:E.reviewUpdate(old,clean,now);
 state.facts[q.key]={q,...schedule};
 if(!clean&&!s.retry.some(v=>v.q.key===q.key))s.retry.push({q,at:s.records.length+3});
 s.combo=clean?s.combo+1:0;
 const xp=skipped?1:clean?10+Math.min(5,Math.max(0,s.combo-1)):4;
 s.xp+=xp;state.xp+=xp;state.answered++;if(clean)state.clean++;
 state.days[today]=(state.days[today]||0)+1;
 s.records.push({q,clean,skipped,time:s.elapsed,xp});
 const newly=badges.filter(([id,,,,test])=>!state.badges.includes(id)&&test());
 newly.forEach(([id])=>state.badges.push(id));
 save();
 if(newly.length)toast('Badge earned: '+newly.map(b=>b[2]).join(' · '));
 if(state.days[today]===state.settings.target)toast('Your daily target is complete. A small promise kept.');
}
function checkAnswer(){
 const s=session;if(!s||s.solved||s.paused)return;
 const value=$('#answer').value;
 if(E.parseAnswer(value)===null){feedback('Enter a number, decimal, or fraction like 3/4. The keypad does not solve expressions.');return;}
 if(E.correct(s.q,value))completeQuestion();
 else{markHelp();s.combo=0;sound(false);feedback('Not quite yet. Try again, use a hint, or open the worked steps.','bad');$('#answer').select();}
}
function completeQuestion(skipped=false){
 const s=session;if(!s||s.solved)return;
 record(s.q,!s.helped&&!skipped,skipped);s.solved=true;sound(!skipped);
 all('#stage-main input,#stage-main [data-key],#stage-main [data-compare],#check-answer,#skip-question').forEach(e=>e.disabled=true);
 feedback(skipped?'Saved for another visit. You can return with a fresh start.':s.helped?'You worked through it. This question will return for a fresh try.':'That’s it. You made the answer. +'+s.records.at(-1).xp+' XP',skipped?'':'good');
 $('#next-area').innerHTML='<button class="button primary next-button" id="next-question">'+(s.mode!=='rush'&&s.records.length>=s.goal?'See my session':'Next question')+' →</button>';
 $('#next-question').focus({preventScroll:true});$('#session-xp').textContent=s.xp;
 if($('#round-count'))$('#round-count').textContent=s.records.length+' / '+s.goal;
}
function compare(value){
 const s=session;if(!s||s.solved||s.paused)return;
 if(value===s.relation)completeQuestion();
 else{markHelp();s.combo=0;sound(false);feedback('Try once more. Work out the question first, then compare it with the target.','bad');}
}
function matchAnswer(i){
 const s=session;if(!s||s.solved||s.paused)return;
 if(s.selected===null){feedback('Choose a question on the left first.');return;}
 if(s.selected!==i){s.boardHelp[s.selected]=true;s.combo=0;sound(false);feedback('That pair does not connect yet. Try a different answer or use a hint.','bad');return;}
 const q=s.board[i];record(q,!s.boardHelp[i]);s.matches.push(i);s.selected=null;sound();
 const done=s.matches.length===s.board.length;
 s.solved=done;renderPlay();feedback(done?'Circuit complete. All three connections are in place.':'Connected. Choose the next question.','good');
 if(done){$('#next-area').innerHTML='<button class="button primary next-button" id="next-question">'+(s.records.length>=s.goal?'See my session':'Next circuit')+' →</button>';$('#next-question').focus({preventScroll:true});}
}
function help(solution=false){
 const s=session;if(!s||s.solved)return;
 if(s.mode==='match'&&s.selected===null){feedback('Select the question you want help with first.');return;}
 markHelp();const q=s.mode==='match'?s.board[s.selected]:s.q;
 const f=$('#feedback');f.className='feedback';
 f.innerHTML=solution?'<strong>Let’s work through it.</strong><ol>'+q.steps.map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol><p>Answer: <b>'+esc(q.displayAnswer)+'</b>. Enter or connect it yourself, then try a fresh question.</p>':esc(q.hint);
}
function finish(){
 const s=session;if(!s)return;
 if(s.records.length){state.sessions++;if(!state.modes.includes(s.mode))state.modes.push(s.mode);if(s.mode==='rush')state.runBest=Math.max(state.runBest,s.records.filter(r=>r.clean).length);}
 const newly=badges.filter(([id,,,,test])=>!state.badges.includes(id)&&test());newly.forEach(([id])=>state.badges.push(id));
 save();const clean=s.records.filter(r=>r.clean).length,helped=s.records.filter(r=>!r.clean),next=recommended();
 navigate('result');$('#result-view').classList.add('celebrate');
 $('#result-view').innerHTML='<div class="result"><div class="result-icon">'+(s.records.length?'✦':'◌')+'</div><div class="eyebrow">THE WORK ADDS UP</div><h1>'+(s.records.length?'A little stronger than before.':'A fresh start is always here.')+'</h1><p class="muted">'+(s.records.length?'You showed up and put your mind to work. That counts.':'Your progress is safe. Start another session whenever you are ready.')+'</p><div class="result-metrics"><div class="metric"><div class="metric-label">Questions</div><div class="metric-value">'+s.records.length+'</div></div><div class="metric"><div class="metric-label">Without help</div><div class="metric-value">'+clean+'</div></div><div class="metric"><div class="metric-label">XP earned</div><div class="metric-value">+'+s.xp+'</div></div></div>'+
 '<div class="result-review"><h3>'+(helped.length?'A few things to bring back.':'Keep the connection alive.')+'</h3><p>'+(helped.length?helped.length+' questions have been scheduled for another visit. A little distance gives you a fresh chance to remember.':'Your successful answers are scheduled for future review. Returning later matters as much as answering today.')+'</p>'+
 [...new Set(helped.map(r=>r.q.skill))].map(id=>'<button class="lesson-link" data-lesson="'+id+'">'+byId[id].title+' ↗</button>').join('')+(newly.length?'<p>New badges: '+newly.map(b=>b[2]).join(', ')+'.</p>':'')+'</div><div class="result-actions"><button class="button primary" id="play-again">Play another session →</button><button class="button secondary" data-lesson="'+next.id+'">Next lesson</button><button class="button ghost" data-nav="home">Back to basecamp</button></div></div>';
 $('#play-again').addEventListener('click',()=>start(s.mode,s.ids.length===1?s.ids[0]:'mix',false));
}
function updateTimer(){
 if(!session||session.mode!=='rush'||!$('#timer'))return;
 const t=Math.max(0,Math.ceil(session.remaining/1000));
 $('#timer').textContent=Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
 $('#pause-game').textContent=session.paused?'Resume':'Pause';
 $('#stage-main').classList.toggle('paused-stage',session.paused);
 all('#stage-main button,#stage-main input,.play-tools button').forEach(b=>{if(session.paused){if(!b.hasAttribute('data-before-pause'))b.dataset.beforePause=String(b.disabled);b.disabled=true;}else if(b.hasAttribute('data-before-pause')){b.disabled=b.dataset.beforePause==='true';delete b.dataset.beforePause;}});
}
setInterval(()=>{
 updateHUD();
 if(!session)return;
 const now=performance.now(),delta=Math.min(1000,now-session.clock);session.clock=now;
 if(session.paused||document.hidden||all('dialog[open]').length)return;
 if(!session.solved)session.elapsed+=delta;
 if(session.mode==='rush'){
  session.remaining-=delta;updateTimer();if(session.remaining<=0)finish();
 }
},150);
document.addEventListener('visibilitychange',()=>{if(session){session.clock=performance.now();if(document.hidden&&session.mode==='rush'){session.paused=true;updateTimer();}}});
document.addEventListener('click',ev=>{
 const b=ev.target.closest('button,[data-nav],.brand');if(!b||b.disabled)return;
 if(b.classList.contains('brand')){ev.preventDefault();navigate('home');return;}
 if(b.dataset.nav){navigate(b.dataset.nav);return;}
 if(b.dataset.track){track=b.dataset.track;skillChoice=E.courses.find(c=>c.track===track).id;navigate('journey');return;}
 if(b.dataset.close){$('#'+b.dataset.close).close();return;}
 if(b.dataset.lesson){
  if($('#lesson-dialog').open)$('#lesson-dialog').close();
  openLesson(b.dataset.lesson);return;
 }
 if(b.dataset.game){skillChoice=$('#arcade-skill').value;difficulty=Number($('#arcade-level').value);start(b.dataset.game);return;}
 if(b.dataset.review){start('engine',b.dataset.review,true);return;}
 if(b.dataset.lessonLevel){lesson.d=Number(b.dataset.lessonLevel);lesson.q=E.generate(lesson.id,lesson.d);lesson.step=0;renderLesson();return;}
 if(b.hasAttribute('data-key')){
  const inp=$('#answer');if(!inp||inp.disabled)return;
  const k=b.dataset.key,v=inp.value,start=inp.selectionStart??v.length,end=inp.selectionEnd??v.length;
  if(k==='Clear')inp.value='';
  else if(k==='±')inp.value=v.startsWith('-')?v.slice(1):'-'+v;
  else if(k==='⌫')inp.value=start===end?v.slice(0,Math.max(0,start-1))+v.slice(end):v.slice(0,start)+v.slice(end);
  else if(v.length<50)inp.value=v.slice(0,start)+k+v.slice(end);
  inp.focus({preventScroll:true});const pos=k==='Clear'?0:k==='±'?inp.value.length:k==='⌫'?Math.max(0,start-1):start+1;inp.setSelectionRange(pos,pos);return;
 }
 if(b.hasAttribute('data-compare')){compare(Number(b.dataset.compare));return;}
 if(b.hasAttribute('data-match-question')){
  session.selected=Number(b.dataset.matchQuestion);session.q=session.board[session.selected];renderPlay();feedback('Now choose the matching answer.');return;
 }
 if(b.hasAttribute('data-match-answer')){matchAnswer(Number(b.dataset.matchAnswer));return;}
 switch(b.id){
  case 'example-step':if(lesson.step>=lesson.q.steps.length){lesson.q=E.generate(lesson.id,lesson.d);lesson.step=0;}else lesson.step++;renderLesson();break;
  case 'lesson-start':$('#lesson-dialog').close();if(!lesson.inPlay){difficulty=lesson.d;skillChoice=lesson.id;track=byId[lesson.id].track;start('engine',lesson.id);}break;
  case 'arcade-lesson':openLesson(skillChoice==='mix'?E.courses.find(c=>c.track===track).id:skillChoice);break;
  case 'review-top':start('engine','all',true);break;
  case 'check-answer':checkAnswer();break;
  case 'skip-question':completeQuestion(true);break;
  case 'next-question':newRound();break;
  case 'hint-button':help();break;
  case 'teach-button':help(true);break;
  case 'play-lesson':if(session){markHelp();openLesson(session.q.skill,true);}break;
  case 'end-session':finish();break;
  case 'pause-game':session.paused=!session.paused;session.clock=performance.now();updateTimer();if(!session.paused)$('#answer')?.focus();break;
  case 'mobile-settings':
  case 'settings-open':$('#sound-setting').checked=state.settings.sound;$('#motion-setting').checked=state.settings.motion;$('#target-setting').value=state.settings.target;$('#settings-dialog').showModal();break;
  case 'about-open':$('#about-dialog').showModal();break;
  case 'export-progress':exportBackup();break;
  case 'reset-progress':if(confirm('Erase all Numbercraft progress saved in this browser? This cannot be undone without an exported backup.')){state=defaults();session=null;save();applySettings();$('#settings-dialog').close();navigate('home');toast('A new beginning.');}break;
 }
});
document.addEventListener('keydown',ev=>{
 if(ev.key==='Enter'&&ev.target.id==='answer'){ev.preventDefault();checkAnswer();}
});
document.addEventListener('input',ev=>{if(ev.target.id==='library-search')renderLibrary(ev.target.value);});
document.addEventListener('change',ev=>{
 const t=ev.target;
 if(t.id==='arcade-track'){track=t.value;skillChoice=E.courses.find(c=>c.track===track).id;renderArcade();}
 if(t.id==='arcade-skill')skillChoice=t.value;
 if(t.id==='arcade-level')difficulty=Number(t.value);
 if(t.id==='sound-setting'){state.settings.sound=t.checked;save();sound();}
 if(t.id==='motion-setting'){state.settings.motion=t.checked;save();applySettings();}
 if(t.id==='target-setting'){state.settings.target=Number(t.value);save();if(screen==='home')renderHome();}
 if(t.id==='import-progress')importBackup(t.files[0]);
});
function applySettings(){document.body.classList.toggle('reduce-motion',state.settings.motion);}
function exportBackup(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='numbercraft-progress-'+dayKey()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#settings-message').textContent='Backup exported. Keep the JSON file somewhere safe.';
}
async function importBackup(file){
 if(!file)return;
 try{
  if(file.size>8000000)throw Error('That file is too large. Choose a Numbercraft JSON backup under 8 MB.');
  const restored=validate(JSON.parse(await file.text()));
  if(!confirm('Replace this browser’s progress with the selected backup? Export your current progress first if you need both.'))return;
  state=restored;session=null;save();applySettings();navigate('home');$('#settings-message').textContent='Your progress has been restored.';
 }catch(err){$('#settings-message').textContent='Could not import: '+err.message;}
 finally{$('#import-progress').value='';}
}
applySettings();navigate('home');
})();
