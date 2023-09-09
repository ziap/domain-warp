#ifndef RAINBOW_H
#define RAINBOW_H

typedef struct {
  int u_resolution;
  int u_time;

  int program;

  int vao;
} DomainWarp;

extern void DomainWarpInit(DomainWarp*);
extern void DomainWarpUpdate(DomainWarp*, int, int, float);
extern void DomainWarpUse(DomainWarp*);
extern void DomainWarpRender(DomainWarp*);

#endif
