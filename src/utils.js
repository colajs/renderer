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
  const uniforms = meshes[0] ? meshes[0].uniforms || {} : {};

  meshes.forEach((mesh) => {
    if(mesh) {
      positions.push(...mesh.positions);
      cells.push(...mesh.cells.map(cell => cell.map(c => c + idx)));
      a_color.push(...mesh.attributes.a_color);
      idx += mesh.positions.length;
    }
  });

  return {positions, cells, attributes: {a_color}, uniforms};
}

function compareUniform(a, b) {
  const ua = a.uniforms || {};
  const ub = b.uniforms || {};

  const keysA = Object.keys(ua),
    keysB = Object.keys(ub);

  if(keysA.length !== keysB.length) return false;

  return keysA.every((key) => {
    const va = ua[key],
      vb = ub[key];

    if(va === vb) return true;
    if(va.length && vb.length && va.length === vb.length) {
      for(let i = 0; i < va.length; i++) {
        if(va[i] !== vb[i]) return false;
      }
      return true;
    }
    return false;
  });
}

function packData(temp, ret) {
  if(temp.length) {
    const meshData = flattenMeshes(temp);
    meshData.positions = GlRenderer.FLOAT(meshData.positions);
    meshData.cells = GlRenderer.USHORT(meshData.cells);
    ret.push(meshData);
    temp.length = 0;
  }
}

export function compress(meshes, maxSize = 10000) {
  const ret = [];
  const temp = [];

  let size = 0;

  for(let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];
    const len = mesh.positions.length;

    if(size + len > maxSize) { // cannot merge
      packData(temp, ret);
      size = 0;
    } else if(size) {
      const lastMesh = meshes[i - 1];
      if(!compareUniform(lastMesh, mesh)) {
        packData(temp, ret);
        size = 0;
      }
    }

    temp.push(mesh);

    if(i === meshes.length - 1) {
      packData(temp, ret);
    } else {
      size += len;
    }
  }
  return ret;
}
