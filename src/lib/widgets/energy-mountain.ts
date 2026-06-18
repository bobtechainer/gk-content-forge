/* Chặng 5 — "Năng lượng hoạt hoá & xúc tác": giữ nút để nạp năng lượng (nhiệt độ)
 * đẩy hòn đá (chất phản ứng) vượt qua đỉnh núi Ea. Thêm xúc tác MnO2 => mở một
 * đường đi mới có Ea thấp hơn, vượt qua dễ dàng. 100% tiếng Việt. */
export const ENERGY_MOUNTAIN_WIDGET = `
<div id="em-root">
  <style>
    #em-root{--bg1:#07101c;--bg2:#0c2233;color:#e2e8f0;padding:22px;border-radius:18px;
      background:radial-gradient(900px 360px at 80% -20%,#0f766e 0%,transparent 55%),linear-gradient(135deg,var(--bg1),var(--bg2))}
    #em-root h2{margin:0 0 2px;font-size:18px;font-weight:800}
    #em-root .sub{margin:0 0 14px;font-size:13px;color:#5eead4}
    .em-wrap{display:flex;gap:18px;flex-wrap:wrap}
    .em-stage{flex:1 1 340px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);
      border-radius:16px;padding:10px;backdrop-filter:blur(8px)}
    svg{width:100%;height:auto;display:block}
    .em-side{flex:1 1 220px;min-width:220px;display:flex;flex-direction:column;gap:12px}
    .meterbox{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:14px}
    .meterbox .k{font-size:12px;color:#5eead4;margin-bottom:8px}
    .meter{height:16px;border-radius:9px;background:rgba(255,255,255,.1);position:relative;overflow:visible}
    .meter>i{display:block;height:100%;width:0%;border-radius:9px;background:linear-gradient(90deg,#fb923c,#ef4444);transition:width .05s}
    .marker{position:absolute;top:-6px;bottom:-6px;width:3px;background:#fde047;box-shadow:0 0 8px #fde047;transition:left .4s}
    .marker::after{content:"Ea";position:absolute;top:-16px;left:-6px;font-size:10px;color:#fde047;font-weight:800}
    .pushbtn{padding:14px;border-radius:12px;border:1px solid rgba(251,146,60,.5);background:linear-gradient(135deg,rgba(251,146,60,.25),rgba(239,68,68,.2));
      color:#fed7aa;font-weight:800;font-size:14px;cursor:pointer;user-select:none;transition:.12s}
    .pushbtn:active{transform:scale(.97)}
    .catbtn{padding:12px;border-radius:12px;border:1px solid rgba(45,212,191,.4);background:rgba(45,212,191,.12);
      color:#99f6e4;font-weight:700;font-size:13px;cursor:pointer;transition:.15s}
    .catbtn.on{background:linear-gradient(135deg,#0d9488,#14b8a6);border-color:#5eead4;color:#042f2e}
    .msg{font-size:13px;font-weight:600;text-align:center;padding:8px;border-radius:10px;min-height:20px;transition:.3s}
    .msg.ok{background:rgba(52,211,153,.16);color:#a7f3d0}
    .msg.no{background:rgba(248,113,113,.16);color:#fecaca}
    .hint{font-size:12px;color:#5eead4;line-height:1.5}
  </style>

  <h2>Vượt núi năng lượng hoạt hoá</h2>
  <p class="sub">Giữ nút <b>Đẩy</b> để nạp năng lượng. Đủ cao thì hòn đá vượt đỉnh và phản ứng xảy ra.</p>

  <div class="em-wrap">
    <div class="em-stage">
      <svg id="em-svg" viewBox="0 0 560 300">
        <defs>
          <linearGradient id="emhill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="rgba(94,234,212,.25)"/><stop offset="1" stop-color="rgba(94,234,212,.02)"/>
          </linearGradient>
        </defs>
        <path id="em-hill0" fill="none" stroke="rgba(148,163,184,.4)" stroke-width="2.5" stroke-dasharray="6 5"></path>
        <path id="em-fill" fill="url(#emhill)"></path>
        <path id="em-hill" fill="none" stroke="#5eead4" stroke-width="3.5" stroke-linecap="round"></path>
        <text id="em-lbR" x="44" y="0" fill="#93c5fd" font-size="11" font-weight="700">Chất đầu</text>
        <text id="em-lbP" x="470" y="0" fill="#fca5a5" font-size="11" font-weight="700">Sản phẩm</text>
        <circle id="em-rock" r="14" fill="#f59e0b" stroke="#fff7ed" stroke-width="2"/>
      </svg>
    </div>

    <div class="em-side">
      <div class="meterbox">
        <div class="k">Năng lượng nạp vào (nhiệt độ)</div>
        <div class="meter"><i id="em-fillbar"></i><div class="marker" id="em-marker" style="left:96%"></div></div>
      </div>
      <button class="pushbtn" id="em-push">⬆ Giữ để ĐẨY</button>
      <button class="catbtn" id="em-cat">➕ Thêm xúc tác MnO₂</button>
      <div class="msg" id="em-msg"></div>
      <div class="hint" id="em-hint">Không có xúc tác, ngưỡng Ea rất cao — phải nạp gần đầy mới qua được.</div>
    </div>
  </div>

  <script>
    (function(){
      var svg=document.getElementById('em-svg');
      var X0=40,X1=520,YB=262,SCALE=205;
      function xPx(x){return X0+x*(X1-X0);}
      function yPx(E){return YB-E*SCALE;}
      var Er=0.16,Ep=0.05,pL=0.18,pR=0.82;
      function energy(x,peak){
        if(x<=pL)return Er;
        if(x>=pR)return Ep;
        var t=(x-pL)/(pR-pL);
        return (Er+(Ep-Er)*t)+peak*Math.sin(Math.PI*t);
      }
      function peakMax(peak){var m=0;for(var x=0;x<=1.0001;x+=0.01){m=Math.max(m,energy(x,peak));}return m;}
      var PEAK_HI=0.80,PEAK_LO=0.30;
      var EmaxHi=peakMax(PEAK_HI),EmaxLo=peakMax(PEAK_LO);

      function pathFor(peak){var d='';for(var x=0;x<=1.0001;x+=0.02){d+=(d?' L ':'M ')+xPx(x).toFixed(1)+' '+yPx(energy(x,peak)).toFixed(1);}return d;}
      document.getElementById('em-hill0').setAttribute('d',pathFor(PEAK_HI));
      document.getElementById('em-lbR').setAttribute('y',yPx(Er)+24);
      document.getElementById('em-lbP').setAttribute('y',yPx(Ep)+24);

      var catalyst=false;
      function activePeak(){return catalyst?PEAK_LO:PEAK_HI;}
      function activeEmax(){return catalyst?EmaxLo:EmaxHi;}

      function drawHill(){
        var d=pathFor(activePeak());
        document.getElementById('em-hill').setAttribute('d',d);
        document.getElementById('em-fill').setAttribute('d',d+' L '+xPx(1)+' '+YB+' L '+xPx(0)+' '+YB+' Z');
        // Ea marker on meter = required / EmaxHi
        document.getElementById('em-marker').style.left=(activeEmax()/EmaxHi*100)+'%';
        placeRock(0);
      }
      function placeRock(x){var r=document.getElementById('em-rock');r.setAttribute('cx',xPx(x));r.setAttribute('cy',yPx(energy(x,activePeak()))-14);}

      // charging
      var charging=false,level=0,raf=null,busy=false;
      var pushBtn=document.getElementById('em-push'),fillbar=document.getElementById('em-fillbar'),msg=document.getElementById('em-msg');
      function tick(){if(charging&&!busy){level=Math.min(1,level+0.012);fillbar.style.width=(level*100)+'%';}raf=requestAnimationFrame(tick);}
      tick();
      function startCharge(e){if(busy)return;e.preventDefault();charging=true;level=0;msg.className='msg';msg.textContent='';}
      function endCharge(){if(!charging||busy)return;charging=false;evaluate();}
      pushBtn.addEventListener('mousedown',startCharge);pushBtn.addEventListener('touchstart',startCharge,{passive:false});
      window.addEventListener('mouseup',endCharge);window.addEventListener('touchend',endCharge);

      function evaluate(){
        var reached=level*EmaxHi; // năng lượng nạp (so theo thang đỉnh cao)
        var required=activeEmax();
        busy=true;
        if(reached>=required){ animateCross(true); }
        else{
          // tìm x dừng (lúc đi lên) nơi energy = reached
          var xs=0.5;for(var x=pL;x<=0.5;x+=0.005){if(energy(x,activePeak())>=reached){xs=x;break;}}
          animateStall(xs);
        }
      }
      function animateCross(){
        var t0=null,dur=1100;
        function f(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1);placeRock(p);
          if(p<1)requestAnimationFrame(f);else{msg.className='msg ok';msg.textContent='Phản ứng xảy ra! Hòn đá đã sang thung lũng sản phẩm.';glow();busy=false;}}
        requestAnimationFrame(f);
      }
      function animateStall(xs){
        var t0=null,dur=700;
        function up(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1);placeRock(xs*p);
          if(p<1)requestAnimationFrame(up);else back(xs);}
        requestAnimationFrame(up);
        function back(from){var s=null;function d(ts){if(!s)s=ts;var p=Math.min((ts-s)/600,1);placeRock(from*(1-p));
          if(p<1)requestAnimationFrame(d);else{msg.className='msg no';msg.textContent='Chưa đủ năng lượng — hòn đá lăn trở lại.';busy=false;}}requestAnimationFrame(d);}
      }
      function glow(){var r=document.getElementById('em-rock');r.setAttribute('fill','#34d399');setTimeout(function(){r.setAttribute('fill','#f59e0b');},900);}

      document.getElementById('em-cat').addEventListener('click',function(){
        catalyst=!catalyst;this.classList.toggle('on',catalyst);
        this.textContent=catalyst?'✓ Đang dùng xúc tác MnO₂':'➕ Thêm xúc tác MnO₂';
        document.getElementById('em-hint').textContent=catalyst
          ?'Xúc tác mở một con đường mới có Ea thấp hơn hẳn — chỉ cần nạp ít năng lượng là vượt qua. Xúc tác không bị tiêu hao.'
          :'Không có xúc tác, ngưỡng Ea rất cao — phải nạp gần đầy mới qua được.';
        msg.className='msg';msg.textContent='';level=0;fillbar.style.width='0%';
        drawHill();
      });

      drawHill();
    })();
  </script>
</div>`;
