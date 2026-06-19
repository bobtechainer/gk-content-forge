import { threeWidget } from "./three-kit";

/* Chặng 3 — Ảnh hưởng của nồng độ đến tốc độ phản ứng.
 * Thí nghiệm "vạch X": cốc Na2S2O3 đặt trên tấm bìa có chữ X.
 * Rót H2SO4 vào, S kết tủa làm đục dung dịch, chữ X mờ dần rồi biến mất.
 * Nồng độ Na2S2O3 càng cao thì chữ X biến mất càng nhanh.
 * Na2S2O3 + H2SO4 -> Na2SO4 + S↓ + SO2 + H2O. */

const BODY = `
<div class="gk-stage" style="height:440px">
  <canvas></canvas>

  <div class="gk-ov read" style="left:12px;top:12px;width:172px">
    <div class="k">Nồng độ Na₂S₂O₃</div>
    <input id="cb-conc" type="range" min="30" max="100" value="65" class="cb-range">
    <div class="k" style="margin-top:8px">Va chạm hiệu quả</div>
    <div class="v" style="color:#f0abfc"><span id="cb-rate">0</span><small> /s</small></div>
  </div>

  <div class="gk-ov read" style="right:12px;top:12px;width:160px;text-align:right">
    <div class="k">Thời gian X biến mất</div>
    <div class="v"><span id="cb-time">0,0</span> s</div>
    <div class="st" id="cb-st">Chưa rót axit</div>
  </div>

  <div class="gk-ov" id="cb-drop" style="left:50%;bottom:14px;transform:translateX(-20px)" title="Kéo ống nhỏ giọt rót H₂SO₄ vào cốc">
    <div class="dropper"><span class="bulb"></span><span class="tube"></span><span class="bead"></span></div>
    <div class="tag">H₂SO₄</div>
  </div>
  <button id="cb-reset" class="gk-pill" style="position:absolute;left:12px;bottom:16px;z-index:4;cursor:pointer">Làm lại</button>
</div>
<div class="gk-hint">Điều chỉnh nồng độ Na₂S₂O₃ rồi <b>kéo ống nhỏ giọt H₂SO₄ thả vào cốc</b>. Nồng độ càng cao thì lưu huỳnh kết tủa nhanh hơn, chữ X biến mất sớm hơn.</div>`;

const CSS = `
  .cb-range{width:100%;accent-color:#a78bfa;margin-top:4px}
  .read .st{font-size:12px;font-weight:600;color:#cbd5e1;margin-top:4px}
  .read .st.go{color:#6ee7b7}
  #cb-drop{text-align:center;cursor:grab;user-select:none;touch-action:none;z-index:4}
  #cb-drop:active{cursor:grabbing}
  .dropper{position:relative;width:22px;height:52px;margin:0 auto}
  .dropper .bulb{position:absolute;top:0;left:3px;width:16px;height:18px;border-radius:50% 50% 45% 45%;background:linear-gradient(#fca5a5,#ef4444)}
  .dropper .tube{position:absolute;top:16px;left:9px;width:4px;height:30px;background:linear-gradient(#e2e8f0,#94a3b8)}
  .dropper .bead{position:absolute;top:44px;left:7px;width:8px;height:8px;border-radius:50%;background:#fde047;box-shadow:0 0 6px #fde047}
  .tag{font-size:10px;color:#9db4e6;margin-top:2px}
`;

