#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
#endif

#define OCTAVES 6
#define LACUNARITY 2.0
#define PERSISTENCE 0.5

uniform vec2 u_resolution;
uniform float u_time;

in vec2 out_uv;

out vec4 frag_color;

#define COLOR_OFFSET vec3(0.25, 0.15, 0.1)
#define COLOR_SCALE 2.5

#define WARP_SCALE 4.0
#define WARP_SHIFT vec3(12.0, 12.0, 0.0)

#define PI2 6.283185307179586
vec3 palette(float x) {
  return 0.5 + 0.5 * sin(PI2 * (COLOR_OFFSET + COLOR_SCALE * x));
}

// Custom seedable vector hash function designed for speed
#define MUL  747796405u
#define seed 420u
uvec3 grug33(ivec3 x) {
  uvec3 v = uvec3(x) * MUL;
  uvec3 h = (seed ^ v) * MUL;
  h = (h ^ v.yzx) * MUL;
  h = (h ^ v.zxy) * MUL;
  return h;
}

// TODO: Use gaussian distribution to generate unbiased unit vectors
// TODO: Normalize so that the noise output is (theoretically) [-1, 1]
vec3 gradient(ivec3 p) {
  return vec3(grug33(p)) / 2147483648.0 - 1.0;
}

vec3 quintic_curve(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float perlin_noise(vec3 inp) {
  ivec3 uv = ivec3(floor(inp));
  vec3 t0 = fract(inp);
  vec3 t1 = t0 - 1.0;
  vec3 uv_t = quintic_curve(fract(inp));

  vec4 cx0 = vec4(
    dot(gradient(uv), t0),
    dot(gradient(uv + ivec3(0, 0, 1)), vec3(t0.x, t0.y, t1.z)),
    dot(gradient(uv + ivec3(0, 1, 0)), vec3(t0.x, t1.y, t0.z)),
    dot(gradient(uv + ivec3(0, 1, 1)), vec3(t0.x, t1.y, t1.z))
  );
  vec4 cx1 = vec4(
    dot(gradient(uv + ivec3(1, 0, 0)), vec3(t1.x, t0.y, t0.z)),
    dot(gradient(uv + ivec3(1, 0, 1)), vec3(t1.x, t0.y, t1.z)),
    dot(gradient(uv + ivec3(1, 1, 0)), vec3(t1.x, t1.y, t0.z)),
    dot(gradient(uv + 1), t1)
  );

  vec4 cx = mix(cx0, cx1, uv_t.x);
  vec2 cy = mix(cx.xy, cx.zw, uv_t.y);

  return mix(cy.x, cy.y, uv_t.z) * 0.5 + 0.5;
}

float fbm(vec3 inp) {
  float result = 0.0;
  float scale = 0.0;

  float amplitude = 1.0;
  float frequency = 1.0;
  
  for (int i = 0; i < OCTAVES; ++i) {
    result += amplitude * perlin_noise(inp * frequency);
    scale += amplitude;

    frequency *= LACUNARITY;
    amplitude *= PERSISTENCE;
  }

  return result / scale;
}

void main() {
  vec3 uv = vec3(out_uv, u_time * 0.025);
  vec3 q = vec3(fbm(uv + WARP_SHIFT), fbm(uv - WARP_SHIFT), 0.5) * 2.0 - 1.0;
  vec3 r = vec3(fbm(uv + WARP_SCALE * q + WARP_SHIFT), fbm(uv + WARP_SCALE * q - WARP_SHIFT), 0.5) * 2.0 - 1.0;
  float color = fbm(uv + WARP_SCALE * r);

  frag_color = vec4(palette(color), 1.0);
}
