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

#define COLOR_OFFSET vec3(0.5, 0.4, 0.35)
#define COLOR_SCALE 2.0

#define WARP_SCALE 2.0
#define WARP_SHIFT vec3(12.0, 12.0, 0.0)

#define PI2 6.283185307179586
vec3 palette(float x) {
  return 0.5 + 0.5 * sin(PI2 * (COLOR_OFFSET + COLOR_SCALE * x));
}

// Modified 3D PCG hash function
// - https://www.jcgt.org/published/0009/03/02/
// - https://pcg-random.org
uint hash(ivec3 x) {
  // TODO: replace the increment with seed generated from the CPU
  uvec3 v = uvec3(x) * 747796405u + 747796405u;
  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;
  
  uint r = v.z >> 27u;
  v.y ^= (v.y >> 18u) | (v.z << 14u);
  v.z ^= v.z >> 18u;

  uint h = (v.y >> 27u) | (v.z << 5u);
  return (h >> r) | (h << (-r & 31u));
}

vec3 quintic_curve(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// TODO: Switch to perlin noise
float value_noise(vec3 inp) {
  ivec3 uv = ivec3(floor(inp));
  vec3 uv_t = quintic_curve(fract(inp));

  vec4 cx0 = vec4(
    hash(uv + ivec3(0, 0, 0)),
    hash(uv + ivec3(0, 0, 1)),
    hash(uv + ivec3(0, 1, 0)),
    hash(uv + ivec3(0, 1, 1))
  );

  vec4 cx1 = vec4(
    hash(uv + ivec3(1, 0, 0)),
    hash(uv + ivec3(1, 0, 1)),
    hash(uv + ivec3(1, 1, 0)),
    hash(uv + ivec3(1, 1, 1))
  );

  vec4 cx = mix(cx0, cx1, uv_t.x);
  vec2 cy = mix(cx.xy, cx.zw, uv_t.y);
  return mix(cy.x, cy.y, uv_t.z) / 4294967296.0;
}

float fbm(vec3 inp) {
  float result = 0.0;
  float scale = 0.0;

  float amplitude = 1.0;
  float frequency = 1.0;
  
  for (int i = 0; i < OCTAVES; ++i) {
    result += amplitude * value_noise(inp * frequency);
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
