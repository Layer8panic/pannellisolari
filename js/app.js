// ===================== APP: STATO, RENDER, EVENTI =====================
const DEF={nome:'',cognome:'',classe:'V MAT 2026/2027',docente:'LILLO TIROLO',variant:0,step:0,vw:{},tk:{},
 edificio:'villetta',A:null,piani:2,regione:null,prov:null,Tp:null,roof:'falda',dir:'Sud',tilt:null,flatTilt:40,roofW:null,roofL:null,camino:true,
 pan:'rps254',cp:{...PANNELLI.custom},coef:null,orient:'V',rows:1,margin:0.5,rimp:12,Lone:null,pipeMat:null,insMat:'nbr',lam:0.035,insPos:'est',
 gtype:'propilenico',Hsc:null,Vsc:null,Hst:null,Pvs:6,kV:55,tank:'ss',dton:6,tmax:85};
const KEY='pannellisolari-v4';
const fresh=()=>JSON.parse(JSON.stringify(DEF));
let S=(()=>{try{const s=JSON.parse(localStorage.getItem(KEY));return s?{...fresh(),...s}:fresh()}catch(e){return fresh()}})();
let D=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

// ---------- helper dei moduli ----------
function txt(k,l){return `<div class="ctrl"><label>${l}</label><input type="text" data-k="${k}" data-t="s" value="${xesc(S[k]||'')}" class="${isNull(S[k])?'miss':''}" autocomplete="off"></div>`}
function numf(k,l,u,min,max,step,sug=''){return `<div class="ctrl"><label>${l} <span class="u">${u}</span></label><input type="number" inputmode="decimal" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${isNull(S[k])?'':S[k]}" class="${isNull(S[k])&&!sug.startsWith('stima')?'miss':''}">${sug?`<div class="sug">${sug}</div>`:''}</div>`}
function sel(k,l,list,ph='',full=false){return `<div class="ctrl"><label>${l}</label><select data-k="${k}" class="${isNull(S[k])?'miss':''}">${ph?`<option value="">${ph}</option>`:''}${list.map(([v,t])=>`<option value="${xesc(v)}" ${String(S[k])===String(v)?'selected':''}>${t}</option>`).join('')}</select></div>`}
function rngf(k,l,min,max,step,u='',dec=0){const v=S[k]==null?min:S[k];return `<div class="ctrl"><label>${l}<b id="v_${k}">${fmt(v,dec)} ${u}</b></label><input type="range" data-k="${k}" data-dec="${dec}" data-unit="${u}" min="${min}" max="${max}" step="${step}" value="${v}"></div>`}
function optf(k,l,list){return `<div class="ctrl"><label>${l}</label><div class="opts">${list.map(([v,t,s])=>`<button class="opt ${String(S[k])===String(v)?'sel':''}" data-set="${k}" data-val="${v}">${t}${s?`<small>${s}</small>`:''}</button>`).join('')}</div></div>`}
function figBox(f,cap){return `<div class="fig">${f.svg}${cap?`<div class="cap">${cap}</div>`:''}</div>`}
const AV=`<svg width="30" height="30" viewBox="0 0 40 40"><circle cx="20" cy="17" r="8" fill="#ffd24a"/><g stroke="#ffd24a" stroke-width="2.4" stroke-linecap="round"><path d="M20 3v4M20 27v4M6 17h4M30 17h4M10 7l3 3M30 7l-3 3M10 27l3-3M30 27l-3-3"/></g><path d="M8 36q12-8 24 0" stroke="#9fc2ff" stroke-width="2.4" fill="none"/></svg>`;

