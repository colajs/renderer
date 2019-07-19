import GlRenderer from 'gl-renderer';
import CanvasContext from './context/canvas_context';
import WebGLContext from './context/webgl_context';

export function getContext(canvas, options) {
  const names = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl', '2d'];
  let context = null;
  for(let i = 0; i < names.length; ++i) {
    try {
      context = canvas.getContext(names[i], options);
    } catch (e) {
      // no-empty
    }
    if(context) {
      break;
    }
  }

  return typeof context.bufferData === 'function' ? WebGLContext(context) : CanvasContext(context);
}

export function flattenMeshes(meshes) {
  const positions = [];
  const cells = [];
  const a_color = [];
  let idx = 0;

  meshes.forEach((mesh) => {
    if(mesh) {
      positions.push(...mesh.positions);
      cells.push(...mesh.cells.map(cell => cell.map(c => c + idx)));
      a_color.push(...mesh.attributes.a_color);
      idx += mesh.positions.length;
    }
  });

  return {positions, cells, attributes: {a_color}};
}

export function compress(meshes, maxSize = 10000) {
  const ret = [];
  const temp = [];

  let size = 0;

  for(let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];
    const len = mesh.positions.length;
    if(size === 0 || size + len < maxSize) {
      temp.push(mesh);
    }
    if(i === meshes.length - 1 || size + len >= maxSize) {
      const meshData = flattenMeshes(temp);
      meshData.positions = GlRenderer.FLOAT(meshData.positions);
      meshData.cells = GlRenderer.USHORT(meshData.cells);
      ret.push(meshData);
      temp.length = 0;
      size = 0;
    } else {
      size += len;
    }
  }
  return ret;
}
