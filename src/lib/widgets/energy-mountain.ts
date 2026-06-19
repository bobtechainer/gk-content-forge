import { threeWidget } from "./three-kit";

/* Chặng 5 — Năng lượng hoạt hoá & xúc tác.
 * Hai ống nghiệm H2O2. Kéo đèn cồn hơ dưới ống A để nạp năng lượng tới ngưỡng
 * Ea thì mới sủi O2. Kéo thìa MnO2 thả vào ống B -> sủi ngay mà không cần đun
 * (xúc tác hạ Ea). 2H2O2 -> 2H2O + O2. */

const BODY = `
<div class="gk-stage" style="height:460px">
  <canvas></canvas>

  <div class="gk-ov tubelab" style="left:12px;top:12px;width:184px">
    <div class="k">Ống A — đun nóng</div>
    <div class="meter"><i id="em-heat"></i><span class="mk" id="em-mk"></span></div>
    <div class="st" id="em-stA">Chưa đủ năng lượng để phản ứng</div>
  </div>
  <div class="gk-ov tubelab" style="right:12px;top:12px;width:184px;text-align:right">
    <div class="k">Ống B — thêm xúc tác</div>
    <div class="st" id="em-stB">Chưa cho xúc tác MnO₂</div>
    <div class="eq">2H₂O₂ → 2H₂O + O₂</div>
  </div>

  <div class="gk-ov" id="em-flame" style="left:50%;bottom:14px;transform:translateX(-115px)" title="Kéo đèn cồn hơ dưới ống A">
    <div class="lamp"><span class="fl"></span><span class="body"></span></div>
    <div class="tag">đèn cồn</div>
  </div>
  <div class="gk-ov" id="em-spatula" style="left:50%;bottom:14px;transform:translateX(35px)" title="Kéo thìa MnO₂ thả vào ống B">
    <div class="spoon"><span class="powder"></span></div>
    <div class="tag">thìa MnO₂</div>
  </div>

  <div class="gk-hintbar">Kéo <b>đèn cồn</b> hơ dưới <b>ống A</b>, và thả <b>thìa MnO₂</b> vào <b>ống B</b> để so sánh.</div>
</div>`;

const CSS = `
  .tubelab{z-index:4}
  .tubelab .k{font-size:11px;color:#9db4e6;font-weight:700;margin-bottom:5px}
  .tubelab .meter{position:relative;height:12px;border-radius:7px;background:rgba(255,255,255,.12);overflow:visible}
  .tubelab .meter>i{display:block;height:100%;width:0%;border-radius:7px;background:linear-gradient(90deg,#fb923c,#ef4444);transition:width .1s}
  .tubelab .meter .mk{position:absolute;top:-5px;bottom:-5px;left:100%;width:2px;background:#fde047;box-shadow:0 0 7px #fde047}
  .tubelab .st{font-size:12px;font-weight:600;margin-top:6px;color:#cbd5e1}
  .tubelab .st.go{color:#6ee7b7}
  .tubelab .eq{font-size:11px;color:#7dd3fc;margin-top:4px}
  #em-flame,#em-spatula{text-align:center;cursor:grab;user-select:none;touch-action:none}
  #em-flame:active,#em-spatula:active{cursor:grabbing}
  .lamp{position:relative;width:34px;height:40px;margin:0 auto}
  .lamp .body{position:absolute;bottom:0;left:5px;width:24px;height:20px;border-radius:5px 5px 7px 7px;background:linear-gradient(#cbd5e1,#94a3b8)}
  .lamp .fl{position:absolute;bottom:16px;left:12px;width:10px;height:22px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
    background:radial-gradient(circle at 50% 70%,#fff,#fde047 40%,#fb923c 70%,#ef4444);filter:blur(.3px);animation:emfl .5s infinite alternate;transform-origin:bottom}
  @keyframes emfl{from{transform:scaleY(.86) scaleX(1.05)}to{transform:scaleY(1.08) scaleX(.92)}}
  .spoon{width:40px;height:16px;margin:0 auto;border-radius:0 0 12px 12px;background:linear-gradient(#cbd5e1,#8593a8);position:relative}
  .spoon .powder{position:absolute;left:8px;top:2px;width:24px;height:8px;border-radius:6px;background:radial-gradient(circle,#3b3b46,#111118)}
  .tag{font-size:10px;color:#9db4e6;margin-top:2px}
`;

