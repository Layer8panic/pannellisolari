// ===================== UTILITÀ =====================
const $=s=>document.querySelector(s);
const fmt=(x,d=2)=>x==null||isNaN(x)?'-':Number(x).toLocaleString('it-IT',{minimumFractionDigits:d,maximumFractionDigits:d});
const f0=x=>fmt(x,0),f1=x=>fmt(x,1),f2=x=>fmt(x,2),f3=x=>fmt(x,3);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI;
const xesc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const strip=s=>String(s).replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ');
function tcol(T){const t=clamp((T-10)/80,0,1),a=[47,127,216],b=[240,180,60],c=[224,60,40];
  const m=t<.5?a.map((v,i)=>lerp(v,b[i],t*2)):b.map((v,i)=>lerp(v,c[i],(t-.5)*2));return `rgb(${m.map(Math.round).join(',')})`}

// ===================== ZIP (store) =====================
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function makeZip(files,mime){
  const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  for(const f of files){
    const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,0,true);lh.setUint16(12,0x21,true);
    lh.setUint32(14,crc,true);lh.setUint32(18,data.length,true);lh.setUint32(22,data.length,true);lh.setUint16(26,name.length,true);lh.setUint16(28,0,true);
    parts.push(new Uint8Array(lh.buffer),name,data);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,0,true);ch.setUint16(14,0x21,true);
    ch.setUint32(16,crc,true);ch.setUint32(20,data.length,true);ch.setUint32(24,data.length,true);ch.setUint16(28,name.length,true);ch.setUint32(38,0,true);ch.setUint32(42,off,true);
    cd.push(new Uint8Array(ch.buffer),name);off+=30+name.length+data.length;
  }
  const cds=cd.reduce((a,b)=>a+b.length,0),end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cds,true);end.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(end.buffer)],{type:mime});
}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}

// ===================== SVG -> PNG =====================
function svgToPng(fig,scale=2){
  return new Promise((res,rej)=>{
    const img=new Image();
    img.onload=()=>{const c=document.createElement('canvas');c.width=fig.w*scale;c.height=fig.h*scale;const x=c.getContext('2d');
      x.fillStyle='#ffffff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
      c.toBlob(b=>b.arrayBuffer().then(ab=>res({bytes:new Uint8Array(ab),w:fig.w,h:fig.h})),'image/png')};
    img.onerror=e=>rej(e);
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(fig.svg);
  });
}

