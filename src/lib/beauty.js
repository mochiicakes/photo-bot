// Beauty (美肌) pass in WebGL: edge-preserving skin smoothing plus a brightening curve.
// The same shader runs on the live camera feed and on photos at export time, so the
// effect looks the same in the preview and the saved strip.
//
// Smoothing is a bilateral blur (neighbours weighted by colour similarity, so edges like
// eyes and hair stay sharp) blended in only where the pixel looks like skin (YCbCr range).
// Brightening uses the log curve common in beauty filters (e.g. GPUPixel's whitening).

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAGMENT = `
precision highp float;
uniform sampler2D u_image;
uniform vec2 u_texel;
uniform float u_radius;
uniform float u_smooth;
uniform float u_brighten;
varying vec2 v_uv;

float skinMask(vec3 c) {
  float y = dot(c, vec3(0.299, 0.587, 0.114));
  float cb = 0.5 - 0.168736 * c.r - 0.331264 * c.g + 0.5 * c.b;
  float cr = 0.5 + 0.5 * c.r - 0.418688 * c.g - 0.081312 * c.b;
  float m = smoothstep(0.27, 0.31, cb) * (1.0 - smoothstep(0.50, 0.55, cb))
          * smoothstep(0.50, 0.535, cr) * (1.0 - smoothstep(0.68, 0.73, cr));
  return m * smoothstep(0.1, 0.25, y);
}

void main() {
  vec3 c = texture2D(u_image, v_uv).rgb;
  vec3 result = c;
  float mask = skinMask(c);

  if (u_smooth > 0.0) {
    vec3 sum = c;
    float total = 1.0;
    for (int ring = 1; ring <= 4; ring++) {
      float r = u_radius * float(ring) / 4.0;
      for (int k = 0; k < 12; k++) {
        float a = float(k) * 0.5235988 + float(ring) * 0.2617994;
        vec3 s = texture2D(u_image, v_uv + vec2(cos(a), sin(a)) * r * u_texel).rgb;
        vec3 d = s - c;
        float w = exp(-dot(d, d) / 0.012);
        sum += s * w;
        total += w;
      }
    }
    result = mix(c, sum / total, u_smooth * mask);
  }

  if (u_brighten > 0.0) {
    float beta = 1.0 + 4.0 * u_brighten;
    vec3 bright = log(result * (beta - 1.0) + 1.0) / log(beta);
    result = mix(result, bright, 0.55 + 0.45 * mask);
  }

  gl_FragColor = vec4(result, 1.0);
}`

const compile = (gl, type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader))
  return shader
}

export const isBeautyActive = ({ smooth = 0, brighten = 0 } = {}) => smooth > 0 || brighten > 0

/**
 * Creates a renderer drawing into `canvas` (a fresh one by default).
 * Returns null when WebGL isn't available.
 */
export const createBeautyRenderer = (canvas = document.createElement('canvas')) => {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false, alpha: false })
  if (!gl) return null

  const program = gl.createProgram()
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(program, 'a_pos')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

  const u = (name) => gl.getUniformLocation(program, name)
  const uniforms = { texel: u('u_texel'), radius: u('u_radius'), smooth: u('u_smooth'), brighten: u('u_brighten') }

  return {
    canvas,
    /** Draws `source` (image, video or canvas) at width x height with the beauty settings. */
    render(source, width, height, { smooth = 0, brighten = 0 } = {}) {
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
      gl.viewport(0, 0, width, height)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source)
      gl.uniform2f(uniforms.texel, 1 / width, 1 / height)
      // Blur radius scales with the image, so previews and exports smooth the same features.
      gl.uniform1f(uniforms.radius, Math.min(width, height) * 0.012)
      gl.uniform1f(uniforms.smooth, smooth)
      gl.uniform1f(uniforms.brighten, brighten)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      return canvas
    },
  }
}

const sizeOf = (source) => ({
  width: source.naturalWidth || source.videoWidth || source.width,
  height: source.naturalHeight || source.videoHeight || source.height,
})

/** Size to process at: the source size, capped so the long side is at most `maxSide`. */
export const fitSize = (source, maxSide) => {
  const { width, height } = sizeOf(source)
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

let sharedRenderer
const getSharedRenderer = () => {
  if (sharedRenderer === undefined) {
    try {
      sharedRenderer = createBeautyRenderer()
    } catch {
      sharedRenderer = null
    }
  }
  return sharedRenderer
}

const cache = new WeakMap()

/**
 * Returns a 2D canvas with the beauty pass applied to `img` (or `img` itself when the
 * settings are off or WebGL is unavailable). Results are cached per image and settings.
 */
export const beautify = (img, { smooth = 0, brighten = 0 } = {}, maxSide = 1600) => {
  if (!isBeautyActive({ smooth, brighten })) return img
  const renderer = getSharedRenderer()
  if (!renderer) return img

  let byKey = cache.get(img)
  if (!byKey) {
    byKey = new Map()
    cache.set(img, byKey)
  }
  const key = `${smooth}|${brighten}|${maxSide}`
  if (byKey.has(key)) return byKey.get(key)
  if (byKey.size > 12) byKey.clear()

  const { width, height } = fitSize(img, maxSide)
  renderer.render(img, width, height, { smooth, brighten })
  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  out.getContext('2d').drawImage(renderer.canvas, 0, 0)
  byKey.set(key, out)
  return out
}
