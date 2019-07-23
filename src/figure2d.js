import parse from 'parse-svg-path';
import simplify from 'simplify-path';
import contours from 'svg-path-contours';
import getBounds from 'bound-points';

function buildCommand(key, args) {
  return `${key}${args.join(' ')}`;
}

const _contours = Symbol('contours');
const _path = Symbol('path');
const _simplify = Symbol('simplify');

export default class Figure2D {
  constructor(options = {}) {
    this[_path] = '';
    this[_contours] = null;
    this[_simplify] = options.simplify || 0;
  }

  clear() {
    this[_path] = '';
    this[_contours] = null;
  }

  get contours() {
    if(this[_contours]) return this[_contours];
    if(this[_path]) {
      this[_contours] = contours(parse(this[_path])).map((path) => {
        return simplify(path, this[_simplify]);
      });
      return this[_contours];
    }
    return null;
  }

  get path() {
    return this[_path];
  }

  get BoundingBox() {
    return getBounds(this.contours);
  }

  get simplify() {
    return this[_simplify];
  }

  addPath(path) {
    this[_contours] = null;
    this[_path] += path;
  }

  beginPath() {
    this.moveTo(0, 0);
  }

  moveTo(x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('M', [x, y]);
  }

  lineTo(x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('L', [x, y]);
  }

  arcTo(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('A', [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y]);
  }

  quadraticCurveTo(x1, y1, x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('Q', [x1, y1, x, y]);
  }

  bezierCurveTo(x1, y1, x2, y2, x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('C', [x1, y1, x2, y2, x, y]);
  }

  closePath() {
    this[_contours] = null;
    this[_path] += 'Z';
  }
}