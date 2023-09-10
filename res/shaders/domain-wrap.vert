#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
#endif

out vec2 out_uv;

uniform vec2 u_resolution;

void main() {
  vec2 uv;
  int id = gl_VertexID;

  uv.x = (id % 2 != 0) ? 1.0 : -1.0;
  uv.y = ((id + 4) % 6 < 3) ? 1.0 : -1.0;

  gl_Position = vec4(uv, 0.0, 1.0);

  out_uv = uv * u_resolution / max(u_resolution.x, u_resolution.y) * 0.5 * 8.0;
}
