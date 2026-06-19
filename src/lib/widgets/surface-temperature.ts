import { threeWidget } from "./three-kit";

/* Chặng 4 — Diện tích bề mặt & nhiệt độ.
 * Tab 1: hai bình tam giác HCl; thả CaCO3 viên vào bình A, kéo viên kia qua cối
 *        đập thành bột rồi thả vào bình B -> bình bột sủi CO2 và phồng bóng nhanh
 *        hơn. CaCO3 + 2HCl -> CaCl2 + CO2 + H2O.
 * Tab 2: ống nghiệm Mg + nước + phenolphthalein; kéo đèn cồn hơ nóng -> màu hồng
 *        lan nhanh, hiện hệ số nhiệt độ γ (×2/×4/×8). */

const BODY = `
<div class="gk-tabs">
  <button class="gk-tab on" data-p="surf">Diện tích bề mặt</button>
  <button class="gk-tab" data-p="temp">Nhiệt độ (Van't Hoff)</button>
</div>

<div class="gk-pane on" data-p="surf">
  <div class="gk-stage" style="height:430px">
    <canvas id="st-surf-cv"></canvas>
    <div class="gk-ov flasklab" style="left:14px;top:10px">Bình A · đá vôi <b>viên</b><div class="bar"><i id="st-coA"></i></div></div>
    <div class="gk-ov flasklab" style="right:14px;top:10px;text-align:right">Bình B · đá vôi <b>bột</b><div class="bar"><i id="st-coB"></i></div></div>
    <div class="gk-ov rock gk-grab" id="st-rockA" style="left:30%;bottom:58px"><span class="lump"></span><span class="tag">đá viên</span></div>
    <div class="gk-ov rock gk-grab" id="st-rockB" style="left:62%;bottom:58px"><span class="lump"></span><span class="tag">đá viên</span></div>
    <div class="gk-ov mortar" id="st-mortar"><span class="bowl"></span><span class="tag">cối đập</span></div>
  </div>
  <div class="gk-hint">Thả đá vào bình A. Kéo viên còn lại vào <b>cối</b> để đập thành bột rồi thả vào bình B, so sánh tốc độ sủi CO₂.</div>
</div>

<div class="gk-pane" data-p="temp">
  <div class="gk-stage" style="height:430px">
    <canvas id="st-temp-cv"></canvas>
    <div class="gk-ov read" style="right:14px;top:12px;width:150px;text-align:right">
      <div class="k">Nhiệt độ</div><div class="v"><span id="st-temp">20</span>°C</div>
      <div class="k" style="margin-top:6px">Tốc độ phản ứng</div><div class="v" style="color:#fda4af">×<span id="st-mult">1</span></div>
      <div class="sub">γ = 2 · mỗi +10°C nhân đôi</div>
    </div>
    <div class="gk-ov" id="st-flame" style="left:46%;bottom:14px" title="Kéo đèn cồn hơ dưới ống nghiệm">
      <div class="lamp2"><span class="fl"></span><span class="body"></span></div><div class="tag">đèn cồn</div>
    </div>
  </div>
  <div class="gk-hint">Kéo <b>đèn cồn</b> hơ dưới ống nghiệm: phân tử chạy nhanh hơn, màu hồng lan nhanh hơn.</div>
</div>`;

const CSS = `
  .gk-tabs{display:flex;gap:8px;margin-bottom:12px}
  .gk-tab{flex:1;padding:9px;border-radius:11px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#cbd5e1;font-weight:700;font-size:13px;cursor:pointer}
  .gk-tab.on{background:linear-gradient(135deg,#2563eb,#3b82f6);border-color:#60a5fa;color:#fff}
  .gk-pane{display:none}.gk-pane.on{display:block}
  .flasklab{z-index:4;font-size:12px;color:#cbd5e1}
  .flasklab .bar{width:130px;height:9px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:5px}
  .flasklab[style*="right"] .bar{margin-left:auto}
  .flasklab .bar>i{display:block;height:100%;width:0%;background:linear-gradient(90deg,#34d399,#22d3ee);border-radius:6px;transition:width .15s}
  .rock{z-index:5;text-align:center;cursor:grab;user-select:none;touch-action:none}
  .rock .lump{display:block;width:26px;height:22px;margin:0 auto;border-radius:48% 52% 55% 45%/55% 48% 52% 45%;background:radial-gradient(circle at 35% 30%,#e5e7eb,#9ca3af 60%,#6b7280)}
  .rock.powder .lump{border-radius:8px;background:repeating-radial-gradient(circle at 50% 50%,#e5e7eb,#cbd5e1 2px)}
  .rock .tag,.mortar .tag,.lamp2+ .tag{font-size:10px;color:#9db4e6;margin-top:2px;display:block}
  .mortar{left:50%;bottom:12px;transform:translateX(-50%);text-align:center;z-index:4}
  .mortar .bowl{display:block;width:64px;height:26px;margin:0 auto;border-radius:0 0 40px 40px;background:linear-gradient(#94a3b8,#475569);border-top:3px solid #cbd5e1}
  #st-flame{text-align:center;cursor:grab;user-select:none;touch-action:none;z-index:5}
  .lamp2{position:relative;width:32px;height:38px;margin:0 auto}
  .lamp2 .body{position:absolute;bottom:0;left:5px;width:22px;height:18px;border-radius:5px;background:linear-gradient(#cbd5e1,#94a3b8)}
  .lamp2 .fl{position:absolute;bottom:14px;left:11px;width:9px;height:20px;border-radius:50%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff,#fde047 40%,#fb923c 70%,#ef4444);animation:emfl2 .5s infinite alternate;transform-origin:bottom}
  @keyframes emfl2{from{transform:scaleY(.85)}to{transform:scaleY(1.1)}}
  .read .sub{font-size:10px;color:#9db4e6;margin-top:2px}
`;

