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
