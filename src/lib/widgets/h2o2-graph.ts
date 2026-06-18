/* Chặng 2 — "Giải mã đồ thị H2O2": kéo cửa sổ thời gian dọc đường cong phân huỷ
 * H2O2, hiện tam giác ΔC/Δt và tốc độ trung bình v cập nhật theo thời gian thực.
 * Số liệu lấy từ Bảng 19.1. 100% tiếng Việt. */
export const H2O2_GRAPH_WIDGET = `
<div id="h2-root">
  <style>
    #h2-root{--bg1:#0b1220;--bg2:#0e2740;color:#e2e8f0;padding:22px;border-radius:18px;
      background:radial-gradient(900px 360px at 85% -20%,#0e7490 0%,transparent 55%),linear-gradient(135deg,var(--bg1),var(--bg2))}
    #h2-root h2{margin:0 0 2px;font-size:18px;font-weight:800}
    #h2-root .sub{margin:0 0 14px;font-size:13px;color:#7dd3fc}
    .h2-wrap{display:flex;gap:18px;flex-wrap:wrap;align-items:stretch}
    .h2-card{flex:1 1 320px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);
      border-radius:16px;padding:12px;backdrop-filter:blur(8px)}
    .h2-side{flex:1 1 200px;display:flex;flex-direction:column;gap:10px;min-width:200px}
    svg{width:100%;height:auto;display:block;touch-action:none}
    .band{fill:rgba(34,211,238,.14);cursor:grab}
    .band:active{cursor:grabbing}
    .grid{stroke:rgba(255,255,255,.08)}
    .curve{fill:none;stroke:#38bdf8;stroke-width:3;filter:drop-shadow(0 2px 6px rgba(56,189,248,.5))}
    .area{fill:url(#h2grad)}
    .pt{fill:#0b1220;stroke:#38bdf8;stroke-width:2.5}
    .leg{stroke:#fbbf24;stroke-width:2.5;stroke-dasharray:5 4}
    .hyp{stroke:#f472b6;stroke-width:3}
    .lab{fill:#fde68a;font-size:11px;font-weight:700}
    .axlab{fill:#94a3b8;font-size:11px}
    .readout{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:14px}
    .readout .k{font-size:12px;color:#93c5fd}
    .vbig{font-size:34px;font-weight:800;color:#67e8f9;line-height:1.1;margin-top:2px}
    .vbig small{font-size:13px;color:#94a3b8;font-weight:600}
    .row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px dashed rgba(255,255,255,.12)}
    .row b{color:#e2e8f0}
    .presets{display:flex;gap:6px;flex-wrap:wrap}
    .pbtn{flex:1;min-width:56px;padding:8px 6px;border-radius:10px;border:1px solid rgba(255,255,255,.18);
      background:rgba(255,255,255,.05);color:#cbd5e1;font-size:12px;font-weight:700;cursor:pointer;transition:.15s}
    .pbtn:hover{background:rgba(56,189,248,.18);border-color:#38bdf8}
    .pbtn.on{background:#0891b2;border-color:#22d3ee;color:#fff}
    .hint{font-size:12px;color:#7dd3fc;margin-top:2px}
  </style>

  <h2>Tốc độ trung bình thay đổi thế nào?</h2>
  <p class="sub">Kéo dải xanh dọc theo đường cong (hoặc bấm khoảng thời gian) để xem độ dốc và tốc độ v.</p>

  <div class="h2-wrap">
    <div class="h2-card">
      <svg id="h2-svg" viewBox="0 0 560 340">
        <defs>
          <linearGradient id="h2grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="rgba(56,189,248,.35)"/>
            <stop offset="1" stop-color="rgba(56,189,248,0)"/>
          </linearGradient>
        </defs>
        <g id="h2-grid"></g>
        <rect id="h2-band" class="band" x="56" y="24" width="120" height="268" rx="6"></rect>
        <path id="h2-area" class="area"></path>
        <path id="h2-curve" class="curve"></path>
        <line id="h2-legh" class="leg"></line>
        <line id="h2-legv" class="leg"></line>
        <line id="h2-hyp" class="hyp"></line>
        <text id="h2-labdc" class="lab"></text>
        <text id="h2-labdt" class="lab"></text>
        <g id="h2-pts"></g>
        <text x="276" y="334" class="axlab" text-anchor="middle">Thời gian (giờ)</text>
        <text x="14" y="160" class="axlab" transform="rotate(-90 14 160)" text-anchor="middle">Nồng độ H2O2 (mol/L)</text>
      </svg>
    </div>

    <div class="h2-side">
      <div class="readout">
        <div class="k">Tốc độ trung bình</div>
        <div class="vbig"><span id="h2-v">0,098</span> <small>mol/(L·h)</small></div>
        <div class="row"><span>Khoảng thời gian</span><b id="h2-int">0 → 3 h</b></div>
        <div class="row"><span>ΔC</span><b id="h2-dc">-0,293 mol/L</b></div>
        <div class="row"><span>Δt</span><b id="h2-dt">3 h</b></div>
        <div class="hint" id="h2-msg">Độ dốc đang lớn nhất — phản ứng nhanh nhất lúc đầu.</div>
      </div>
      <div class="presets">
        <button class="pbtn on" data-s="0">0–3 h</button>
        <button class="pbtn" data-s="3">3–6 h</button>
        <button class="pbtn" data-s="6">6–9 h</button>
        <button class="pbtn" data-s="9">9–12 h</button>
      </div>
    </div>
  </div>

  <script>
    (function(){
      var T=[0,3,6,9,12], C=[1.000,0.707,0.500,0.354,0.250];
      var L=56,R=536,TP=24,BT=292,W=R-L,H=BT-TP;
      function x(t){return L+(t/12)*W;}
      function y(c){return TP+(1-c)*H;}
      var svg=document.getElementById('h2-svg');
      function el(id){return document.getElementById(id);}

      // grid + axis ticks
      var g='';
      for(var i=0;i<=12;i+=3){g+='<line class="grid" x1="'+x(i)+'" y1="'+TP+'" x2="'+x(i)+'" y2="'+BT+'"/>'+'<text class="axlab" x="'+x(i)+'" y="'+(BT+16)+'" text-anchor="middle">'+i+'</text>';}
      for(var c=0;c<=1.0001;c+=0.25){g+='<line class="grid" x1="'+L+'" y1="'+y(c)+'" x2="'+R+'" y2="'+y(c)+'"/>'+'<text class="axlab" x="'+(L-8)+'" y="'+(y(c)+4)+'" text-anchor="end">'+c.toFixed(2).replace('.',',')+'</text>';}
      el('h2-grid').innerHTML=g;

      // curve + area
      var d='M '+x(T[0])+' '+y(C[0]);
      for(var k=1;k<T.length;k++){d+=' L '+x(T[k])+' '+y(C[k]);}
      el('h2-curve').setAttribute('d',d);
      el('h2-area').setAttribute('d',d+' L '+x(12)+' '+BT+' L '+x(0)+' '+BT+' Z');
      var ph='';for(var p=0;p<T.length;p++){ph+='<circle class="pt" cx="'+x(T[p])+'" cy="'+y(C[p])+'" r="4.5"/>';}
      el('h2-pts').innerHTML=ph;

      var start=0;
      function fmt(n,dg){return n.toFixed(dg).replace('.',',');}

      function render(animate){
        var idx=start/3, t1=T[idx],t2=T[idx+1],c1=C[idx],c2=C[idx+1];
        var x1=x(t1),x2=x(t2),y1=y(c1),y2=y(c2);
        el('h2-band').setAttribute('x',x1);
        el('h2-band').setAttribute('width',x2-x1);
        el('h2-legh').setAttribute('x1',x1);el('h2-legh').setAttribute('y1',y1);el('h2-legh').setAttribute('x2',x2);el('h2-legh').setAttribute('y2',y1);
        el('h2-legv').setAttribute('x1',x2);el('h2-legv').setAttribute('y1',y1);el('h2-legv').setAttribute('x2',x2);el('h2-legv').setAttribute('y2',y2);
        el('h2-hyp').setAttribute('x1',x1);el('h2-hyp').setAttribute('y1',y1);el('h2-hyp').setAttribute('x2',x2);el('h2-hyp').setAttribute('y2',y2);
        el('h2-labdt').setAttribute('x',(x1+x2)/2);el('h2-labdt').setAttribute('y',y1-6);el('h2-labdt').setAttribute('text-anchor','middle');el('h2-labdt').textContent='Δt = 3 h';
        el('h2-labdc').setAttribute('x',x2+6);el('h2-labdc').setAttribute('y',(y1+y2)/2);el('h2-labdc').textContent='ΔC';
        var dc=c2-c1, v=-dc/(t2-t1);
        el('h2-int').textContent=t1+' → '+t2+' h';
        el('h2-dc').textContent=fmt(dc,3)+' mol/L';
        el('h2-dt').textContent='3 h';
        var msg=idx===0?'Độ dốc đang lớn nhất — phản ứng nhanh nhất lúc đầu.':(idx===3?'Đường cong thoải hẳn — phản ứng đã chậm lại nhiều.':'Độ dốc nhỏ dần — tốc độ đang giảm theo thời gian.');
        el('h2-msg').textContent=msg;
        document.querySelectorAll('.pbtn').forEach(function(b){b.classList.toggle('on',Number(b.dataset.s)===start);});
        countTo(v);
      }

      var shown=0.098, raf=null;
      function countTo(v){
        if(raf)cancelAnimationFrame(raf);
        var from=shown,to=v,t0=null;
        function step(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/350,1);shown=from+(to-from)*p;
          el('h2-v').textContent=fmt(shown,3);if(p<1)raf=requestAnimationFrame(step);}
        raf=requestAnimationFrame(step);
      }

      // preset buttons
      document.querySelectorAll('.pbtn').forEach(function(b){b.addEventListener('click',function(){start=Number(b.dataset.s);render(true);});});

      // drag band
      var band=el('h2-band'),dragging=false;
      function timeFromEvent(e){var r=svg.getBoundingClientRect();var px=( (e.touches?e.touches[0].clientX:e.clientX) - r.left)/r.width*560;var t=(px-L)/W*12;return t;}
      function snap(t){var s=Math.round((t-1.5)/3)*3;return Math.max(0,Math.min(9,s));}
      function down(e){dragging=true;e.preventDefault();}
      function move(e){if(!dragging)return;var ns=snap(timeFromEvent(e));if(ns!==start){start=ns;render(true);}}
      function up(){dragging=false;}
      band.addEventListener('mousedown',down);band.addEventListener('touchstart',down,{passive:false});
      svg.addEventListener('mousemove',move);svg.addEventListener('touchmove',move,{passive:false});
      window.addEventListener('mouseup',up);window.addEventListener('touchend',up);

      render(false);
    })();
  </script>
</div>`;
