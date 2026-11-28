// ===================== SCHEDA DI ALLENAMENTO: rifare tutto a mano =====================
function withState(patch,fn){const old=S;S={...old,...patch,tk:{},bad:{}};let r;try{TH=makeTheme();const D2=compute();r=fn(D2)}finally{S=old;TH=makeTheme();D=compute()}return r}
function calcTasks(){const out=[];for(const st of STEPS)for(const t of (st.tasks||[]))if(t.kind==='num')out.push([st,t]);return out}
function blankLine(n=34){return '_'.repeat(n)}
function trainingExercise(){const R=rngFrom(hashStr(seedStr()+'#train'+(S.train||1))),pk=a=>a[Math.floor(R()*a.length)],regs=Object.keys(REGIONI);
  for(let k=0;k<30;k++){const reg=pk(regs),prov=pk(Object.keys(REGIONI[reg].p));
    const p={regione:reg,prov,Tp:REGIONI[reg].p[prov],A:5*Math.round((90+R()*170)/5),piani:pk([1,2]),edificio:'villetta',roof:'falda',dir:'Sud',tilt:pk([20,25,30,35,40]),roofW:null,roofL:null,camino:true,pan:'rps254',coef:null,orient:'V',rows:1,Lone:pk([6,7,8,9,10,12,14,15,18]),pipeMat:'nero',insMat:pk(['nbr','pe','lana']),gtype:pk(['propilenico','etilico']),Hsc:null,Vsc:null,Hst:pk([6,7,8,9,10,12]),Pvs:6,kV:pk([50,55,60]),tank:'ss',dton:6};
    if(INS_MAT[p.insMat])p.lam=INS_MAT[p.insMat].l;else{p.insMat='nbr';p.lam=INS_MAT.nbr.l}
    const ok=withState(p,D2=>D2.N>=2&&D2.N<=10&&!D2.pipeOver&&D2.gOk&&D2.Pf>D2.Pi&&D2.fitAny);if(ok)return p}
  return null}
