import normalize from 'normalize-path-scale';
import svgMesh3d from 'svg-mesh-3d';
import triangulate from 'triangulate-contours';
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

export default class Mesh2D {
  constructor(figure, {width, height} = {width: 150, height: 150}) {
    this[_figure] = figure;
    this[_stroke] = null;
    this[_fill] = null;
    this[_bound] = [[0, 0], [width, height]];
  }

  setStroke({thickness = 1, cap = 'butt', join = 'miter', miterLimit = 0, color = [0, 0, 0, 0]} = {}) {
    this[_stroke] = stroke({thickness, cap, join, miterLimit});
    this[_strokeColor] = color;
  }

  setFill({delaunay = true, clean = true, randomization = 0, color = [0, 0, 0, 0]}) {
    this[_fill] = {delaunay, clean, randomization};
    this[_fillColor] = color;
  }

  // {stroke, fill}
  get meshData() {
    if(this[_mesh] && this[_figure].path === this[_path]) return this[_mesh];

    this[_path] = this[_figure].path;

    const contours = this[_figure].contours;
    const meshes = {};

    if(contours && contours.length) {
      if(this[_fill]) {
        const mesh = triangulate(contours);
        normalize(mesh.positions, this[_bound]);
        mesh.positions = mesh.positions.map((p) => {
          p[1] *= -1;
          p.push(0);
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
          normalize(mesh.positions, this[_bound]);
          mesh.positions = mesh.positions.map((p) => {
            p[1] *= -1;
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

    return flattenMeshes([meshes.fill, meshes.stroke]);
  }
}