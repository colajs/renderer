attribute vec3 a_vertexPosition;

attribute vec3 a_color;
varying vec3 vColor;

uniform mat3 u_transform;

void main() {
  gl_PointSize = 1.0;
  // gl_Position = vec4(a_vertexPosition, 1.0);
  gl_Position = vec4(u_transform * a_vertexPosition, 1.0);
  vColor = a_color;
}