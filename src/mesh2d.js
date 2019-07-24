import normalize from 'normalize-path-scale';
import triangulate from 'triangulate-contours';
import {mat2d} from 'gl-matrix';
import stroke from './extrude-polyline';
import {flattenMeshes} from './utils';

const _mesh = Symbol('mesh');
const _path = Symbol('path');
const _figure = Symbol('figure');
const _stroke = Symbol('stroke');
const _fill = Symbol('fill');
const _bound = Symbol('bound');
const _strokeColor = Symbol('strokeColor');
const _fillColor = Symbol('fillColor');
const _transform = Symbol('transform');
const _uniforms = Symbol('uniforms');
const _texOptions = Symbol('texOptions');
const _enableBlend = Symbol('enableBlend');

function transformPoint(p, m, w, h) {
  let [x, y] = p;

  x = (x + 1) * 0.5 * w;
  y = (-y + 1) * 0.5 * h;

  p[0] = x * m[0] + y * m[2] + m[4];
  p[1] = h - (x * m[1] + y * m[3] + m[5]);
  return p;
}

function isUnitTransform(m) {
  return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
}

function getTexCoord([x, y], [ox, oy, w, h], {scale, repeat}) {
  // console.log(imgWidth, imgHeight);
  if(!scale) {
    x /= w;
    y = 1 - (1 - y) / h;
    x -= ox;
    y += oy;
  }

  return [x, y];
}

export default class Mesh2D {
  constructor(figure, {width, height} = {width: 150, height: 150}) {
    this[_figure] = figure;
    this[_stroke] = null;
    this[_fill] = null;
    // this[_fill] = {
    //   delaunay: true,
    //   clean: true,
    //   randomization: 0,
    // };
    // this[_fillColor] = [0, 0, 0, 0];
    this[_bound] = [[0, 0], [width, height]];
    this[_transform] = [1, 0, 0, 1, 0, 0];
    this[_uniforms] = {};
  }

  setStroke({thickness = 1, cap = 'butt', join = 'miter', miterLimit = 0, color = [0, 0, 0, 0]} = {}) {
    this[_mesh] = null;
    this[_stroke] = stroke({thickness, cap, join, miterLimit});
    this[_strokeColor] = color;
    this[_enableBlend] = color[3] < 1.0;
  }

  setFill({delaunay = true, clean = true, randomization = 0, color = [0, 0, 0, 0]}) {
    this[_mesh] = null;
    this[_fill] = {delaunay, clean, randomization};
    this[_fillColor] = color;
    this[_enableBlend] = color[3] < 1.0;
  }

  get enableBlend() {
    return this[_enableBlend];
  }

  setTransform(m) {
    const {positions} = this.meshData;
    const transform = this[_transform];

    this[_transform] = m;

    m = mat2d(m) * mat2d.invert(transform); // eslint-disable-line operator-assignment

    const [w, h] = this[_bound][1];

    for(let i = 0; i < positions.length; i++) {
      const point = positions[i];
      transformPoint(point, m, w, h);
    }

    normalize(positions, this[_bound]);
    return positions;
  }

  setUniforms(uniforms = {}) {
    Object.assign(this[_uniforms], uniforms);
  }

  setTexture(texture, options = {}) {
    if(!this[_fill]) {
      this.setFill({color: [0, 0, 0, 0]});
    }
    this.setUniforms({
      u_texFlag: 1,
      u_texSampler: texture,
    });
    this[_texOptions] = options;
    const mesh = this.meshData;

    const transform = this[_transform];
    const {width: imgWidth, height: imgHeight} = texture._img;
    const rect = options.rect || [0, 0, imgWidth, imgHeight];
    if(rect[2] == null) rect[2] = imgWidth;
    if(rect[3] == null) rect[3] = imgHeight;

    const [w, h] = this[_bound][1];
    if(!isUnitTransform(transform)) {
      const m = mat2d.invert(transform);
      mesh.textureCoord = mesh.positions.map(([x, y, z]) => {
        if(z > 0) {
          [x, y] = transformPoint([x, y], m, w, h);
          [x, y] = [x / w, y / h];
          return getTexCoord([x, y], [rect[0] / imgWidth, rect[1] / imgHeight, rect[2] / w, rect[3] / h], this[_texOptions]);
        }
        return [0, 0];
      });
    } else {
      mesh.textureCoord = mesh.positions.map(([x, y, z]) => {
        if(z > 0) { // fillTag
          [x, y] = [0.5 * (x + 1), 0.5 * (y + 1)];
          return getTexCoord([x, y], [rect[0] / imgWidth, rect[1] / imgHeight, rect[2] / w, rect[3] / h], this[_texOptions]);
        }
        return [0, 0];
      });
    }
    if(options.repeat) {
      this[_uniforms].u_repeat = 1;
    } else {
      this[_uniforms].u_repeat = 0;
    }
  }

  get uniforms() {
    return this[_uniforms];
  }

  get transform() {
    return this[_transform];
  }

  // {stroke, fill}
  get meshData() {
    if(this[_mesh] && this[_figure].path === this[_path]) {
      return this[_mesh];
    }

    this[_path] = this[_figure].path;

    const contours = this[_figure].contours;
    const meshes = {};

    if(contours && contours.length) {
      if(this[_fill]) {
        const mesh = triangulate(contours);
        mesh.positions = mesh.positions.map((p) => {
          p[1] = this[_bound][1][1] - p[1];
          p.push(1);
          return p;
        });
        mesh.attributes = {
          a_color: Array(mesh.positions.length).fill(this[_fillColor]),
        };
        meshes.fill = mesh;
      }

      if(this[_stroke]) {
        const _meshes = contours.map(lines => this[_stroke].build(lines));
        _meshes.forEach((mesh) => {
          mesh.positions = mesh.positions.map((p) => {
            p[1] = this[_bound][1][1] - p[1];
            p.push(0);
            return p;
          });
          mesh.attributes = {
            a_color: Array(mesh.positions.length).fill(this[_strokeColor]),
          };
        });
        meshes.stroke = flattenMeshes(_meshes);
      }
    }

    const mesh = flattenMeshes([meshes.fill, meshes.stroke]);
    normalize(mesh.positions, this[_bound]);
    if(!this[_uniforms].u_texSampler) {
      mesh.textureCoord = mesh.positions.map(() => [0, 0]);
    }
    mesh.uniforms = this[_uniforms];
    if(!mesh.uniforms.u_texFlag) mesh.uniforms.u_texFlag = 0;
    this[_mesh] = mesh;
    return this[_mesh];
  }
}