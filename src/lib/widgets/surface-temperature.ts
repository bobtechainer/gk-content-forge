/* Chặng 4 — "Diện tích bề mặt & Van't Hoff". Hai tab:
 *  1) Chẻ khối đá vôi => tổng diện tích bề mặt tăng theo bội số.
 *  2) Nhiệt kế: tăng 10°C => tốc độ nhân lên theo hệ số gamma (cấp số nhân).
 * 100% tiếng Việt, nhiều animation. */
export const SURFACE_TEMP_WIDGET = `
<div id="st-root">
  <style>
    #st-root{--bg1:#0f1117;--bg2:#221a0f;color:#f1f5f9;padding:22px;border-radius:18px;
      background:radial-gradient(800px 320px at 90% -20%,#b45309 0%,transparent 55%),linear-gradient(135deg,var(--bg1),var(--bg2))}
    #st-root h2{margin:0 0 2px;font-size:18px;font-weight:800}
    #st-root .sub{margin:0 0 14px;font-size:13px;color:#fcd34d}
    .tabs{display:flex;gap:8px;margin-bottom:16px}
    .tab{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);
      color:#cbd5e1;font-weight:700;font-size:13px;cursor:pointer;transition:.18s}
    .tab.on{background:linear-gradient(135deg,#d97706,#f59e0b);border-color:#fbbf24;color:#1c1917}
    .pane{display:none}.pane.on{display:block;animation:fade .35s}
    @keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .panel{display:flex;gap:18px;flex-wrap:wrap;align-items:center}
    .stage{flex:1 1 300px;min-height:230px;display:flex;align-items:center;justify-content:center;
      background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
    .side{flex:1 1 220px;min-width:220px;display:flex;flex-direction:column;gap:12px}
    .read{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:14px}
    .read .k{font-size:12px;color:#fcd34d}
    .big{font-size:30px;font-weight:800;color:#fde68a;margin-top:2px}
    .btn{padding:11px 14px;border-radius:12px;border:1px solid rgba(251,191,36,.4);background:rgba(251,191,36,.12);
      color:#fde68a;font-weight:700;font-size:13px;cursor:pointer;transition:.15s}
    .btn:hover{background:rgba(251,191,36,.25)}
    .btn:disabled{opacity:.4;cursor:not-allowed}
    .cubes{display:grid;gap:6px;transition:gap .4s}
    .cube{animation:popin .35s backwards}
    @keyframes popin{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
    .hint{font-size:12px;color:#fcd34d;line-height:1.5}
    /* thermometer */
    .thermo{display:flex;gap:18px;align-items:flex-end}
    .tube{width:34px;height:180px;border-radius:18px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.2);
      position:relative;overflow:hidden}
    .merc{position:absolute;left:0;right:0;bottom:0;border-radius:0 0 16px 16px;
      background:linear-gradient(0deg,#ef4444,#f59e0b);transition:height .5s cubic-bezier(.3,1.2,.4,1)}
    .bulb{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#f59e0b);position:absolute;bottom:-12px;left:-8px;box-shadow:0 0 18px rgba(239,68,68,.6)}
    .bars{flex:1;display:flex;align-items:flex-end;gap:8px;height:180px}
    .bcol{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
    .bcol>i{width:100%;border-radius:7px 7px 0 0;background:linear-gradient(0deg,#f59e0b,#fbbf24);transition:height .5s cubic-bezier(.3,1.2,.4,1)}
    .bcol>span{font-size:10px;color:#cbd5e1;margin-top:4px}
    .bcol.cur>i{background:linear-gradient(0deg,#ef4444,#fca5a5);box-shadow:0 0 14px rgba(239,68,68,.6)}
  </style>

  <h2>Bề mặt và nhiệt độ</h2>
  <p class="sub">Hai cách tăng tốc quen thuộc: chia nhỏ chất rắn và tăng nhiệt độ.</p>

  <div class="tabs">
    <button class="tab on" data-p="surf">Diện tích bề mặt</button>
    <button class="tab" data-p="temp">Nhiệt độ (Van't Hoff)</button>
  </div>

  <div class="pane on" id="pane-surf">
    <div class="panel">
      <div class="stage"><div class="cubes" id="st-cubes"></div></div>
      <div class="side">
        <div class="read">
          <div class="k">Tổng diện tích bề mặt</div>
          <div class="big"><span id="st-area">6</span> <small style="font-size:13px;color:#cbd5e1">đơn vị a²</small></div>
          <div class="k" style="margin-top:6px">Số mảnh: <b id="st-cnt" style="color:#fde68a">1</b> · Gấp <b id="st-ratio" style="color:#fde68a">1×</b> lúc đầu</div>
        </div>
        <button class="btn" id="st-chop">Chẻ nhỏ hơn ✂️</button>
        <button class="btn" id="st-reset" style="border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#cbd5e1">Khối ban đầu</button>
        <div class="hint">Cùng một viên đá vôi: chẻ càng nhỏ thì tổng bề mặt tiếp xúc càng lớn, HCl tấn công được nhiều chỗ hơn nên phản ứng nhanh hơn.</div>
      </div>
    </div>
  </div>

  <div class="pane" id="pane-temp">
    <div class="panel">
      <div class="stage">
        <div class="thermo">
          <div class="tube"><div class="merc" id="st-merc" style="height:20%"></div><div class="bulb"></div></div>
          <div class="bars" id="st-bars"></div>
        </div>
      </div>
      <div class="side">
        <div class="read">
          <div class="k">Nhiệt độ</div>
          <div class="big"><span id="st-temp">20</span> <small style="font-size:14px">°C</small></div>
          <div class="k" style="margin-top:6px">Tốc độ phản ứng: <b id="st-mult" style="color:#fde68a">×1</b> (hệ số γ = 2)</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" id="st-cool" style="flex:1">−10 °C</button>
          <button class="btn" id="st-heat" style="flex:1">+10 °C</button>
        </div>
        <div class="hint">Mỗi khi tăng 10 °C, tốc độ không cộng thêm mà nhân lên γ lần. Vì thế tốc độ bùng nổ theo cấp số nhân: ×2, ×4, ×8…</div>
      </div>
    </div>
  </div>

  <script>
    (function(){
      // tabs
      document.querySelectorAll('.tab').forEach(function(t){t.addEventListener('click',function(){
        document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('on');});t.classList.add('on');
        document.querySelectorAll('.pane').forEach(function(p){p.classList.remove('on');});
        document.getElementById('pane-'+t.dataset.p).classList.add('on');
      });});

      // ---- surface ----
      var k=1,grid=document.getElementById('st-cubes');
      function miniCube(size){
        var s=size,t=s*0.5;
        return '<svg width="'+s+'" height="'+(s*1.15)+'" viewBox="0 0 100 116">'
          +'<polygon points="50,2 96,28 50,54 4,28" fill="#fcd34d"/>'
          +'<polygon points="4,28 50,54 50,112 4,86" fill="#d97706"/>'
          +'<polygon points="96,28 50,54 50,112 96,86" fill="#b45309"/></svg>';
      }
      function renderCubes(){
        grid.style.gridTemplateColumns='repeat('+k+',1fr)';
        grid.style.gap=(k>1?Math.max(3,10-k)+'px':'0');
        var n=k*k,cell=Math.max(26,Math.min(120, (k===1?120:150)/k));
        var html='';
        for(var i=0;i<n;i++){html+='<div class="cube" style="animation-delay:'+(i*0.02)+'s">'+miniCube(cell)+'</div>';}
        grid.innerHTML=html;
        document.getElementById('st-area').textContent=(6*k);
        document.getElementById('st-cnt').textContent=(k*k*k);
        document.getElementById('st-ratio').textContent=k+'×';
        document.getElementById('st-chop').disabled=k>=4;
      }
      document.getElementById('st-chop').addEventListener('click',function(){if(k<4){k++;renderCubes();}});
      document.getElementById('st-reset').addEventListener('click',function(){k=1;renderCubes();});
      renderCubes();

      // ---- temperature ----
      var temp=20,gamma=2,steps=[20,30,40,50,60];
      var bars=document.getElementById('st-bars');
      function mult(T){return Math.pow(gamma,(T-20)/10);}
      function renderTemp(){
        document.getElementById('st-temp').textContent=temp;
        var m=mult(temp);
        document.getElementById('st-mult').textContent='×'+m;
        var maxM=mult(60);
        var html='';
        steps.forEach(function(T){var mm=mult(T);var h=Math.round(mm/maxM*100);
          html+='<div class="bcol'+(T===temp?' cur':'')+'"><i style="height:'+h+'%"></i><span>'+T+'°</span></div>';});
        bars.innerHTML=html;
        document.getElementById('st-merc').style.height=(10+(temp-20)/40*80)+'%';
        document.getElementById('st-cool').disabled=temp<=20;
        document.getElementById('st-heat').disabled=temp>=60;
      }
      document.getElementById('st-heat').addEventListener('click',function(){if(temp<60){temp+=10;renderTemp();}});
      document.getElementById('st-cool').addEventListener('click',function(){if(temp>20){temp-=10;renderTemp();}});
      renderTemp();
    })();
  </script>
</div>`;
