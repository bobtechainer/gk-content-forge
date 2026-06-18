/* Chặng 1 — "Cảm nhận thời gian": kéo-thả các hiện tượng vào đúng nấc thời gian.
 * HTML tự chứa, nhúng qua block "html". 100% tiếng Việt. */
export const TIMELINE_SORT_WIDGET = `
<div id="tl-root">
  <style>
    #tl-root{--bg1:#0f172a;--bg2:#1e1b4b;--glass:rgba(255,255,255,.08);--line:rgba(255,255,255,.16);
      background:radial-gradient(1200px 400px at 20% -10%,#3730a3 0%,transparent 60%),linear-gradient(135deg,var(--bg1),var(--bg2));
      color:#e2e8f0;padding:22px;border-radius:18px;overflow:hidden}
    #tl-root *{font-family:inherit}
    #tl-root h2{margin:0 0 2px;font-size:18px;font-weight:800;letter-spacing:.2px}
    #tl-root .sub{margin:0 0 16px;font-size:13px;color:#a5b4fc}
    .tray{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px;min-height:54px}
    .chip{cursor:grab;user-select:none;padding:10px 14px;border-radius:14px;font-size:13px;font-weight:600;
      background:var(--glass);border:1px solid var(--line);backdrop-filter:blur(8px);
      box-shadow:0 4px 16px rgba(0,0,0,.25);transition:transform .18s,box-shadow .18s,opacity .2s;display:flex;align-items:center;gap:8px}
    .chip .ico{font-size:18px}
    .chip:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 10px 24px rgba(99,102,241,.35)}
    .chip.dragging{opacity:.35}
    .chip.placed{cursor:default}
    .chip.shake{animation:shake .45s}
    @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
    .axis{position:relative;display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
    .axis::before{content:"";position:absolute;left:0;right:0;top:18px;height:3px;border-radius:3px;
      background:linear-gradient(90deg,#22d3ee,#818cf8,#f472b6)}
    .zone{position:relative;padding-top:34px}
    .dot{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;
      background:#0f172a;border:3px solid #818cf8;box-shadow:0 0 0 4px rgba(129,140,248,.18)}
    .slot{min-height:96px;border-radius:14px;border:1.5px dashed var(--line);background:rgba(255,255,255,.04);
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px;text-align:center;transition:.2s}
    .slot .lab{font-size:12px;font-weight:700;color:#c7d2fe}
    .slot.over{border-color:#22d3ee;background:rgba(34,211,238,.12);transform:scale(1.03)}
    .slot.correct{border-style:solid;border-color:#34d399;background:rgba(52,211,153,.14);animation:pop .4s}
    @keyframes pop{0%{transform:scale(.85)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
    .slot.correct .lab{color:#6ee7b7}
    .done{margin-top:16px;padding:14px 16px;border-radius:14px;font-size:14px;font-weight:600;text-align:center;
      background:linear-gradient(135deg,rgba(52,211,153,.2),rgba(34,211,238,.16));border:1px solid rgba(52,211,153,.4);
      color:#d1fae5;opacity:0;transform:translateY(8px);transition:.4s}
    .done.show{opacity:1;transform:none}
    .spark{position:absolute;width:8px;height:8px;border-radius:2px;pointer-events:none}
  </style>

  <h2>Sắp xếp theo tốc độ</h2>
  <p class="sub">Kéo mỗi hiện tượng vào nấc thời gian mà phản ứng của nó thường diễn ra. Sai thì thẻ sẽ bật về chỗ cũ.</p>

  <div class="tray" id="tl-tray"></div>

  <div class="axis" id="tl-axis"></div>

  <div class="done" id="tl-done">Tuyệt vời! Cùng một phản ứng hoá học nhưng thời gian diễn ra chênh nhau hàng tỉ lần — đó chính là tốc độ phản ứng.</div>

  <script>
    (function(){
      var root=document.getElementById('tl-root');
      var ZONES=[
        {id:'giay',lab:'Vài giây'},
        {id:'gio',lab:'Vài giờ'},
        {id:'ngay',lab:'Vài ngày'},
        {id:'nam',lab:'Vài tháng – năm'},
        {id:'theky',lab:'Hàng thế kỉ'}
      ];
      var ITEMS=[
        {id:'phaohoa',ico:'\\uD83C\\uDF86',name:'Đốt pháo hoa',zone:'giay'},
        {id:'tieuhoa',ico:'\\uD83C\\uDF5C',name:'Tiêu hoá thức ăn',zone:'gio'},
        {id:'muoidua',ico:'\\uD83E\\uDD52',name:'Muối dưa (lên men)',zone:'ngay'},
        {id:'satgi',ico:'\\uD83D\\uDD29',name:'Sắt bị gỉ',zone:'nam'},
        {id:'thachnhu',ico:'\\uD83D\\uDD7D',name:'Tạo thạch nhũ',zone:'theky'}
      ];
      var axis=document.getElementById('tl-axis');
      var tray=document.getElementById('tl-tray');
      var done=document.getElementById('tl-done');
      var placed=0;
      var dragId=null;

      ZONES.forEach(function(z){
        var col=document.createElement('div');col.className='zone';
        col.innerHTML='<div class="dot"></div>';
        var slot=document.createElement('div');slot.className='slot';slot.dataset.zone=z.id;
        slot.innerHTML='<div class="lab">'+z.lab+'</div>';
        slot.addEventListener('dragover',function(e){e.preventDefault();slot.classList.add('over');});
        slot.addEventListener('dragleave',function(){slot.classList.remove('over');});
        slot.addEventListener('drop',function(e){e.preventDefault();slot.classList.remove('over');drop(z.id,slot);});
        col.appendChild(slot);axis.appendChild(col);
      });

      function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

      shuffle(ITEMS.slice()).forEach(function(it){
        var c=document.createElement('div');c.className='chip';c.draggable=true;c.dataset.id=it.id;
        c.innerHTML='<span class="ico">'+it.ico+'</span>'+it.name;
        c.addEventListener('dragstart',function(){dragId=it.id;c.classList.add('dragging');});
        c.addEventListener('dragend',function(){c.classList.remove('dragging');});
        tray.appendChild(c);
      });

      function drop(zoneId,slot){
        if(!dragId)return;
        var it=ITEMS.filter(function(x){return x.id===dragId;})[0];
        var chip=tray.querySelector('[data-id="'+dragId+'"]');
        if(!it||!chip)return;
        if(it.zone===zoneId){
          chip.classList.add('placed');chip.draggable=false;
          slot.innerHTML='';slot.appendChild(chip);
          var lab=document.createElement('div');lab.className='lab';lab.textContent=ZONES.filter(function(z){return z.id===zoneId;})[0].lab;
          slot.appendChild(lab);slot.classList.add('correct');
          burst(slot);placed++;
          if(placed===ITEMS.length){done.classList.add('show');}
        }else{
          chip.classList.add('shake');setTimeout(function(){chip.classList.remove('shake');},480);
        }
        dragId=null;
      }

      function burst(el){
        var r=el.getBoundingClientRect(),rr=root.getBoundingClientRect();
        var cx=r.left-rr.left+r.width/2,cy=r.top-rr.top+r.height/2;
        var cols=['#34d399','#22d3ee','#818cf8','#f472b6'];
        for(var i=0;i<14;i++){(function(i){
          var s=document.createElement('div');s.className='spark';
          s.style.left=cx+'px';s.style.top=cy+'px';s.style.background=cols[i%cols.length];
          root.appendChild(s);
          var ang=Math.random()*6.28,dist=30+Math.random()*46;
          var ex=cx+Math.cos(ang)*dist,ey=cy+Math.sin(ang)*dist;
          s.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+(ex-cx)+'px,'+(ey-cy)+'px) scale(0)',opacity:0}],{duration:600+Math.random()*300,easing:'cubic-bezier(.2,.7,.3,1)'});
          setTimeout(function(){s.remove();},900);
        })(i);}
      }
    })();
  </script>
</div>`;
