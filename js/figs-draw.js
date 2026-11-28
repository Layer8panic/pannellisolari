// ===================== DISEGNA CON ME: disegni a mano passo passo su foglio a quadretti =====================
const DRAW={
 line3d:{tip:'Usa matita, righello e squadra a 30°. Ripassa in rosso la mandata e in blu il ritorno solo alla fine.',steps:[
  {t:'Sul foglio a quadretti traccia due assi a 30° dall’orizzontale: sono le direzioni della pianta in assonometria.'},
  {t:'In alto a sinistra disegna i pannelli: parallelogrammi affiancati, inclinati come la falda.'},
  {t:'Dal lato alto dei pannelli parte la mandata (calda): scende fino al locale caldaia. Ripassala in rosso.'},
  {t:'Il ritorno (freddo) corre parallelo alla mandata e rientra dal lato basso dei pannelli. Ripassalo in blu.'},
  {t:'Sul ritorno disegna i simboli di pompa, vaso di espansione e valvola di sicurezza con la tanica.'},
  {t:'In basso a destra disegna il serbatoio con il serpentino: lì arrivano mandata e ritorno.'},
  {t:'Scrivi le quote: diametro del tubo, spessore dell’isolante e lunghezza L di andata.'},
  {t:'Accanto fai il particolare in sezione: tre cerchi, cioè tubo, isolante e lamierino di protezione.'}]},
 centrale:{tip:'Disegna prima tutto a matita. Usa simboli semplici: un cerchio con un triangolo per la pompa, una capsula per il vaso.',steps:[
  {t:'Disegna il serbatoio: un rettangolo alto con gli angoli arrotondati.'},
  {t:'In basso dentro il serbatoio disegna il serpentino solare a zig-zag.'},
  {t:'In alto a sinistra metti i pannelli. Dalla loro uscita alta scende la mandata (rossa) fino all’entrata alta del serpentino.'},
  {t:'Dall’uscita bassa del serpentino parte il ritorno (blu) verso i pannelli. Sul ritorno disegna la pompa con la freccia del verso.'},
  {t:'Sul ritorno aggiungi il vaso di espansione e la valvola di sicurezza con lo scarico nella tanica.'},
  {t:'Disegna la centralina. Collega con linee tratteggiate la sonda S1 (sul pannello) e la sonda S2 (in basso nel serbatoio). Un’altra linea va alla pompa.'},
  {t:'Completa: acqua fredda che entra in basso, acqua calda che esce in alto, e scrivi la regola ΔT.'}]}
};
function paperBg(W,H){let g='';for(let x=0;x<=W;x+=20)g+=`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#cfe0f5" stroke-width="${x%100?0.6:1.1}"/>`;for(let y=0;y<=H;y+=20)g+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#cfe0f5" stroke-width="${y%100?0.6:1.1}"/>`;
  return `<rect width="${W}" height="${H}" fill="#fbfdff"/>${g}<line x1="48" y1="0" x2="48" y2="${H}" stroke="#f3a9a9" stroke-width="1.4"/>`}
