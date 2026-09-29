"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { CAST_SIZE, castRect, paintCast } from "./paint/cast";
import { ATLAS, paintAtlas, tileRect } from "./paint/country";
import { put, W } from "./world";

// ---------------------------------------------------------------------------
// Painted cut-outs standing on the ground: one instanced quad per tree, house
// or person, always turned to face the lens (like the flats of a toy theatre
// turned on their stands), each with a soft shadow at its feet. They grow in
// when planted or built and fold away when the city comes for them — all in
// the vertex shader, from the year.
// ---------------------------------------------------------------------------

export interface Cutout {
  name: string;
  x: number;
  z: number;
  /** scale on the tile's own size */
  s: number;
  /** grows in from `from` over `grow` years; folds away before `to` (as quickly as it grew, up to half a year) */
  from: number;
  to: number;
  grow?: number;
  /** mirror it, for variety */
  flip?: boolean;
  /** colour variation, ±0.1 */
  tint?: number;
  /** flip between the two frames this many times a second (cast only) */
  anim?: number;
  /** 0…1: where in its little routine this one is */
  phase?: number;
  /** radians: a toy-theatre wobble on its stand */
  wobble?: number;
  /** share of each cycle spent on the gesture frame (default ½) */
  duty?: number;
}

type Rect = { u0: number; v0: number; u1: number; v1: number };

/** A painted sheet of cut-outs: its texture, and where each thing is on it. */
export interface Sheet {
  texture: () => THREE.Texture;
  rect: (name: string, frame: number) => Rect;
  size: (name: string) => { w: number; h: number };
}

const VERT = /* glsl */ `
  attribute vec3 aPos;
  attribute vec2 aSize;
  attribute vec4 aRect;
  attribute vec4 aRect2;
  attribute vec3 aLife;
  attribute vec2 aVar;
  attribute vec4 aAnim;
  uniform float uYear;
  uniform float uTime;
  varying vec2 vUv;
  varying float vTint;
  #include <common>
  #include <fog_pars_vertex>
  void main() {
    float grow = smoothstep(aLife.x, aLife.x + aLife.z, uYear);
    float fold = 1.0 - smoothstep(aLife.y - clamp(aLife.z * 3.0, 0.04, 0.5), aLife.y, uYear);
    float s = grow * fold;
    // turn to face the lens; when looking steeply down, lie back like a card
    vec3 fwd = -vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
    vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    float steep = smoothstep(0.55, 0.95, abs(fwd.y));
    vec3 right = normalize(vec3(viewMatrix[0][0], mix(0.0, viewMatrix[1][0], steep), viewMatrix[2][0]));
    vec3 up = normalize(mix(vec3(0.0, 1.0, 0.0), camUp, steep));
    vec2 corner = position.xy; // x: -0.5..0.5, y: 0..1
    // a little wobble on its stand, pivoting at the feet
    float wob = aAnim.z * sin(uTime * (1.1 + aAnim.y * 0.7) + aAnim.y * 6.2831);
    vec2 q = vec2(corner.x * aSize.x, corner.y * aSize.y) * s;
    q = vec2(q.x * cos(wob) - q.y * sin(wob), q.x * sin(wob) + q.y * cos(wob));
    vec3 p = aPos + right * q.x + up * q.y;
    // two frames: idle, and the gesture
    float fr = aAnim.x > 0.0 ? step(1.0 - aAnim.w, fract(uTime * aAnim.x + aAnim.y)) : 0.0;
    vec4 rect = mix(aRect, aRect2, fr);
    vec2 tuv = vec2(aVar.y > 0.0 ? 1.0 - uv.x : uv.x, uv.y);
    vUv = mix(rect.xy, rect.zw, tuv);
    vTint = aVar.x;
    vec4 mvPosition = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    if (s < 0.001) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    #include <fog_vertex>
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uLight;
  uniform float uNight;
  varying vec2 vUv;
  varying float vTint;
  #include <common>
  #include <fog_pars_fragment>
  void main() {
    vec4 c = texture2D(uMap, vUv);
    // a crisp, anti-aliased edge at any distance (alpha to coverage)
    float a = clamp((c.a - 0.5) / max(fwidth(c.a), 1e-4) + 0.5, 0.0, 1.0);
    if (a < 0.02) discard;
    vec3 col = c.rgb * (1.0 + vTint);
    gl_FragColor = vec4(col * uLight, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const SHADOW_VERT = /* glsl */ `
  attribute vec3 aPos;
  attribute vec2 aSize;
  attribute vec3 aLife;
  uniform float uYear;
  uniform vec2 uSun;
  varying vec2 vUv;
  void main() {
    float grow = smoothstep(aLife.x, aLife.x + aLife.z, uYear);
    float fold = 1.0 - smoothstep(aLife.y - clamp(aLife.z * 3.0, 0.04, 0.5), aLife.y, uYear);
    float s = grow * fold;
    vUv = position.xy + 0.5;
    // an ellipse on the ground, pushed away from the sun
    float r = aSize.x * 0.45 * s;
    vec3 p = aPos + vec3(position.x * r * 1.4 - uSun.x * aSize.y * 0.25 * s, 0.03, position.y * r - uSun.y * aSize.y * 0.25 * s);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
    if (s < 0.001) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`;

const SHADOW_FRAG = /* glsl */ `
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.3, 1.0, d)) * uStrength;
    gl_FragColor = vec4(0.12, 0.09, 0.06, a);
  }
