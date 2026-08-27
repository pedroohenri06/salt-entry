// Raw WebGL1 (GLSL ES 1.00) shaders for the Salt hero background.
//
// v3 — same motion core as v1/v2 (domain-warped fbm, Ashima Arts simplex
// noise, portrait-aware framing), with three added layers requested for
// the "luxury technology company" pass:
//
//   1. data traces  — thin traveling isolines pulled straight out of the
//      existing noise field (no extra noise cost), read as signal/telemetry
//      rather than literal wires. Confined to the dark valleys only.
//   2. tech grid    — a faint coordinate grid, warped by the same domain
//      warp vectors as the metal so it feels like one computational
//      surface, not a UI overlay laid on top.
//   3. far plane    — a second, coarser/slower fbm evaluated behind the
//      main field: a real second motion frequency, which combined with
//      u_mouse/u_scroll-driven offsets at a different rate than the near
//      field gives an actual parallax depth cue instead of a flat card.
//
// u_touch is a soft, decaying light bloom at the last touch point (mobile
// touch response). u_scroll drives a very small camera dolly + shifts the
// existing specular streak, so the background answers scroll without ever
// looking like a UI reacting to it.

export const VERT_SRC = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export const FRAG_SRC = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_octaves;
uniform vec3 u_touch;   // xy: normalized touch point (-1..1), z: pulse 0..1
uniform float u_scroll; // 0..1, smoothed

vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p, float oct){
  float f = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for(int i = 0; i < 5; i++){
    if(float(i) < oct){
      f += amp * snoise(p);
    }
    p = rot * p * 2.0 + vec2(3.1, 1.7);
    amp *= 0.52;
  }
  return f;
}

float warped(vec2 p, float oct, out vec2 q, out vec2 r){
  q = vec2(fbm(p, oct), fbm(p + vec2(5.2, 1.3), oct));
  r = vec2(fbm(p + 3.6*q + vec2(1.7, 9.2), oct), fbm(p + 3.6*q + vec2(8.3, 2.8), oct));
  return fbm(p + 3.4*r, oct);
}

float lineMask(float d, float w){ return 1.0 - smoothstep(0.0, w, abs(d)); }

void main(){
  vec2 res = u_resolution;
  float aspect = res.x / res.y;
  float portrait = step(aspect, 0.85);

  vec2 uv = (gl_FragCoord.xy - 0.5*res) / res.y;
  uv.y += 0.12 * portrait;
  uv += u_mouse * mix(0.05, 0.022, portrait);

  /* scroll dolly: a very small push-in + upward drift, so the background
     reads as a camera move rather than a page reacting to scroll */
  uv *= mix(1.0, 0.945, u_scroll);
  uv.y -= 0.03 * u_scroll;

  float uvScale = mix(1.55, 1.05, portrait);
  float speed = mix(0.026, 0.02, portrait);
  float t = u_time * speed;
  vec2 p = uv * uvScale + vec2(t*0.22, -t*0.14);

  vec2 q, r;
  float n = warped(p, u_octaves, q, r);

  /* fully desaturated ramp: --void #000 -> --d1 #040405 -> --d2 #08080a ->
     mid steel gray -> --ivory #f5f4f2. No hue at all, matching the rest
     of the site's editorial, zero-color palette. */
  vec3 col = mix(vec3(0.0,0.0,0.0), vec3(0.024,0.024,0.030), smoothstep(-0.6, 0.05, n));
  col = mix(col, vec3(0.075,0.075,0.086), smoothstep(-0.05, 0.4, n));
  col = mix(col, vec3(0.34,0.34,0.34), smoothstep(0.32, 0.68, n));
  col = mix(col, vec3(0.96,0.957,0.949), smoothstep(0.66, 0.95, n));

  /* ---------- far plane: a second, slower motion frequency behind the
     near field. Offset by mouse/scroll at a different rate than the near
     field above -- that mismatch IS the parallax depth cue. ---------- */
  vec2 farP = uv*0.5 + u_mouse*0.012 + vec2(t*0.09, -t*0.05) + vec2(0.0, u_scroll*0.05);
  float farN = fbm(farP, min(u_octaves, 3.0));
  vec3 farTint = mix(vec3(0.0,0.0,0.0), vec3(0.05,0.052,0.06), smoothstep(-0.2, 0.6, farN));
  col = mix(farTint, col, 0.88);

  /* ---------- data traces: thin isolines of the same field, animated in
     phase so they travel like signal along the metal's contours. Kept to
     the dark valleys only -- never drawn over the bright highlight. ---- */
  float darkMask = 1.0 - smoothstep(0.02, 0.55, n);
  float iso = fract(n*5.0 - u_time*0.05);
  float trace = lineMask(iso - 0.5, 0.035) * darkMask;
  trace *= 0.16 + 0.1*sin(u_time*0.6 + q.x*4.0);
  col += trace * vec3(0.55,0.57,0.62);

  /* ---------- tech grid: faint coordinate plane warped by the same
     domain-warp vectors as the metal, so it bends with the material
     instead of sitting on top of it like a UI layer. ---------- */
  vec2 gp = uv * mix(3.4, 4.2, portrait) + r*0.18 + vec2(0.0, u_scroll*0.08 - t*0.015);
  vec2 gUv = fract(gp) - 0.5;
  float grid = max(lineMask(gUv.x, 0.006), lineMask(gUv.y, 0.006));
  grid *= 0.05 * darkMask;
  col += grid * vec3(0.7,0.73,0.8);

  /* ---------- specular streak (v2), now shifted slightly by scroll ---- */
  float streak = (1.0 - portrait) * smoothstep(0.55, 0.6, fbm(p*2.4 + r*1.6 + vec2(u_scroll*0.4,0.0), u_octaves)) * 0.4;
  col += streak * vec3(0.96, 0.957, 0.949);

  /* ---------- touch response: soft decaying light bloom (mobile) ------ */
  float touchD = length(uv - u_touch.xy);
  float touchGlow = smoothstep(0.55, 0.0, touchD) * u_touch.z * 0.22;
  col += touchGlow * vec3(0.92,0.94,0.98);

  float vig = smoothstep(1.25, 0.1, length(uv));
  col *= mix(0.42, 1.0, vig);

  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453) - 0.5) / 255.0;
  col += dither;

  gl_FragColor = vec4(col, 1.0);
}
`;
