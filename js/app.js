// ===================== APP: STATO, CONTROLLI, PERCORSO RAGIONATO, EVENTI =====================
const DEF={nome:'',cognome:'',classe:'V MAT 2026/2027',docente:'LILLO TIROLO',variant:0,step:0,vw:{},tk:{},bad:{},seen:{},fast:false,mine:{},dstep:{},
 edificio:'villetta',A:null,piani:2,regione:null,prov:null,Tp:null,roof:'falda',dir:'Sud',tilt:null,flatTilt:40,roofW:null,roofL:null,camino:true,
 pan:'rps254',cp:{...PANNELLI.custom},coef:null,orient:'V',rows:1,margin:0.5,rimp:12,Lone:null,pipeMat:null,insMat:'nbr',lam:0.035,insPos:'est',
 gtype:'propilenico',Hsc:null,Vsc:null,Hst:null,Pvs:6,kV:55,tank:'ss',dton:6,tmax:85};
const KEY='pannellisolari-v6',OLDKEY='pannellisolari-v5';
const fresh=()=>JSON.parse(JSON.stringify(DEF));
function loadState(){
  const rd=k=>{try{const v=JSON.parse(localStorage.getItem(k));return v&&typeof v==='object'&&!Array.isArray(v)?v:null}catch(e){return null}};
  let s=rd(KEY);if(!s){const o=rd(OLDKEY);if(o){s=o;s.tk={};s.step=0}}
  const st={...fresh(),...(s||{})};
  for(const k of ['vw','tk','bad','seen','mine','dstep','cp'])if(!st[k]||typeof st[k]!=='object'||Array.isArray(st[k]))st[k]=k==='cp'?{...PANNELLI.custom}:{};
  if(!Number.isInteger(st.step))st.step=0;if(!Number.isInteger(st.variant)||st.variant<0)st.variant=0;
  if(st.regione&&!REGIONI[st.regione]){st.regione=null;st.prov=null}if(st.prov&&(!st.regione||!(st.prov in REGIONI[st.regione].p)))st.prov=null;
  return st}
let S=loadState();
let D=null,RUNNING=false,BUSY=false,_saveT=0;
function save(){clearTimeout(_saveT);_saveT=setTimeout(saveNow,150)}
function saveNow(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toastOnce('Il browser non riesce a salvare: chiudendo la pagina perderesti i dati.')}}
let _tw=false;function toastOnce(t){if(_tw)return;_tw=true;toast(t)}

// ---------- controllo degli inserimenti ----------
const VALID={A:[20,5000,'La superficie deve stare tra 20 e 5000 m².'],piani:[1,6,'I piani vanno da 1 a 6.',true],Tp:[-30,15,'In Italia la temperatura di progetto sta tra −30 e +15 °C.'],
 tilt:[5,70,'L’inclinazione del tetto va da 5° a 70°.'],roofW:[2,60,'La larghezza della falda va da 2 a 60 m.'],roofL:[2,40,'La lunghezza della falda va da 2 a 40 m.'],
 Lone:[1,100,'La distanza va da 1 a 100 m (solo andata).'],Hsc:[0,5000,'La perdita dello scambiatore va da 0 a 5000 mm c.a.'],Hst:[1,40,'L’altezza va da 1 a 40 m.'],Vsc:[0,200,'I litri dello scambiatore vanno da 0 a 200.']};
const VALID_CP={Ar:[0.5,5,'La superficie di un pannello sta tra 0,5 e 5 m².'],vol:[0.3,15,'Il liquido contenuto sta tra 0,3 e 15 litri.'],Gp:[10,600,'La portata di prova sta tra 10 e 600 l/h.'],Hp:[1,3000,'La perdita sta tra 1 e 3000 mm c.a.'],maxV:[1,20,'Da 1 a 20 pannelli in fila.',true],lung:[500,3500,'La lunghezza sta tra 500 e 3500 mm.'],larg:[400,3000,'La larghezza sta tra 400 e 3000 mm.']};
function parseNum(v){if(v==null)return NaN;let t=String(v).trim().replace(/\s/g,'').replace(/[−–]/g,'-');if(!t)return NaN;
  if(/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t))t=t.replace(/\./g,'');
  if(!/^[-+]?(\d+([.,]\d*)?|[.,]\d+)$/.test(t))return NaN;return parseFloat(t.replace(',','.'))}
function checkNum(rule,raw){if(String(raw).trim()==='')return {v:null,err:''};const v=parseNum(raw);if(isNaN(v))return {v:null,err:'Scrivi solo un numero, ad esempio 12 oppure 12,5.'};
  if(rule[3]&&!Number.isInteger(v))return {v:null,err:'Qui serve un numero intero.'};if(v<rule[0]||v>rule[1])return {v:null,err:rule[2]};return {v,err:''}}