// ---------- stato dei compiti ----------
function tkS(id){return S.tk[id]||(S.tk[id]={})}
function taskOk(t){const s=S.tk[t.id]||{};if(s.shown)return true;
  if(t.kind==='num'){const v=parseFloat(String(s.v??'').replace(',','.'));if(!s.chk||isNaN(v))return false;const e=t.exp(D);return Math.abs(v-e)<=Math.max(t.abs??0.05,Math.abs(e)*(t.tol??0.02))}
  if(t.kind==='cell'){if(!s.cell)return false;const g=t.target(D);return s.cell.r===g.r&&s.cell.c===g.c}
  if(t.kind==='pick'){if(s.v==null)return false;if(t.correct&&String(s.v)!==String(t.correct(D)))return false;if(t.check&&!t.check(D))return false;return true}
  return true}
function stepDone(st){return (st.tasks?st.tasks.every(taskOk):!!(S.seen&&S.seen[st.id]))&&ownMissing(st).length===0&&otherMissing(st).length===0}
function ownMissing(st){return (st.need||[]).filter(k=>NEED_STEP[k]===st.id&&isNull(S[k])&&!(k==='tilt'&&S.roof==='piano'))}
function otherMissing(st){return (st.need||[]).filter(k=>NEED_STEP[k]!==st.id&&isNull(S[k])&&!(k==='tilt'&&S.roof==='piano'))}

// ---------- render ----------
function render(){
  TH=makeTheme();D=compute();S.step=clamp(S.step,0,STEPS.length-1);const st=STEPS[S.step];S.seen=S.seen||{};if(!ownMissing(st).length)S.seen[st.id]=1;
  $('#varN').textContent=(S.variant||0)+1;$('#sub').textContent=`Fase ${S.step+1} di ${STEPS.length} · ${st.t}`;
  $('#prog').style.width=(STEPS.filter(stepDone).length/STEPS.length*100)+'%';
  renderNav();
  const om=otherMissing(st),g=st.tutor(D);
  let html=`<div class="step"><div class="shead"><div><span class="k">${st.grp} · fase ${S.step+1} di ${STEPS.length}</span><h2>${st.t}</h2></div></div>${tutorHTML(g)}`;
  if(om.length){html+=`<div class="card"><p style="margin-top:0">Per questa fase mi servono ancora: <b>${om.map(k=>NEED_NAMES[k]).join(', ')}</b>.</p><button class="btn" data-goid="${NEED_STEP[om[0]]}">Vai a inserirli</button></div>`}
  else if(st.report){html+=reportUI()}
  else{html+=`<div class="work ${st.tasks?'':'figfirst'}"><div><div id="usesBox"></div>${st.form?`<div class="card" id="formBox">${st.form(D)}</div>`:''}<div id="dyn"></div></div>${st.figs?`<div class="figcard" id="figc"></div>`:''}</div>`}
  html+=`<div class="navb"><button class="btn ghost" data-nav="-1" ${S.step?'':'disabled'}>← Indietro</button>${S.step<STEPS.length-1?`<button class="btn" data-nav="1">Avanti →</button>`:''}</div></div>`;
  $('#main').innerHTML=html;
  $('#mnav').innerHTML=`<button class="btn ghost" data-nav="-1" ${S.step?'':'disabled'}>←</button><span class="ct">${S.step+1} / ${STEPS.length}</span>${S.step<STEPS.length-1?`<button class="btn" data-nav="1">Avanti →</button>`:`<button class="btn sun" id="docBtn2">⬇ Word</button>`}`;
  if(!om.length&&!st.report)refreshDyn();
  save();
}
function tutorHTML(g){const open=S.tipsOpen??(window.innerWidth>860);
  return `<div class="tutor"><div class="av">${AV}</div><div><div class="bub"><div class="who">Archimede</div><div class="msg">${g.msg}</div></div>
  <details class="more" ${open?'open':''}><summary>Dove lo trovo · Perché</summary><div class="tips" style="grid-template-columns:1fr 1fr"><div class="tip dove"><b>Dove lo trovi</b>${g.dove}</div><div class="tip rag"><b>Perché</b>${g.perche}</div></div></details></div></div>`}