`;

let atlasTex: THREE.CanvasTexture | null = null;
function atlas() {
  if (!atlasTex) {
    atlasTex = new THREE.CanvasTexture(paintAtlas());
    atlasTex.colorSpace = THREE.SRGBColorSpace;
    atlasTex.anisotropy = 4;
  }
  return atlasTex;
}

let castTex: THREE.CanvasTexture | null = null;
function cast() {
  if (!castTex) {
    castTex = new THREE.CanvasTexture(paintCast());
    castTex.colorSpace = THREE.SRGBColorSpace;
    castTex.anisotropy = 8;
  }
  return castTex;
}

/** Trees, farmhouses, haystacks, stones. */
export const COUNTRY: Sheet = { texture: atlas, rect: (n) => tileRect(n), size: (n) => ATLAS[n].size };
/** The people. */
export const CAST_SHEET: Sheet = { texture: cast, rect: castRect, size: () => CAST_SIZE };

export function Cutouts({ items, sheet = COUNTRY, shadows = true }: { items: Cutout[]; sheet?: Sheet; shadows?: boolean }) {
  const { mesh, shadow, mat, smat } = useMemo(() => {
    const n = items.length;
    const aPos = new Float32Array(n * 3);
    const aSize = new Float32Array(n * 2);
    const aRect = new Float32Array(n * 4);
    const aRect2 = new Float32Array(n * 4);
    const aLife = new Float32Array(n * 3);
    const aVar = new Float32Array(n * 2);
    const aAnim = new Float32Array(n * 4);
    items.forEach((it, i) => {
      const size = sheet.size(it.name);
      const r = sheet.rect(it.name, 0);
      const r2 = it.anim ? sheet.rect(it.name, 1) : r;
      aPos.set([it.x, 0, it.z], i * 3);
      aSize.set([size.w * it.s, size.h * it.s], i * 2);
      aRect.set([r.u0, r.v0, r.u1, r.v1], i * 4);
      aRect2.set([r2.u0, r2.v0, r2.u1, r2.v1], i * 4);
      aLife.set([it.from, it.to, it.grow ?? 3], i * 3);
      aVar.set([it.tint ?? 0, it.flip ? 1 : 0], i * 2);
      aAnim.set([it.anim ?? 0, it.phase ?? 0, it.wobble ?? 0, it.duty ?? 0.5], i * 4);
    });
    const quad = new THREE.PlaneGeometry(1, 1);
    quad.translate(0, 0.5, 0);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = quad.index;
    geo.setAttribute("position", quad.attributes.position);
    geo.setAttribute("uv", quad.attributes.uv);
    geo.setAttribute("aPos", new THREE.InstancedBufferAttribute(aPos, 3));
    geo.setAttribute("aSize", new THREE.InstancedBufferAttribute(aSize, 2));
    geo.setAttribute("aRect", new THREE.InstancedBufferAttribute(aRect, 4));
    geo.setAttribute("aRect2", new THREE.InstancedBufferAttribute(aRect2, 4));
    geo.setAttribute("aAnim", new THREE.InstancedBufferAttribute(aAnim, 4));
    geo.setAttribute("aLife", new THREE.InstancedBufferAttribute(aLife, 3));
    geo.setAttribute("aVar", new THREE.InstancedBufferAttribute(aVar, 2));
    geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      fog: true,
      alphaToCoverage: true,
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        uMap: { value: sheet.texture() },
        uYear: { value: 1881 },
        uTime: { value: 0 },
        uLight: { value: new THREE.Color(1, 1, 1) },
        uNight: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;

    const sq = new THREE.PlaneGeometry(1, 1);
    const sgeo = new THREE.InstancedBufferGeometry();
    sgeo.index = sq.index;
    sgeo.setAttribute("position", sq.attributes.position);
    sgeo.setAttribute("aPos", geo.attributes.aPos);
    sgeo.setAttribute("aSize", geo.attributes.aSize);
    sgeo.setAttribute("aLife", geo.attributes.aLife);
    sgeo.instanceCount = n;
    const smat = new THREE.ShaderMaterial({
      vertexShader: SHADOW_VERT,
      fragmentShader: SHADOW_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { uYear: { value: 1881 }, uSun: { value: new THREE.Vector2() }, uStrength: { value: 0.45 } },
    });
    const shadow = new THREE.Mesh(sgeo, smat);
    shadow.frustumCulled = false;
    shadow.renderOrder = -1;
    return { mesh, shadow, mat, smat };
  }, [items, sheet]);

  const light = useMemo(() => new THREE.Color(), []);
  const sky = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const L = W.light;
    // the cut-outs are painted lit; the day only tints them
    light.copy(L.sun).multiplyScalar(L.sunI * 0.22).add(sky.copy(L.sky).multiplyScalar(L.hemiI * 0.42));
    light.setRGB(Math.min(1.25, light.r), Math.min(1.25, light.g), Math.min(1.25, light.b));
    put(mat.uniforms.uYear, "value", W.year);
    put(mat.uniforms.uTime, "value", W.time);
    (mat.uniforms.uLight.value as THREE.Color).copy(light);
    put(smat.uniforms.uYear, "value", W.year);
    (smat.uniforms.uSun.value as THREE.Vector2).set(L.sunDir.x, L.sunDir.z).normalize();
    put(smat.uniforms.uStrength, "value", 0.45 * (1 - L.night * 0.8));
  });

  return (
    <group>
      {shadows && <primitive object={shadow} />}
      <primitive object={mesh} />
    </group>
  );
}
