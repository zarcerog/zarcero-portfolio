"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { rng } from "@/stage3d/lib/canvas";

import { BUILD } from "../script";
import { birthTexture, coastX } from "./plan";
import { grainTexture } from "./textures";
import { built, put, W } from "./world";

// ---------------------------------------------------------------------------
// The ground: fields, tracks, streets, squares, beach and sea — all painted in
// one shader from the world position and the year. Lambert underneath, so it
// takes the sun, the shadows and the fog like everything else.
// ---------------------------------------------------------------------------

const GROUND_HEAD = /* glsl */ `
  uniform sampler2D uBirth;
  uniform sampler2D uGrain;
  uniform float uYear;
  uniform float uTime;
  uniform float uNight;
  uniform vec3 uFlash;
  uniform float uSite;
  varying vec3 vWPos;

  const float P = 13.3;
  const float B = 5.65;
  const float CH = 1.6;
  const float G = 24.0;
  const float NN = 49.0;
  const float REACH = 7.0;

  float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) { float s = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }

  float birthAt(vec2 cell) {
    vec2 uv = (cell + G + 0.5) / NN;
    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 2100.0;
    return texture2D(uBirth, uv).r * 255.0 + 1850.0;
  }

  vec3 fieldColor(vec2 p, float far) {
    float a = 0.38;
    vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
    vec2 size = vec2(9.0, 6.5);
    vec2 id = floor(q / size);
    vec2 f = fract(q / size);
    float strips = 1.0 + floor(h21(id) * 3.0);
    float sid = floor(f.x * strips);
    float sf = fract(f.x * strips);
    float h = h21(id * 1.7 + sid * 3.1);
    float type = floor(h * 5.0);
    vec3 soil = mix(vec3(0.63, 0.50, 0.35), vec3(0.54, 0.41, 0.29), h21(id + 9.0));
    float n = fbm(p * 0.35);
    vec3 c;
    float detail = 1.0 - far;
    if (type < 1.0) {
      float fur = sin(q.y * 9.0 + h * 6.0) * 0.5 + 0.5;
      c = mix(soil * 0.84, soil * 1.04, mix(0.5, fur, detail));
    } else if (type < 2.0) {
      float row = smoothstep(0.3, 0.5, abs(fract(q.x * 2.2 + h) - 0.5));
      c = mix(vec3(0.34, 0.47, 0.21), soil * 0.92, mix(0.35, row * 0.75, detail));
    } else if (type < 3.0) {
      vec2 g = fract(q * vec2(1.6, 2.6)) - 0.5;
      float vine = 1.0 - smoothstep(0.16, 0.32, length(g * vec2(1.0, 1.6)));
      c = mix(soil * 1.02, vec3(0.31, 0.40, 0.17), mix(0.3, vine * 0.85, detail));
    } else if (type < 4.0) {
      c = mix(vec3(0.80, 0.68, 0.43), vec3(0.71, 0.59, 0.36), n);
    } else {
      c = mix(vec3(0.53, 0.55, 0.31), vec3(0.43, 0.47, 0.26), n);
    }
    float e = min(min(f.x, 1.0 - f.x) * size.x, min(f.y, 1.0 - f.y) * size.y);
    e = min(e, min(sf, 1.0 - sf) * size.x / strips);
    c = mix(vec3(0.40, 0.38, 0.24), c, mix(1.0, smoothstep(0.04, 0.2, e), detail));
    c *= 0.9 + 0.2 * fbm(p * 0.8);
    // the old tracks between farms
    float d1 = abs(p.y - (8.0 * sin(p.x * 0.03 + 1.0) + 26.0));
    float d2 = abs(dot(p, normalize(vec2(1.0, 0.55))) - 12.0);
    float d3 = abs(p.x - (6.0 * sin(p.y * 0.05) - 34.0));
    float road = 1.0 - smoothstep(0.35, 0.6, min(min(d1, d2), d3));
    vec3 track = vec3(0.80, 0.71, 0.54) * (0.92 + 0.12 * vnoise(p * 3.0));
    return mix(c, track, road);
  }

  vec3 gColor;
  vec3 gGlow;

  void groundAt(vec2 p) {
    float far = smoothstep(0.06, 0.5, length(fwidth(p)));
    vec3 c = fieldColor(p, far);
    vec3 glow = vec3(0.0);

    vec2 cell = floor((p + P * 0.5) / P);
    vec2 l = p - cell * P;
    vec2 al = abs(l);
    float dBlock = max(max(al.x - B, al.y - B), (al.x + al.y - (2.0 * B - CH)) * 0.7071);
    float inB = step(dBlock, 0.0);
    bool special = cell.x == 0.0 && abs(cell.y) <= 1.0;
    float by = birthAt(cell);
    float streetBy = special ? 1905.0 : by;
    float urbStreet = smoothstep(streetBy - 1.0, streetBy + 2.0, uYear);
    float urbBlock = smoothstep(by - 0.5, by + 1.5, uYear);

    // — streets —
    float modern = smoothstep(1945.0, 1965.0, uYear);
    vec3 cobble = vec3(0.60, 0.56, 0.49) * (0.9 + 0.15 * vnoise(p * 4.0));
    vec3 asphalt = vec3(0.30, 0.30, 0.31) * (0.94 + 0.1 * vnoise(p * 2.0));
    vec3 street = mix(cobble, asphalt, modern);
    float walk = 1.0 - smoothstep(0.45, 0.5, dBlock);
    street = mix(street, vec3(0.72, 0.68, 0.62), walk * (1.0 - inB));
    // lane dashes, once there are cars
    float bx = P * 0.5 - al.x;
    float bz = P * 0.5 - al.y;
    float dash = 0.0;
    if (bx < 0.06 && al.y < B - 1.0) dash = step(0.5, fract(p.y * 0.35));
    if (bz < 0.06 && al.x < B - 1.0) dash = step(0.5, fract(p.x * 0.35));
    street = mix(street, vec3(0.86), dash * modern * (1.0 - far));
    // the tram lines in front of the Nativity façade
    float tram = smoothstep(1899.0, 1901.0, uYear) * (1.0 - smoothstep(1962.0, 1965.0, uYear));
    float rail = 1.0 - smoothstep(0.03, 0.06, min(abs(p.y - 6.3), abs(p.y - 7.0)));
    street = mix(street, vec3(0.2, 0.2, 0.22), rail * tram * (1.0 - far));
    // street lamps
    float along = min(abs(fract(p.x / 3.325) - 0.5), abs(fract(p.y / 3.325) - 0.5)) * 3.325;
    float edge = min(abs(dBlock - 0.35), 5.0);
    float lamp = exp(-(along * along + edge * edge) * 1.2);
    glow += vec3(1.0, 0.68, 0.36) * lamp * 0.5 * uNight * urbStreet * (1.0 - inB);
    glow += vec3(0.45, 0.33, 0.22) * 0.08 * uNight * urbStreet * (1.0 - inB);

    // — inside the blocks, beyond the modelled city: roofs and courtyards —
    vec3 roof = vec3(0.62, 0.52, 0.44) * (0.82 + 0.3 * h21(cell));
    float court = step(al.x, B - 2.4) * step(al.y, B - 2.4);
    roof = mix(roof, vec3(0.40, 0.44, 0.30) * (0.8 + 0.3 * vnoise(p * 2.0)), court);
    roof *= 0.9 + 0.2 * step(0.5, fract((l.x + l.y) * 1.3));
    float win = step(0.88, h21(floor(p * 3.0))) * (1.0 - court);
    vec3 roofGlow = vec3(1.0, 0.75, 0.42) * win * 0.9 * uNight;

    vec3 u = c;
    if (inB > 0.5) {
      if (!special) {
        u = mix(c, roof, urbBlock);
        glow += roofGlow * urbBlock * step(REACH + 0.5, max(abs(cell.x), abs(cell.y)));
      } else if (cell.y == 0.0) {
        // the building site, and later the pavement round the temple
        vec3 site = vec3(0.67, 0.57, 0.43) * (0.85 + 0.25 * fbm(p * 1.5));
        vec3 paved = vec3(0.80, 0.77, 0.71) * (0.95 + 0.05 * vnoise(p * 6.0));
        u = mix(c, site, uSite);
        u = mix(u, paved, smoothstep(1985.0, 1995.0, uYear));
        // the plan, traced on the ground: a Latin cross, five aisles, the apse
        vec2 q = p;
        float nave = max(max(-7.2 - q.x, q.x + 1.5), abs(q.y) - 2.35);
        float tran = max(abs(q.x) - 1.5, abs(q.y) - 3.7);
        float aps = max(length(q - vec2(1.5, 0.0)) - 2.6, 1.5 - q.x);
        float plan = min(min(nave, tran), aps);
        float inside = 1.0 - smoothstep(-0.02, 0.02, plan);
        float line = 1.0 - smoothstep(0.03, 0.07, abs(plan));
        vec2 col = abs(fract(q / vec2(0.9, 0.78)) - 0.5);
        float pillar = (1.0 - smoothstep(0.06, 0.1, length(col * vec2(0.9, 0.78)))) * step(plan, -0.2);
        vec3 floorC = mix(u, vec3(0.86, 0.8, 0.7), 0.55);
        u = mix(u, floorC, inside * uSite);
        u = mix(u, vec3(0.45, 0.33, 0.22), (line * 0.9 + pillar * 0.7) * uSite);
      } else {
        // the two squares: dust, grass, and (on the Nativity side) the pond
        float park = smoothstep(1912.0, 1920.0, uYear);
        vec3 dust = vec3(0.66, 0.59, 0.45);
        float grass = smoothstep(0.45, 0.6, fbm(p * 0.6));
        vec3 pk = mix(dust, vec3(0.36, 0.48, 0.25), grass * 0.8);
        float path = 1.0 - smoothstep(0.3, 0.5, min(abs(l.x), abs(l.x + l.y * 0.8)));
        pk = mix(pk, dust * 1.08, path);
        u = mix(c, pk, park);
        if (cell.y == 1.0) {
          float pond = length((l - vec2(0.0, 0.9)) / vec2(3.4, 1.9));
          float water = (1.0 - smoothstep(0.96, 1.0, pond)) * smoothstep(1978.0, 1982.0, uYear);
          vec3 wcol = mix(vec3(0.24, 0.40, 0.42), vec3(0.08, 0.10, 0.16), uNight);
          u = mix(u, wcol, water);
          glow += uFlash * water * 0.6;
          u = mix(u, vec3(0.78, 0.74, 0.66), (1.0 - smoothstep(0.0, 0.06, abs(pond - 1.0))) * smoothstep(1978.0, 1982.0, uYear));
        }
      }
    } else {
      u = mix(c, street, urbStreet);
    }

    // — the old town, always there, down by the port —
    vec2 ov = (p - vec2(-40.0, -300.0)) / vec2(80.0, 55.0);
    float old = 1.0 - smoothstep(0.8, 1.0, length(ov));
    vec3 oldCol = vec3(0.58, 0.44, 0.36) * (0.75 + 0.4 * h21(floor(p * 0.9)));
    u = mix(u, oldCol, old);
    glow += vec3(1.0, 0.72, 0.4) * step(0.9, h21(floor(p * 2.0))) * old * uNight * 0.8;

    // — beach and sea —
    float cx = -150.0 - 0.225 * (p.y - 100.0);
    float dx = p.x - cx;
    vec3 sand = vec3(0.86, 0.78, 0.62);
    u = mix(u, sand, 1.0 - smoothstep(2.0, 3.0, dx));
    float sea = 1.0 - smoothstep(-0.2, 0.2, dx);
    vec3 wave = mix(vec3(0.26, 0.50, 0.62), vec3(0.14, 0.33, 0.48), smoothstep(0.0, 60.0, -dx));
    float glint = pow(vnoise(p * vec2(0.6, 1.4) + vec2(uTime * 0.25, uTime * 0.1)), 8.0) * (1.0 - uNight);
    wave = mix(wave, vec3(0.04, 0.06, 0.12), uNight * 0.85);
    wave += glint * 0.5;
    wave = mix(wave, vec3(0.93, 0.95, 0.94), (1.0 - smoothstep(0.0, 0.9, -dx)) * (0.5 + 0.5 * sin(uTime * 1.3 + p.y * 0.4)));
    u = mix(u, wave, sea);

    u *= 0.93 + 0.14 * texture2D(uGrain, p * 0.21).r;
    gColor = u;
    gGlow = glow;
  }
`;