const SCENE = `
  var stage=document.querySelector("#em-energy .gk-stage")||document.querySelector(".gk-stage");
  var canvas=stage.querySelector("canvas");
  var S=GK.makeScene(canvas,{camera:[0,1.7,7.6],target:[0,1.1,0]});

  function buildTube(x,liquidColor){
    var g=new THREE.Group(); g.position.x=x;
    var glass=GK.glass(THREE,0.55,0.55,2.6); glass.position.y=1.3; g.add(glass);
    var bottom=new THREE.Mesh(new THREE.SphereGeometry(0.55,24,24,0,Math.PI*2,Math.PI/2,Math.PI/2),
      new THREE.MeshStandardMaterial({color:0xeaf6ff,roughness:0.06,transparent:true,opacity:0.18,side:THREE.DoubleSide}));
    bottom.position.y=0.0; g.add(bottom);
    var liq=GK.liquid(THREE,0.5,1.5,liquidColor,0.5); liq.position.y=0.75; g.add(liq);
    var molG=new THREE.Group(); molG.position.y=0.75;
    for(var i=0;i<4;i++){ var m=GK.molecule(THREE,GK.MOL.H2O2,0.34);
      m.position.set((Math.random()-0.5)*0.5,(Math.random()-0.5)*1.1,(Math.random()-0.5)*0.5); molG.add(m); }
    g.add(molG);
    S.scene.add(g);
    return {group:g,molG:molG,liq:liq};
  }
  var tubeA=buildTube(-1.75,0x9fd8ff), tubeB=buildTube(1.75,0x9fd8ff);
  var bubA=GK.bubbles(THREE,S.scene,{x:-1.75,z:0,yMin:0.2,yMax:2.3,r:0.07,color:0xcdefff,count:34,spread:0.55});
  var bubB=GK.bubbles(THREE,S.scene,{x:1.75,z:0,yMin:0.2,yMax:2.3,r:0.07,color:0xcdefff,count:34,spread:0.55});

  // glow puck under heated tube
  var glow=new THREE.Mesh(new THREE.CircleGeometry(0.7,32),
    new THREE.MeshBasicMaterial({color:0xff7a3c,transparent:true,opacity:0}));
  glow.rotation.x=-Math.PI/2; glow.position.set(-1.75,0.02,0); S.scene.add(glow);

  // ---- state ----
  var heat=0, reactA=false, catalyst=false;
  var elHeat=document.getElementById("em-heat"), elMk=document.getElementById("em-mk");
  var stA=document.getElementById("em-stA"), stB=document.getElementById("em-stB");
  elMk.style.left="100%"; // Ea threshold without catalyst

  // ---- drag helpers (HTML overlays) ----
  function rectOf(el){return el.getBoundingClientRect();}
  function makeDrag(el,onMove,onUp){
    var ox=0,oy=0,sx=0,sy=0,drag=false;
    el.addEventListener("pointerdown",function(e){drag=true;el.setPointerCapture(e.pointerId);
      var r=rectOf(el),sr=rectOf(stage); ox=r.left-sr.left; oy=r.top-sr.top; sx=e.clientX; sy=e.clientY; el.style.transform="none";});
    el.addEventListener("pointermove",function(e){ if(!drag)return; var nx=ox+(e.clientX-sx), ny=oy+(e.clientY-sy);
      el.style.left=nx+"px"; el.style.top=ny+"px"; el.style.bottom="auto"; if(onMove)onMove(nx,ny); });
    el.addEventListener("pointerup",function(e){ drag=false; if(onUp)onUp(); });
  }
  function centerX(el){var r=rectOf(el),sr=rectOf(stage);return (r.left-sr.left)+r.width/2;}
  function centerY(el){var r=rectOf(el),sr=rectOf(stage);return (r.top-sr.top)+r.height/2;}

  var flame=document.getElementById("em-flame"), spat=document.getElementById("em-spatula");
  var underA=false;
  makeDrag(flame,function(){ var w=stage.clientWidth,h=stage.clientHeight;
    underA = centerX(flame)< w*0.5 && centerY(flame) > h*0.55; });
  makeDrag(spat,function(){}, function(){ var w=stage.clientWidth,h=stage.clientHeight;
    if(!catalyst && centerX(spat)>w*0.5 && centerY(spat)<h*0.55){ catalyst=true;
      spat.querySelector(".powder").style.opacity="0"; stB.textContent="Đã cho MnO₂ — sủi O₂ ngay!"; stB.className="st go";
      // drop a MnO2 speck into tube B
      var mn=GK.atom(THREE,0.22,0xb06bd6); mn.position.set(1.75,1.2,0); S.scene.add(mn);
      var fall=setInterval(function(){ mn.position.y-=0.08; if(mn.position.y<0.5)clearInterval(fall); },30);
    }
  });

  S.start(function(dt){
    // heating
    if(underA){ heat=Math.min(1,heat+dt*0.28); } else { heat=Math.max(0,heat-dt*0.12); }
    elHeat.style.width=(heat*100)+"%";
    glow.material.opacity=underA?0.5+0.2*Math.sin(performance.now()/120):Math.max(0,glow.material.opacity-dt);
    reactA = heat>=1;
    if(reactA){ stA.textContent="Đủ Ea — phản ứng xảy ra, sủi O₂"; stA.className="st go"; }
    else { stA.textContent="Chưa đủ năng lượng để phản ứng"; stA.className="st"; }
    var rateA=reactA?0.9:(underA?0.06:0);
    var rateB=catalyst?1.0:0;
    bubA.update(dt,rateA); bubB.update(dt,rateB);
    tubeA.molG.rotation.y+=dt*0.6; tubeB.molG.rotation.y+=dt*0.6;
    tubeA.molG.children.forEach(function(m){m.rotation.x+=dt*0.8;});
    tubeB.molG.children.forEach(function(m){m.rotation.x+=dt*0.8;});
    // shrink B liquid slightly while reacting (being consumed) — visual cue
    if(catalyst && tubeB.liq.scale.y>0.7){ tubeB.liq.scale.y-=dt*0.03; }
    if(reactA && tubeA.liq.scale.y>0.7){ tubeA.liq.scale.y-=dt*0.03; }
  });
`;

export const ENERGY_MOUNTAIN_WIDGET = threeWidget({
  id: "em-energy",
  title: "Năng lượng hoạt hoá & chất xúc tác",
  subtitle: "Ống A cần đun tới ngưỡng Eₐ mới phản ứng. Ống B chỉ cần thả xúc tác MnO₂ là sủi O₂ ngay.",
  css: CSS,
  body: BODY,
  sceneJs: SCENE,
});
