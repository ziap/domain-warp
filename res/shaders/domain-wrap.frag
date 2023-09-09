#version 300 es

#ifdef GL_ES
precision highp float;
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

#define PI2 6.283185307179586
vec3 palette(float x) {
  return 0.5 + 0.5 * sin(PI2 * (COLOR_OFFSET + COLOR_SCALE * x));
}

int permute(int x) {
  x ^= 5;
  x &= 0xff;
  x ^= x >> ((x >> 6) + 2);
  x *= 217;
  x &= 0xff;
  x ^= (x >> 6);
  return x;
}

int permute(ivec3 v) {
  return permute(v.x + permute(v.y + permute(v.z)));
}

vec3 quintic_curve(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// TODO: Switch to perlin noise
float value_noise(vec3 inp) {
  vec3 uv_floor = floor(inp);
  ivec3 uv = ivec3(uv_floor);
  vec3 uv_t = quintic_curve(inp - uv_floor);

  float c000 = float(permute(uv));
  float c001 = float(permute(uv + ivec3(0, 0, 1)));
  float c010 = float(permute(uv + ivec3(0, 1, 0)));
  float c011 = float(permute(uv + ivec3(0, 1, 1)));
  float c100 = float(permute(uv + ivec3(1, 0, 0)));
  float c101 = float(permute(uv + ivec3(1, 0, 1)));
  float c110 = float(permute(uv + ivec3(1, 1, 0)));
  float c111 = float(permute(uv + ivec3(1, 1, 1)));

  float cx00 = mix(c000, c100, uv_t.x);
  float cx01 = mix(c001, c101, uv_t.x);
  float cx10 = mix(c010, c110, uv_t.x);
  float cx11 = mix(c011, c111, uv_t.x);

  float cy0 = mix(cx00, cx10, uv_t.y);
  float cy1 = mix(cx01, cx11, uv_t.y);

  return mix(cy0, cy1, uv_t.z) / 256.0;
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
  vec3 shift = vec3(12.0, 6.0, 0.0);
  vec3 uv = vec3(out_uv, u_time * 0.025);
  vec3 q = vec3(fbm(uv), fbm(uv + shift), 0.5) * 2.0 - 1.0;
  vec3 r = vec3(fbm(uv + WARP_SCALE * q), fbm(uv + WARP_SCALE * q + shift), 0.5) * 2.0 - 1.0;
  float color = fbm(uv + WARP_SCALE * r);

  frag_color = vec4(palette(color), 1.0);
}
