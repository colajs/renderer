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
