const _context = Symbol('context');

export default class CanvasContext {
  constructor(context) {
    this[_context] = context;
  }

  get type() {
    return 'canvas';
  }
}