function refreshDyn(){
  const st=STEPS[S.step];if(st.report||otherMissing(st).length)return;
  TH=makeTheme();D=compute();
  const ub=$('#usesBox');if(ub)ub.innerHTML=st.uses?`<div class="uses"><span>Ti servono</span>${st.uses(D).map(([a,b])=>`<span class="pill">${a} <b>${b}</b></span>`).join('')}</div>`:'';
  let h='';const om=ownMissing(st);
  if(st.tasks){
    const cur=st.tasks.findIndex(t=>!taskOk(t));
    h+=`<div class="card"><h4 style="margin-top:0">Passo dopo passo</h4>`;
    st.tasks.forEach((t,i)=>{
      if(i<cur||cur<0)h+=doneTask(t);
      else if(i===cur)h+=om.length?`<div class="task next">Prima completa i dati qui sopra: ${om.map(k=>NEED_NAMES[k]).join(', ')}.</div>`:curTask(t,i,st.tasks.length);
      else h+=`<div class="task next">Passo ${i+1} · ${{num:'un calcolo',cell:'leggi la tabella',pick:'una scelta'}[t.kind]}</div>`});
    h+='</div>';
  }
  if(stepDone(st)&&st.gives)h+=`<div class="result"><h4>✔ Risultato di questa fase</h4><div class="rg">${st.gives(D).map(([a,b])=>`<div><small>${a}</small><b>${b}</b></div>`).join('')}</div></div>`;
  else if(st.gives&&!st.tasks&&om.length===0)h+=`<div class="result"><h4>Quello che ricaviamo</h4><div class="rg">${st.gives(D).map(([a,b])=>`<div><small>${a}</small><b>${b}</b></div>`).join('')}</div></div>`;
  $('#dyn').innerHTML=h;
  const fc=$('#figc');if(fc)fc.innerHTML=figPanel(st);
  renderNav();$('#prog').style.width=(STEPS.filter(stepDone).length/STEPS.length*100)+'%';save();
}
function doneTask(t){const s=S.tk[t.id]||{};let ans='';
  if(t.kind==='pick'){const o=t.opts(D).find(([v])=>String(v)===String(s.v));ans=o?o[1]:''}else if(t.show)ans=t.show(D);
  return `<div class="task done ${s.shown?'shown':''}"><span class="ck">${s.shown?'!':'✔'}</span><div><div>${strip(t.q(D))}</div>${ans?`<div class="ans">${ans}${s.shown?' · (soluzione mostrata)':''}</div>`:''}</div></div>`}
function curTask(t,i,n){const s=tkS(t.id);let body='',fb='';
  if(t.kind==='num'){body=`<div class="tin"><input type="text" inputmode="decimal" data-tin="${t.id}" value="${xesc(s.v??'')}" placeholder="scrivi qui"><span class="qu">${t.unit||''}</span><button class="btn sm" data-tchk="${t.id}">Verifica</button></div>`;
    if(s.chk&&!taskOk(t))fb=`<div class="fb no">${isNaN(parseFloat(String(s.v).replace(',','.')))?'Scrivi un numero (puoi usare la virgola).':V('no'+t.id+(s.tries||0),['Non torna, riprova.','Quasi: ricontrolla il conto.','Non ancora. Prova a rifarlo con calma.'])}</div>`}
  if(t.kind==='pick'){body=`<div class="opts">${t.opts(D).map(([v,l,sm])=>`<button class="opt ${String(s.v)===String(v)?'sel':''}" data-topt="${t.id}" data-val="${v}">${l}${sm?`<small>${sm}</small>`:''}</button>`).join('')}</div>`;
    if(s.v!=null&&!taskOk(t))fb=`<div class="fb no">${t.bad?t.bad(D):'Non è la scelta giusta, riprova.'}</div>`}
  if(t.kind==='cell'&&s.wrong)fb=`<div class="fb no">${V('cw'+t.id+(s.tries||0),['Non è quella: guarda bene riga e colonna.','Quasi: controlla di nuovo.','No, riprova.'])}</div>`;
  if(s.help&&t.help)fb+=`<div class="fb help">💡 ${t.help(D)}</div>`;
  let tbl='';if(t.table){const o={click:t.kind==='cell'?t.click:null,rowOn:t.rowOn?t.rowOn(D):undefined,colOn:t.colOn?t.colOn(D):undefined,wrong:s.wrong};tbl=TABLES[t.table](D,o)}
  return `<div class="task cur"><span class="tn">Passo ${i+1} di ${n}</span><div class="tq">${t.q(D)}</div>${body}${fb}${tbl}
   <div class="tact">${t.help?`<button class="btn sm ghost" data-thelp="${t.id}">💡 Aiutami</button>`:''}<button class="btn sm ghost" data-tshow="${t.id}">Mostrami la soluzione</button></div></div>`}