function nameErr(t){t=String(t||'').trim();if(!t)return '';if(t.length<2)return 'Scrivi il nome completo.';if(/\d/.test(t))return 'Il nome non può contenere numeri.';if(!/^[A-Za-zÀ-ÿ' .-]+$/.test(t))return 'Usa solo lettere, spazi e apostrofi.';return ''}
function fieldBad(k){if(k==='nome'||k==='cognome')return isNull(String(S[k]||'').trim())||!!nameErr(S[k]);return isNull(S[k])||!!S.bad[k]}

// ---------- moduli ----------
function errDiv(k,msg){return `<div class="ferr" id="e_${k}">${msg?'⚠ '+msg:''}</div>`}
function txt(k,l){const e=(k==='nome'||k==='cognome')?nameErr(S[k]):'';return `<div class="ctrl"><label>${l}</label><input type="text" data-k="${k}" data-t="s" maxlength="40" value="${xesc(S[k]||'')}" class="${isNull(String(S[k]||'').trim())?'miss':''} ${e?'err':''}" autocomplete="off" spellcheck="false">${errDiv(k,e)}</div>`}
function numf(k,l,u,min,max,step,sug=''){const bad=S.bad[k],val=bad!=null?bad.raw:(isNull(S[k])?'':String(S[k]).replace('.',','));
  return `<div class="ctrl"><label>${l} <span class="u">${u}</span></label><input type="text" inputmode="decimal" data-k="${k}" maxlength="12" value="${xesc(val)}" class="${bad?'err':isNull(S[k])&&!sug.startsWith('stima')&&!sug.startsWith('se manca')?'miss':''}" autocomplete="off">${errDiv(k,bad?bad.err:'')}${sug?`<div class="sug">${sug}</div>`:''}</div>`}
function sel(k,l,list,ph=''){return `<div class="ctrl"><label>${l}</label><select data-k="${k}" class="${isNull(S[k])?'miss':''}">${ph?`<option value="">${ph}</option>`:''}${list.map(([v,t])=>`<option value="${xesc(v)}" ${String(S[k])===String(v)?'selected':''}>${t}</option>`).join('')}</select></div>`}
function rngf(k,l,min,max,step,u='',dec=0){const v=S[k]==null?min:S[k];return `<div class="ctrl"><label>${l}<b id="v_${k}">${fmt(v,dec)} ${u}</b></label><input type="range" data-k="${k}" data-dec="${dec}" data-unit="${u}" min="${min}" max="${max}" step="${step}" value="${v}"></div>`}
function optf(k,l,list){return `<div class="ctrl"><label>${l}</label><div class="opts">${list.map(([v,t,s])=>`<button class="opt ${String(S[k])===String(v)?'sel':''}" data-set="${k}" data-val="${v}">${t}${s?`<small>${s}</small>`:''}</button>`).join('')}</div></div>`}
function figBox(f,cap){return `<div class="fig">${f.svg}${cap?`<div class="cap">${cap}</div>`:''}</div>`}
const AV=`<svg width="30" height="30" viewBox="0 0 40 40"><circle cx="20" cy="17" r="8" fill="#ffd24a"/><g stroke="#ffd24a" stroke-width="2.4" stroke-linecap="round"><path d="M20 3v4M20 27v4M6 17h4M30 17h4M10 7l3 3M30 7l-3 3M10 27l3-3M30 27l-3-3"/></g><path d="M8 36q12-8 24 0" stroke="#9fc2ff" stroke-width="2.4" fill="none"/></svg>`;

// ---------- stato dei passi ----------
function tkS(id){return S.tk[id]||(S.tk[id]={})}
const AUTO=['num','cell','read','list'];
const safe=(f,d)=>{try{return f()}catch(e){return d}};
function symOf(t){return typeof t.sym==='function'?t.sym(D):t.sym}
function altOf(t){return typeof t.alt==='function'?t.alt(D):(t.alt||[])}
function slotKeys(t){return [...new Set((symOf(t).match(/\{(\w+)\}/g)||[]).map(x=>x.slice(1,-1)))]}
function cellTarget(t){if(t.kind==='read'){const [r,c]=t.readAt(D);return {r,c}}return t.target(D)}
function sigOf(t){return safe(()=>{
  if(t.kind==='num'){const sl=t.slots(D);return fmt(t.exp(D),4)+'|'+slotKeys(t).map(k=>fmt(sl[k][0],4)).join(',')}
  if(t.kind==='cell'||t.kind==='read')return JSON.stringify(cellTarget(t))+'|'+(t.thr?fmt(t.thr(D),2):'');
  if(t.kind==='list')return String(listPick(t));return ''},'x')}
function taskOk(t){const s=S.tk[t.id]||{};
  if(AUTO.includes(t.kind))return !!s.done&&s.sig===sigOf(t);
  if(t.kind==='pick'){if(s.v==null)return false;const ops=safe(()=>t.opts(D).map(o=>String(o[0])),[]);if(!ops.includes(String(s.v)))return false;
    if(t.correct&&String(s.v)!==String(t.correct(D)))return false;if(t.check&&!safe(()=>t.check(D),false))return false;return true}
  return true}
function revalidate(){let n=0;for(const st of STEPS)for(const t of (st.tasks||[])){const s=S.tk[t.id];if(!s)continue;
  if(AUTO.includes(t.kind)&&s.done&&s.sig!==sigOf(t)){S.tk[t.id]={};n++}
  else if(t.kind==='pick'&&s.v!=null&&!safe(()=>t.opts(D).some(o=>String(o[0])===String(s.v)),true)){S.tk[t.id]={};if(!t.key.startsWith('_'))S[t.key]=null;n++}}
  if(n&&D)toast(`Hai cambiato un dato: ${n} ${n>1?'passi vanno rifatti':'passo va rifatto'} con i numeri nuovi.`);return n}
const words=t=>String(t||'').trim().split(/\s+/).filter(w=>/[A-Za-zÀ-ÿ]{2,}/.test(w));
function mineErr(st){if(!st.mine)return '';const t=String(S.mine[st.id]||'').trim(),w=words(t),u=new Set(w.map(x=>x.toLowerCase()));
  if(w.length<20)return `Scrivi almeno 20 parole (ora ${w.length}).`;if(u.size<12)return 'Usa parole diverse: spiega davvero cosa hai fatto.';
  if(!/\d/.test(t))return 'Metti almeno un numero del tuo progetto (un dato o un risultato).';return ''}
function ownMissing(st){return (st.need||[]).filter(k=>NEED_STEP[k]===st.id&&fieldBad(k)&&!(k==='tilt'&&S.roof==='piano'))}
function otherMissing(st){return (st.need||[]).filter(k=>NEED_STEP[k]!==st.id&&fieldBad(k)&&!(k==='tilt'&&S.roof==='piano'))}
function stepBlock(st){return st.block&&!otherMissing(st).length?safe(()=>st.block(D),''):''}
const BADSTEP={A:'casa',piani:'casa',Tp:'casa',tilt:'tetto',roofW:'tetto',roofL:'tetto',Lone:'tubi',Hsc:'pompa',Hst:'vaso',Vsc:'vaso'};
function stepBad(st){return Object.keys(S.bad).filter(k=>BADSTEP[k]===st.id)}
function cpBad(){return S.pan==='custom'&&Object.keys(VALID_CP).some(k=>S.bad['cp_'+k])}
function tasksDone(st){return !st.tasks||st.tasks.every(taskOk)}
function stepDone(st){if(st.report)return false;if(otherMissing(st).length||ownMissing(st).length||stepBlock(st))return false;if(st.id==='pannello'&&cpBad())return false;if(stepBad(st).length)return false;
  if(st.tasks)return tasksDone(st)&&!mineErr(st);return !!S.seen[st.id]}
function firstOpen(){const i=STEPS.findIndex(s=>!s.report&&!stepDone(s));return i<0?STEPS.length-1:i}
function whyNotDone(st){const om=ownMissing(st);if(om.length){const wr=om.filter(k=>!isNull(S[k])||S.bad[k]);return wr.length?'Correggi '+wr.map(k=>NEED_NAMES[k]).join(', ')+': c’è un errore segnato in rosso.':'Prima inserisci '+om.map(k=>NEED_NAMES[k]).join(', ')+'.'}
  const b=stepBlock(st);if(b)return strip(b.replace(/<div[\s\S]*$/,''));
  if(st.id==='pannello'&&cpBad())return 'Correggi i dati del pannello segnati in rosso.';if(stepBad(st).length)return 'Correggi il valore segnato in rosso: '+S.bad[stepBad(st)[0]].err;
  if(st.tasks){const t=st.tasks.find(x=>!taskOk(x));if(t)return `Prima completa il passo ${st.tasks.indexOf(t)+1}.`;const m=mineErr(st);if(m)return 'Manca la tua spiegazione: '+m}
  return 'Completa questa fase per andare avanti.'}

// ---------- render ----------
let _wasDone=false;
function render(){
  TH=makeTheme();D=compute();revalidate();S.step=clamp(S.step,0,STEPS.length-1);if(S.step>firstOpen())S.step=firstOpen();
  const st=STEPS[S.step];if(!ownMissing(st).length&&!stepBad(st).length)S.seen[st.id]=1;
  $('#varN').textContent=(S.variant||0)+1;$('#sub').textContent=`Fase ${S.step+1} di ${STEPS.length} · ${st.t}`;
  const om=otherMissing(st),g=safe(()=>st.tutor(D),{msg:'',dove:'',perche:''});
  let html=`<div class="step"><div class="shead"><div><span class="k">${st.grp} · fase ${S.step+1} di ${STEPS.length}</span><h2>${st.t}</h2></div></div>${tutorHTML(g)}`;
  if(om.length)html+=`<div class="card"><p style="margin-top:0">Per questa fase mi servono ancora: <b>${om.map(k=>NEED_NAMES[k]).join(', ')}</b>.</p><button class="btn" data-goid="${NEED_STEP[om[0]]}">Vai a inserirli</button></div>`;
  else if(st.report)html+=reportUI();
  else html+=`<div class="work ${st.tasks?'':'figfirst'}"><div><div id="usesBox"></div>${st.form?`<div class="card" id="formBox">${st.form(D)}</div>`:''}<div id="dyn"></div></div>${st.figs?`<div class="figcard" id="figc"></div>`:''}</div>`;
  html+=`<div class="navb"><button class="btn ghost" data-nav="-1" ${S.step?'':'disabled'}>← Indietro</button>${S.step<STEPS.length-1?`<button class="btn" id="nextBtn" data-nav="1">Avanti →</button>`:''}</div></div>`;
  $('#main').innerHTML=html;
  $('#mnav').innerHTML=`<button class="btn ghost" data-nav="-1" ${S.step?'':'disabled'}>←</button><span class="ct">${S.step+1} / ${STEPS.length}</span>${S.step<STEPS.length-1?`<button class="btn" id="nextBtnM" data-nav="1">Avanti →</button>`:`<button class="btn sun" id="docBtn2">⬇ Word</button>`}`;
  _wasDone=stepDone(st);
  if(!om.length&&!st.report)refreshDyn();else{renderNav();updNext()}
  if(st.report)loadPhotos();
  save();
}
function updNext(){const st=STEPS[S.step],ok=stepDone(st);['#nextBtn','#nextBtnM'].forEach(id=>{const b=$(id);if(b){b.classList.toggle('locked',!ok);b.innerHTML=ok?'Avanti →':'🔒 Avanti'}});
  $('#prog').style.width=(STEPS.filter(stepDone).length/(STEPS.length-1)*100)+'%';
  if(ok&&!_wasDone&&!st.report&&st.tasks)celebrate();_wasDone=ok}
function tutorHTML(g){const open=S.tipsOpen??(window.innerWidth>860);
  return `<div class="tutor"><div class="av">${AV}</div><div><div class="bub"><div class="who">Archimede</div><div class="msg">${g.msg}</div></div>
  <details class="more" ${open?'open':''}><summary>Dove lo trovo · Perché</summary><div class="tips"><div class="tip dove"><b>Dove lo trovi</b>${g.dove}</div><div class="tip rag"><b>Perché</b>${g.perche}</div></div></details></div></div>`}
function refreshDyn(){
  const st=STEPS[S.step];if(st.report||otherMissing(st).length){updNext();return}
  TH=makeTheme();D=compute();revalidate();
  const ub=$('#usesBox');if(ub)ub.innerHTML=st.uses?`<div class="uses"><span>Ti servono</span>${safe(()=>st.uses(D),[]).map(([a,b])=>`<span class="pill">${a} <b>${b}</b></span>`).join('')}</div>`:'';
  let h='';const om=ownMissing(st),blk=stepBlock(st);
  if(st.id==='pannello'&&cpBad())h+=`<div class="note red">Alcuni dati del pannello non sono validi: correggi i campi in rosso.</div>`;
  if(blk)h+=`<div class="note red"><b>Attenzione.</b> ${blk}</div>`;
  if(st.tasks){const cur=st.tasks.findIndex(t=>!taskOk(t)),nd=st.tasks.filter(taskOk).length;
    h+=`<div class="card"><div class="taskhead"><h4>Passo dopo passo <span class="cnt">${nd}/${st.tasks.length}</span></h4><label class="chk sm"><input type="checkbox" id="fastChk" ${S.fast?'checked':''}> animazioni veloci</label></div><div class="tbar"><i style="width:${nd/st.tasks.length*100}%"></i></div>`;
    st.tasks.forEach((t,i)=>{if(i<cur||cur<0)h+=doneTask(t);
      else if(i===cur)h+=om.length?`<div class="task next">Prima completa i dati qui sopra: ${om.map(k=>NEED_NAMES[k]).join(', ')}.</div>`:blk||stepBad(st).length?`<div class="task next">Correggi il problema segnalato e poi riprendiamo da qui.</div>`:curTask(t,i,st.tasks.length);
      else h+=`<div class="task next">Passo ${i+1} · ${{num:'un calcolo da fare tu',cell:'una ricerca in tabella',read:'una lettura in tabella',list:'una misura in commercio',pick:t.lampo?'una verifica lampo':'una domanda per te'}[t.kind]}</div>`});
    h+='</div>';
    if(tasksDone(st)&&st.mine&&!blk)h+=mineHTML(st)}
  if(st.paper&&!om.length)h+=`<details class="paper card" ${S.paperOpen?'open':''}><summary>✍️ Rifallo su carta e penna</summary><ol>${safe(()=>st.paper(D),[]).map(x=>`<li>${x}</li>`).join('')}</ol><p class="hint">Rifai la fase sul quaderno senza guardare lo schermo, poi confronta i risultati con quelli qui.</p></details>`;
  const gv=st.gives&&!blk&&!om.length?safe(()=>st.gives(D),null):null;
  if(gv&&stepDone(st))h+=`<div class="result"><h4>✔ Risultato di questa fase</h4><div class="rg">${gv.map(([a,b])=>`<div><small>${a}</small><b>${b}</b></div>`).join('')}</div></div>`;
  const ae=document.activeElement,aeSel=ae&&ae.dataset&&(ae.dataset.slot?`[data-slot="${ae.dataset.slot}"]`:ae.dataset.res?`[data-res="${ae.dataset.res}"]`:ae.dataset.mine?'[data-mine]':null);
  $('#dyn').innerHTML=h;if(aeSel){const e=document.querySelector(aeSel);if(e)e.focus()}
  const fc=$('#figc');if(fc)fc.innerHTML=figPanel(st);
  renderNav();updNext();save();
}
function doneTask(t){const s=S.tk[t.id]||{};let ans='';
  if(t.kind==='pick'){const o=safe(()=>t.opts(D),[]).find(([v])=>String(v)===String(s.v));ans=o?o[1]:'';if(t.ok&&o)ans+=`<span class="why">${t.ok(D)}</span>`}else if(t.show)ans=safe(()=>t.show(D),'');else if(t.kind==='list')ans=listPick(t)+' '+(t.unit||'');
  return `<div class="task done ${s.helped?'helped':''} ${t.lampo?'lampo':''}"><span class="ck">✔</span><div style="flex:1;min-width:0"><div>${strip(t.q(D))}</div>${ans?`<div class="ans">${ans}</div>`:''}${s.helped?'<div class="hl">svolto con il procedimento guidato: da ripetere sul quaderno</div>':''}</div>${t.kind==='pick'||t.kind==='num'?`<button class="btn sm ghost" data-tundo="${t.id}">${t.kind==='num'?'Rifai':'Cambia'}</button>`:''}</div>`}
function listPick(t){const thr=t.thr(D),L=t.list(D);return L.find(v=>v>=thr-1e-9)??L[L.length-1]}
function tblFor(t){return TABLES[t.table](D,{rowOn:t.rowOn?t.rowOn(D):undefined,colOn:t.colOn?t.colOn(D):undefined})}
function symHTML(t,mode){const sl=t.slots(D),s=S.tk[t.id]||{},sv=s.sv||{};
  return xesc(symOf(t)).replace(/\{(\w+)\}/g,(m,k)=>{const v=sl[k];if(mode==='sym')return `<i class="sv">${k}</i>`;
    if(mode==='val')return `<b class="vv">${fmt(v[0],v[1])}</b>`;
    const st=s.sok&&s.sok[k]!=null?(s.sok[k]?'ok':'err'):'';return `<input class="slot ${st}" data-slot="${t.id}:${k}" inputmode="decimal" autocomplete="off" maxlength="12" value="${xesc(sv[k]??'')}" placeholder="${k}" aria-label="${xesc(v[2])}" size="${Math.max(3,Math.min(8,String(fmt(v[0],v[1])).length+1))}">`})}
function legendHTML(t){const sl=t.slots(D);return `<div class="legend">${Object.keys(sl).map(k=>`<span><i class="sv">${k}</i> = ${sl[k][2]}</span>`).join('')}</div>`}
function fOpts(t){const all=[[symOf(t),''],...altOf(t)],R=rngFrom(hashStr(seedStr()+'#f'+t.id)),idx=all.map((_,i)=>i);for(let i=idx.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]]}return idx.map(i=>[i,all[i]])}
function shuf(a,id){const R=rngFrom(hashStr(seedStr()+'#o'+id)),b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function symPlain(sym){return xesc(sym).replace(/\{(\w+)\}/g,'<i class="sv">$1</i>')}
function curTask(t,i,n){const s=tkS(t.id);let body='';const miss=s.miss||0;
  const showBtn=(lbl)=>miss>=3?`<button class="btn sm ghost" data-show="${t.id}">👀 ${lbl}</button>`:'';
  if(t.kind==='num'){const stg=s.stg||0;
    body+=`<div class="stages"><span class="${stg>0?'ok':'on'}">1 · Formula</span><span class="${stg>1?'ok':stg===1?'on':''}">2 · Dati</span><span class="${stg>2?'ok':stg===2?'on':''}">3 · Conto</span></div>`;
    if(stg===0){body+=`<p class="sq">Quale formula usi? Leggi cosa vuol dire ogni lettera.</p>${legendHTML(t)}<div class="fopts">${fOpts(t).map(([j,[f]])=>`<button class="fopt ${s.fw&&s.fw.includes(j)?'no':''}" data-fopt="${t.id}" data-j="${j}">${symPlain(f)}</button>`).join('')}</div>`;
      if(s.fwhy)body+=`<div class="fb no">${s.fwhy}</div>`}
    if(stg===1){body+=`<p class="sq">Metti i numeri al posto delle lettere. Sotto trovi dove prenderli.</p><div class="slotf">${symHTML(t,'in')}</div>
      <div class="srcs">${slotKeys(t).map(k=>{const v=t.slots(D)[k],ok=s.sok&&s.sok[k];return `<div class="src ${ok===true?'ok':ok===false?'err':''}"><i class="sv">${k}</i> ${v[2]}: <span>lo trovi in ${v[3]}</span>${ok===false&&(s.sm&&s.sm[k]||0)>=2?` <b class="reveal">→ è ${fmt(v[0],v[1])}</b>`:''}</div>`}).join('')}</div>
      <div class="tact"><button class="btn" data-chkslots="${t.id}">Controlla i numeri</button></div>`;if(s.smsg)body+=`<div class="fb no">${s.smsg}</div>`}
    if(stg===2){body+=`<div class="board static"><div class="l1">${symHTML(t,'val')}</div></div><p class="sq">Ora fai il conto (anche con la calcolatrice) e scrivi il risultato.</p>
      <div class="resrow"><input class="resin ${s.rmsg?'err':''}" data-res="${t.id}" inputmode="decimal" autocomplete="off" maxlength="14" value="${xesc(s.rv||'')}" placeholder="risultato"><span class="u">${t.unit}</span><button class="btn" data-chkres="${t.id}">Controlla</button></div>
      ${s.rmsg?`<div class="fb no">${s.rmsg}</div>`:''}${(s.tries||0)>=3?`<div class="tact"><button class="btn sm ghost" data-showcalc="${t.id}">👀 Mostrami il conto svolto</button></div>`:''}`}
    if(stg===3)body+=`<div class="board" id="bd-${t.id}"></div>`}
  if(t.kind==='cell'||t.kind==='read')body=`<div class="tblwrap" id="tb-${t.id}" data-tclick="${t.id}">${tblFor(t)}</div><div class="narr ${s.msg?'no':''}" id="nr-${t.id}">${s.msg||'👆 Tocca tu la cella giusta nella tabella.'}</div><div class="tact">${showBtn('Mostrami come si fa')}</div>`;
  if(t.kind==='list')body=`<div class="chips" id="ls-${t.id}">${t.list(D).map(v=>`<button class="chipv" data-chip="${t.id}" data-v="${v}">${fmt(v,0)} ${t.unit||''}</button>`).join('')}</div><div class="narr ${s.msg?'no':''}" id="nr-${t.id}">${s.msg||`Valore da raggiungere: <b>${fmt(t.thr(D),1)} ${t.unit||''}</b>. Tocca la misura giusta.`}</div><div class="tact">${showBtn('Mostrami')}</div>`;
  if(t.kind==='pick'){const OP=t.correct?shuf(t.opts(D),t.id):t.opts(D);body=`<div class="opts ${t.lampo?'lampo':''}">${OP.map(([v,l,sm])=>`<button class="opt ${String(s.v)===String(v)?'sel':''}" data-topt="${t.id}" data-val="${xesc(v)}">${l}${sm?`<small>${sm}</small>`:''}</button>`).join('')}</div>`;
    if(s.v!=null&&!taskOk(t))body+=`<div class="fb no">${t.bad?t.bad(D):'Non è questa: riprova.'}</div>`;
    if(s.help&&t.help)body+=`<div class="fb help">💡 ${t.help(D)}</div>`;
    if(t.help)body+=`<div class="tact"><button class="btn sm ghost" data-thelp="${t.id}">💡 ${s.help?'Nascondi l’aiuto':'Aiutami a ragionare'}</button></div>`}
  return `<div class="task cur ${t.lampo?'lampo':''}" id="cur-${t.id}"><span class="tn">Passo ${i+1} di ${n}</span><div class="tq">${t.q(D)}</div>${body}</div>`}
function mineHTML(st){const v=S.mine[st.id]||'',e=mineErr(st),w=words(v).length;
  return `<div class="card mine ${e?'':'ok'}"><h4>✍️ Spiegalo con parole tue</h4><p class="sq">${st.mine.q}</p><textarea data-mine="${st.id}" rows="5" maxlength="1200" placeholder="${xesc(st.mine.start)}…">${xesc(v)}</textarea>
   <div class="wc"><span id="mwc">${w} parole</span><span id="merr">${e?'⚠ '+e:'✔ Va bene: questo testo andrà nella tua relazione.'}</span></div></div>`}
function figPanel(st){const vs=st.figs,i=clamp(S.vw[st.id]||0,0,vs.length-1),v=vs[i];
  const tabs=vs.length>1?`<div class="vtabs">${vs.map((x,j)=>`<button class="${j===i?'on':''}" data-view="${j}">${x.n}</button>`).join('')}</div>`:'';
  if(v.draw)return tabs+drawPanel(v.draw);
  return tabs+figBox(safe(()=>v.f(D),{svg:'<p class="hint">Disegno non disponibile con questi dati.</p>'}),v.n)}
function drawPanel(name){const G=DRAW[name],k=clamp(S.dstep[name]||0,0,G.steps.length-1);
  return `<div class="drawp"><div class="dhead"><b>Passo ${k+1} di ${G.steps.length}</b><span>${G.steps[k].t}</span></div>${figBox(figDraw(name,D,k),'')}
  <div class="dnav"><button class="btn sm ghost" data-dstep="${name}" data-d="-1" ${k?'':'disabled'}>← Indietro</button><span class="dots">${G.steps.map((_,j)=>`<i class="${j<=k?'on':''}"></i>`).join('')}</span><button class="btn sm" data-dstep="${name}" data-d="1" ${k<G.steps.length-1?'':'disabled'}>Avanti →</button></div>
  <p class="hint">${G.tip}</p></div>`}
function renderNav(){let h='',g='';const fo=firstOpen();
  STEPS.forEach((s,i)=>{if(s.grp!==g){g=s.grp;h+=`<div class="g">${g}</div>`}const dn=stepDone(s),lock=i>fo;
    h+=`<button class="${i===S.step?'cur':''} ${dn?'done':''} ${lock?'lock':''}" data-go="${i}"><span class="d">${lock?'🔒':dn&&i!==S.step?'✓':i+1}</span>${s.t}</button>`});
  const rows=[];STEPS.forEach(s=>{if(s.gives&&stepDone(s))safe(()=>s.gives(D),[]).forEach(r=>rows.push(r))});
  if(rows.length)h+=`<div class="qnb"><h5>Il tuo quaderno</h5>${rows.slice(0,30).map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
  h+=`<div class="qnb"><button data-reset="1"><span class="d">↺</span>Nuovo progetto</button></div>`;
  $('#nav').innerHTML=h}
function go(i,fromPop){if(RUNNING)return;i=clamp(i|0,0,STEPS.length-1);const fo=firstOpen();
  if(i>fo){const st=STEPS[fo];toast(fo===S.step?whyNotDone(st):`Prima completa la fase ${fo+1}: ${st.t}`);if(fo!==S.step)i=fo;else return}
  S.step=i;render();if(!fromPop)try{history.pushState({s:i},'','#fase-'+(i+1))}catch(e){}
  window.scrollTo({top:0,behavior:RM?'auto':'smooth'});$('#nav').classList.remove('open')}
function toast(t){document.querySelectorAll('.toast').forEach(x=>x.remove());const d=document.createElement('div');d.className='toast';d.setAttribute('role','status');d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3600)}

// ---------- effetti ----------
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const T_=ms=>RM?0:ms*(S.fast?0.35:1);
function shake(el){if(!el||RM)return;el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')}
function burst(el,n=18){if(RM||!el||!el.getBoundingClientRect)return;const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+Math.min(r.height/2,60),cols=['#ffd24a','#14965c','#2f7fd8','#e0482f','#9fc2ff'];
  for(let i=0;i<n;i++){const p=document.createElement('i');p.className='pt';const a=Math.random()*Math.PI*2,d=50+Math.random()*90;p.style.cssText=`left:${cx}px;top:${cy}px;background:${cols[i%5]};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-40}px;--r:${Math.random()*540}deg`;document.body.appendChild(p);setTimeout(()=>p.remove(),900)}}
function celebrate(){if(RM)return;document.querySelectorAll('.celeb').forEach(x=>x.remove());const o=document.createElement('div');o.className='celeb';o.innerHTML='<div><span>✔</span>Fase completata!<small>Premi “Avanti”</small></div>';document.body.appendChild(o);
  for(let k=0;k<3;k++)setTimeout(()=>burst(o.firstChild,22),k*180);setTimeout(()=>o.classList.add('out'),1300);setTimeout(()=>o.remove(),1800)}
function itNum(str){const m=String(str).match(/-?[\d.]+(,\d+)?/);if(!m)return null;const dec=m[1]?m[1].length-1:0;return {v:parseFloat(m[0].replace(/\./g,'').replace(',','.')),dec,txt:m[0],i:m.index}}
function flashPill(tok){const n=tok.replace(/[^\d,]/g,'');if(!n)return;document.querySelectorAll('.pill b').forEach(b=>{if(b.textContent.replace(/\./g,'').includes(n)){const p=b.parentElement;p.classList.remove('flash');void p.offsetWidth;p.classList.add('flash')}})}
async function animCalc(bd,formula,show){if(!bd)return;const res=show.includes('=')?show.slice(show.lastIndexOf('=')+1).trim():show;
  bd.classList.remove('fin');bd.innerHTML='<div class="l1"></div><div class="l2"></div>';const l1=bd.querySelector('.l1'),l2=bd.querySelector('.l2');
  for(const tok of formula.split(/\s+/).filter(Boolean)){const sp=document.createElement('span');sp.textContent=tok;sp.style.marginRight='.4em';if(/\d/.test(tok)){sp.className='n';flashPill(tok)}else if(/^[×\/+−\-()=²]+$/.test(tok))sp.className='op';l1.appendChild(sp);await sleep(T_(/\d/.test(tok)?300:150))}
  await sleep(T_(200));const eq=document.createElement('span');eq.className='op';eq.textContent='=';eq.style.marginRight='.4em';l2.appendChild(eq);
  const num=itNum(res),out=document.createElement('span');out.className='res';l2.appendChild(out);
  if(num&&!RM){const steps=16;for(let k=1;k<=steps;k++){out.textContent=fmt(num.v*k/steps,num.dec);await sleep(T_(35))}}
  out.textContent=num?res.slice(0,num.i)+num.txt:res;if(num){const rest=document.createElement('span');rest.className='res2';rest.textContent=' '+res.slice(num.i+num.txt.length).trim();l2.appendChild(rest)}
  bd.classList.add('fin');burst(bd,14);await sleep(T_(500))}
function scanSeq(t){const g=cellTarget(t);const seq=[];
  if(t.click==='row')for(let r=0;r<=g.r;r++)seq.push([r,-1]);
  else if(t.kind==='read'){const [r,c]=t.readAt(D);if(r<0)for(let k=(t.rowOn?t.rowOn(D):0);k>=0;k--)seq.push([k,c]);else for(let k=(t.colOn?t.colOn(D):0);k>=0;k--)seq.push([r,k]);seq.push([r,c])}
  else if(t.rowOn)for(let c=0;c<=g.c;c++)seq.push([t.rowOn(D),c]);
  else if(t.colOn)for(let r=0;r<=g.r;r++)seq.push([r,t.colOn(D)]);
  else{for(let r=0;r<=g.r;r++)seq.push([r,-1]);for(let c=0;c<=g.c;c++)seq.push([g.r,c])}return seq}
async function animScan(t){const box=$('#tb-'+t.id),nr=$('#nr-'+t.id),seq=scanSeq(t);let prev=null;const thr=t.thr?t.thr(D):null;nr.classList.remove('no');
  for(let k=0;k<seq.length;k++){const [r,c]=seq[k],el=box.querySelector(`[data-pos="${r},${c}"]`);if(!el)continue;
    if(prev){prev.classList.remove('scan');prev.classList.add('seen')}el.classList.add('scan');prev=el;try{el.scrollIntoView({block:'nearest',inline:'nearest'})}catch(e){}
    const last=k===seq.length-1,txtv=el.textContent.trim();
    nr.innerHTML=thr!=null&&c>=0&&t.kind==='cell'?(last?`<b>${txtv}</b> ≥ ${f0(thr)} ✔ trovato!`:`${txtv} è meno di ${f0(thr)}: vado avanti…`):(last?`Trovato: <b>${txtv}</b>`:`Controllo: ${txtv}…`);
    await sleep(T_(last?300:330))}
  if(prev){prev.classList.remove('scan');prev.classList.add('pk','pop')}nr.innerHTML+=t.show?`<div class="nres">${t.show(D)}</div>`:'';await sleep(T_(1300))}
async function animList(t){const box=$('#ls-'+t.id),nr=$('#nr-'+t.id),thr=t.thr(D),pick=listPick(t);nr.classList.remove('no');
  for(const ch of box.querySelectorAll('.chipv')){const v=+ch.dataset.v;ch.classList.add('scan');
    nr.innerHTML=v>=thr-1e-9?`<b>${fmt(v,0)} ${t.unit}</b> ≥ ${fmt(thr,1)} ✔ è la misura giusta`:`${fmt(v,0)} ${t.unit} è meno di ${fmt(thr,1)}: troppo piccolo`;
    await sleep(T_(420));ch.classList.remove('scan');if(v===pick){ch.classList.add('pk','pop');break}ch.classList.add('seen')}await sleep(T_(1100))}
async function lockRun(fn){if(RUNNING)return;RUNNING=true;document.body.classList.add('running');try{await fn()}catch(e){console.error(e)}RUNNING=false;document.body.classList.remove('running')}
function finishTask(t,helped){const s=tkS(t.id);s.done=true;s.sig=sigOf(t);if(helped)s.helped=true;delete s.msg;refreshDyn();
  const nx=document.querySelector('.task.cur,.mine textarea');if(nx)try{nx.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'})}catch(e){}}

// ---------- logica dei passi ----------
function slotTol(v,dec){return Math.max(0.5*10**-dec,Math.abs(v)*0.005)}
function findTask(id){for(const s of STEPS)for(const t of (s.tasks||[]))if(t.id===id)return t;return null}
function checkSlots(id){const t=findTask(id);if(!t)return;const s=tkS(id),sl=t.slots(D);s.sok={};s.sm=s.sm||{};s.sv=s.sv||{};const bad=[];let mm='';
  for(const k of slotKeys(t)){const raw=s.sv[k],v=parseNum(raw),[val,dec]=sl[k];if(raw==null||String(raw).trim()===''){s.sok[k]=false;bad.push(k);continue}
    if(isNaN(v)){s.sok[k]=false;bad.push(k);s.sm[k]=(s.sm[k]||0)+1;continue}
    const ok=Math.abs(v-val)<=slotTol(val,dec);
    if(!ok&&val!==0&&Math.abs(v/1000-val)<=slotTol(val,dec))mm=`<i class="sv">${k}</i>: hai scritto il numero in millimetri? Qui va in metri (dividi per 1000).`;
    s.sok[k]=ok;if(!ok){bad.push(k);s.sm[k]=(s.sm[k]||0)+1}}
  if(!bad.length){s.stg=2;delete s.smsg;refreshDyn();const r=document.querySelector(`[data-res="${id}"]`);if(r){r.focus();burst(r,10)}return}
  s.smsg=mm||(bad.some(k=>String(s.sv[k]??'').trim()==='')?'Riempi tutte le caselle.':`Controlla ${bad.map(k=>`<i class="sv">${k}</i>`).join(', ')}: guarda qui sotto dove si trova${bad.length>1?'no':''}.`);
  refreshDyn();shake($('#cur-'+id))}
function checkRes(id){const t=findTask(id);if(!t)return;const s=tkS(id),v=parseNum(s.rv),exp=t.exp(D);
  if(isNaN(v)){s.rmsg='Scrivi un numero, ad esempio 12,5.';refreshDyn();shake($('#cur-'+id));return}
  const tol=Math.max(t.abs??0.05,(t.tol??0.01)*Math.abs(exp));
  if(Math.abs(v-exp)<=tol){delete s.rmsg;s.stg=3;refreshDyn();lockRun(async()=>{await animCalc($('#bd-'+id),strip(symHTML(t,'val')),t.show(D));finishTask(t,false)});return}
  s.tries=(s.tries||0)+1;const tr=safe(()=>t.traps?t.traps(D):[],[]).find(([x])=>Math.abs(v-x)<=Math.max(t.abs??0.05,(t.tol??0.01)*Math.abs(x)));
  if(tr)s.rmsg=tr[1];else if(v!==0&&(Math.abs(v*1000-exp)<=tol*1.5||Math.abs(v/1000-exp)<=tol*1.5||Math.abs(v*10-exp)<=tol*1.5||Math.abs(v/10-exp)<=tol*1.5))s.rmsg='Le cifre sono giuste ma la virgola è nel posto sbagliato: controlla le unità di misura e le divisioni.';
  else if(s.tries===1)s.rmsg='Non torna. Rifai il conto con calma: prima parentesi e potenze, poi moltiplicazioni e divisioni, infine le somme.';
  else s.rmsg=t.mid?'💡 '+t.mid(D):'Ricontrolla il conto un pezzo alla volta.';
  if(s.tries>=3)s.rmsg+=' Se vuoi, puoi vedere il conto svolto e poi ripeterlo sul quaderno.';
  refreshDyn();shake($('#cur-'+id))}
function cellClick(t,el){const s=tkS(t.id),[r,c]=el.dataset.pos.split(',').map(Number),g=cellTarget(t),val=el.textContent.trim(),thr=t.thr?t.thr(D):null;
  const ok=t.click==='row'?r===g.r&&r>=0:r===g.r&&c===g.c;
  if(ok){el.classList.add('pk','pop');burst(el,14);s.msg='';const nr=$('#nr-'+t.id);nr.innerHTML=`✔ Giusto! ${t.show?t.show(D):''}`;nr.classList.remove('no');nr.classList.add('yes');lockRun(async()=>{await sleep(T_(900)||10);finishTask(t,false)});return}
  s.miss=(s.miss||0)+1;let m='';const vn=parseNum(val);
  if(t.kind==='read')m=t.help(D);
  else if(t.rowOn&&!t.colOn){if(r!==g.r)m='Resta sulla riga evidenziata.';else if(thr!=null&&!isNaN(vn)&&c>=0){m=vn<thr?`${val} è meno di ${f0(thr)}: questo tubo non basta, vai più a destra.`:`${val} basta, ma c’è una cella prima che basta già: prendi la prima.`}else m=c<g.c?'Vai più a destra.':'Sei andato troppo avanti: torna indietro.'}
  else if(t.colOn&&!t.rowOn){if(c!==g.c)m='Resta nella colonna evidenziata.';else if(thr!=null&&!isNaN(vn)&&r>=0){m=vn<thr?`${val} è meno di ${f0(thr)}: scendi ancora.`:`${val} basta, ma più in alto ce n’è una che basta già: prendi la prima dall’alto.`}else m=r<g.r?'Scendi ancora.':'Sei sceso troppo.'}
  else if(t.click==='row')m=r<0?'Questa è l’intestazione: tocca una riga.':t.help(D);
  else m=t.help(D);
  if(s.miss>=3)m+=' Se vuoi, guarda il procedimento e poi ripetilo.';s.msg='✘ '+m;
  el.classList.add('wrongc');setTimeout(()=>el.classList.remove('wrongc'),700);const nr=$('#nr-'+t.id);nr.innerHTML=s.msg;nr.classList.add('no');shake(nr);
  if(s.miss===3)refreshDyn();else save()}
function chipClick(t,el){const s=tkS(t.id),v=+el.dataset.v,pick=listPick(t),thr=t.thr(D);
  if(v===pick){el.classList.add('pk','pop');burst(el,14);const nr=$('#nr-'+t.id);nr.innerHTML=`✔ Giusto! ${t.show?t.show(D):''}`;nr.classList.remove('no');lockRun(async()=>{await sleep(T_(900)||10);finishTask(t,false)});return}
  s.miss=(s.miss||0)+1;s.msg=v<thr?`✘ ${fmt(v,0)} ${t.unit} è meno di ${fmt(thr,1)}: troppo piccolo, non basta.`:`✘ ${fmt(v,0)} ${t.unit} basta, ma ce n’è uno più piccolo che basta già: in commercio si prende il primo che va bene.`;
  el.classList.add('wrongc');setTimeout(()=>el.classList.remove('wrongc'),700);const nr=$('#nr-'+t.id);nr.innerHTML=s.msg;nr.classList.add('no');shake(nr);if(s.miss===3)refreshDyn();else save()}

// ---------- relazione e foto ----------
const PH={line:'Il mio disegno della linea 3D (punto 2)',cent:'Il mio schema della centrale (punto 9)'};let PHOTOS={};
function idb(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej('no');const r=indexedDB.open('pannellisolari',1);r.onupgradeneeded=()=>r.result.createObjectStore('f');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function idbSet(k,v){const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction('f','readwrite');v==null?tx.objectStore('f').delete(k):tx.objectStore('f').put(v,k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function idbGet(k){const db=await idb();return new Promise((res,rej)=>{const r=db.transaction('f').objectStore('f').get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function loadPhotos(){for(const k of Object.keys(PH)){try{const v=await idbGet('ph_'+k);if(v!==undefined)PHOTOS[k]=v||null}catch(e){}const el=$('#ph_'+k);if(el)el.innerHTML=photoInner(k)}}
function photoInner(k){const p=PHOTOS[k];return p?`<img src="${p.url}" alt="${PH[k]}"><button class="btn sm ghost" data-phdel="${k}">Togli</button>`:`<label class="btn sm ghost upl">📷 Carica la foto<input type="file" accept="image/*" data-photo="${k}" hidden></label>`}
function readPhoto(file){return new Promise((res,rej)=>{if(!file||!/^image\//.test(file.type||'image/'))return rej('Il file non è un’immagine.');if(file.size>25e6)return rej('La foto è troppo grande (massimo 25 MB).');
  const u=URL.createObjectURL(file),img=new Image();img.onload=()=>{const m=1500,sc=Math.min(1,m/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));
    const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res({url:c.toDataURL('image/png'),w:c.width,h:c.height})};img.onerror=()=>{URL.revokeObjectURL(u);rej('Non riesco ad aprire questa foto: prova con un JPG o un PNG.')};img.src=u})}
function reportUI(){const L=makeLayout(),todo=STEPS.filter(s=>!s.report&&!stepDone(s)),ok=!todo.length;const helped=Object.values(S.tk).filter(s=>s&&s.helped).length;
  return `<div class="rep"><div class="card"><h4 style="margin-top:0">Copertina</h4><div class="g2">${txt('nome','Nome')}${txt('cognome','Cognome')}</div><div class="g2">${txt('classe','Classe')}${txt('docente','Docente di riferimento')}</div>
   <h4>Fasi completate</h4><ul class="checklist">${STEPS.filter(s=>!s.report).map(s=>`<li><i style="color:${stepDone(s)?'#14965c':'#d98a0b'}">${stepDone(s)?'✔':'•'}</i><span>${s.t}</span></li>`).join('')}</ul>
   ${ok?'<div class="note green">Tutte le fasi sono fatte: la relazione è pronta.</div>':`<div class="note red">Mancano ${todo.length} fasi: torna a “${todo[0].t}”.</div>`}
   ${helped?`<div class="note">In ${helped} passi hai visto il procedimento guidato: ripassali sul quaderno con la scheda di allenamento.</div>`:''}
   <div class="opts" style="margin-top:14px"><button class="btn sun" id="docBtn" ${ok?'':'disabled'}>⬇ Scarica la relazione Word</button><button class="btn" id="trainBtn" ${ok?'':'disabled'}>✍️ Scheda di allenamento</button><button class="btn ghost" id="varBtn2">🎲 Nuova versione</button></div>
   <p class="hint">Versione ${(S.variant||0)+1} · impaginazione: ${layoutName(L)}. La scheda di allenamento ha i tuoi calcoli da rifare a mano e un esercizio nuovo con le soluzioni in fondo: ogni volta che la scarichi i numeri cambiano.</p></div>
   <div class="card"><h4 style="margin-top:0">I tuoi disegni a mano (facoltativi)</h4><p class="hint" style="margin-top:0">Fai i disegni sul quaderno con “Disegna con me”, fotografali e caricali: entrano nella relazione accanto a quelli dell’app.</p>
   <div class="g2">${Object.keys(PH).map(k=>`<div class="phbox"><b>${PH[k]}</b><div id="ph_${k}">${photoInner(k)}</div></div>`).join('')}</div></div>
   <div class="card"><h4 style="margin-top:0">Anteprima della copertina</h4><img class="logo-img" alt="I.I.S.S. Archimede" src="assets/logo.png" onerror="this.src='data:image/png;base64,'+LOGO_B64"><p style="text-align:center;font-weight:800;margin:10px 0">PROGETTO IMPIANTO A PANNELLI SOLARI PER UN SERVIZIO COMBINATO</p>
   ${figBox(sceneHouse(D,{cut:true,L:true,title:V('ct',['Progetto impianto a pannelli solari','Impianto solare termico combinato','Pannelli solari per ACS e riscaldamento','Energia dal sole per la casa']),sub:D.loc}),'')}
   <p style="font-weight:800;margin:10px 0 0">ALUNNO: ${xesc((S.cognome+' '+S.nome).toUpperCase())}<br>CLASSE: ${xesc(S.classe)}<br>DOCENTE DI RIFERIMENTO: ${xesc(S.docente)}</p></div></div>`}
function fileBase(){const nm=`${S.cognome}_${S.nome}`.trim().replace(/\s+/g,'_').replace(/[^\wÀ-ÿ_-]/g,'');return nm&&nm!=='_'?'_'+nm:''}
async function withBusy(msg,fn){if(BUSY)return;BUSY=true;const bx=document.createElement('div');bx.className='busy';bx.innerHTML=`<div class="bx"><div class="spinner"></div><div id="bmsg">${msg}</div></div>`;document.body.appendChild(bx);
  try{await fn(m=>{const e=$('#bmsg');if(e)e.textContent=m})}catch(e){console.error(e);toast('Non sono riuscito a creare il file. Riprova; se succede ancora, ricarica la pagina.')}bx.remove();BUSY=false}
function readyForFiles(){if(STEPS.some(s=>!s.report&&!stepDone(s))){toast('Completa tutte le fasi prima di scaricare.');return false}
  if(nameErr(S.nome)||nameErr(S.cognome)||!String(S.nome||'').trim()||!String(S.cognome||'').trim()){toast('Controlla nome e cognome.');return false}return true}
async function exportDocx(){if(!readyForFiles())return;await loadPhotos();
  await withBusy('Preparo la relazione…',async pr=>{const doc=await buildReport();const blob=await buildDocx(doc,pr);window.__lastDocx=blob;download(blob,`Progetto_impianto_solare${fileBase()}_v${(S.variant||0)+1}.docx`);toast('Relazione pronta: la trovi nei download.')})}
async function exportTrain(){if(!readyForFiles())return;S.train=(S.train||0)+1;save();
  await withBusy('Preparo la scheda di allenamento…',async pr=>{const doc=buildTraining();const blob=await buildDocx(doc,pr);window.__lastTrain=blob;download(blob,`Scheda_allenamento${fileBase()}_${S.train}.docx`);toast('Scheda pronta: stampala e rifai i conti a mano.')})}

// ---------- eventi ----------
function setNum(k,t){const r=VALID[k]?checkNum(VALID[k],t.value):{v:parseNum(t.value),err:''};
  if(r.err){S.bad[k]={raw:t.value,err:r.err};S[k]=null}else{delete S.bad[k];S[k]=r.v}
  t.classList.toggle('err',!!r.err);const ed=$('#e_'+k);if(ed)ed.textContent=r.err?'⚠ '+r.err:''}
let _inT=0;
document.addEventListener('input',e=>{const t=e.target;
  if(t.id==='fastChk'){S.fast=t.checked;save();return}
  if(t.dataset.slot){const [id,k]=t.dataset.slot.split(':'),s=tkS(id);s.sv=s.sv||{};s.sv[k]=t.value;document.querySelectorAll(`[data-slot="${t.dataset.slot}"]`).forEach(x=>{if(x!==t)x.value=t.value});t.classList.remove('ok','err');save();return}
  if(t.dataset.res){tkS(t.dataset.res).rv=t.value;t.classList.remove('err');save();return}
  if(t.dataset.mine){S.mine[t.dataset.mine]=t.value.slice(0,1200);const st=STEPS[S.step],er=mineErr(st);const w=$('#mwc');if(w)w.textContent=words(t.value).length+' parole';const m=$('#merr');if(m)m.textContent=er?'⚠ '+er:'✔ Va bene: questo testo andrà nella tua relazione.';
    t.closest('.mine').classList.toggle('ok',!er);updNext();renderNav();save();return}
  if(RUNNING)return;
  if(t.dataset.cp){const k=t.dataset.cp;if(k==='n'){S.cp.n=t.value.slice(0,40);save();return}
    const r=checkNum(VALID_CP[k],t.value);if(r.err||r.v==null){S.bad['cp_'+k]={raw:t.value,err:r.err||'Questo dato serve.'};t.classList.add('err')}else{delete S.bad['cp_'+k];S.cp[k]=r.v;t.classList.remove('err')}
    const ed=$('#e_cp_'+k);if(ed)ed.textContent=S.bad['cp_'+k]?'⚠ '+S.bad['cp_'+k].err:'';clearTimeout(_inT);_inT=setTimeout(refreshDyn,300);return}
  if(t.dataset.k&&t.tagName!=='SELECT'&&t.type!=='checkbox'){const k=t.dataset.k;
    if(t.dataset.t==='s'){S[k]=t.value.slice(0,40);const er=(k==='nome'||k==='cognome')?nameErr(t.value):'';t.classList.toggle('miss',!t.value.trim());t.classList.toggle('err',!!er);const ed=$('#e_'+k);if(ed)ed.textContent=er?'⚠ '+er:'';
      if(!ownMissing(STEPS[S.step]).length)S.seen[STEPS[S.step].id]=1;if(STEPS[S.step].report){save();updNext()}else{clearTimeout(_inT);_inT=setTimeout(refreshDyn,300)}return}
    if(t.type==='range'){const v=parseFloat(t.value);S[k]=v;const lb=$('#v_'+k);if(lb)lb.textContent=fmt(v,+t.dataset.dec||0)+' '+(t.dataset.unit||'');clearTimeout(_inT);_inT=setTimeout(refreshDyn,150);return}
    setNum(k,t);if(!ownMissing(STEPS[S.step]).length)S.seen[STEPS[S.step].id]=1;clearTimeout(_inT);_inT=setTimeout(refreshDyn,400)}});
document.addEventListener('change',async e=>{const t=e.target;
  if(t.dataset.photo){const k=t.dataset.photo,f=t.files&&t.files[0];t.value='';if(!f)return;try{const p=await readPhoto(f);PHOTOS[k]=p;try{await idbSet('ph_'+k,p)}catch(er){toast('La foto resta solo finché non chiudi la pagina.')}const el=$('#ph_'+k);if(el)el.innerHTML=photoInner(k);toast('Foto caricata: andrà nella relazione.')}catch(er){toast(typeof er==='string'?er:'Non riesco a leggere la foto.')}return}
  if(RUNNING)return;
  if(t.tagName==='SELECT'&&t.dataset.k){const k=t.dataset.k;S[k]=t.value===''?null:t.value;
    if(k==='regione'){S.prov=null;S.Tp=null;S.coef=null;delete S.bad.Tp}if(k==='prov'&&S.regione&&S.prov&&REGIONI[S.regione].p[S.prov]!=null){S.Tp=REGIONI[S.regione].p[S.prov];delete S.bad.Tp}return render()}
  if(t.dataset.k&&t.type==='checkbox'){S[t.dataset.k]=t.checked;return refreshDyn()}
  if(t.dataset.k&&t.tagName==='INPUT'&&t.dataset.t!=='s'&&t.type!=='range'){clearTimeout(_inT);refreshDyn()}});
document.addEventListener('toggle',e=>{const t=e.target;if(!t.classList)return;if(t.classList.contains('more')){S.tipsOpen=t.open;save()}if(t.classList.contains('paper')){S.paperOpen=t.open;save()}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('.lbox')?.remove();
  if(e.key==='Enter'&&e.target.tagName==='INPUT'){const t=e.target;
    if(t.dataset.slot){e.preventDefault();const all=[...document.querySelectorAll('input.slot')],i=all.indexOf(t);if(i<all.length-1)all[i+1].focus();else checkSlots(t.dataset.slot.split(':')[0]);return}
    if(t.dataset.res){e.preventDefault();checkRes(t.dataset.res);return}if(t.type!=='file')t.blur()}});
document.addEventListener('click',e=>{
  if(e.target.closest('.lb-x')){document.querySelector('.lbox')?.remove();return}
  if(RUNNING&&e.target.closest('button,[data-pos]')){toast('Aspetta un attimo: sto finendo.');e.preventDefault();return}
  const cell=e.target.closest('[data-tclick] [data-pos]');if(cell){const box=cell.closest('[data-tclick]'),t=findTask(box.dataset.tclick);if(t&&!taskOk(t))cellClick(t,cell);return}
  const fz=e.target.closest('.fig');if(fz&&!e.target.closest('button')&&!fz.closest('.drawp')){const sv=fz.querySelector('svg');if(sv){const o=document.createElement('div');o.className='lbox';o.innerHTML=`<div class="lb-top"><span>${xesc(fz.querySelector('.cap')?.textContent||'Figura')}</span><button class="tbtn lb-x">✕ Chiudi</button></div><div class="lb-in">${sv.outerHTML}</div>`;document.body.appendChild(o);return}}
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.id==='menuBtn'){$('#nav').classList.toggle('open');return}
  if(b.id==='brand')return go(0);
  if(b.id==='varBtn'||b.id==='varBtn2'){S.variant=(S.variant||0)+1;render();toast(`Versione ${S.variant+1}: nuova impaginazione, nuovi disegni e frasi`);return}
  if(b.dataset.reset){if(confirm('Vuoi iniziare un progetto nuovo? I dati e i passi fatti verranno cancellati (nome e classe restano).')){const keep={nome:S.nome,cognome:S.cognome,classe:S.classe,docente:S.docente,seen:{copertina:1}};S=Object.assign(fresh(),keep);saveNow();go(1)}return}
  if(b.dataset.go!=null)return go(+b.dataset.go);
  if(b.dataset.goid){const i=STEPS.findIndex(s=>s.id===b.dataset.goid);if(i>=0)go(i);return}
  if(b.dataset.nav){const n=+b.dataset.nav;if(n>0&&!stepDone(STEPS[S.step])){toast(whyNotDone(STEPS[S.step]));const c=document.querySelector('input.err,.task.cur,.mine textarea,.miss');if(c)try{c.scrollIntoView({block:'center',behavior:'smooth'})}catch(er){}shake(c);return}return go(S.step+n)}
  if(b.id==='docBtn'||b.id==='docBtn2')return exportDocx();
  if(b.id==='trainBtn')return exportTrain();
  if(b.dataset.phdel){const k=b.dataset.phdel;PHOTOS[k]=null;idbSet('ph_'+k,null).catch(()=>{});const el=$('#ph_'+k);if(el)el.innerHTML=photoInner(k);return}
  if(b.dataset.view!=null){S.vw[STEPS[S.step].id]=+b.dataset.view;const f=$('#figc');if(f)f.innerHTML=figPanel(STEPS[S.step]);save();return}
  if(b.dataset.dstep){const nm=b.dataset.dstep,G=DRAW[nm];S.dstep[nm]=clamp((S.dstep[nm]||0)+(+b.dataset.d),0,G.steps.length-1);const f=$('#figc');if(f)f.innerHTML=figPanel(STEPS[S.step]);save();return}
  if(b.dataset.fopt){const id=b.dataset.fopt,t=findTask(id),s=tkS(id),j=+b.dataset.j;if(!t)return;
    if(j===0){s.stg=1;delete s.fwhy;refreshDyn();const f=document.querySelector('input.slot');if(f){f.focus();burst(f,10)}}else{s.fw=[...new Set([...(s.fw||[]),j])];s.fwhy='✘ '+(altOf(t)[j-1]||['',''])[1];refreshDyn();shake($('#cur-'+id))}return}
  if(b.dataset.chkslots)return checkSlots(b.dataset.chkslots);
  if(b.dataset.chkres)return checkRes(b.dataset.chkres);
  if(b.dataset.showcalc){const id=b.dataset.showcalc,t=findTask(id),s=tkS(id);if(!t)return;s.stg=3;s.helped=true;refreshDyn();lockRun(async()=>{await animCalc($('#bd-'+id),strip(symHTML(t,'val')),t.show(D));await sleep(T_(800));finishTask(t,true)});return}
  if(b.dataset.show){const id=b.dataset.show,t=findTask(id);if(!t)return;lockRun(async()=>{if(t.kind==='list')await animList(t);else await animScan(t);finishTask(t,true)});return}
  if(b.dataset.chip){const t=findTask(b.dataset.chip);if(t&&!taskOk(t))chipClick(t,b);return}
  if(b.dataset.tundo){const st=STEPS[S.step],i=st.tasks.findIndex(x=>x.id===b.dataset.tundo);if(i<0)return;st.tasks.slice(i).forEach(x=>{delete S.tk[x.id]});refreshDyn();
    const c=document.querySelector('.task.cur');if(c)try{c.scrollIntoView({block:'center',behavior:'smooth'})}catch(er){}return}
  if(b.dataset.thelp){const s=tkS(b.dataset.thelp);s.help=!s.help;return refreshDyn()}
  if(b.dataset.topt){const id=b.dataset.topt,t=findTask(id);if(!t)return;let v=b.dataset.val;if(v!==''&&!isNaN(+v))v=+v;tkS(id).v=v;
    if(!t.key.startsWith('_')){S[t.key]=v;if(t.key==='insMat')S.lam=INS_MAT[v].l}
    refreshDyn();if(taskOk(t)){const dn=document.querySelectorAll('.task.done');burst(dn[dn.length-1],12)}else shake($('#cur-'+id));return}
  if(b.dataset.set){const k=b.dataset.set;let v=b.dataset.val;if(v!==''&&!isNaN(+v))v=+v;S[k]=v;if(k==='roof'){S.roofW=null;S.roofL=null;delete S.bad.roofW;delete S.bad.roofL;delete S.bad.tilt}if(k==='pan'&&v!=='custom')Object.keys(VALID_CP).forEach(x=>delete S.bad['cp_'+x]);return render()}
});
window.addEventListener('popstate',e=>{const i=e.state&&Number.isInteger(e.state.s)?e.state.s:0;go(i,true)});
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue&&!RUNNING){S=loadState();render();toast('Il progetto è stato aggiornato da un’altra scheda.')}});
window.addEventListener('pagehide',saveNow);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow()});
window.addEventListener('error',e=>{console.error(e);toastOnce('Qualcosa non ha funzionato: ricarica la pagina, i tuoi dati sono salvati.')});
window.addEventListener('unhandledrejection',e=>{console.error(e.reason)});
window.addEventListener('load',()=>{try{render();history.replaceState({s:S.step},'','#fase-'+(S.step+1))}catch(e){console.error(e);try{localStorage.removeItem(KEY)}catch(er){}S=fresh();render()}
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{})});
