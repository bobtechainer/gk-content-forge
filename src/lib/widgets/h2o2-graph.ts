import { threeWidget } from "./three-kit";

/* Chặng 2 — Phân huỷ H2O2 (đồ thị tốc độ trung bình).
 * Cốc H2O2 3D, kéo tay cầm thời gian: H2O2 tách thành H2O + O2, bọt O2 nổi lên
 * (mạnh lúc đầu, yếu dần). Sổ tay vẽ đường cong [H2O2]-t và chạy v = -ΔC/Δt.
 * Số liệu Bảng 19.1. */

const BODY = `
<div class="gk-stage" style="height:440px">
  <canvas></canvas>

  <div class="gk-ov note" style="right:12px;top:12px;width:250px">
    <div class="ttl">Sổ tay phòng thí nghiệm</div>
    <svg viewBox="0 0 240 150" id="h2-svg"></svg>
    <div class="vline"><span>v = −ΔC/Δt</span><b id="h2-v">0,098</b></div>
    <div class="sub" id="h2-int">Khoảng 0–3 h · ΔC = −0,293 mol/L</div>
  </div>

  <div class="gk-ov read" style="left:12px;top:12px">
    <div class="k">Thời gian</div><div class="v"><span id="h2-t">0</span> h</div>
    <div class="k" style="margin-top:6px">[H₂O₂] còn lại</div><div class="v" style="color:#7dd3fc"><span id="h2-c">1,000</span></div>
  </div>

  <div class="gk-ov track" id="h2-track">
    <div class="rail"></div>
    <div class="knob gk-grab" id="h2-knob"></div>
    <div class="ticks"><span>0h</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span></div>
  </div>
</div>
<div class="gk-hint">Kéo nút thời gian để xem H₂O₂ phân huỷ và độ dốc thoải dần.</div>`;

const CSS = `
  .note{z-index:4;background:rgba(8,14,28,.62);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px;backdrop-filter:blur(6px)}
  .note .ttl{font-size:11px;color:#9db4e6;font-weight:700;margin-bottom:4px}
  .note svg{width:100%;height:auto;display:block}
  .note .vline{display:flex;justify-content:space-between;align-items:baseline;margin-top:6px;font-size:12px;color:#9db4e6}
  .note .vline b{font-size:20px;color:#67e8f9}
  .note .sub{font-size:11px;color:#7dd3fc;margin-top:2px}
  .read{z-index:4}
  .track{left:12px;right:280px;bottom:54px;z-index:4}
  .track .rail{height:6px;border-radius:6px;background:linear-gradient(90deg,#38bdf8,#818cf8,#a78bfa)}
  .track .knob{position:absolute;top:-9px;left:0;width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#38bdf8);box-shadow:0 2px 10px rgba(56,189,248,.7);transform:translateX(-12px)}
  .track .ticks{display:flex;justify-content:space-between;font-size:10px;color:#9db4e6;margin-top:8px}
  .h2-grid{stroke:rgba(255,255,255,.10)} .h2-cur{fill:none;stroke:#38bdf8;stroke-width:2.5}
  .h2-leg{stroke:#fbbf24;stroke-width:2;stroke-dasharray:4 3} .h2-dot{fill:#fde047}
`;

