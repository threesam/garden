type AnyGL = WebGLRenderingContext | WebGL2RenderingContext;

/**
 * Compile a shader of the given type from source.
 * Logs and returns null on compile failure.
 */
export function compileShader(gl: AnyGL, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Link two compiled shaders into a program.
 * Logs and returns null on link failure.
 */
export function linkProgram(
  gl: AnyGL,
  vert: WebGLShader,
  frag: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- createProgram returns null on a lost context despite the non-null lib type
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}