function figPanel(st){const vs=st.figs,i=clamp(S.vw[st.id]||0,0,vs.length-1),v=vs[i];
  return `${vs.length>1?`<div class="vtabs">${vs.map((x,j)=>`<button class="${j===i?'on':''}" data-view="${j}">${x.n}</button>`).join('')}</div>`:''}${figBox(v.f(D),v.n)}`}
function renderNav(){let h='',g='';
  STEPS.forEach((s,i)=>{if(s.grp!==g){g=s.grp;h+=`<div class="g">${g}</div>`}const dn=stepDone(s);
    h+=`<button class="${i===S.step?'cur':''} ${dn?'done':''}" data-go="${i}"><span class="d">${dn&&i!==S.step?'✓':i+1}</span>${s.t}</button>`});
  const rows=[];STEPS.forEach(s=>{if(s.gives&&stepDone(s)&&!otherMissing(s).length)s.gives(D).forEach(r=>rows.push(r))});
  if(rows.length)h+=`<div class="qnb"><h5>Il tuo quaderno</h5>${rows.slice(0,24).map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
  h+=`<div class="qnb"><button data-reset="1"><span class="d">↺</span>Nuovo progetto</button></div>`;
  $('#nav').innerHTML=h}
function go(i){S.step=clamp(i,0,STEPS.length-1);render();window.scrollTo({top:0,behavior:'smooth'});$('#nav').classList.remove('open')}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2300)}

// ---------- relazione ----------
function reportUI(){
  const L=makeLayout(),todo=STEPS.filter(s=>!s.report&&!stepDone(s));
  return `<div class="rep"><div class="card"><h4 style="margin-top:0">Copertina</h4><div class="g2">${txt('nome','Nome')}${txt('cognome','Cognome')}</div><div class="g2">${txt('classe','Classe')}${txt('docente','Docente di riferimento')}</div>
   <h4>Fasi completate</h4><ul class="checklist">${STEPS.filter(s=>!s.report).map(s=>`<li><i style="color:${stepDone(s)?'#14965c':'#d98a0b'}">${stepDone(s)?'✔':'•'}</i><span>${s.t}</span></li>`).join('')}</ul>
   ${todo.length?`<div class="note">Puoi scaricare lo stesso, ma ${todo.length===1?'manca una fase':`mancano ${todo.length} fasi`}: i valori mancanti li completo io con i calcoli corretti.</div>`:'<div class="note green">Tutto fatto: la relazione è pronta.</div>'}
   <div class="opts" style="margin-top:14px"><button class="btn sun" id="docBtn" ${isNull(S.A)||isNull(S.prov)||isNull(S.Tp)||isNull(S.Lone)?'disabled':''}>⬇ Scarica la relazione Word</button><button class="btn ghost" id="varBtn2">🎲 Nuova versione</button></div>
   <p class="hint">Versione ${(S.variant||0)+1} · impaginazione: ${layoutName(L)}.</p></div>
   <div class="card"><h4 style="margin-top:0">Anteprima della copertina</h4><img class="logo-img" alt="I.I.S.S. Archimede" src="assets/logo.png" onerror="this.src='data:image/png;base64,'+LOGO_B64"><p style="text-align:center;font-weight:800;margin:10px 0">PROGETTO IMPIANTO A PANNELLI SOLARI PER UN SERVIZIO COMBINATO</p>
   ${figBox(sceneHouse(D,{cut:true,L:true,title:V('ct',['Progetto impianto a pannelli solari','Impianto solare termico combinato','Pannelli solari per ACS e riscaldamento','Energia dal sole per la casa']),sub:D.loc}),'')}
   <p style="font-weight:800;margin:10px 0 0">ALUNNO: ${xesc((S.cognome+' '+S.nome).toUpperCase())}<br>CLASSE: ${xesc(S.classe)}<br>DOCENTE DI RIFERIMENTO: ${xesc(S.docente)}</p></div></div>`}
async function exportDocx(){
  const bx=document.createElement('div');bx.className='busy';bx.innerHTML='<div class="bx"><div class="spinner"></div><div id="bmsg">Preparo la relazione…</div></div>';document.body.appendChild(bx);
  try{const doc=await buildReport();const blob=await buildDocx(doc,m=>{const e=$('#bmsg');if(e)e.textContent=m});window.__lastDocx=blob;
    const nm=`${S.cognome}_${S.nome}`.trim().replace(/\s+/g,'_').replace(/[^\wÀ-ÿ_-]/g,'');
    download(blob,`Progetto_impianto_solare${nm&&nm!=='_'?'_'+nm:''}_v${(S.variant||0)+1}.docx`);toast('Relazione pronta')}
  catch(e){console.error(e);alert('Non sono riuscito a creare il file: '+e.message)}
  bx.remove()}

// ---------- eventi ----------
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.tin){const s=tkS(t.dataset.tin);s.v=t.value;s.chk=false;save();return}
  if(t.dataset.cp){S.cp[t.dataset.cp]=t.type==='number'?parseFloat(t.value)||0:t.value;refreshDyn();return}
  if(t.dataset.k&&t.tagName!=='SELECT'&&t.type!=='checkbox'){const k=t.dataset.k;
    if(t.dataset.t==='s'){S[k]=t.value;S.seen=S.seen||{};if(!ownMissing(STEPS[S.step]).length)S.seen[STEPS[S.step].id]=1;t.classList.toggle('miss',!t.value);if(k==='nome'||k==='cognome'){const st=STEPS[S.step];if(st.report){save();return}refreshDyn()}save();return}
    if(t.value===''){S[k]=null;t.classList.add('miss');refreshDyn();return}
    const v=parseFloat(t.value);if(isNaN(v))return;S[k]=v;t.classList.remove('miss');S.seen=S.seen||{};if(!ownMissing(STEPS[S.step]).length)S.seen[STEPS[S.step].id]=1;const lb=$('#v_'+k);if(lb)lb.textContent=fmt(v,+t.dataset.dec||0)+' '+(t.dataset.unit||'');refreshDyn()}});
document.addEventListener('change',e=>{const t=e.target;
  if(t.tagName==='SELECT'&&t.dataset.k){const k=t.dataset.k;S[k]=t.value===''?null:t.value;
    if(k==='regione'){S.prov=null;S.Tp=null;S.coef=null}if(k==='prov'&&S.regione&&S.prov)S.Tp=REGIONI[S.regione].p[S.prov];return render()}
  if(t.dataset.k&&t.type==='checkbox'){S[t.dataset.k]=t.checked;return refreshDyn()}});
document.addEventListener('toggle',e=>{if(e.target.classList&&e.target.classList.contains('more')){S.tipsOpen=e.target.open;save()}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('.lbox')?.remove();if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.tin){e.preventDefault();check(e.target.dataset.tin)}});
function check(id){const s=tkS(id);s.chk=true;s.tries=(s.tries||0)+1;refreshDyn();const t=STEPS[S.step].tasks.find(x=>x.id===id);if(t&&taskOk(t))toast(V('okt'+id,['Esatto!','Giusto!','Perfetto, andiamo avanti.','Ottimo.']));else{const i=document.querySelector(`[data-tin="${id}"]`);if(i)i.focus()}}
document.addEventListener('click',e=>{
  if(e.target.closest('.lb-x')){document.querySelector('.lbox')?.remove();return}
  const td=e.target.closest('[data-tc]');if(td){const st=STEPS[S.step],t=st.tasks&&st.tasks.find(x=>!taskOk(x));if(t&&t.kind==='cell'){const [r,c]=td.dataset.tc.split(',').map(Number);const s=tkS(t.id);s.cell={r,c};const g=t.target(D);s.wrong=(r===g.r&&c===g.c)?null:{r,c};s.tries=(s.tries||0)+1;refreshDyn();if(!s.wrong)toast(V('okc'+t.id,['Esatto!','Proprio quella!','Giusto.']))}return}
  const fz=e.target.closest('.fig');if(fz&&!e.target.closest('button')){const sv=fz.querySelector('svg');if(sv){const o=document.createElement('div');o.className='lbox';o.innerHTML=`<div class="lb-top"><span>${fz.querySelector('.cap')?.textContent||'Figura'}</span><button class="tbtn lb-x">✕ Chiudi</button></div><div class="lb-in">${sv.outerHTML}</div>`;document.body.appendChild(o);return}}
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='menuBtn'){$('#nav').classList.toggle('open');return}
  if(b.id==='brand')return go(0);
  if(b.id==='varBtn'||b.id==='varBtn2'){S.variant=(S.variant||0)+1;render();toast(`Versione ${S.variant+1}: nuova impaginazione, nuovi disegni e frasi`);return}
  if(b.dataset.reset){if(confirm('Vuoi iniziare un progetto nuovo? I dati inseriti verranno cancellati (nome e classe restano).')){const keep={nome:S.nome,cognome:S.cognome,classe:S.classe,docente:S.docente};S=Object.assign(fresh(),keep);go(1)}return}
  if(b.dataset.go!=null)return go(+b.dataset.go);
  if(b.dataset.goid)return go(STEPS.findIndex(s=>s.id===b.dataset.goid));
  if(b.dataset.nav){const st=STEPS[S.step],n=+b.dataset.nav;if(n>0){const om=ownMissing(st);if(om.length){toast('Prima inserisci '+om.map(k=>NEED_NAMES[k]).join(', '));return}}return go(S.step+n)}
  if(b.id==='docBtn'||b.id==='docBtn2')return exportDocx();
  if(b.dataset.view!=null){S.vw[STEPS[S.step].id]=+b.dataset.view;const f=$('#figc');if(f)f.innerHTML=figPanel(STEPS[S.step]);save();return}
  if(b.dataset.tchk)return check(b.dataset.tchk);
  if(b.dataset.thelp){const s=tkS(b.dataset.thelp);s.help=!s.help;return refreshDyn()}
  if(b.dataset.tshow){tkS(b.dataset.tshow).shown=true;return refreshDyn()}
  if(b.dataset.topt){const id=b.dataset.topt,t=STEPS[S.step].tasks.find(x=>x.id===id);let v=b.dataset.val;if(v!==''&&!isNaN(+v))v=+v;tkS(id).v=v;
    if(!t.key.startsWith('_')){S[t.key]=v;if(t.key==='insMat')S.lam=INS_MAT[v].l;if(t.key==='orient')S.rows=S.rows||1}
    refreshDyn();if(taskOk(t))toast(V('okp'+id+v,['Fatto.','Bene.','Ok, avanti.']));return}
  if(b.dataset.set){const k=b.dataset.set;let v=b.dataset.val;if(v!==''&&!isNaN(+v))v=+v;S[k]=v;if(k==='roof'){S.roofW=null;S.roofL=null}return render()}
});
window.addEventListener('load',()=>{render();if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{})});