function buildTraining(){
  TH=makeTheme();D=compute();const L=makeLayout(),doc=new Doc('Scheda di allenamento',L),who=`${String(S.cognome||'').toUpperCase()} ${String(S.nome||'').toUpperCase()}`.trim();
  doc.p('SCHEDA DI ALLENAMENTO · IMPIANTO SOLARE COMBINATO',{style:'TitoloSez'});
  doc.p(`Alunno: **${who}** · Classe: ${S.classe}`);
  doc.p('Questa scheda si fa con carta, penna, calcolatrice e le tabelle del libro. Per ogni calcolo scrivi prima la formula con le lettere, poi la formula con i numeri, poi il risultato con l’unità di misura. Non guardare lo schermo: alla fine controlla con l’app o con le soluzioni.');
  // ---------- parte A ----------
  doc.h2(`${L.bullet} Il metodo per ogni fase`);doc.num(METODO);
  doc.h1('A. Rifai il tuo progetto');
  doc.p('I dati sono quelli del tuo progetto. Gli spazi vuoti sono da completare a mano.');
  let last='';
  for(const st of STEPS){if(!st.tasks)continue;const ts=st.tasks.filter(t=>t.kind!=='pick'||t.key.startsWith('_'));if(!ts.length)continue;
    doc.h2(`${L.bullet} ${st.t}`);
    if(st.testa){doc.p('**Cosa ti deve girare in testa:**');doc.bul(st.testa)}
    if(st.paper){doc.p('**Come procedi:**');doc.num(safe(()=>st.paper(D),[]).map(strip))}
    for(const t of ts){const q=strip(safe(()=>t.q(D),''));
      if(t.kind==='num'){const sl=t.slots(D),keys=slotKeys(t);doc.p(`**${q}**`);doc.cp(`Formula: ${blankLine(28)}`);
        doc.p('Dati: '+keys.map(k=>`${k} = ${blankLine(8)} (${sl[k][2]}, da ${strip(sl[k][3])})`).join('; ')+'.');
        doc.cp(`Calcolo: ${blankLine(40)}`);doc.cp(`Risultato: ${blankLine(14)} ${t.unit}`)}
      else if(t.kind==='pick')doc.p(`**Domanda.** ${q} ${blankLine(40)}`);
      else doc.p(`**Tabella.** ${q} Valore letto: ${blankLine(12)}`)}}
  doc.h2(`${L.bullet} Disegni da fare`);
  doc.num([...DRAW.line3d.steps.map(s=>'Linea 3D: '+s.t),...DRAW.centrale.steps.map(s=>'Centrale: '+s.t)]);
  doc.pb();
  // ---------- parte B ----------
  const p=trainingExercise();
  if(p){const ex=withState(p,D2=>{const tasks=calcTasks().map(([st,t])=>{const nn={...D};D=D2;const r={st:st.t,q:strip(safe(()=>t.q(D2),'')),sym:symOf(t),show:safe(()=>t.show(D2),''),unit:t.unit};D=nn;return r});
      return {D2,tasks,txt:`In una villetta di ${f0(D2.A)} m² nella provincia di ${D2.loc} (${p.regione}, Italia ${D2.zona}) si vuole realizzare un impianto a pannelli solari per il servizio combinato acqua calda sanitaria e riscaldamento a pavimento. Il tetto è esposto a sud, a falda inclinata di ${D2.tilt}°. La temperatura esterna di progetto è ${D2.Tp} °C. I pannelli sono Riello RPS 25/4. La distanza tra pannelli e locale caldaia è di ${f1(D2.Lone)} m (solo andata); l’altezza dal vaso al punto più alto è ${f1(D2.Hst)} m. Isolante: ${D2.im.n.toLowerCase()}. Glicole: ${GLICOLE[D2.gtype].n}. Serbatoio: ${D2.kV} l per m².`}});
    doc.h1('B. Esercizio nuovo');
    doc.p(ex.txt);
    doc.p('Svolgi tutte le fasi come nel tuo progetto: numero di pannelli, portata, tubo (Tab. 7A), isolante (Legge 10 e Tab. 9), antigelo, pompa, scambiatore, vaso, valvola e serbatoio. Prendi il coefficiente più basso dell’intervallo. Monta i pannelli in verticale su una fila.');
    doc.h2(`${L.bullet} Letture in tabella e scelte`);
    doc.num([`Tabella dei coefficienti: intervallo per Italia ${ex.D2.zona}, piccole dimensioni: ${blankLine(14)}`,`Tab. 7A, riga r = 12: primo tubo con portata ≥ G. De = ${blankLine(8)} Di = ${blankLine(8)}`,`Tab. 7A, colonna del tubo: perdita reale r = ${blankLine(8)} mm c.a./m`,`Legge 10: spessore minimo ${blankLine(8)} mm → commerciale ${blankLine(8)} mm`,`Tab. 9: superficie esterna per metro ${blankLine(8)} m²/m`,`Glicole: concentrazione ${blankLine(6)} %, protegge fino a ${blankLine(6)} °C, fattore ${blankLine(6)}`,`Vaso commerciale ${blankLine(8)} l · serbatoio commerciale ${blankLine(8)} l`]);
    let cur='';ex.tasks.forEach((t,i)=>{if(t.st!==cur){cur=t.st;doc.h2(`${L.bullet} ${t.st}`)}doc.p(`${i+1}. ${t.q}`);doc.cp(`${blankLine(46)}`)});
    doc.pb();
    // ---------- parte C ----------
    doc.h1('C. Soluzioni dell’esercizio nuovo');
    doc.p('Guardale solo dopo aver finito. Se un risultato non torna, cerca l’errore partendo dalla formula, poi dai dati, poi dal conto.');
    cur='';ex.tasks.forEach((t,i)=>{if(t.st!==cur){cur=t.st;doc.h2(`${L.bullet} ${t.st}`)}doc.cp(`${i+1}. ${t.sym.replace(/[{}]/g,'')}  →  ${t.show}`)});
    const D2=ex.D2;doc.p(`Letture in tabella: tubo De ${f1(D2.pipeP.de)} mm (Di ${f1(D2.pipeP.di)} mm), r = ${D2.r} mm c.a./m; isolante ${D2.insTab} mm dalla Legge 10 → ${D2.insComm} mm commerciale; superficie esterna ${f3(D2.Sext)} m²/m; glicole al ${D2.gpct}% (protegge fino a ${D2.Tg} °C, fattore ${f2(D2.fg)}); vaso commerciale ${D2.vaso} l; serbatoio ${D2.Vtank} l.`)}
  // ---------- tabelle ----------
  doc.pb();doc.h1('Tabelle da usare a mano');
  doc.fig(figTab7A(D,true),'Tab. 7A · Perdite di carico nei tubi in acciaio (acqua 50 °C)',{width:16});
  doc.fig(figDPR(D,true),'Legge 10 · Spessori minimi dell’isolante',{width:15});
  doc.fig(figTab9(D,true),'Tab. 9 · Superficie esterna di 1 m di tubo isolato',{width:14});
  return doc}
