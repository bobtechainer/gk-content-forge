/* Chặng 1 — Khái niệm tốc độ phản ứng. Kéo-thả từng dụng cụ (đốt Mg, viên sủi,
 * hũ lên men, đinh sắt gỉ, thạch nhũ) vào đúng nấc thời gian trên trục.
 * Đặt đúng thì phản ứng "chạy". HTML/CSS/JS thuần. */
export const TIMELINE_SORT_WIDGET = `
<div id="tl-root">
  <style>
    #tl-root{--ink:#e6eefb;color:var(--ink);padding:20px;border-radius:18px;font-family:inherit;
      background:radial-gradient(1000px 360px at 80% -15%,#3a2f6b 0%,transparent 60%),linear-gradient(150deg,#0c1126,#181433)}
    #tl-root h2{margin:0 0 2px;font-size:18px;font-weight:800}
    #tl-root .sub{margin:0 0 14px;font-size:13px;color:#b7a6ee}
    .tray{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:18px;min-height:88px}
    .vessel{width:84px;cursor:grab;user-select:none;transition:transform .18s,filter .18s;will-change:transform}
    .vessel:hover{transform:translateY(-4px) scale(1.04);filter:drop-shadow(0 8px 18px rgba(124,99,230,.4))}
    .vessel.dragging{opacity:.4}.vessel.placed{cursor:default}
    .vessel.shake{animation:shk .45s}
    @keyframes shk{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
    .vessel .art{height:64px;display:flex;align-items:flex-end;justify-content:center}
    .vessel .name{font-size:10.5px;text-align:center;color:#cbd5e1;margin-top:4px;line-height:1.2}
    .scene{perspective:1000px}
    .shelf{transform:rotateX(16deg);transform-style:preserve-3d;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;
      padding:14px 10px 8px;border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.12)}
    .slot{position:relative;min-height:120px;border-radius:12px;border:1.5px dashed rgba(255,255,255,.16);
      background:rgba(255,255,255,.03);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:8px;transition:.2s}
    .slot.over{border-color:#a78bfa;background:rgba(167,139,250,.14);transform:translateZ(14px)}
    .slot.correct{border-style:solid;border-color:#34d399;background:rgba(52,211,153,.12)}
    .slot .lab{font-size:11px;font-weight:700;color:#c7b8f5;margin-top:6px;text-align:center}
    .slot.correct .lab{color:#6ee7b7}
    .done{margin-top:14px;padding:12px 14px;border-radius:12px;font-size:13px;font-weight:600;text-align:center;
      background:linear-gradient(135deg,rgba(52,211,153,.18),rgba(124,99,230,.16));border:1px solid rgba(52,211,153,.4);color:#d1fae5;opacity:0;transition:.4s}
    .done.show{opacity:1}
    /* glassware + reactions */
    .tube{width:24px;height:54px;border:2px solid rgba(226,232,240,.55);border-top:none;border-radius:0 0 12px 12px;position:relative;overflow:hidden;background:rgba(255,255,255,.05)}
    .tube .liq{position:absolute;left:0;right:0;bottom:0;height:60%;background:linear-gradient(#9fd8ff,#5fb4ef)}
    .beaker{width:40px;height:46px;border:2px solid rgba(226,232,240,.55);border-top:none;border-radius:0 0 9px 9px;position:relative;overflow:hidden;background:rgba(255,255,255,.05)}
    .beaker .liq{position:absolute;left:0;right:0;bottom:0;height:62%}
    .bub{position:absolute;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.85);bottom:6px;opacity:0}
    .mg{position:relative;width:34px;height:50px}
    .mg .strip{position:absolute;left:14px;bottom:0;width:5px;height:46px;background:linear-gradient(#cfd6e0,#9aa3b0);border-radius:2px}
    .nail{position:absolute;left:9px;bottom:4px;width:5px;height:42px;background:linear-gradient(#b9c0cc,#7c8492);border-radius:2px}
    .rust{position:absolute;left:9px;bottom:4px;width:5px;height:0;background:linear-gradient(#b45309,#f59e0b);border-radius:2px;transition:height 2.6s ease}
    .stal{position:relative;width:40px;height:54px}
    .stal .rock{position:absolute;top:0;left:0;right:0;height:14px;background:linear-gradient(#6b7280,#4b5563);border-radius:6px 6px 40% 40%}
    .stal .icicle{position:absolute;top:12px;left:50%;width:6px;height:26px;transform:translateX(-50%);background:linear-gradient(#9ca3af,#d1d5db);clip-path:polygon(0 0,100% 0,50% 100%)}
    .stal .drop{position:absolute;top:36px;left:50%;width:5px;height:5px;border-radius:50%;background:#bfe9ff;transform:translateX(-50%);opacity:0}
    .placed .flash{position:absolute;inset:-6px;border-radius:50%;background:radial-gradient(circle,#fff,rgba(255,255,255,0) 70%);opacity:0}
    .run .flash{animation:flash 1.2s infinite}
    @keyframes flash{0%,100%{opacity:0}45%{opacity:.95}}
    .run.r-fast .bub{animation:rise .9s linear infinite}
    .run.r-mid .bub{animation:rise 1.8s linear infinite}
    .run.r-slow .bub{animation:rise 3.2s linear infinite}
    @keyframes rise{0%{transform:translateY(0);opacity:0}20%{opacity:.9}100%{transform:translateY(-38px);opacity:0}}
    .run .rust{height:38px}
    .run .drop{animation:drip 3.4s linear infinite}
    @keyframes drip{0%,70%{transform:translate(-50%,0);opacity:0}80%{opacity:1}100%{transform:translate(-50%,18px);opacity:0}}
  </style>

  <h2>Phản ứng nhanh hay chậm?</h2>
  <p class="sub">Kéo từng dụng cụ vào đúng nấc thời gian trên trục. Đặt đúng vị trí thì phản ứng sẽ bắt đầu chạy.</p>

  <div class="tray" id="tl-tray"></div>
  <div class="scene"><div class="shelf" id="tl-shelf"></div></div>
  <div class="done" id="tl-done">Cùng là phản ứng hoá học, nhưng thời gian diễn ra chênh nhau từ vài giây đến hàng nghìn năm. Sự nhanh chậm đó chính là tốc độ phản ứng.</div>

  <script>
    (function(){
      var ZONES=[{id:"giay",lab:"Vài giây"},{id:"gio",lab:"Vài giờ"},{id:"ngay",lab:"Vài ngày"},{id:"nam",lab:"Vài tháng – năm"},{id:"ky",lab:"Hàng thế kỉ"}];
      var ART={
        mg:'<div class="mg"><span class="flash"></span><span class="strip"></span></div>',
        sui:'<div class="beaker"><span class="liq" style="background:linear-gradient(#bbf7d0,#86efac)"></span><span class="bub" style="left:10px"></span><span class="bub" style="left:20px;animation-delay:.4s"></span><span class="bub" style="left:28px;animation-delay:.8s"></span></div>',
        lenmen:'<div class="beaker"><span class="liq" style="background:linear-gradient(#fde68a,#fbbf24)"></span><span class="bub" style="left:12px"></span><span class="bub" style="left:24px;animation-delay:1s"></span></div>',
        gi:'<div class="tube"><span class="liq" style="opacity:.5"></span><span class="nail"></span><span class="rust"></span></div>',
        stal:'<div class="stal"><span class="rock"></span><span class="icicle"></span><span class="drop"></span></div>'
      };
      var ITEMS=[
        {id:"mg",name:"Đốt băng Mg",zone:"giay",art:ART.mg,run:"r-fast"},
        {id:"sui",name:"Viên sủi tan",zone:"gio",art:ART.sui,run:"r-mid"},
        {id:"lenmen",name:"Hũ lên men dưa",zone:"ngay",art:ART.lenmen,run:"r-slow"},
        {id:"gi",name:"Đinh sắt bị gỉ",zone:"nam",art:ART.gi,run:""},
        {id:"stal",name:"Thạch nhũ nhỏ giọt",zone:"ky",art:ART.stal,run:""}
      ];
      var tray=document.getElementById("tl-tray"),shelf=document.getElementById("tl-shelf"),done=document.getElementById("tl-done");
      var dragId=null,placed=0;
      ZONES.forEach(function(z){ var slot=document.createElement("div"); slot.className="slot"; slot.dataset.zone=z.id;
        slot.innerHTML='<div class="lab">'+z.lab+'</div>';
        slot.addEventListener("dragover",function(e){e.preventDefault();slot.classList.add("over");});
        slot.addEventListener("dragleave",function(){slot.classList.remove("over");});
        slot.addEventListener("drop",function(e){e.preventDefault();slot.classList.remove("over");drop(z.id,slot);});
        shelf.appendChild(slot); });
      function shuffle(a){for(var i=a.length-1;i>0;i--){var j=(Math.random()*(i+1))|0;var t=a[i];a[i]=a[j];a[j]=t;}return a;}
      shuffle(ITEMS.slice()).forEach(function(it){ var v=document.createElement("div"); v.className="vessel"; v.draggable=true; v.dataset.id=it.id;
        v.innerHTML='<div class="art">'+it.art+'</div><div class="name">'+it.name+'</div>';
        v.addEventListener("dragstart",function(){dragId=it.id;v.classList.add("dragging");});
        v.addEventListener("dragend",function(){v.classList.remove("dragging");});
        tray.appendChild(v); });
      function drop(zoneId,slot){ if(!dragId)return; var it=ITEMS.filter(function(x){return x.id===dragId;})[0];
        var v=tray.querySelector('[data-id="'+dragId+'"]'); if(!it||!v)return;
        if(it.zone===zoneId){ v.classList.add("placed","run"); if(it.run)v.classList.add(it.run); v.draggable=false;
          slot.insertBefore(v,slot.firstChild); slot.classList.add("correct"); placed++; if(placed===ITEMS.length)done.classList.add("show"); }
        else { v.classList.add("shake"); setTimeout(function(){v.classList.remove("shake");},470); }
        dragId=null;
      }
    })();
  </script>
</div>`;
