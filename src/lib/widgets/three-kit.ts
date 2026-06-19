/* Shared foundation for the 3D chemistry lab widgets.
 * Each widget is a self-contained HTML document (rendered in a sandboxed
 * iframe). They all load Three.js from a CDN and reuse the helpers below
 * (scene setup, glassware, ball-and-stick molecules, rising bubbles).
 *
 * Interaction is done with HTML overlays dragged over the 3D canvas (flame,
 * catalyst, time handle…) rather than 3D ray-picking — simpler and robust.
 * No backticks / ${} inside these strings: they are template literals. */

/* Loads THREE as a global, trying two CDNs; shows a friendly note if offline. */
const LOADER_JS = `
function gkLoadThree(cb){
  if(window.THREE){cb();return;}
  var urls=[
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    "https://unpkg.com/three@0.137.0/build/three.min.js"
  ];
  var i=0;
  function next(){
    if(i>=urls.length){gkFail();return;}
    var s=document.createElement("script");
    s.src=urls[i++];
    s.onload=function(){ window.THREE ? cb() : next(); };
    s.onerror=next;
    document.head.appendChild(s);
  }
  next();
}
function gkFail(){
  var el=document.querySelector(".gk-stage");
  if(el){el.innerHTML='<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#fca5a5;font-size:14px;text-align:center;padding:20px">Không tải được mô phỏng 3D.<br>Hãy kiểm tra kết nối mạng rồi mở lại.</div>';}
}`;

/* Reusable scene + chemistry helpers, exposed as window.GK. */
const KIT_JS = `
var GK = (function(){
  var ELEMENTS = {
    H:{color:0xeef2f7,r:0.30}, O:{color:0xff5a5a,r:0.48}, C:{color:0x404654,r:0.46},
    N:{color:0x5b8cff,r:0.46}, S:{color:0xf4d03f,r:0.58}, Cl:{color:0x7ee07a,r:0.55},
    Mg:{color:0x73c267,r:0.62}, Ca:{color:0x49b6b6,r:0.70}, Mn:{color:0xb06bd6,r:0.62}
  };
  function atom(THREE, r, color){
    var geo=new THREE.SphereGeometry(r,24,24);
    var mat=new THREE.MeshStandardMaterial({color:color,roughness:0.35,metalness:0.05,emissive:color,emissiveIntensity:0.12});
    return new THREE.Mesh(geo,mat);
  }
  function bond(THREE,a,b,r){
    var dir=new THREE.Vector3().subVectors(b,a); var len=dir.length();
    var m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,12),
      new THREE.MeshStandardMaterial({color:0xc4ccd6,roughness:0.5,metalness:0.1}));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());
    return m;
  }
  function molecule(THREE,spec,scale){
    scale=scale||1; var g=new THREE.Group();
    var pts=spec.atoms.map(function(a){return new THREE.Vector3(a[1]*scale,a[2]*scale,a[3]*scale);});
    (spec.bonds||[]).forEach(function(b){ g.add(bond(THREE,pts[b[0]],pts[b[1]],0.12*scale)); });
    spec.atoms.forEach(function(a,i){ var el=ELEMENTS[a[0]]||ELEMENTS.C; var s=atom(THREE,el.r*scale,el.color); s.position.copy(pts[i]); g.add(s); });
    g.userData.spin=(Math.random()-0.5)*0.02;
    return g;
  }
  // Common molecule shapes used across the lab.
  var MOL = {
    H2O2:{atoms:[["O",-0.7,0,0],["O",0.7,0,0],["H",-1.05,0.72,0.35],["H",1.05,-0.72,-0.35]],bonds:[[0,1],[0,2],[1,3]]},
    H2O:{atoms:[["O",0,0,0],["H",0.76,0.58,0],["H",-0.76,0.58,0]],bonds:[[0,1],[0,2]]},
    O2:{atoms:[["O",-0.6,0,0],["O",0.6,0,0]],bonds:[[0,1]]},
    CO2:{atoms:[["C",0,0,0],["O",-1.1,0,0],["O",1.1,0,0]],bonds:[[0,1],[0,2]]}
  };
  function glass(THREE,rTop,rBot,h){
    var m=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBot,h,40,1,true),
      new THREE.MeshStandardMaterial({color:0xeaf6ff,roughness:0.06,metalness:0.0,transparent:true,opacity:0.18,side:THREE.DoubleSide}));
    return m;
  }
  function liquid(THREE,r,h,color,opacity){
    return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,40),
      new THREE.MeshStandardMaterial({color:color,roughness:0.25,metalness:0.0,transparent:true,opacity:opacity==null?0.55:opacity}));
  }
  function makeScene(canvas, opts){
    opts=opts||{};
    var THREE=window.THREE;
    var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    var scene=new THREE.Scene();
    var camera=new THREE.PerspectiveCamera(42,1,0.1,100);
    var cp=opts.camera||[0,2.5,9]; camera.position.set(cp[0],cp[1],cp[2]);
    var tgt=opts.target||[0,0.4,0]; camera.lookAt(tgt[0],tgt[1],tgt[2]);
    scene.add(new THREE.HemisphereLight(0xffffff,0x33405a,0.95));
    var dir=new THREE.DirectionalLight(0xffffff,0.9); dir.position.set(4,8,6); scene.add(dir);
    var dir2=new THREE.DirectionalLight(0x88bbff,0.4); dir2.position.set(-5,3,-4); scene.add(dir2);
    var pivot=new THREE.Group(); scene.add(pivot);
    function resize(){
      var w=canvas.clientWidth||canvas.parentElement.clientWidth, h=canvas.clientHeight||360;
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
    }
    resize();
    if(typeof ResizeObserver!=="undefined"){ new ResizeObserver(resize).observe(canvas); }
    window.addEventListener("resize",resize);
    // Drag empty canvas to spin the pivot group (where rotatable content lives).
    var dragging=false,px=0;
    canvas.addEventListener("pointerdown",function(e){dragging=true;px=e.clientX;});
    window.addEventListener("pointermove",function(e){ if(!dragging)return; pivot.rotation.y+=(e.clientX-px)*0.01; px=e.clientX; });
    window.addEventListener("pointerup",function(){dragging=false;});
    function start(frame){
      var last=performance.now();
      function loop(now){ var dt=Math.min((now-last)/1000,0.05); last=now; if(frame)frame(dt,now/1000); renderer.render(scene,camera); requestAnimationFrame(loop); }
      requestAnimationFrame(loop);
    }
    return {THREE:THREE,scene:scene,camera:camera,renderer:renderer,pivot:pivot,start:start};
  }
  // A reusable column of rising bubbles between yMin..yMax around (x,z).
  function bubbles(THREE,parent,opts){
    opts=opts||{}; var n=opts.count||40, r=opts.r||0.08, x=opts.x||0, z=opts.z||0, spread=opts.spread||0.6;
    var yMin=opts.yMin||0, yMax=opts.yMax||2, color=opts.color==null?0xffffff:opts.color;
    var arr=[];
    var mat=new THREE.MeshStandardMaterial({color:color,roughness:0.1,metalness:0,transparent:true,opacity:0.55,emissive:color,emissiveIntensity:0.15});
    for(var i=0;i<n;i++){
      var b=new THREE.Mesh(new THREE.SphereGeometry(r*(0.6+Math.random()*0.8),10,10),mat);
      b.position.set(x+(Math.random()-0.5)*spread, yMin+Math.random()*(yMax-yMin), z+(Math.random()-0.5)*spread);
      b.userData.sp=0.4+Math.random()*0.7; b.visible=false; parent.add(b); arr.push(b);
    }
    return { update:function(dt,rate){
      // rate 0..1 controls how many bubbles are active and how fast.
      for(var i=0;i<arr.length;i++){ var b=arr[i]; var on=i< Math.round(rate*arr.length);
        b.visible=on; if(!on)continue;
        b.position.y+=b.userData.sp*dt*(0.6+rate*1.6);
        if(b.position.y>yMax){ b.position.y=yMin; b.position.x=x+(Math.random()-0.5)*spread; b.position.z=z+(Math.random()-0.5)*spread; }
      }
    }};
  }
  return {ELEMENTS:ELEMENTS,MOL:MOL,atom:atom,bond:bond,molecule:molecule,glass:glass,liquid:liquid,makeScene:makeScene,bubbles:bubbles};
})();`;

