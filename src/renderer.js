import GlRenderer from 'gl-renderer';
import {loadImage} from 'gl-renderer/src/helpers';
import vertShader from './shader.vert';
import fragShader from './shader.frag';
import {compress, createText} from './utils';

export default class Renderer extends GlRenderer {
  constructor(canvas, opts = {}) {
    super(canvas, opts);
    const program = this.compileSync(fragShader, vertShader);
    this.useProgram(program);

    // bind default Texture to eliminate warning
    const img = document.createElement('canvas');
    img.width = 1;
    img.height = 1;
    const texture = this.createTexture(img);
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }

  loadImage(src) {
    return loadImage(src);
  }

  createText(text, {font = '16px arial', fillColor = null, strokeColor = null} = {}) {
    const img = createText(text, {font, fillColor, strokeColor});
    window.canvascc = img;
    const texture = this.createTexture(img);
    texture._img = img;
    this.textures.push(texture);
    return texture;
  }

  drawMeshes(meshes) {
    const meshData = compress(meshes);
    return this.setMeshData(meshData);
  }
}