function groundMaterial() {
  const mat = new THREE.MeshLambertMaterial({ color: "#ffffff" });
  const uniforms = {
    uBirth: { value: birthTexture() },
    uGrain: { value: grainTexture() },
    uYear: { value: 1881 },
    uTime: { value: 0 },
    uNight: { value: 0 },
    uSite: { value: 0 },
    uFlash: { value: new THREE.Color(0, 0, 0) },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${GROUND_HEAD}`)
      .replace("#include <map_fragment>", "groundAt(vWPos.xz);\ndiffuseColor.rgb = gColor;\ntotalEmissiveRadiance += gGlow;");
  };
  return { mat, uniforms };
}

function Ground() {
  const { mat, uniforms } = useMemo(() => groundMaterial(), []);
  useFrame(() => {
    put(uniforms.uYear, "value", W.year);
    put(uniforms.uTime, "value", W.time);
    put(uniforms.uNight, "value", W.light.night);
    put(uniforms.uSite, "value", built(W.year, [1881.95, 1882.25]));
    uniforms.uFlash.value.copy(W.flashColor).multiplyScalar(W.flash);
  });
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[1800, 1800, 1, 1]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// The hills: Montjuïc to the south-west, Collserola & Tibidabo inland, and the
// Garraf far beyond. Painted by height, then left to the haze.
// ---------------------------------------------------------------------------

function vnoise2(r: () => number) {
  const g: number[] = [];
  for (let i = 0; i < 64 * 64; i++) g.push(r());
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const s = (t: number) => t * t * (3 - 2 * t);
    const v = (a: number, b: number) => g[(((a % 64) + 64) % 64) + (((b % 64) + 64) % 64) * 64];
    const a = v(xi, yi);
    const b = v(xi + 1, yi);
    const c = v(xi, yi + 1);
    const d = v(xi + 1, yi + 1);
    return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
  };
}

function hillGeometry(
  segU: number,
  segV: number,
  place: (u: number, v: number) => [number, number, number],
  tint: (h: number, u: number, v: number) => THREE.Color,
) {
  const g = new THREE.PlaneGeometry(1, 1, segU, segV);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  for (let k = 0; k < pos.count; k++) {
    const u = pos.getX(k) + 0.5;
    const v = pos.getY(k) + 0.5;
    const [x, y, z] = place(u, v);
    pos.setXYZ(k, x, y, z);
    const c = tint(y, u, v);
    colors[k * 3] = c.r;
    colors[k * 3 + 1] = c.g;
    colors[k * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

const PINE = new THREE.Color("#4c5f36");
const SCRUB = new THREE.Color("#7c7a4c");
const ROCK = new THREE.Color("#a08f73");

function Montjuic() {
  const geo = useMemo(() => {
    const r = rng(8);
    const n = vnoise2(r);
    return hillGeometry(
      90,
      60,
      (u, v) => {
        const x = (u - 0.5) * 200;
        const z = (v - 0.5) * 140;
        const d = Math.hypot(x / 70, z / 48);
        let h = 34 * Math.exp(-d * d * 1.6);
        // a plateau for the castle, a cliff to the sea
        h = Math.min(h, 30 + (h - 30) * 0.2);
        h += (n(x * 0.06, z * 0.06) - 0.5) * 5 * Math.min(1, h / 8);
        if (x < -30) h *= Math.max(0, 1 - (-30 - x) / 40);
        return [x - 50, Math.max(-1, h), z - 395];
      },
      (h, u, v) => {
        const c = PINE.clone().lerp(SCRUB, Math.max(0, Math.min(1, n(u * 30, v * 30) * 1.2 - 0.2)));
        if (h > 26) c.lerp(ROCK, 0.3);
        return c;
      },
    );
  }, []);
  return (
    <group>
      <mesh geometry={geo}>
        <meshLambertMaterial vertexColors />
      </mesh>
      {/* the castle: a low star fort on the summit */}
      <group position={[-40, 29.5, -400]}>
        <mesh>
          <cylinderGeometry args={[5.5, 6.2, 2.4, 5]} />
          <meshLambertMaterial color="#b8a482" />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[3.4, 2.2, 3.4]} />
          <meshLambertMaterial color="#c4b18e" />
        </mesh>
      </group>
    </group>
  );
}

/** A ridge that runs parallel to the coast, `off` units inland. */
function Ridge({ off, len, depth, peaks, color, seed, from, scale = 1 }: { off: number; len: number; depth: number; peaks: [number, number, number][]; color: string; seed: number; from: number; scale?: number }) {
  const geo = useMemo(() => {
    const r = rng(seed);
    const n = vnoise2(r);
    const dir = new THREE.Vector2(-0.225, 1).normalize();
    const perp = new THREE.Vector2(dir.y, -dir.x); // points inland (+x)
    const base = new THREE.Color(color);
    return hillGeometry(
      220,
      26,
      (u, v) => {
        const s = from + u * len;
        const w = (v - 0.5) * depth;
        const cz = s;
        const cx = coastX(cz) + off;
        const x = cx + perp.x * w + dir.x * 0;
        const z = cz + perp.y * w;
        // the skyline: a base height plus named peaks
        let top = 16 + n(s * 0.02, 0.5) * 18 + n(s * 0.08, 3.3) * 6;
        for (const [ps, ph, pw] of peaks) top += ph * Math.exp(-((s - ps) * (s - ps)) / (pw * pw));
        const profile = Math.pow(Math.sin(Math.PI * v), 0.8);
        return [x, top * profile * scale - 2, z];
      },
      (h) => base.clone().multiplyScalar(0.85 + Math.min(0.3, h / 200)),
    );
  }, [off, len, depth, peaks, color, seed, from, scale]);
  return (
    <mesh geometry={geo}>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

const COLLSEROLA_OFF = 420;
const COLLSEROLA_PEAKS: [number, number, number][] = [
  [60, 34, 40],
  [-120, 16, 60],
  [260, 20, 70],
];

/** The temple on the summit of Tibidabo, 1902–1961. */
function Tibidabo() {
  const ref = useRef<THREE.Group>(null);
  const top = useMemo(() => {
    const n = vnoise2(rng(3));
    const s = 60;
    let h = 16 + n(s * 0.02, 0.5) * 18 + n(s * 0.08, 3.3) * 6;
    for (const [ps, ph, pw] of COLLSEROLA_PEAKS) h += ph * Math.exp(-((s - ps) * (s - ps)) / (pw * pw));
    return [coastX(s) + COLLSEROLA_OFF, h - 2.5, s] as const;
  }, []);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = built(W.year, BUILD.tibidabo);
    g.visible = p > 0;
    g.scale.set(1, Math.max(0.001, p), 1);
  });
  return (
    <group
      ref={ref}
      position={[top[0], top[1], top[2]]}
    >
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[5, 4, 3]} />
        <meshLambertMaterial color="#b7a78e" />
      </mesh>
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[0.8, 1.2, 6, 8]} />
        <meshLambertMaterial color="#b7a78e" />
      </mesh>
      <mesh position={[0, 11, 0]}>
        <coneGeometry args={[0.6, 2, 8]} />
        <meshLambertMaterial color="#d4c08a" />
      </mesh>
    </group>
  );
}

export function Land() {
  return (
    <group>
      <Ground />
      <Montjuic />
      <Ridge off={COLLSEROLA_OFF} len={1100} depth={220} peaks={COLLSEROLA_PEAKS} color="#56663e" seed={3} from={-600} />
      {/* the Garraf, far beyond the Llobregat */}
      <Ridge off={90} len={900} depth={160} peaks={[[-980, 10, 120], [-760, 6, 80]]} color="#6b7a64" seed={5} from={-1450} scale={0.55} />
      <Tibidabo />
    </group>
  );
}
