/* Pure math shared by the browser and Node tests. No training or sampling model. */
(function (root) {
  'use strict';
  function finite(...values) {
    if (values.some(v => !Number.isFinite(v))) throw new TypeError('请输入有限数字。');
  }
  function cosine(t) {
    finite(t);
    if (t < 0 || t > 1) throw new RangeError('t 必须介于 0 和 1 之间。');
    if (t === 0) return { alpha: 1, sigma: 0 };
    if (t === 1) return { alpha: 0, sigma: 1 };
    return { alpha: Math.cos(Math.PI * t / 2), sigma: Math.sin(Math.PI * t / 2) };
  }
  function mix(x0, alpha, sigma, epsilon) {
    finite(x0, alpha, sigma, epsilon);
    return alpha * x0 + sigma * epsilon;
  }
  function loss(prediction, target) {
    finite(prediction, target);
    return (prediction - target) ** 2;
  }
  function estimate(xt, alpha, sigma, prediction) {
    finite(xt, alpha, sigma, prediction);
    if (Math.abs(alpha) < 1e-8) return null;
    return (xt - sigma * prediction) / alpha;
  }
  function format(value, digits = 3) {
    if (value === null || !Number.isFinite(value)) return '不可反算';
    const rounded = Number(value.toFixed(digits));
    return Object.is(rounded, -0) ? '0' : String(rounded);
  }
  function gaussianArray(length, seed = 12345) {
    if (!Number.isInteger(length) || length < 0 || length > 1e6) throw new RangeError('无效的数组长度。');
    let state = seed >>> 0;
    function random() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return (state + 1) / 4294967297;
    }
    const out = new Float32Array(length);
    for (let i = 0; i < length; i += 2) {
      const r = Math.sqrt(-2 * Math.log(random()));
      const angle = 2 * Math.PI * random();
      out[i] = r * Math.cos(angle);
      if (i + 1 < length) out[i + 1] = r * Math.sin(angle);
    }
    return out;
  }
  root.DiffusionMath = Object.freeze({ cosine, mix, loss, estimate, format, gaussianArray });
})(globalThis);
