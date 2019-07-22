attribute vec3 a_vertexPosition;

attribute vec3 a_color;
varying vec3 vColor;

attribute vec2 a_vertexTextureCoord;

varying vec2 vTextureCoord;
varying float flagBackground;

uniform vec3 u_mixcolor;

void main() {
  gl_PointSize = 1.0;
  gl_Position = vec4(a_vertexPosition.xy, 1.0, 1.0);
  
  flagBackground = a_vertexPosition.z;
  vColor = a_color + u_mixcolor;
  vTextureCoord = a_vertexTextureCoord;
}