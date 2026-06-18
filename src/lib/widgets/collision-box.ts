/* Chặng 3 — "Thuyết va chạm": hộp phân tử động. Tăng nồng độ (số hạt) hoặc giảm
 * thể tích (tăng áp suất) => tần suất va chạm hiệu quả tăng => tốc độ tăng.
 * Canvas + requestAnimationFrame. 100% tiếng Việt. */
export const COLLISION_BOX_WIDGET = `
<div id="cb-root">
  <style>
    #cb-root{--bg1:#0a0f1f;--bg2:#1a103a;color:#e2e8f0;padding:22px;border-radius:18px;
      background:radial-gradient(800px 320px at 10% -20%,#6d28d9 0%,transparent 55%),linear-gradient(135deg,var(--bg1),var(--bg2))}
    #cb-root h2{margin:0 0 2px;font-size:18px;font-weight:800}
    #cb-root .sub{margin:0 0 14px;font-size:13px;color:#c4b5fd}
    .cb-wrap{display:flex;gap:18px;flex-wrap:wrap}
    .cb-stage{flex:1 1 340px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);
      border-radius:16px;padding:10px;backdrop-filter:blur(8px)}
    canvas{width:100%;height:auto;display:block;border-radius:12px;background:radial-gradient(circle at 50% 40%,#15193a,#0b0f24)}
    .cb-side{flex:1 1 220px;display:flex;flex-direction:column;gap:14px;min-width:220px}
    .ctrl label{display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;color:#ddd6fe}
    .ctrl input[type=range]{width:100%;accent-color:#a78bfa}
    .gauge{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:14px}
    .gauge .k{font-size:12px;color:#c4b5fd}
    .gbig{font-size:30px;font-weight:800;color:#f0abfc;margin-top:2px}
    .bar{height:12px;border-radius:8px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:8px}
    .bar>i{display:block;height:100%;width:10%;border-radius:8px;background:linear-gradient(90deg,#a78bfa,#f0abfc,#f472b6);transition:width .25s}
    .hint{font-size:12px;color:#c4b5fd;margin-top:8px;line-height:1.5}
  </style>

  <h2>Hộp va chạm phân tử</h2>
  <p class="sub">Mỗi lần hai hạt đập vào nhau là một va chạm. Hãy thử thay đổi nồng độ và thể tích.</p>

  <div class="cb-wrap">
    <div class="cb-stage"><canvas id="cb-canvas" width="560" height="320"></canvas></div>
    <div class="cb-side">
      <div class="ctrl">
        <label>Nồng độ (số hạt) <span id="cb-n">26</span></label>
        <input id="cb-count" type="range" min="6" max="64" value="26">
      </div>
      <div class="ctrl">
        <label>Thể tích bình <span id="cb-vol">100%</span></label>
        <input id="cb-volr" type="range" min="45" max="100" value="100">
      </div>
      <div class="gauge">
        <div class="k">Tần suất va chạm hiệu quả</div>
        <div class="gbig"><span id="cb-rate">0</span> <small style="font-size:13px;color:#94a3b8">va chạm/giây</small></div>
        <div class="bar"><i id="cb-fill"></i></div>
        <div class="hint" id="cb-hint">Nồng độ cao và thể tích nhỏ đều làm mật độ hạt tăng — va chạm dày hơn.</div>
      </div>
    </div>
  </div>

  <script>
    (function(){
      var cv=document.getElementById('cb-canvas'),ctx=cv.getContext('2d');
      var W=cv.width,H=cv.height,R=7;
      var parts=[],vol=1,target=26,collisions=0,flashes=[];
      function box(){var s=vol; var bw=W*s,bh=H*s; return {x:(W-bw)/2,y:(H-bh)/2,w:bw,h:bh};}

      function rnd(a,b){return a+Math.random()*(b-a);}
      function build(n){
        var b=box();parts=[];
        for(var i=0;i<n;i++){
          var sp=rnd(1.1,2.0),ang=Math.random()*6.28;
          parts.push({x:rnd(b.x+R,b.x+b.w-R),y:rnd(b.y+R,b.y+b.h-R),vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,hue:rnd(255,320)});
        }
      }
      build(target);

      function step(){
        var b=box();
        // walls
        for(var i=0;i<parts.length;i++){var p=parts[i];p.x+=p.vx;p.y+=p.vy;
          if(p.x<b.x+R){p.x=b.x+R;p.vx*=-1;}if(p.x>b.x+b.w-R){p.x=b.x+b.w-R;p.vx*=-1;}
          if(p.y<b.y+R){p.y=b.y+R;p.vy*=-1;}if(p.y>b.y+b.h-R){p.y=b.y+b.h-R;p.vy*=-1;}
        }
        // pair collisions
        for(var a=0;a<parts.length;a++){for(var c=a+1;c<parts.length;c++){
          var p=parts[a],q=parts[c],dx=q.x-p.x,dy=q.y-p.y,dist=Math.hypot(dx,dy);
          if(dist<2*R&&dist>0){
            var nx=dx/dist,ny=dy/dist;
            var dvx=p.vx-q.vx,dvy=p.vy-q.vy,rel=dvx*nx+dvy*ny;
            if(rel>0){
              p.vx-=rel*nx;p.vy-=rel*ny;q.vx+=rel*nx;q.vy+=rel*ny;
              var ov=2*R-dist;p.x-=nx*ov/2;p.y-=ny*ov/2;q.x+=nx*ov/2;q.y+=ny*ov/2;
              collisions++;flashes.push({x:(p.x+q.x)/2,y:(p.y+q.y)/2,life:1});
            }
          }
        }}
      }

      function draw(){
        var b=box();
        ctx.clearRect(0,0,W,H);
        // glass box
        ctx.fillStyle='rgba(167,139,250,.06)';ctx.strokeStyle='rgba(167,139,250,.45)';ctx.lineWidth=2;
        roundRect(b.x,b.y,b.w,b.h,12);ctx.fill();ctx.stroke();
        // flashes
        for(var f=flashes.length-1;f>=0;f--){var fl=flashes[f];fl.life-=0.08;if(fl.life<=0){flashes.splice(f,1);continue;}
          ctx.beginPath();ctx.arc(fl.x,fl.y,R+10*(1-fl.life),0,6.28);ctx.fillStyle='rgba(244,114,182,'+(fl.life*0.4)+')';ctx.fill();}
        // particles
        for(var i=0;i<parts.length;i++){var p=parts[i];
          var grd=ctx.createRadialGradient(p.x-2,p.y-2,1,p.x,p.y,R+2);
          grd.addColorStop(0,'hsl('+p.hue+',90%,80%)');grd.addColorStop(1,'hsl('+p.hue+',85%,55%)');
          ctx.beginPath();ctx.arc(p.x,p.y,R,0,6.28);ctx.fillStyle=grd;ctx.shadowColor='hsl('+p.hue+',90%,65%)';ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;}
      }
      function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

      function loop(){step();draw();requestAnimationFrame(loop);}
      loop();

      // rate sampling each second
      setInterval(function(){
        var rate=collisions;collisions=0;
        document.getElementById('cb-rate').textContent=rate;
        var pct=Math.min(100,Math.round(rate/3));
        document.getElementById('cb-fill').style.width=Math.max(6,pct)+'%';
      },1000);

      // controls
      var cnt=document.getElementById('cb-count'),volr=document.getElementById('cb-volr');
      cnt.addEventListener('input',function(){target=Number(cnt.value);document.getElementById('cb-n').textContent=target;reflow();});
      volr.addEventListener('input',function(){vol=Number(volr.value)/100;document.getElementById('cb-vol').textContent=volr.value+'%';clampInside();});
      function reflow(){var diff=target-parts.length;if(diff>0){var b=box();for(var i=0;i<diff;i++){var sp=rnd(1.1,2.0),ang=Math.random()*6.28;parts.push({x:rnd(b.x+R,b.x+b.w-R),y:rnd(b.y+R,b.y+b.h-R),vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,hue:rnd(255,320)});}}else{parts.splice(target);}}
      function clampInside(){var b=box();for(var i=0;i<parts.length;i++){var p=parts[i];p.x=Math.max(b.x+R,Math.min(b.x+b.w-R,p.x));p.y=Math.max(b.y+R,Math.min(b.y+b.h-R,p.y));}}
    })();
  </script>
</div>`;