const SCENE = `
  var stage=document.querySelector("#h2-beaker .gk-stage")||document.querySelector(".gk-stage");
  var canvas=stage.querySelector("canvas");
  var S=GK.makeScene(canvas,{camera:[0,2.0,7.2],target:[0,1.0,0]});

  // beaker
  var beaker=GK.glass(THREE,1.35,1.2,2.2); beaker.position.y=1.1; S.scene.add(beaker);
  var bottom=new THREE.Mesh(new THREE.CircleGeometry(1.2,40),
    new THREE.MeshStandardMaterial({color:0xeaf6ff,transparent:true,opacity:0.18,side:THREE.DoubleSide}));
  bottom.rotation.x=-Math.PI/2; bottom.position.y=0; S.scene.add(bottom);
  var liq=GK.liquid(THREE,1.18,1.7,0x7fd4ff,0.5); liq.position.y=0.85; S.scene.add(liq);

  var molG=new THREE.Group(); molG.position.y=0.85; S.scene.add(molG);
  var mols=[];
  for(var i=0;i<16;i++){ var m=GK.molecule(THREE,GK.MOL.H2O2,0.30);
    m.position.set((Math.random()-0.5)*1.7,(Math.random()-0.5)*1.4,(Math.random()-0.5)*1.7); molG.add(m); mols.push(m); }
  var bub=GK.bubbles(THREE,S.scene,{x:0,z:0,yMin:0.2,yMax:2.0,r:0.06,color:0xcdefff,count:48,spread:1.7});

  // data (Bảng 19.1) + first-order model C(t)=exp(-k t)
  var K=0.11552; // halves every 6h, C(12)=0.25
  function Cof(t){return Math.exp(-K*t);}
  var TBL=[1.000,0.707,0.500,0.354,0.250];
  function fmt(n,d){return n.toFixed(d).replace(".",",");}

  // graph
  var svg=document.getElementById("h2-svg"); var L=30,R=228,TP=12,BT=120,W=R-L,H=BT-TP;
  function gx(t){return L+(t/12)*W;} function gy(c){return TP+(1-c)*H;}
  var g="";
  for(var t=0;t<=12;t+=3){g+='<line class="h2-grid" x1="'+gx(t)+'" y1="'+TP+'" x2="'+gx(t)+'" y2="'+BT+'"/>';}
  g+='<line class="h2-grid" x1="'+L+'" y1="'+BT+'" x2="'+R+'" y2="'+BT+'"/>';
  var d="M "+gx(0)+" "+gy(Cof(0));
  for(var tt=0.5;tt<=12.01;tt+=0.5){ d+=" L "+gx(tt)+" "+gy(Cof(tt)); }
  g+='<path class="h2-cur" d="'+d+'"/>';
  g+='<line id="h2-lh" class="h2-leg"/><line id="h2-lv" class="h2-leg"/><circle id="h2-pt" class="h2-dot" r="3.5"/>';
  g+='<text x="'+((L+R)/2)+'" y="138" fill="#9db4e6" font-size="9" text-anchor="middle">thời gian (h)</text>';
  svg.innerHTML=g;
  var lh=document.getElementById("h2-lh"),lv=document.getElementById("h2-lv"),pt=document.getElementById("h2-pt");

  var elT=document.getElementById("h2-t"),elC=document.getElementById("h2-c"),elV=document.getElementById("h2-v"),elInt=document.getElementById("h2-int");
  var time=0, targetRate=1;

  function setTime(t){
    time=Math.max(0,Math.min(12,t));
    var c=Cof(time);
    elT.textContent=Math.round(time); elC.textContent=fmt(c,3);
    targetRate=c; // first-order: rate ∝ C
    // graph window (3h containing t)
    var i0=Math.min(3,Math.floor(time/3)); var t1=i0*3,t2=t1+3, c1=TBL[i0],c2=TBL[i0+1];
    var v=-(c2-c1)/3;
    elV.textContent=fmt(v,3); elInt.textContent="Khoảng "+t1+"–"+t2+" h · ΔC = "+fmt(c2-c1,3)+" mol/L";
    lh.setAttribute("x1",gx(t1));lh.setAttribute("y1",gy(c1));lh.setAttribute("x2",gx(t2));lh.setAttribute("y2",gy(c1));
    lv.setAttribute("x1",gx(t2));lv.setAttribute("y1",gy(c1));lv.setAttribute("x2",gx(t2));lv.setAttribute("y2",gy(c2));
    pt.setAttribute("cx",gx(time));pt.setAttribute("cy",gy(c));
    // fewer molecules + shorter liquid as it decomposes
    liq.scale.y=0.5+0.5*c; liq.position.y=0.85*(0.5+0.5*c)+0.0;
    for(var k=0;k<mols.length;k++){ mols[k].visible = k < Math.round(c*mols.length); }
  }

  // drag the time knob
  var track=document.getElementById("h2-track"), knob=document.getElementById("h2-knob");
  function setFromX(clientX){ var r=track.getBoundingClientRect(); var f=(clientX-r.left)/r.width; f=Math.max(0,Math.min(1,f));
    knob.style.left=(f*100)+"%"; setTime(f*12); }
  var drag=false;
  knob.addEventListener("pointerdown",function(e){drag=true;knob.setPointerCapture(e.pointerId);});
  window.addEventListener("pointermove",function(e){ if(drag)setFromX(e.clientX); });
  window.addEventListener("pointerup",function(){drag=false;});
  track.addEventListener("pointerdown",function(e){ if(e.target===knob)return; setFromX(e.clientX); });

  setTime(0);
  S.start(function(dt){
    bub.update(dt,Math.max(0,targetRate));
    molG.rotation.y+=dt*0.3;
    for(var k=0;k<mols.length;k++){ mols[k].rotation.x+=dt*0.7; mols[k].rotation.y+=dt*0.5; }
  });
`;

export const H2O2_GRAPH_WIDGET = threeWidget({
  id: "h2-beaker",
  title: "Phân huỷ H₂O₂ — tốc độ giảm dần theo thời gian",
  subtitle: "Kéo nút thời gian: H₂O₂ tách thành H₂O + O₂, bọt O₂ nổi lên, đồ thị cho thấy độ dốc thoải dần.",
  css: CSS,
  body: BODY,
  sceneJs: SCENE,
});
