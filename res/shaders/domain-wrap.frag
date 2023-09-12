#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
#endif

uniform vec2 u_resolution;
uniform float u_time;

in vec2 out_uv;

out vec4 frag_color;

#define COLOR_OFFSET vec3(0.25, 0.15, 0.1)
#define COLOR_SCALE 2.0

#define PI2 6.283185307179586
vec3 palette(float x) {
  return 0.5 + 0.5 * sin(PI2 * (COLOR_OFFSET + COLOR_SCALE * x));
}

// Custom seedable vector hash function designed for speed
#define MUL 747796405u
#define SEED 42u
vec3 gradient(ivec3 x) {
  uvec3 v = uvec3(x) * MUL;
  uvec3 h = (SEED ^ v) * MUL;
  h = ((h >> 16u) ^ v.yzx) * MUL;
  h = ((h >> 16u) ^ v.zxy) * MUL;

  return vec3(h) / 2147483648.0 - 1.0;
}

vec3 quintic_curve(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float perlin_noise(vec3 inp) {
  vec3 uv0 = floor(inp);
  vec3 uv1 = uv0 + 1.0;

  vec3 t0 = fract(inp);
  vec3 t1 = t0 - 1.0;

  vec3 uv_t = quintic_curve(fract(inp));

  vec4 cx0 = vec4(
    dot(gradient(ivec3(uv0)), t0),
    dot(gradient(ivec3(uv0.xy, uv1.z)), vec3(t0.xy, t1.z)),
    dot(gradient(ivec3(uv0.x, uv1.y, uv0.z)), vec3(t0.x, t1.y, t0.z)),
    dot(gradient(ivec3(uv0.x, uv1.yz)), vec3(t0.x, t1.yz))
  );
  vec4 cx1 = vec4(
    dot(gradient(ivec3(uv1.x, uv0.yz)), vec3(t1.x, t0.yz)),
    dot(gradient(ivec3(uv1.x, uv0.y, uv1.z)), vec3(t1.x, t0.y, t1.z)),
    dot(gradient(ivec3(uv1.xy, uv0.z)), vec3(t1.xy, t0.z)),
    dot(gradient(ivec3(uv1)), t1)
  );

  vec4 cy = mix(cx0, cx1, uv_t.x);
  vec2 cz = mix(cy.xy, cy.zw, uv_t.y);

  return mix(cz.x, cz.y, uv_t.z);
}

#define OCTAVES 5
#define LACUNARITY 2.0
#define PERSISTENCE 0.5
float fbm(vec3 inp) {
  float result = 0.0;
  float scale = 0.0;

  float amplitude = 1.0;
  
  for (int i = 0; i < OCTAVES; ++i) {
    result += amplitude * perlin_noise(inp);
    scale += amplitude;
    inp *= LACUNARITY;
    amplitude *= PERSISTENCE;
  }

  return result / scale;
}

#define WARP_SCALE 4.0
#define WARP_SHIFT vec3(12.0, 24.0, 0.0)
void main() {
  vec3 uv = vec3(out_uv, u_time * 0.025);

  vec3 warp = vec3(fbm(uv + WARP_SHIFT),
                   fbm(uv - WARP_SHIFT),
                   0.0);

  warp = vec3(fbm(uv + WARP_SCALE * warp + WARP_SHIFT.yxz),
              fbm(uv + WARP_SCALE * warp - WARP_SHIFT.yxz),
              0.0);

  float color = fbm(uv + WARP_SCALE * warp);
  frag_color = vec4(palette(color), 1.0);
}
