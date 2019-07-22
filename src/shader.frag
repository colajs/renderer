#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texSampler;
uniform int u_texFlag;

varying vec3 vColor;
varying vec2 vTextureCoord;
varying float flagBackground;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
  // gl_FragColor = vec4(1.0, 0, 0, 1.0);
  if(u_texFlag > 0 && flagBackground > 0.0) {
    gl_FragColor = texture2D(u_texSampler, vTextureCoord);
  }
}