function figDraw(name,D,k){const W=640,H=420;const L=[];
  const pen=(i,s)=>L.push({i,s});
  const P=(d,c='#1d2433',w=2.2,dash='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${dash?`stroke-dasharray="${dash}"`:'pathLength="1"'}/>`;
  const Tx=(x,y,t,c='#1d2433',s=13,a='start')=>`<text x="${x}" y="${y}" font-size="${s}" fill="${c}" font-family="'Comic Sans MS','Segoe Print',cursive" text-anchor="${a}">${xesc(t)}</text>`;
  if(name==='line3d'){const c=Math.cos(Math.PI/6),sn=0.5,Sc=38;const iso=(u,v,h)=>[260+(u-v)*Sc*c,215+(u+v)*Sc*sn-h];const p=a=>a[0].toFixed(1)+','+a[1].toFixed(1);const pl=pts=>'M'+pts.map(q=>p(iso(...q))).join(' L');
    const n=Math.min(D.N||3,5),uE=n*1.08,hT=178,hB=136,tu=uE+1.4,tv=2.2;
    pen(0,P(pl([[-1,0,0],[tu+1.2,0,0]]),'#8aa0bf',1.4,'6 5')+P(pl([[-1,0,0],[-1,4,0]]),'#8aa0bf',1.4,'6 5')+P(pl([[-1,0,0],[-1,0,120]]),'#8aa0bf',1.4,'6 5')+Tx(...iso(tu+1.3,0,0),'x','#8aa0bf')+Tx(...iso(-1,4.2,-8),'y','#8aa0bf')+Tx(...iso(-1,0,128),'z','#8aa0bf'));
    let pan='';for(let j=0;j<n;j++){const u0=j*1.08;pan+=P(pl([[u0,0,hT],[u0+1,0,hT],[u0+1,1.3,hB],[u0,1.3,hB],[u0,0,hT]]),'#2a4f8f',2);pan+=P(pl([[u0+.5,0,hT],[u0+.5,1.3,hB]]),'#2a4f8f',1)}
    pen(1,pan+Tx(...iso(0,-.5,hT-4).map((v,i)=>v-(i?0:60)),`${D.N||''} pannelli`,'#2a4f8f'));
    pen(2,P(pl([[uE-.08,0,hT],[uE+.5,0,hT],[uE+.5,0,40],[uE+.5,tv-.5,40],[tu-.3,tv-.5,40]]),'#d8452c',3.2)+Tx(...iso(uE+.6,0,120).map((v,i)=>v+(i?0:10)),'mandata','#d8452c',13));
    pen(3,P(pl([[0,1.3,hB],[-.4,1.3,hB],[-.4,1.3,10],[-.4,tv+.3,10],[tu-.3,tv+.3,10]]),'#2f7fd8',3.2)+Tx(...iso(-.4,2.3,30).map((v,i)=>v-(i?0:70)),'ritorno','#2f7fd8',13));
    const pp=iso(.6,tv+.3,10),vv=iso(1.4,tv+.3,10),vs=iso(2.2,tv+.3,10);
    pen(4,P(`M${pp[0]+11},${pp[1]} a11,11 0 1,0 -22,0 a11,11 0 1,0 22,0 M${pp[0]-5},${pp[1]-7} L${pp[0]+7},${pp[1]} L${pp[0]-5},${pp[1]+7}`,'#1d2433',2)+Tx(pp[0]-18,pp[1]+28,'pompa',undefined,12)+
      P(`M${vv[0]},${vv[1]} L${vv[0]},${vv[1]+16} M${vv[0]-11},${vv[1]+24} a11,9 0 0,1 22,0 L${vv[0]+11},${vv[1]+44} a11,9 0 0,1 -22,0 Z`,'#1d2433',2)+Tx(vv[0]+16,vv[1]+40,'vaso',undefined,12)+
      P(`M${vs[0]},${vs[1]} L${vs[0]},${vs[1]-18} M${vs[0]-8},${vs[1]-32} L${vs[0]+8},${vs[1]-18} L${vs[0]-8},${vs[1]-18} L${vs[0]+8},${vs[1]-32} Z M${vs[0]+8},${vs[1]-25} L${vs[0]+24},${vs[1]-25} L${vs[0]+24},${vs[1]-6}`,'#1d2433',2)+`<rect x="${vs[0]+14}" y="${vs[1]-6}" width="20" height="16" rx="3" fill="none" stroke="#1d2433" stroke-width="2" pathLength="1"/>`+Tx(vs[0]-10,vs[1]-40,'valvola + tanica',undefined,12));
    const tk=iso(tu+.2,tv,0);pen(5,P(`M${tk[0]-28},${tk[1]} L${tk[0]-28},${tk[1]-120} a28,11 0 0,1 56,0 L${tk[0]+28},${tk[1]} a28,11 0 0,1 -56,0 M${tk[0]-16},${tk[1]-24} l32,-8 l-32,-8 l32,-8 l-32,-8 l32,-8`,'#1d2433',2.2)+Tx(tk[0],tk[1]+26,`serbatoio ${D.Vtank||''} l`,'#1d2433',13,'middle'));
    pen(6,Tx(470,330,`tubo De ${f1(D.pipeP.de)} / Di ${f1(D.pipeP.di)} mm`,'#7a3e00',13)+Tx(470,350,`isolante ${D.insComm} mm`,'#7a3e00',13)+Tx(470,370,`L andata = ${D.Lone==null?'…':f1(D.Lone)} m`,'#7a3e00',13)+P(`M466,326 L${iso(uE+.5,1,40)[0]+4},${iso(uE+.5,1,40)[1]+2}`,'#7a3e00',1.2,'4 3'));
    const cx=570,cy=90,r1=10,r2=10+D.insComm*0.5,r3=r2+4;pen(7,`<circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="#6b7480" stroke-width="2" pathLength="1"/><circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="#d98a0b" stroke-width="2" stroke-dasharray="3 3"/><circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="#1d2433" stroke-width="2.4" pathLength="1"/>`+Tx(cx,cy+r3+18,'sezione del tubo','#1d2433',12,'middle')+Tx(cx,cy-r3-8,`s = ${D.insComm} mm`,'#d98a0b',12,'middle'))}
  else{const tx=430,ty=120,tw=110,th=230;
    pen(0,P(`M${tx+14},${ty} L${tx+tw-14},${ty} Q${tx+tw},${ty} ${tx+tw},${ty+14} L${tx+tw},${ty+th-14} Q${tx+tw},${ty+th} ${tx+tw-14},${ty+th} L${tx+14},${ty+th} Q${tx},${ty+th} ${tx},${ty+th-14} L${tx},${ty+14} Q${tx},${ty} ${tx+14},${ty} Z`,'#1d2433',2.6)+Tx(tx+tw/2,ty-10,`serbatoio ${D.Vtank||''} l`,'#1d2433',13,'middle'));
    let z=`M${tx},${ty+150}`;for(let i=0;i<5;i++)z+=` L${tx+tw-20},${ty+150+i*14+7} L${tx+20},${ty+150+i*14+14}`;z+=` L${tx},${ty+225}`;pen(1,P(z,'#d8452c',2.2)+Tx(tx+tw+8,ty+190,'serpentino solare','#d8452c',12));
    pen(2,P('M90,70 L190,70 L170,120 L70,120 Z','#2a4f8f',2.2)+P('M120,70 L100,120 M150,70 L130,120','#2a4f8f',1.2)+Tx(70,60,'pannelli','#2a4f8f')+P(`M190,78 L300,78 L300,${ty+150} L${tx},${ty+150}`,'#d8452c',3)+Tx(310,110,'mandata','#d8452c',12));
    const ry=ty+225;pen(3,P(`M${tx},${ry} L250,${ry} L250,${ry+40} L120,${ry+40} L120,128 L80,128 L80,118`,'#2f7fd8',3)+P(`M211,${ry} a11,11 0 1,0 -22,0 a11,11 0 1,0 22,0 M196,${ry-7} L208,${ry} L196,${ry+7}`,'#1d2433',2)+Tx(178,ry-18,'pompa',undefined,12)+Tx(130,ry+58,'ritorno','#2f7fd8',12));
    pen(4,P(`M160,${ry+40} L160,${ry+58} M148,${ry+66} a12,9 0 0,1 24,0 L172,${ry+84} a12,9 0 0,1 -24,0 Z`,'#1d2433',2)+Tx(178,ry+80,'vaso',undefined,12)+P(`M120,${ry-30} L100,${ry-30} M92,${ry-40} L108,${ry-24} L92,${ry-24} L108,${ry-40} Z M100,${ry-24} L100,${ry+10}`,'#1d2433',2)+`<rect x="88" y="${ry+10}" width="24" height="20" rx="3" fill="none" stroke="#1d2433" stroke-width="2" pathLength="1"/>`+Tx(60,ry-46,'valvola + tanica',undefined,12));
    pen(5,`<rect x="300" y="18" width="92" height="40" rx="6" fill="none" stroke="#14965c" stroke-width="2.2" pathLength="1"/>`+Tx(346,43,'centralina','#14965c',12,'middle')+P('M300,38 L160,38 L160,74','#14965c',1.6,'5 4')+Tx(150,90,'S1','#14965c',12)+P(`M392,38 L470,38 L470,${ty+205} L${tx+14},${ty+205}`,'#14965c',1.6,'5 4')+Tx(tx+18,ty+200,'S2','#14965c',12)+P(`M346,58 L346,${ry-20} L200,${ry-20} L200,${ry-11}`,'#14965c',1.6,'5 4'));
    pen(6,P(`M${tx+tw},${ty+th-20} L${tx+tw+50},${ty+th-20}`,'#2f7fd8',2.6)+Tx(tx+tw+8,ty+th-28,'acqua fredda','#2f7fd8',12)+P(`M${tx+tw},${ty+20} L${tx+tw+50},${ty+20}`,'#d8452c',2.6)+Tx(tx+tw+8,ty+12,'ACS calda','#d8452c',12)+Tx(420,395,`pompa ON se T1 − T2 ≥ ${D.dton} °C`,'#14965c',14,'middle'))}
  const body=L.filter(x=>x.i<=k).map(x=>`<g class="${x.i===k?'dnew':'dold'}">${x.s}</g>`).join('');
  return {w:W,h:H,svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${paperBg(W,H)}${body}</svg>`}}
