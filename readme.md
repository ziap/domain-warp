# Domain Warp

Small domain warped noise experiment

## How to use (this is also copy-pasted)

### Requirements

**Linux build**

- A C99 compiler
- GNU make
- GLFW
- GLEW

**WebAssembly build**

- Clang
- A web server (ex: `python -m http.server`)

**Windows build**

- `¯\_(ツ)_/¯`

### Building

Running this will compile both the Linux version and the web version

```
make
```

### Debugging

Compile with debug symbols then use gdb to debug

```
make debug

gdb ./debug/app
```

### Running

For the Linux version, the executable is located at `./build/app`

For the web version use a web server (See [above](#requirements)) to host the
website.

## License

This project is licensed under the [MIT License](LICENSE).
