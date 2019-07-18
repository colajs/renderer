import GlRenderer from 'gl-renderer';
import Figure2D from './figure2d';
import Mesh2D from './mesh2d';
import vertShader from './shader.vert';
import fragShader from './shader.frag';
import {flattenMeshes} from './utils';

const d = 'M50 50L50 150L150 150Z';

const figure = new Figure2D();
figure.addPath(d);

console.log(figure.contours);

const mesh = new Mesh2D(figure, {width: 512, height: 512});
mesh.setStroke({
  thickness: 10,
  color: [255, 0, 255],
});

mesh.setFill({
  color: [255, 0, 0],
});
console.log(mesh.meshData);

(async function () {
  const canvas = document.querySelector('canvas');
  const renderer = new GlRenderer(canvas);
  const program = await renderer.compile(fragShader, vertShader);
  renderer.useProgram(program);
  const {positions, cells, attributes} = mesh.meshData;
  const meshDatas = [];
  for(let i = 0; i < 800; i++) {
    const angle = Math.random() * Math.PI;
    meshDatas.push({
      positions,
      cells,
      attributes,
      uniforms: {
        // u_transform: [Math.sin(angle), Math.cos(angle), 0, Math.cos(angle), -Math.sin(angle), 0, 0, 0, 1],
        u_transform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      },
    });
  }
  const meshData = flattenMeshes(meshDatas);
  console.log(meshData);
  // meshData.uniforms = {
  //   u_transform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  // };
  function update() {
    renderer.setMeshData(meshDatas);
    requestAnimationFrame(update);
  }
  update();
  renderer.render();
}());

export default {
  all: 42,
};