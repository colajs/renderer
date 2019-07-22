import GlRenderer from 'gl-renderer';
import Figure2D from './figure2d';
import Mesh2D from './mesh2d';
import vertShader from './shader.vert';
import fragShader from './shader.frag';
import {compress} from './utils';

const canvas = document.querySelector('canvas');
const renderer = new GlRenderer(canvas);
const program = renderer.compileSync(fragShader, vertShader);
renderer.useProgram(program);

const textureURL = 'https://p4.ssl.qhimg.com/t012170360e1552ce17.png';

(async function () {
  const texture = await renderer.loadTexture(textureURL);

  const meshList = [];
  for(let i = 0; i < 2500; i++) {
    const d = 'M0 0L0 20L20 20Z';

    const figure = new Figure2D();
    figure.addPath(d);
    // console.log(figure.contours);

    const mesh = new Mesh2D(figure, {width: 512, height: 512});
    mesh.setStroke({
      thickness: 2,
      color: [255, 0, 255],
    });

    mesh.setFill({
      color: [255, 0, 0],
    });

    if(i > 1500) {
      mesh.setUniforms({u_mixcolor: [0, 128, 0], u_texFlag: 0});
    } else {
      mesh.setUniforms({u_mixcolor: [0, 0, 0], u_texFlag: 1, u_texSampler: texture});
    }

    // mesh.setTransform([1, 0, 0, 1, 0, 100]);
    // mesh.setTransform([1, 0, 0, 1, 0, 50]);
    // mesh.setTransform([1, 0, 0, 1, 300 * Math.random(), 300 * Math.random()]);

    meshList.push(mesh);
  }

  function getData() {
    const meshDatas = meshList.map((mesh) => {
      mesh.setTransform([1, 0, 0, 1, 500 * Math.random(), 500 * Math.random()]);
      return mesh.meshData;
    });
    return compress(meshDatas);
  }

  window.getData = getData;

  // const meshData = flattenMeshes(meshDatas);
  // meshData.positions = GlRenderer.FLOAT(meshData.positions);
  // meshData.cells = GlRenderer.USHORT(meshData.cells);
  // console.log(meshData);
  // meshData.uniforms = {
  //   u_transform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  // };


  function update() {
    const meshData = getData();
    renderer.setMeshData(meshData);
    // renderer.setMeshData(meshDatas);
    // renderer.setMeshData([
    //   meshData, meshData, meshData, meshData,
    // ]);
    requestAnimationFrame(update);
  }
  update();
  renderer.render();
}());

export default {
  all: 42,
};