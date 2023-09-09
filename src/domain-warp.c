#include "domain-warp.h"

#include "imports.h"
#include "resources.h"
#include "shader.h"

void DomainWarpInit(DomainWarp *dw) {
  dw->program = create_program(shaders_domain_wrap_vert, shaders_domain_wrap_frag);

  dw->vao = glCreateVertexArray();

  dw->u_resolution = glGetUniformLocation(dw->program, "u_resolution");
  dw->u_time = glGetUniformLocation(dw->program, "u_time");
}

void DomainWarpUse(DomainWarp *dw) {
  glUseProgram(dw->program);
  glBindVertexArray(dw->vao);
}

void DomainWarpUpdate(
  DomainWarp *rb, int width, int height, float time
) {
  glUniform2f(rb->u_resolution, width, height);
  glUniform1f(rb->u_time, time);
}

void DomainWarpRender(DomainWarp *rb) {
  (void)rb;
  glDrawArrays(GL_TRIANGLES, 0, 6);
}
