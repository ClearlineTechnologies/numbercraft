const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const E=require('../engine.js');
let wall=1900000000000,mono=0,stored='',storageFails=false,tick;
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{id,innerHTML:'',textContent:'',value:'',disabled:false,dataset:{},className:'',classList:{add(){},remove(){},toggle(){}},focus(){},select(){},addEventListener(){},setSelectionRange(){},hasAttribute(){return false;},showModal(){this.open=true;},close(){this.open=false;},click(){}});return nodes.get(id);}
class ClockDate extends Date{constructor(...a){super(...(a.length?a:[wall]));}static now(){return wall;}}
const context={
 window:{Numbercraft:E,scrollTo(){}},document:{querySelector:node,querySelectorAll(){return [];},addEventListener(){},body:node('body'),hidden:false},
 localStorage:{getItem(){return stored;},setItem(k,v){if(storageFails)throw Error('Quota');stored=v;}},
 Date:ClockDate,performance:{now:()=>mono},setInterval(fn){tick=fn;},setTimeout(){},clearTimeout(){},console,confirm:()=>true,Blob,URL
};
vm.createContext(context);
let source=fs.readFileSync(require('node:path').resolve(__dirname,'../app.js'),'utf8');
source=source.replace("\napplySettings();navigate('home');","\nwindow.test={defaults,validate,start,newRound,record,completeQuestion,checkAnswer,compare,matchAnswer,finish,save,suggestedLevel,recommended,getState:()=>state,setState:s=>state=s,getSession:()=>session,setDifficulty:d=>difficulty=d,storageOK:()=>storageOK};");
vm.runInContext(source,context);
const A=context.window.test;
let runs=0;
// Exercise all skill/mode/difficulty combinations through the real session state machine.
for(const c of E.courses)for(let d=0;d<3;d++)for(const mode of ['engine','signal','match','rush']){
 A.setState(A.defaults());A.setDifficulty(d);A.start(mode,c.id);
 const s=A.getSession();assert.ok(s);
 if(mode==='match'){
  assert.equal(s.board.length,3,c.id+' makes a complete matching board');
  assert.equal(new Set(s.board.map(q=>q.answer)).size,3,c.id+' distinct matching answers');
  for(let i=0;i<3;i++){s.selected=i;A.matchAnswer(i);}
  assert.equal(s.records.length,3);
 }else if(mode==='signal'){
  const target=E.parseAnswer(s.targetLabel);
  assert.ok(Math.abs(target-s.target)<1e-6,c.id+' exact target text');
  const relation=Math.abs(s.q.answer-target)<1e-7?0:Math.sign(s.q.answer-target);
  A.compare(relation);assert.equal(s.records.length,1,c.id+' comparison checked');
 }else{
  node('#answer').value=s.q.displayAnswer;A.checkAnswer();assert.equal(s.records.length,1);
  const xp=A.getState().xp;A.checkAnswer();assert.equal(A.getState().xp,xp,'double submission gives no extra XP');
 }
 A.finish();assert.equal(A.getSession(),null);assert.ok(A.getState().sessions===1);runs++;
}
// Invalid and incorrect input do not grant an answer or XP; a hint marks assisted practice.
A.setDifficulty(0);
A.setState(A.defaults());A.start('engine','add');node('#answer').value='2+3';A.checkAnswer();assert.equal(A.getState().answered,0);
node('#answer').value='9999';A.checkAnswer();assert.equal(A.getState().answered,0);assert.equal(A.getSession().helped,true);
node('#answer').value=A.getSession().q.displayAnswer;A.checkAnswer();assert.equal(A.getState().clean,0);assert.equal(A.getState().answered,1);
assert.equal(A.getSession().retry.length,1);
// A retry is served after two intervening questions.
const missed=A.getSession().q.key;
A.newRound();A.completeQuestion();A.newRound();A.completeQuestion();A.newRound();assert.equal(A.getSession().q.key,missed);
// Review promotion requires time to pass. Early repeats cannot simulate long-term recall.
A.setState(A.defaults());A.start('engine','add');const q=A.getSession().q;A.record(q,true);
let fact=A.getState().facts[q.key];assert.equal(fact.level,0);const due=fact.due;A.record(q,true);assert.equal(A.getState().facts[q.key].due,due);assert.equal(A.getState().facts[q.key].level,0);
wall=due+1;A.record(q,true);assert.equal(A.getState().facts[q.key].level,1);
// Difficulty recommendations require practice at each level.
A.setState(A.defaults());A.start('engine','tables');let qs=A.getSession().q;
for(let i=0;i<8;i++)A.record(qs,true);
assert.equal(A.suggestedLevel('tables'),1);
qs=E.generate('tables',1);for(let i=0;i<8;i++)A.record(qs,true);
assert.equal(A.suggestedLevel('tables'),2);
// Progress round-trip preserves records, fractions, review dates, and settings.
const original=A.getState();original.settings.target=20;
const restored=A.validate(JSON.parse(JSON.stringify(original)));
assert.equal(restored.xp,original.xp);assert.equal(restored.skills.tables.clean,16);
assert.equal(restored.settings.target,20);assert.equal(Object.keys(restored.facts).length,Object.keys(original.facts).length);
assert.throws(()=>A.validate({version:12}));
assert.throws(()=>A.validate(null));
const polluted=JSON.parse(JSON.stringify(original));polluted.skills.fake={attempts:5};polluted.facts.fake={q:{skill:'fake',answer:0}};polluted.settings.target=999;
const safe=A.validate(polluted);assert.equal(safe.skills.fake,undefined);assert.equal(safe.facts.fake,undefined);assert.equal(safe.settings.target,10);
storageFails=true;A.save();assert.equal(A.storageOK(),false);storageFails=false;A.save();assert.equal(A.storageOK(),true);
// Timer pauses without advancing, then ends a run automatically.
A.setState(A.defaults());A.start('rush','tables');const rush=A.getSession();node('#answer').value=rush.q.displayAnswer;A.checkAnswer();
rush.paused=true;mono+=1000;tick();assert.equal(rush.remaining,90000);
rush.paused=false;for(let i=0;i<90;i++){mono+=1000;tick();}
assert.equal(A.getSession(),null);assert.equal(A.getState().runBest,1);
console.log(JSON.stringify({modeSkillDifficultyCombinations:runs,duplicateSubmission:'passed',retryQueue:'passed',reviewTiming:'passed',difficultyProgression:'passed',backupValidation:'passed',storageFailure:'passed',timerExpiryAndPause:'passed'},null,2));
