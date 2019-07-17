const _context = Symbol('context');

export default class WebGLContext {
  constructor(context) {
    this[_context] = context;
  }

  get type() {
    return 'webgl';
  }
}