const BASE_CSS = `
  *{box-sizing:border-box}
  .gk-card{--ink:#e6eefb;color:var(--ink);padding:20px;border-radius:18px;font-family:inherit;
    background:radial-gradient(1000px 380px at 18% -15%,#243a6b 0%,transparent 60%),linear-gradient(150deg,#0b1426,#121a33);}
  .gk-card h2{margin:0 0 2px;font-size:18px;font-weight:800}
  .gk-card .gk-sub{margin:0 0 14px;font-size:13px;color:#9db4e6}
  .gk-stage{position:relative;width:100%;border-radius:16px;overflow:hidden;
    background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.10)}
  .gk-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
  .gk-ov{position:absolute;z-index:3}
  .gk-readout{background:rgba(8,14,28,.6);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px 12px;backdrop-filter:blur(6px)}
  .gk-readout .k{font-size:11px;color:#9db4e6}
  .gk-readout .v{font-size:22px;font-weight:800}
  .gk-pill{background:rgba(8,14,28,.55);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;backdrop-filter:blur(6px)}
  .gk-hint{font-size:12px;color:#9db4e6;margin-top:10px;line-height:1.5}
  .gk-hintbar{position:absolute;left:0;right:0;bottom:0;padding:8px 12px;text-align:center;font-size:12px;color:#bcd0f5;
    background:linear-gradient(0deg,rgba(6,10,22,.9),rgba(6,10,22,0));z-index:2;pointer-events:none}
  .gk-grab{cursor:grab;user-select:none;touch-action:none}
  .gk-grab:active{cursor:grabbing}
`;

export interface ThreeWidgetOpts {
  id: string;
  title: string;
  subtitle: string;
  /** HTML placed inside .gk-card (must include a .gk-stage > canvas). */
  body: string;
  /** Extra CSS scoped to this widget. */
  css?: string;
  /** JS body of start(THREE); GK + THREE are in scope. */
  sceneJs: string;
}

/** Compose a complete, self-contained 3D-lab widget HTML document. */
export function threeWidget(o: ThreeWidgetOpts): string {
  return (
    '<div id="' + o.id + '" class="gk-card">' +
    "<style>" + BASE_CSS + (o.css || "") + "</style>" +
    "<h2>" + o.title + "</h2><p class=\"gk-sub\">" + o.subtitle + "</p>" +
    o.body +
    "<script>" + LOADER_JS + KIT_JS +
    "function gkStart(THREE){" + o.sceneJs + "}" +
    "gkLoadThree(function(){ if(window.THREE) gkStart(window.THREE); });" +
    "</scr" + "ipt>" +
    "</div>"
  );
}
