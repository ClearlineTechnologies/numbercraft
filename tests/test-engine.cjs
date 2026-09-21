const assert=require('node:assert/strict');
const E=require('../engine.js');
const results={samples:0,distinct:new Set(),skills:{}};
for(const c of E.courses){
 const keys=new Set();
 for(let d=0;d<3;d++)for(let i=0;i<500;i++){
  const q=E.generate(c.id,d,E.seeded(101+i*971+d*43));
  assert.ok(Number.isFinite(q.answer),c.id+' finite answer');
  assert.ok(E.correct(q,q.displayAnswer),c.id+' exact displayed answer '+q.displayAnswer+' vs '+q.answer);
  assert.ok(!E.correct(q,String(q.answer+1)),c.id+' rejects wrong answer');
  assert.equal(q.skill,c.id);
  assert.ok(q.steps.length&&q.steps.every(s=>typeof s==='string'&&s.length));
  assert.ok(q.hint&&q.stem&&!q.stem.includes('undefined'));
  const opts=E.options(q,E.seeded(i+14));
  assert.equal(opts.length,4);
  assert.equal(opts.filter(s=>E.correct(q,s)).length,1);
  assert.equal(new Set(opts.map(E.parseAnswer)).size,4);
  keys.add(q.key);results.distinct.add(q.key);results.samples++;
 }
 results.skills[c.id]=keys.size;
}
// Independent calculations from the visible questions, not from the answer path.
const checks={
 add:q=>q.stem.split(' + ').map(Number).reduce((a,b)=>a+b),
 subtract:q=>{let [a,b]=q.stem.split(' − ').map(Number);return a-b;},
 tables:q=>q.stem.split(' × ').map(Number).reduce((a,b)=>a*b),
 division:q=>{let [a,b]=q.stem.split(' ÷ ').map(Number);return a/b;},
 'fraction-add':q=>{const [a,b,c,d]=q.stem.match(/\d+/g).map(Number);return a/b+c/d;},
 'fraction-multiply':q=>{const [a,b,c,d]=q.stem.match(/\d+/g).map(Number);return a*c/(b*d);},
 quadratics:q=>{const [sum,product]=q.stem.match(/− (\d+)x \+ (\d+)/).slice(1).map(Number);return (sum+Math.sqrt(sum*sum-4*product))/2;},
 derivatives:q=>{const [a,n,b,x]=q.stem.match(/f\(x\) = (\d+)x\^(\d+) \+ (\d+)\. Find f′\((\d+)\)/).slice(1).map(Number);return a*n*Math.pow(x,n-1);},
 integrals:q=>{const [b,a,n]=q.stem.match(/0 to (\d+) of (\d+)x\^(\d+)/).slice(1).map(Number);return a/(n+1)*Math.pow(b,n+1);},
 determinants:q=>{const [a,b,c,d]=q.stem.match(/-?\d+/g).map(Number);return a*d-b*c;},
 'triangle-angles':q=>{const [a,b]=q.stem.match(/\d+/g).map(Number);assert.ok(a+b<180);return 180-a-b;},
 pythagoras:q=>{const [a,b]=q.stem.match(/\d+/g).map(Number);return Math.sqrt(a*a+b*b);},
 curvature:q=>{const a=Number(q.stem.match(/y=(-?\d+)x²/)[1]);return Math.abs(2*a);}
};
for(const [id,calc] of Object.entries(checks))for(let i=0;i<100;i++){
 const q=E.generate(id,2,E.seeded(i*1337+12));
 assert.ok(Math.abs(calc(q)-q.answer)<1e-7,id+' independent check: '+q.stem);
}
assert.equal(E.parseAnswer('3/4'),.75);
assert.equal(E.parseAnswer(' −2.5 '),-2.5);
assert.equal(E.parseAnswer('-2/3'),-2/3);
for(const bad of ['','2+3','2*3','3/0','NaN','Infinity','alert(1)','1e9','1/2/3'])assert.equal(E.parseAnswer(bad),null,bad);
assert.ok(E.correct({answer:1/3},'2/6'));
let old;const now=1000000;const delays=[60000,600000,86400000,259200000,604800000,1814400000];
for(let i=0;i<6;i++){old=E.reviewUpdate(old,true,now);assert.equal(old.level,i);assert.equal(old.due,now+delays[i]);}
assert.equal(E.reviewUpdate(old,true,now).level,5);
assert.deepEqual(E.reviewUpdate(old,false,now),{level:0,due:now+30000,last:now});
assert.ok(results.distinct.size>10000);
console.log(JSON.stringify({samples:results.samples,distinct:results.distinct.size,skills:E.courses.length,independentChecks:1300,parserAndScheduling:'passed',distinctBySkill:results.skills},null,2));
