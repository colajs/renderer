import parse from 'parse-svg-path';
import simplify from 'simplify-path';
import contours from 'svg-path-contours';
import normalize from 'normalize-path-scale';

const d = 'M0,0L0,100L100,100z';

const lines = contours(parse(d)).map((path) => {
  return simplify(path, 0);
});
normalize(lines[0], [[-256, -256], [256, 256]]);

console.log(lines);

export default {
  all: 42,
};