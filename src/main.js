import './style.css';
import { VERT_SRC, FRAG_SRC } from './shaders.js';

// ---------- Official contact / links ----------
const WHATSAPP_NUMBER = '5512936290045'; // +55 12 93629-0045, digits only
const SITE_URL = 'https://salt-mauve.vercel.app/';

function waLink(message){
  return 'https://wa.me/' + WHATSAPP_NUMBER + (message ? ('?text=' + encodeURIComponent(message)) : '');
}

document.querySelectorAll('[data-wa]').forEach(function(el){
  el.href = waLink(el.getAttribute('data-wa') || undefined);
  el.target = '_blank';
  el.rel = 'noopener';
});

document.querySelectorAll('[data-site]').forEach(function(el){
  el.href = SITE_URL;
  el.target = '_blank';
  el.rel = 'noopener';
});

// ---------- Background shader ----------
(function(){
  var canvas = document.getElementById('bg-canvas');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if(!gl){
    var fb = document.createElement('div');
    fb.className = 'bg-fallback';
    canvas.replaceWith(fb);
  } else {
    initGL(gl, canvas, reduceMotion);
  }

  function compile(gl, type, src){
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function initGL(gl, canvas, reduceMotion){
    var vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'u_resolution');
    var uTime = gl.getUniformLocation(prog, 'u_time');
    var uMouse = gl.getUniformLocation(prog, 'u_mouse');
    var uOct = gl.getUniformLocation(prog, 'u_octaves');

    var mouse = {x:0, y:0};
    var mouseTarget = {x:0, y:0};
    var isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var isSmall = false;

    function resize(){
      isSmall = window.innerWidth < 720;
      var scale = isSmall ? 0.62 : 0.85;
      var dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.3 : 1.7) * scale;
      var w = Math.max(1, Math.floor(window.innerWidth * dpr));
      var h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if(canvas.width !== w || canvas.height !== h){
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    resize();
    window.addEventListener('resize', resize);

    if(!isTouch){
      window.addEventListener('pointermove', function(e){
        mouseTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseTarget.y = (e.clientY / window.innerHeight - 0.5) * -2;
      });
    }

    var start = null;
    var frozen = 0;

    function frame(ts){
      if(start === null) start = ts;
      var elapsed = reduceMotion ? 0 : (ts - start) / 1000;

      mouse.x += (mouseTarget.x - mouse.x) * 0.04;
      mouse.y += (mouseTarget.y - mouse.y) * 0.04;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uOct, isSmall ? 3.0 : 5.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if(!reduceMotion || frozen < 2){
        if(reduceMotion) frozen++;
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }
})();

// ---------- Cursor glow (desktop only) ----------
(function(){
  var glow = document.getElementById('cursorGlow');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouchDevice = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if(glow && !isTouchDevice && !reduceMotion){
    var gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function(e){
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('active');
    });
    (function loop(){
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
      requestAnimationFrame(loop);
    })();
  }
})();