const SCENE = `
  var stage=document.querySelector("#cb-x .gk-stage")||document.querySelector(".gk-stage");
  var canvas=stage.querySelector("canvas");
  var S=GK.makeScene(canvas,{camera:[0,1.8,7.4],target:[0,0.9,0]});

  // X card behind the beaker (CanvasTexture)
  var cx=document.createElement("canvas"); cx.width=256; cx.height=256; var c2=cx.getContext("2d");
  c2.fillStyle="#fdf6e3"; c2.fillRect(0,0,256,256);
  c2.strokeStyle="#1f2937"; c2.lineWidth=26; c2.lineCap="round";
  c2.beginPath(); c2.moveTo(54,54); c2.lineTo(202,202); c2.moveTo(202,54); c2.lineTo(54,202); c2.stroke();
  var tex=new THREE.CanvasTexture(cx);
  var card=new THREE.Mesh(new THREE.PlaneGeometry(2.0,2.0),new THREE.MeshBasicMaterial({map:tex}));
  card.position.set(0,0.05,-0.05); card.rotation.x=-Math.PI/2; S.scene.add(card);

  // beaker + clouding liquid
  var beaker=GK.glass(THREE,1.25,1.1,2.0); beaker.position.y=1.0; S.scene.add(beaker);
  var liqMat=new THREE.MeshStandardMaterial({color:0x86d4ff,transparent:true,opacity:0.16,roughness:0.3});
  var liq=new THREE.Mesh(new THREE.CylinderGeometry(1.06,1.0,1.5,40),liqMat); liq.position.y=0.78; S.scene.add(liq);

  // particles (thiosulfate) inside the liquid
  var pGroup=new THREE.Group(); pGroup.position.y=0.78; S.scene.add(pGroup);
  var parts=[];
  function buildParticles(n){
    while(parts.length<n){ var m=GK.atom(THREE,0.07,0xfff0a6);
      m.userData={vx:(Math.random()-0.5)*0.9,vy:(Math.random()-0.5)*0.9,vz:(Math.random()-0.5)*0.9};
      m.position.set((Math.random()-0.5)*1.6,(Math.random()-0.5)*1.2,(Math.random()-0.5)*1.6); pGroup.add(m); parts.push(m); }
    for(var i=0;i<parts.length;i++){ parts[i].visible=i<n; }
  }

  var conc=0.65, reacting=false, cloud=0, timer=0, doneT=null, collide=0, rateShown=0;
  var elRate=document.getElementById("cb-rate"),elTime=document.getElementById("cb-time"),elSt=document.getElementById("cb-st");
  var concEl=document.getElementById("cb-conc");
  concEl.addEventListener("input",function(){ conc=Number(concEl.value)/100; });

  // dropper drag -> pour acid when released over the beaker
  var drop=document.getElementById("cb-drop");
  (function(){ var ox=0,oy=0,sx=0,sy=0,d=false;
    drop.addEventListener("pointerdown",function(e){d=true;drop.setPointerCapture(e.pointerId);
      var r=drop.getBoundingClientRect(),sr=stage.getBoundingClientRect();ox=r.left-sr.left;oy=r.top-sr.top;sx=e.clientX;sy=e.clientY;drop.style.transform="none";});
    drop.addEventListener("pointermove",function(e){ if(!d)return; drop.style.left=(ox+e.clientX-sx)+"px"; drop.style.top=(oy+e.clientY-sy)+"px"; drop.style.bottom="auto"; });
    drop.addEventListener("pointerup",function(){ d=false; var r=drop.getBoundingClientRect(),sr=stage.getBoundingClientRect();
      var px=(r.left-sr.left)+r.width/2, py=(r.top-sr.top)+r.height/2, w=stage.clientWidth,h=stage.clientHeight;
      if(!reacting && Math.abs(px-w/2)<w*0.28 && py<h*0.6){ reacting=true; elSt.textContent="Đang phản ứng — S kết tủa…"; }
    });
  })();

  document.getElementById("cb-reset").addEventListener("click",function(){ reacting=false;cloud=0;timer=0;doneT=null;elSt.textContent="Chưa rót axit";elSt.className="st";elTime.textContent="0,0"; });

  buildParticles(Math.round(conc*36));
  S.start(function(dt){
    var n=Math.round(conc*36); buildParticles(n);
    // move particles + count collisions
    collide=0;
    for(var i=0;i<n;i++){ var p=parts[i],u=p.userData; p.position.x+=u.vx*dt; p.position.y+=u.vy*dt; p.position.z+=u.vz*dt;
      var rad=Math.sqrt(p.position.x*p.position.x+p.position.z*p.position.z);
      if(rad>1.0){ u.vx*=-1; u.vz*=-1; } if(Math.abs(p.position.y)>0.7){ u.vy*=-1; }
    }
    for(var a=0;a<n;a++)for(var b=a+1;b<n;b++){ var pa=parts[a],pb=parts[b];
      var dx=pa.position.x-pb.position.x,dy=pa.position.y-pb.position.y,dz=pa.position.z-pb.position.z;
      if(dx*dx+dy*dy+dz*dz<0.05){ collide++; } }
    var rate=Math.round(collide*conc*6);
    rateShown+=(rate-rateShown)*0.2; elRate.textContent=Math.round(rateShown);

    if(reacting && cloud<1){ cloud=Math.min(1,cloud+dt*(0.12+conc*0.5)); timer+=dt;
      if(cloud>=0.85 && doneT==null){ doneT=timer; elSt.textContent="Chữ X đã biến mất!"; elSt.className="st go"; } }
    if(doneT==null){ elTime.textContent=timer.toFixed(1).replace(".",","); }
    // cloudiness: liquid opacity up, colour to milky sulfur-yellow
    liqMat.opacity=0.16+cloud*0.8;
    liqMat.color.setRGB(0.52+0.4*cloud, 0.83+0.05*cloud, 1.0-0.55*cloud);
    pGroup.rotation.y+=dt*0.2;
  });
`;

export const COLLISION_BOX_WIDGET = threeWidget({
  id: "cb-x",
  title: "Ảnh hưởng của nồng độ đến tốc độ phản ứng",
  subtitle: "Thí nghiệm vạch X: thay đổi nồng độ Na₂S₂O₃ rồi rót H₂SO₄ vào. Nồng độ càng cao, S kết tủa càng nhanh, chữ X biến mất sớm hơn.",
  css: CSS,
  body: BODY,
  sceneJs: SCENE,
});
