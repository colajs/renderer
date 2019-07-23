import GlRenderer from 'gl-renderer';
// import { loadImage } from 'gl-renderer/src/helpers';

export function flattenMeshes(meshes) {
  const positions = [];
  const textureCoord = [];
  const cells = [];
  const a_color = [];
  let idx = 0;
  const uniforms = meshes[0] ? meshes[0].uniforms || {} : {};

  meshes.forEach((mesh) => {
    if(mesh) {
      positions.push(...mesh.positions);
      cells.push(...mesh.cells.map(cell => cell.map(c => c + idx)));
      a_color.push(...mesh.attributes.a_color);
      if(mesh.textureCoord) textureCoord.push(...mesh.textureCoord);
      idx += mesh.positions.length;
    }
  });

  const ret = {positions, cells, attributes: {a_color}, uniforms};

  if(textureCoord.length) {
    ret.textureCoord = textureCoord;
  }

  return ret;
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
    if(meshData.textureCoord) meshData.textureCoord = GlRenderer.FLOAT(meshData.textureCoord);
    ret.push(meshData);
    temp.length = 0;
  }
}

export function compress(meshes, maxSize = 10000) {
  const ret = [];
  const temp = [];

  let size = 0;

  for(let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i].meshData;
    const len = mesh.positions.length;

    if(size + len > maxSize) { // cannot merge
      packData(temp, ret);
      size = 0;
    } else if(size) {
      const lastMesh = meshes[i - 1].meshData;
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
