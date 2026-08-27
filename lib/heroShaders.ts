// Raw WebGL1 (GLSL ES 1.00) shaders for the Salt hero background.
//
// Domain-warped fractal-Brownian-motion field (Ashima Arts 2D simplex noise +
// Inigo Quilez-style nested warping). Color ramp and a couple of
// orientation-aware uniforms are tuned to match this app's existing --void /
// --d1 / --d2 / --ivory palette (see app/globals.css) — fully desaturated,
// no blue tint, consistent with the rest of the site.

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

void main(){
  vec2 res = u_resolution;
  float aspect = res.x / res.y;
  float portrait = step(aspect, 0.85);

  vec2 uv = (gl_FragCoord.xy - 0.5*res) / res.y;
  uv.y += 0.12 * portrait;
  uv += u_mouse * mix(0.05, 0.022, portrait);

  float uvScale = mix(1.55, 1.05, portrait);
  float speed = mix(0.026, 0.02, portrait);
  float t = u_time * speed;
  vec2 p = uv * uvScale + vec2(t*0.22, -t*0.14);

  vec2 q, r;
  float n = warped(p, u_octaves, q, r);

  /* fully desaturated ramp: --void #000 -> --d1 #040405 -> --d2 #08080a ->
     mid steel gray -> --ivory #f5f4f2. No hue at all, matching the rest
     of the site's editorial, zero-color palette. Bands widened vs. the
     first pass so the moving shapes read clearly against the black
     instead of mostly disappearing into it. */
  vec3 col = mix(vec3(0.0,0.0,0.0), vec3(0.024,0.024,0.030), smoothstep(-0.6, 0.05, n));
  col = mix(col, vec3(0.075,0.075,0.086), smoothstep(-0.05, 0.4, n));
  col = mix(col, vec3(0.34,0.34,0.34), smoothstep(0.32, 0.68, n));
  col = mix(col, vec3(0.96,0.957,0.949), smoothstep(0.66, 0.95, n));

  float streak = (1.0 - portrait) * smoothstep(0.55, 0.6, fbm(p*2.4 + r*1.6, u_octaves)) * 0.4;
  col += streak * vec3(0.96, 0.957, 0.949);

  float vig = smoothstep(1.25, 0.1, length(uv));
  col *= mix(0.42, 1.0, vig);

  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453) - 0.5) / 255.0;
  col += dither;

  gl_FragColor = vec4(col, 1.0);
}
`;
