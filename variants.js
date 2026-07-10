/* Bidirectional variant generators for reinforced Focused Study.
   Each generator makes a FRESH question on the same concept with random
   numbers/contexts AND a random "direction" (which quantity is unknown),
   so a skill is practised forwards and backwards. All answers are integers
   by construction; makeMC guarantees exactly one correct option among 5. */
(function(){
  function ri(lo,hi){return lo+Math.floor(Math.random()*(hi-lo+1));}
  function pick(a){return a[Math.floor(Math.random()*a.length)];}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
  // Build 5 distinct options (by display string) around `correct`, using the
  // supplied distractors first, then padding. Returns {options, answer}.
  function makeMC(correct,distractors,fmt){
    fmt=fmt||(x=>String(x));
    const seen=new Set(),vals=[];
    const push=v=>{ if(v===null||v===undefined)return; if(typeof v==="number"&&(!isFinite(v)||v<=0))return; const s=fmt(v); if(!seen.has(s)){seen.add(s);vals.push(v);} };
    push(correct);
    (distractors||[]).forEach(push);
    let step=1;
    while(vals.length<5&&step<300){push(correct+step);if(vals.length<5)push(correct-step);step++;}
    const arr=shuffle(vals.slice(0,5));
    const L=["A","B","C","D","E"],options={};let answer=null;
    arr.forEach((v,i)=>{options[L[i]]=fmt(v);if(fmt(v)===fmt(correct))answer=L[i];});
    return {options,answer};
  }
  const money=x=>"$"+x;

  const GEN={};

  // ---------- ratios ----------
  GEN["ratios"]=function(){
    const ctx=pick([{a:"flour",b:"sugar",u:"kg"},{a:"red paint",b:"white paint",u:"litres"},
      {a:"sand",b:"cement",u:"kg"},{a:"apple juice",b:"soda water",u:"mL"},{a:"rice",b:"lentils",u:"grams"}]);
    let A=ri(2,6),B=ri(1,5); if(A<=B)A=B+ri(1,3);
    const k=ri(2,9), sA=A*k, sB=B*k, T=(A+B)*k, diff=(A-B)*k;
    const mode=ri(0,2); let q,ans,ds,expl;
    if(mode===0){ // forward: total given, find a share
      q=`A mixture uses ${ctx.a} and ${ctx.b} in the ratio ${A} : ${B}. In a batch that uses ${T} ${ctx.u} in total, how much ${ctx.a} is used?`;
      ans=sA; ds=[sB,T,diff,T-sA-1];
      expl=`Total parts = ${A} + ${B} = ${A+B}, so one part = ${T} ÷ ${A+B} = ${k} ${ctx.u}. The ${ctx.a} is ${A} parts = ${A} × ${k} = ${sA} ${ctx.u}.`;
    }else if(mode===1){ // backward from difference
      q=`A mixture uses ${ctx.a} and ${ctx.b} in the ratio ${A} : ${B}. A batch uses ${diff} ${ctx.u} more ${ctx.a} than ${ctx.b}. What is the total amount of the mixture?`;
      ans=T; ds=[diff,sA,sB,diff*2];
      expl=`The difference is ${A} − ${B} = ${A-B} parts, and this equals ${diff} ${ctx.u}, so one part = ${diff} ÷ ${A-B} = ${k}. Total = ${A+B} parts × ${k} = ${T} ${ctx.u}.`;
    }else{ // backward from one share
      q=`A mixture uses ${ctx.a} and ${ctx.b} in the ratio ${A} : ${B}. A batch uses ${sB} ${ctx.u} of ${ctx.b}. How much ${ctx.a} does it use?`;
      ans=sA; ds=[sB,T,diff,sB+ (A-B)];
      expl=`The ${ctx.b} is ${B} parts = ${sB} ${ctx.u}, so one part = ${sB} ÷ ${B} = ${k}. The ${ctx.a} is ${A} parts = ${A} × ${k} = ${sA} ${ctx.u}.`;
    }
    return mk("Number and Algebra","ratios","ratios",q,ans,ds,x=>x+" "+ctx.u,expl);
  };

  // ---------- fractions of a quantity ----------
  GEN["fractions-of-quantity"]=function(){
    const q0=pick([2,3,4,5,6,8]), p=ri(1,q0-1), m=ri(3,15), N=q0*m, part=p*m, rest=(q0-p)*m;
    const mode=ri(0,2); let q,ans,ds,expl,fmt=x=>String(x);
    if(mode===0){
      const ctx=pick([{n:"marbles"},{n:"pages"},{n:"stickers"},{n:"cards"}]);
      q=`A collection has ${N} ${ctx.n}. ${p}/${q0} of them are red. How many are red?`;
      ans=part; ds=[rest,N-p,q0*p,m];
      expl=`${p}/${q0} of ${N} = ${N} ÷ ${q0} × ${p} = ${m} × ${p} = ${part}.`;
    }else if(mode===1){
      q=`${p}/${q0} of a number is ${part}. What is the number?`;
      ans=N; ds=[part,part*q0,q0*p,rest];
      expl=`If ${p}/${q0} of the number is ${part}, then 1/${q0} of it is ${part} ÷ ${p} = ${m}, so the whole number is ${q0} × ${m} = ${N}.`;
    }else{ // two-step spend
      const x=pick([2,3,4]),y=pick([2,3,4]),t=ri(2,9),S=x*y*t,L=(x-1)*(y-1)*t;
      q=`Maya spent 1/${x} of her money, then spent 1/${y} of what was left. She now has $${L}. How much did she start with?`;
      ans=S; ds=[L,L*2,S-L,x*y*t- t];
      expl=`After spending 1/${x}, she had ${x-1}/${x} left. Spending 1/${y} of that leaves ${y-1}/${y} × ${x-1}/${x} = ${(x-1)*(y-1)}/${x*y} of the start. So ${(x-1)*(y-1)}/${x*y} of the start = $${L}, giving a start of $${S}.`;
      return mk("Number and Algebra","fractions of quantities","fractions-of-quantity",q,ans,ds,money,expl);
    }
    return mk("Number and Algebra","fractions of quantities","fractions-of-quantity",q,ans,ds,fmt,expl);
  };

  // ---------- rates & proportion ----------
  GEN["rates"]=function(){
    const kind=pick([
      {noun:"car",act:"travels",u1:"km",u2:"litres of petrol",rate:"km per litre"},
      {noun:"reader",act:"reads",u1:"pages",u2:"minutes",rate:"pages per minute"},
      {noun:"printer",act:"prints",u1:"pages",u2:"minutes",rate:"pages per minute"}]);
    const r=ri(6,15),F=ri(2,8),D=r*F,mode=ri(0,1);
    if(mode===0){ const F2=ri(2,10); const ans=r*F2;
      const q=`A ${kind.noun} ${kind.act} ${D} ${kind.u1} using ${F} ${kind.u2}. At the same rate, how many ${kind.u1} for ${F2} ${kind.u2}?`;
      const expl=`Rate = ${D} ÷ ${F} = ${r} ${kind.rate}. For ${F2} ${kind.u2}: ${F2} × ${r} = ${r*F2} ${kind.u1}.`;
      return mk("Number and Algebra","rates","rates",q,ans,[D+(F2-F),r*F2+F2,D*F2, r+F2],x=>x+" "+kind.u1,expl);
    }else{ const D2=r*ri(2,10); const ans=D2/r;
      const q=`A ${kind.noun} ${kind.act} ${D} ${kind.u1} using ${F} ${kind.u2}. At the same rate, how many ${kind.u2} are needed for ${D2} ${kind.u1}?`;
      const expl=`Rate = ${D} ÷ ${F} = ${r} ${kind.rate}. ${kind.u2} needed = ${D2} ÷ ${r} = ${ans}.`;
      return mk("Number and Algebra","rates","rates",q,ans,[D2-D,ans+F,r,ans*2],x=>x+" "+kind.u2,expl);
    }
  };

  // ---------- distance / speed / time ----------
  GEN["distance-rate-time"]=function(){
    const who=pick([{n:"cyclist",v:"rides"},{n:"car",v:"drives"},{n:"train",v:"travels"},{n:"runner",v:"runs"}]);
    const s=ri(6,20),t=ri(2,9),d=s*t,mode=ri(0,2);
    if(mode===0){ const q=`A ${who.n} ${who.v} at a steady ${s} km/h for ${t} hours. How far does it travel?`;
      return mk("Problem Solving","distance-rate-time","distance-rate-time",q,d,[s+t,s*(t+1),Math.round(d/2),s*t- s],x=>x+" km",`Distance = speed × time = ${s} × ${t} = ${d} km.`);
    }else if(mode===1){ const q=`A ${who.n} ${who.v} ${d} km at a steady ${s} km/h. How many hours does it take?`;
      return mk("Problem Solving","distance-rate-time","distance-rate-time",q,t,[s,d-s,t+1,Math.max(1,t-1)],x=>x+" h",`Time = distance ÷ speed = ${d} ÷ ${s} = ${t} hours.`);
    }else{ const q=`A ${who.n} ${who.v} ${d} km in ${t} hours at a steady speed. What is its speed?`;
      return mk("Problem Solving","distance-rate-time","distance-rate-time",q,s,[t,d-t,s+t,Math.round(d/(t+1))],x=>x+" km/h",`Speed = distance ÷ time = ${d} ÷ ${t} = ${s} km/h.`);
    }
  };

  // ---------- mean (average) ----------
  GEN["mean"]=function(){
    const n=ri(4,5),M=ri(6,20);
    const nums=[]; let sum=0; for(let i=0;i<n-1;i++){const v=ri(Math.max(1,M-8),M+8);nums.push(v);sum+=v;}
    let last=n*M-sum; if(last<1){last=1;} // adjust: recompute M to keep integer & positive
    nums.push(last); const total=nums.reduce((a,b)=>a+b,0); const realM=total/n;
    const mode=ri(0,2);
    if(mode===0&&Number.isInteger(realM)){ const q=`Find the mean (average) of these ${n} numbers: ${nums.join(", ")}.`;
      return mk("Statistics and Probability","averages backwards","mean",q,realM,[total, total- realM, realM+1, Math.round(total/(n-1))],x=>String(x),`Total = ${nums.join(" + ")} = ${total}. Mean = ${total} ÷ ${n} = ${realM}.`);
    }else if(mode===1){ // missing value
      const known=nums.slice(0,n-1),missing=n*M-known.reduce((a,b)=>a+b,0);
      if(missing<1) return GEN["mean"]();
      const q=`The mean of ${n} numbers is ${M}. Four... ${n-1} of them are ${known.join(", ")}. What is the missing number?`.replace("Four... ","");
      return mk("Statistics and Probability","averages backwards","mean",q,missing,[M,known.reduce((a,b)=>a+b,0),n*M, M+1],x=>String(x),`The ${n} numbers must total ${n} × ${M} = ${n*M}. The known ones add to ${known.reduce((a,b)=>a+b,0)}, so the missing number is ${n*M} − ${known.reduce((a,b)=>a+b,0)} = ${missing}.`);
    }else{ // raise the mean by adding one
      const M2=M+ri(1,4),v=(n+1)*M2-n*M;
      const q=`The mean of ${n} numbers is ${M}. What value must a new (${n+1}th) number be so the mean of all ${n+1} numbers becomes ${M2}?`;
      return mk("Statistics and Probability","averages backwards","mean",q,v,[M2,M2-M,(M2-M)*(n+1),n*M],x=>String(x),`The ${n} numbers total ${n} × ${M} = ${n*M}. For a mean of ${M2} over ${n+1} numbers the total must be ${(n+1)} × ${M2} = ${(n+1)*M2}. So the new value = ${(n+1)*M2} − ${n*M} = ${v}.`);
    }
  };

  // ---------- simple algebra (two items / consecutive) ----------
  GEN["simple-algebra"]=function(){
    const mode=ri(0,1);
    if(mode===0){ const x=ri(2,9),delta=ri(1,5),y=x+delta,a=ri(2,4),b=ri(2,4),T=a*x+b*y;
      const items=pick([{X:"pencil",Y:"pen"},{X:"apple",Y:"mango"},{X:"child ticket",Y:"adult ticket"}]);
      const askX=Math.random()<0.5;
      const q=`A ${items.Y} costs $${delta} more than a ${items.X}. ${a} ${items.X}${a>1?"s":""} and ${b} ${items.Y}${b>1?"s":""} cost $${T} in total. What is the cost of one ${askX?items.X:items.Y}?`;
      const ans=askX?x:y;
      return mk("Number and Algebra","simple algebra","simple-algebra",q,ans,[askX?y:x,delta,x+y,T-a*x],money,
        `Let a ${items.X} cost p. A ${items.Y} costs p + ${delta}. Then ${a}p + ${b}(p + ${delta}) = ${T}, so ${a+b}p + ${b*delta} = ${T}, giving p = ${x}. A ${items.X} is $${x} and a ${items.Y} is $${y}.`);
    }else{ const step=pick([1,2]),m=ri(6,30),nums=[m-step,m,m+step],S=3*m;
      const kind=step===1?"consecutive whole numbers":"consecutive "+(m%2===0?"even":"odd")+" numbers";
      const askLargest=Math.random()<0.5;
      const q=`The sum of three ${kind} is ${S}. What is the ${askLargest?"largest":"smallest"} of them?`;
      const ans=askLargest?m+step:m-step;
      return mk("Number and Algebra","simple algebra","simple-algebra",q,ans,[m,askLargest?m-step:m+step,S,Math.round(S/2)],x=>String(x),
        `Call the middle number n. The three numbers are n−${step}, n, n+${step}, and their sum is 3n = ${S}, so n = ${m}. The numbers are ${nums.join(", ")}, so the ${askLargest?"largest":"smallest"} is ${ans}.`);
    }
  };

  // ---------- number patterns ----------
  GEN["number-patterns"]=function(){
    const A=ri(1,8),D=ri(2,7),mode=ri(0,1);
    const terms=[A,A+D,A+2*D,A+3*D];
    if(mode===0){ const K=ri(8,20),ans=A+(K-1)*D;
      const q=`A sequence begins ${terms.join(", ")}, … (it goes up by the same amount each time). What is the ${ord(K)} term?`;
      return mk("Number and Algebra","number patterns","number-patterns",q,ans,[A+K*D,(K-1)*D,ans-D,ans+D],x=>String(x),
        `The common difference is ${D}. The ${ord(K)} term = first term + (${K}−1) × ${D} = ${A} + ${(K-1)*D} = ${ans}.`);
    }else{ const m=ri(6,15),V=A+(m-1)*D;
      const q=`A sequence begins ${terms.join(", ")}, … (going up by the same amount each time). Which term of the sequence is equal to ${V}?`;
      return mk("Number and Algebra","number patterns","number-patterns",q,m,[V,m+1,m-1,V-A],x=>ord(x)+" term",
        `The common difference is ${D}. Terms after the first add ${D} each time: ${V} − ${A} = ${V-A}, and ${V-A} ÷ ${D} = ${m-1} steps after the first term, so it is the ${ord(m)} term.`);
    }
  };

  // ---------- age problems ----------
  GEN["age-problems"]=function(){
    let Y,y,k,O,guard=0;
    do{ Y=ri(5,12); y=ri(2,8); k=ri(2,4); O=k*(Y+y)-y; guard++; }while((O<=Y||O>70)&&guard<50);
    const rel=pick([{o:"mother",yg:"daughter"},{o:"father",yg:"son"},{o:"aunt",yg:"nephew"}]);
    const an=w=>(/^[aeiou]/i.test(w)?"An ":"A ")+w;
    const askYoung=Math.random()<0.5;
    if(askYoung){ const q=`In ${y} years' time, ${rel.o==="aunt"||rel.o==="mother"?"a":"a"} ${rel.o} will be ${k} times as old as the ${rel.yg}. The ${rel.o} is now ${O}. How old is the ${rel.yg} now?`;
      return mk("Problem Solving","age problem","age-problems",q,Y,[Y+y,O-y,k*Y,O-Y],x=>String(x),
        `In ${y} years the ${rel.o} will be ${O} + ${y} = ${O+y}. That is ${k} times the ${rel.yg}'s age then, so the ${rel.yg} will be ${O+y} ÷ ${k} = ${Y+y}. So now the ${rel.yg} is ${Y+y} − ${y} = ${Y}.`);
    }else{ const q=`${an(rel.o)}'s ${rel.yg} is now ${Y}. In ${y} years' time the ${rel.o} will be ${k} times as old as the ${rel.yg}. How old is the ${rel.o} now?`;
      return mk("Problem Solving","age problem","age-problems",q,O,[k*Y,Y+y,O+y,k*(Y+y)],x=>String(x),
        `In ${y} years the ${rel.yg} will be ${Y} + ${y} = ${Y+y}, and the ${rel.o} will be ${k} × ${Y+y} = ${k*(Y+y)}. So the ${rel.o} is now ${k*(Y+y)} − ${y} = ${O}.`);
    }
  };

  function ord(n){const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
  function mk(category,topic,concept,question,correct,distractors,fmt,explanation){
    const mc=makeMC(correct,distractors,fmt);
    return {category,topic,concept,question,options:mc.options,answer:mc.answer,explanation,difficulty:"M",estSecs:70,_generated:true};
  }

  let counter=0;
  window.VARIANT_CONCEPTS=Object.keys(GEN);
  window.hasGenerator=function(concept){return !!GEN[concept];};
  window.generateVariant=function(concept){
    if(!GEN[concept])return null;
    let out=null,guard=0;
    while(!out&&guard<20){ try{const c=GEN[concept](); if(c&&c.answer&&Object.keys(c.options).length===5)out=c;}catch(e){} guard++; }
    if(!out)return null;
    out.id="GEN-"+(concept)+"-"+(++counter);
    return out;
  };
})();