const SCENE = `
  var root=document.getElementById("st-lab");
  // tabs
  root.querySelectorAll(".gk-tab").forEach(function(t){ t.addEventListener("click",function(){
    root.querySelectorAll(".gk-tab").forEach(function(x){x.classList.remove("on");}); t.classList.add("on");
    root.querySelectorAll(".gk-pane").forEach(function(p){p.classList.toggle("on",p.dataset.p===t.dataset.p);});
    setTimeout(function(){ window.dispatchEvent(new Event("resize")); },30);
  }); });

  function dragXY(el,onMove,onUp){ var ox=0,oy=0,sx=0,sy=0,d=false; var st=el.closest(".gk-stage");
    el.addEventListener("pointerdown",function(e){d=true;el.setPointerCapture(e.pointerId);var r=el.getBoundingClientRect(),sr=st.getBoundingClientRect();ox=r.left-sr.left;oy=r.top-sr.top;sx=e.clientX;sy=e.clientY;el.style.transform="none";});
    el.addEventListener("pointermove",function(e){ if(!d)return; el.style.left=(ox+e.clientX-sx)+"px"; el.style.top=(oy+e.clientY-sy)+"px"; el.style.bottom="auto"; if(onMove)onMove(e); });
    el.addEventListener("pointerup",function(e){ d=false; if(onUp)onUp(el,st); });
  }
  function ctr(el,st){var r=el.getBoundingClientRect(),sr=st.getBoundingClientRect();return {x:(r.left-sr.left)+r.width/2,y:(r.top-sr.top)+r.height/2,w:sr.width,h:sr.height};}

  // ---------- Tab 1: surface area ----------
  (function(){
    var canvas=document.getElementById("st-surf-cv");
    var S=GK.makeScene(canvas,{camera:[0,1.7,8],target:[0,1.0,0]});
    function flask(x){ var g=new THREE.Group(); g.position.x=x;
      var body=new THREE.Mesh(new THREE.CylinderGeometry(0.28,1.0,1.5,36,1,true),
        new THREE.MeshStandardMaterial({color:0xeaf6ff,roughness:0.06,transparent:true,opacity:0.18,side:THREE.DoubleSide}));
      body.position.y=0.85; g.add(body);
      var neck=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.5,24,1,true),
        new THREE.MeshStandardMaterial({color:0xeaf6ff,roughness:0.06,transparent:true,opacity:0.18,side:THREE.DoubleSide}));
      neck.position.y=1.75; g.add(neck);
      var liq=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.9,0.8,36),new THREE.MeshStandardMaterial({color:0xfff3b0,roughness:0.3,transparent:true,opacity:0.5}));
      liq.position.y=0.55; g.add(liq);
      var balloon=new THREE.Mesh(new THREE.SphereGeometry(0.32,24,24),new THREE.MeshStandardMaterial({color:0xff8fb0,roughness:0.4,transparent:true,opacity:0.85}));
      balloon.position.y=2.1; balloon.scale.set(0.2,0.2,0.2); g.add(balloon);
      S.scene.add(g);
      return {group:g,balloon:balloon,liq:liq};
    }
    var fa=flask(-1.7), fb=flask(1.7);
    var bubA=GK.bubbles(THREE,S.scene,{x:-1.7,z:0,yMin:0.2,yMax:1.4,r:0.05,color:0xffffff,count:30,spread:0.7});
    var bubB=GK.bubbles(THREE,S.scene,{x:1.7,z:0,yMin:0.2,yMax:1.4,r:0.05,color:0xffffff,count:30,spread:0.7});
    var coA=0,coB=0,rateA=0,rateB=0;
    var barA=document.getElementById("st-coA"),barB=document.getElementById("st-coB");

    function dropZone(el,st){ var c=ctr(el,st);
      // mortar?
      var mc=ctr(document.getElementById("st-mortar"),st);
      if(Math.abs(c.x-mc.x)<70 && Math.abs(c.y-mc.y)<60){ el.classList.add("powder"); el.querySelector(".tag").textContent="đá bột"; el.dataset.pow="1";
        el.style.left=(mc.x-13)+"px"; el.style.top=(mc.y-30)+"px"; el.style.bottom="auto"; return; }
      // flask A (left) or B (right)
      if(c.x<c.w*0.5 && c.y<c.h*0.62){ rateA=el.dataset.pow==="1"?1.0:0.32; el.style.display="none"; }
      else if(c.x>=c.w*0.5 && c.y<c.h*0.62){ rateB=el.dataset.pow==="1"?1.0:0.32; el.style.display="none"; }
    }
    dragXY(document.getElementById("st-rockA"),null,dropZone);
    dragXY(document.getElementById("st-rockB"),null,dropZone);

    S.start(function(dt){
      if(rateA>0)coA=Math.min(1,coA+dt*0.12*rateA*2); if(rateB>0)coB=Math.min(1,coB+dt*0.12*rateB*2);
      barA.style.width=(coA*100)+"%"; barB.style.width=(coB*100)+"%";
      bubA.update(dt,rateA*(1-coA*0.4)); bubB.update(dt,rateB*(1-coB*0.4));
      fa.balloon.scale.setScalar(0.2+coA*1.1); fa.balloon.position.y=2.1+coA*0.3;
      fb.balloon.scale.setScalar(0.2+coB*1.1); fb.balloon.position.y=2.1+coB*0.3;
    });
  })();

  // ---------- Tab 2: temperature ----------
  (function(){
    var canvas=document.getElementById("st-temp-cv");
    var S=GK.makeScene(canvas,{camera:[0,1.6,6.5],target:[0,1.0,0]});
    var glass=GK.glass(THREE,0.5,0.5,2.6); glass.position.y=1.3; S.scene.add(glass);
    var bottom=new THREE.Mesh(new THREE.SphereGeometry(0.5,24,24,0,Math.PI*2,Math.PI/2,Math.PI/2),
      new THREE.MeshStandardMaterial({color:0xeaf6ff,transparent:true,opacity:0.18,side:THREE.DoubleSide})); S.scene.add(bottom);
    var liqMat=new THREE.MeshStandardMaterial({color:0xdfefff,roughness:0.25,transparent:true,opacity:0.55});
    var liq=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,1.7,36),liqMat); liq.position.y=0.85; S.scene.add(liq);
    var mg=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.7,0.12),new THREE.MeshStandardMaterial({color:0xbfc6d0,metalness:0.5,roughness:0.4}));
    mg.position.y=0.5; S.scene.add(mg);
    var molG=new THREE.Group(); molG.position.y=0.9; S.scene.add(molG);
    for(var i=0;i<8;i++){ var m=GK.molecule(THREE,GK.MOL.H2O,0.26); m.position.set((Math.random()-0.5)*0.6,(Math.random()-0.5)*1.3,(Math.random()-0.5)*0.6); m.userData.v=new THREE.Vector3((Math.random()-0.5),(Math.random()-0.5),(Math.random()-0.5)); molG.add(m); }
    var bub=GK.bubbles(THREE,S.scene,{x:0,z:0,yMin:0.2,yMax:1.9,r:0.05,color:0xffffff,count:20,spread:0.5});

    var heat=0,pink=0;
    var flame=document.getElementById("st-flame");
    var under=false;
    dragXY(flame,function(){ var c=ctr(flame,flame.closest(".gk-stage")); under=Math.abs(c.x-c.w*0.5)<c.w*0.22 && c.y>c.h*0.5; });
    var elT=document.getElementById("st-temp"),elM=document.getElementById("st-mult");

    S.start(function(dt){
      if(under)heat=Math.min(1,heat+dt*0.25); else heat=Math.max(0,heat-dt*0.1);
      var temp=20+heat*40; var mult=Math.pow(2,(temp-20)/10);
      elT.textContent=Math.round(temp); elM.textContent=(Math.round(mult*10)/10);
      pink=Math.min(1,pink+dt*0.05*mult*(under?1:0.15));
      liqMat.color.setRGB(0.87+0.13*(1-pink), 0.94-0.5*pink, 1.0-0.45*pink);
      var speed=0.4+mult*0.25;
      molG.children.forEach(function(m){ var v=m.userData.v; m.position.addScaledVector(v,dt*speed);
        if(m.position.length()>1.0){ v.multiplyScalar(-1); } m.rotation.x+=dt*speed; });
      bub.update(dt,under?Math.min(1,mult*0.12):0);
    });
  })();
`;

export const SURFACE_TEMP_WIDGET = threeWidget({
  id: "st-lab",
  title: "Diện tích bề mặt & nhiệt độ",
  subtitle: "Đá vôi dạng bột phản ứng nhanh hơn dạng viên; và mỗi khi tăng 10°C tốc độ lại nhân đôi.",
  css: CSS,
  body: BODY,
  sceneJs: SCENE,
});
