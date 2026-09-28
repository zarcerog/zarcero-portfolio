"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useStage } from "@/theatre/engine";

import { Q } from "../cues";
import { roundedBox } from "../lib/geom";
import { mats } from "../lib/materials";
import { cloudTexture, gullTexture, hutTexture, raysTexture, sandTexture } from "../lib/paint";
import { umbrellaTexture } from "../lib/signs";

const C = Q.act1;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const out3 = (p: number) => 1 - Math.pow(1 - p, 3);
const in3 = (p: number) => p * p * p;

/** 0 = struck (off stage) … 1 = set. Each piece enters on its own sub-cue. */
function presence(t: number, delayIn: number, delayOut: number) {
  const [ia, ib] = C.setIn;
  const [oa, ob] = C.setOut;
  const len = ib - ia;
  const pin = out3(seg(t, ia + len * delayIn, ia + len * (delayIn + 0.55)));
  const olen = ob - oa;
  const pout = in3(seg(t, oa + olen * delayOut, oa + olen * (delayOut + 0.6)));
  return pin * (1 - pout);
}

function extrude(shape: THREE.Shape, depth = 0.12) {
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 24 });
}

function ridge(width: number, base: number, points: [number, number][]) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(-width / 2, base);
  const pts = points.map(([x, y]) => new THREE.Vector2(x, y));
  const curve = new THREE.SplineCurve([new THREE.Vector2(-width / 2, base), ...pts, new THREE.Vector2(width / 2, base)]);
  curve.getPoints(80).forEach((p) => s.lineTo(p.x, p.y));
  s.lineTo(width / 2, 0);
  s.closePath();
  return s;
}

function waveShape(width: number, h: number, period: number, amp: number) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(-width / 2, h);
  for (let x = -width / 2; x < width / 2; x += period) {
    s.quadraticCurveTo(x + period / 2, h + amp * 2.2, x + period, h);
  }
  s.lineTo(width / 2, 0);
  s.closePath();
  return s;
}

function House({ x, w, h, color }: { x: number; w: number; h: number; color: string }) {
  const m = mats();
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, 0.5]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, h + 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[w * 0.78, 0.42, 4]} />
        <meshLambertMaterial color="#c3624b" />
      </mesh>
      <mesh position={[0, h * 0.55, 0.26]} material={m.bulb}>
        <planeGeometry args={[0.12, 0.18]} />
      </mesh>
    </group>
  );
}

function Train() {
  const m = mats();
  const windowMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#26363d" }),
    [],
  );
  const body = useMemo(() => new THREE.MeshLambertMaterial({ color: "#f3ead8" }), []);
  const stripe = useMemo(() => new THREE.MeshLambertMaterial({ color: "#b8323a" }), []);
  const car = (x: number, nose: boolean, panto: boolean) => (
    <group position={[x, 0, 0]} key={x}>
      <mesh geometry={roundedBox(4.3, 1.2, 0.95, nose ? 0.34 : 0.12)} position={[0, 0.78, 0]} material={body} />
      <mesh position={[0, 0.42, 0.48]} material={stripe}>
        <boxGeometry args={[4.1, 0.36, 0.02]} />
      </mesh>
      <mesh position={[0, 1.2, 0.48]} material={stripe}>
        <boxGeometry args={[4.1, 0.1, 0.02]} />
      </mesh>
      <mesh position={[nose ? -0.25 : 0, 0.95, 0.48]} material={windowMat}>
        <boxGeometry args={[nose ? 3.2 : 3.8, 0.3, 0.02]} />
      </mesh>
      {nose && (
        <mesh position={[1.9, 0.98, 0.3]} rotation={[0, 0.9, 0]} material={windowMat}>
          <boxGeometry args={[0.55, 0.36, 0.02]} />
        </mesh>
      )}
      <mesh position={[0, 1.42, 0]} material={m.steel}>
        <boxGeometry args={[3.9, 0.08, 0.7]} />
      </mesh>
      {panto && (
        <group position={[0, 1.46, 0]}>
          <mesh position={[-0.2, 0.3, 0]} rotation={[0, 0, 0.7]} material={m.blackMetal}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 4]} />
          </mesh>
          <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, -0.7]} material={m.blackMetal}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 4]} />
          </mesh>
          <mesh position={[0, 0.58, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.blackMetal}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
          </mesh>
        </group>
      )}
      {[-1.5, -1.1, 1.1, 1.5].map((wx) => (
        <mesh key={wx} position={[wx, 0.14, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={m.blackMetal}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group>
      {car(-4.45, false, false)}
      {car(0, false, true)}
      {car(4.45, true, false)}
    </group>
  );
}

function Umbrella({ x }: { x: number }) {
  const m = mats();
  const tex = useMemo(() => umbrellaTexture(), []);
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.8, 0]} material={m.darkWood}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
      </mesh>
      <mesh position={[0, 1.68, 0]}>
        <coneGeometry args={[0.95, 0.4, 16, 1, true]} />
        <meshLambertMaterial map={tex} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}


/** A bathing hut: striped canvas, a pitched roof, a door with a porthole. */
function Hut({ x, stripe, roof, flip = 1 }: { x: number; stripe: THREE.Texture; roof: string; flip?: number }) {
  const m = mats();
  const roofGeo = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.44, 0);
    sh.lineTo(0, 0.34);
    sh.lineTo(0.44, 0);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false });
    g.translate(0, 0, -0.25);
    return g;
  }, []);
  return (
    <group position={[x, 0.7, -2.58]} scale={[flip, 1, 1]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.74, 0.9, 0.44]} />
        <meshLambertMaterial map={stripe} />
      </mesh>
      <mesh position={[0, 0.9, 0]} geometry={roofGeo}>
        <meshLambertMaterial color={roof} />
      </mesh>
      <mesh position={[0, 0.34, 0.225]} material={m.cream}>
        <boxGeometry args={[0.34, 0.6, 0.02]} />
      </mesh>
      <mesh position={[0, 0.52, 0.24]} material={m.ink}>
        <circleGeometry args={[0.06, 16]} />
      </mesh>
      <mesh position={[0, 1.28, 0]} material={m.gold}>
        <sphereGeometry args={[0.035, 10, 8]} />
      </mesh>
    </group>
  );
}

/** A little boat, rocking between the waves, its sail split down the mast. */
function Boat() {
  const m = mats();
  const hull = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.62, 0.26);
    sh.quadraticCurveTo(-0.45, 0, -0.3, 0);
    sh.lineTo(0.3, 0);
    sh.quadraticCurveTo(0.45, 0, 0.62, 0.26);
    sh.closePath();
    return extrude(sh, 0.3);
  }, []);
  const sail = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.5, 0);
    sh.lineTo(0, 1.05);
    sh.lineTo(0.5, 0);
    sh.closePath();
    return new THREE.ShapeGeometry(sh);
  }, []);
  const hullMat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#f3ead8" }), []);
  const sailMat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#fbf4e6", side: THREE.DoubleSide }), []);
  const stripe = useMemo(() => new THREE.MeshLambertMaterial({ color: "#c8474a" }), []);
  return (
    <group>
      <mesh geometry={hull} material={hullMat} position={[0, 0, -0.15]} />
      <mesh position={[0, 0.2, 0.17]} material={stripe}>
        <boxGeometry args={[1.0, 0.05, 0.01]} />
      </mesh>
      <mesh position={[0, 0.85, 0]} material={m.darkWood}>
        <cylinderGeometry args={[0.018, 0.018, 1.3, 6]} />
      </mesh>
      <mesh geometry={sail} material={sailMat} position={[0, 0.34, 0.03]} />
      <mesh position={[0, 0.72, 0.035]} material={stripe}>
        <boxGeometry args={[0.36, 0.06, 0.005]} />
      </mesh>
      <mesh position={[0, 1.54, 0]} rotation={[0, 0, Math.PI / 2]} material={stripe}>
        <coneGeometry args={[0.05, 0.18, 3]} />
      </mesh>
    </group>
  );
}

const CLOUDS: [number, number, number, number, number][] = [
  // x, y, z, scale, seed — mirrored in pairs
  [-6.3, 5.5, -9.6, 1.15, 3],
  [-3.3, 6.35, -9.9, 0.8, 8],
  [3.3, 6.35, -9.9, 0.8, 8],
  [6.3, 5.5, -9.6, 1.15, 3],
];

export function Coast() {
  const stage = useStage();
  const root = useRef<THREE.Group>(null);
  const sky = useRef<THREE.Group>(null);
  const far = useRef<THREE.Group>(null);
  const mid = useRef<THREE.Group>(null);
  const town = useRef<THREE.Group>(null);
  const waves = useRef<(THREE.Group | null)[]>([]);
  const rail = useRef<THREE.Group>(null);
  const train = useRef<THREE.Group>(null);
  const beach = useRef<THREE.Group>(null);
  const clouds = useRef<(THREE.Group | null)[]>([]);
  const slots = useRef<(THREE.Mesh | null)[]>([]);
  const huts = useRef<(THREE.Group | null)[]>([]);
  const rays = useRef<THREE.Mesh>(null);
  const boat = useRef<THREE.Group>(null);
  const gulls = useRef<(THREE.Group | null)[]>([]);
  const m = mats();

  const geos = useMemo(
    () => ({
      far: extrude(ridge(26, 2.8, [[-9, 4.1], [-5, 3.4], [-2, 4.0], [0, 3.1], [2.2, 4.0], [5.5, 3.3], [9, 4.3]])),
      mid: extrude(ridge(26, 2.0, [[-10, 2.6], [-6, 3.1], [-3, 2.3], [3, 2.3], [6.5, 3.2], [10, 2.5]])),
      hill: extrude(ridge(9, 0.0, [[-3.3, 1.6], [-1.6, 2.5], [0, 2.75], [1.6, 2.5], [3.3, 1.6]])),
      waves: [1.85, 1.55, 1.25, 0.95].map((h, i) => extrude(waveShape(30, h, 0.9 + i * 0.1, 0.18), 0.1)),
      sand: extrude(ridge(26, 0.72, [[-9, 0.98], [-5.5, 0.84], [-2.4, 0.95], [0, 0.86], [2.4, 0.95], [5.5, 0.84], [9, 0.98]]), 0.3),
    }),
    [],
  );
  const hillMats = useMemo(
    () => ({
      far: new THREE.MeshLambertMaterial({ color: "#b9d0bb" }),
      mid: new THREE.MeshLambertMaterial({ color: "#98bb90" }),
      hill: new THREE.MeshLambertMaterial({ color: "#7fa877" }),
      waves: ["#8fc0bf", "#6fa6a8", "#5a9397", "#4a8286"].map((c) => new THREE.MeshLambertMaterial({ color: c })),
      clouds: [3, 8].map((seed) => new THREE.MeshLambertMaterial({ map: cloudTexture(seed), alphaTest: 0.5 })),
      rays: new THREE.MeshBasicMaterial({ map: raysTexture(), transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending }),
      gull: new THREE.MeshBasicMaterial({ map: gullTexture(), alphaTest: 0.4, side: THREE.DoubleSide }),
      sand: (() => {
        const map = sandTexture();
        map.repeat.set(0.16, 0.9);
        return new THREE.MeshLambertMaterial({ map, color: "#ffffff" });
      })(),
      huts: ["#e58c86", "#6fa6a8", "#e8b85c"].map((c) => hutTexture(c)),
      ochre: new THREE.MeshLambertMaterial({ color: "#d9a560", map: m.brick.map, bumpMap: m.brick.bumpMap, bumpScale: 1.2 }),
      sun: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffc66b").multiplyScalar(1.6) }),
      slot: new THREE.MeshBasicMaterial({ color: "#050202" }),
      halo: new THREE.MeshBasicMaterial({ color: "#ffd89a", transparent: true, opacity: 0.18, depthWrite: false }),
    }),
    [m],
  );

  useFrame(() => {
    const t = stage.t;
    const on = t > C.setIn[0] - 0.05 && t < C.setOut[1] + 0.05;
    if (root.current) root.current.visible = on;
    if (!on) return;

    const pSky = presence(t, 0, 0.4);
    if (sky.current) sky.current.position.y = (1 - pSky) * 12;
    clouds.current.forEach((c, i) => {
      // mirrored pairs sway in mirror image
      if (c) c.rotation.z = Math.sin(t * 1.6 + (i < 2 ? i : 3 - i) * 2.1) * 0.035 * (i < 2 ? 1 : -1);
    });
    if (rays.current) rays.current.rotation.z = t * 0.12;
    if (boat.current) {
      // the boat sails in from stage left and away to stage right
      const [ia, ib] = C.setIn;
      const [oa, ob] = C.setOut;
      const sailIn = out3(seg(t, ia + (ib - ia) * 0.3, ia + (ib - ia) * 0.95));
      const sailOut = in3(seg(t, oa, oa + (ob - oa) * 0.7));
      boat.current.rotation.z = Math.sin(t * 2.6 + 0.8) * 0.06;
      boat.current.position.x = -(1 - sailIn) * 15 + sailOut * 15;
      boat.current.position.y = 1.32 + Math.sin(t * 2.6 + 1.6) * 0.05;
    }
    gulls.current.forEach((g, i) => {
      if (!g) return;
      g.scale.y = 0.75 + Math.sin(t * 9) * 0.25;
      g.position.y = 4.4 + Math.sin(t * 1.3) * 0.12 + (1 - presence(t, 0.05, 0.3)) * 8;
      g.position.x = (i ? 1 : -1) * (2.3 + Math.sin(t * 0.9) * 0.15);
    });
    // ground rows rise and sink through cuts in the stage floor; a cut is
    // open only while its piece is travelling through it
    const cut = (i: number, p: number) => {
      const sl = slots.current[i];
      if (!sl) return;
      sl.visible = p > 0.002 && p < 0.998;
      // the cut slides open before the piece reaches the floor, and shut after it has gone
      const k = Math.min(1, p / 0.22);
      sl.scale.y = Math.max(0.001, k * k * (3 - 2 * k));
    };
    const pFar = presence(t, 0.1, 0.3);
    const pMid = presence(t, 0.18, 0.25);
    const pTown = presence(t, 0.26, 0.2);
    if (far.current) far.current.position.y = -(1 - pFar) * 6.5;
    if (mid.current) mid.current.position.y = -(1 - pMid) * 6.5;
    if (town.current) town.current.position.y = -(1 - pTown) * 7;
    cut(0, pFar);
    cut(1, pMid);
    cut(2, pTown);
    waves.current.forEach((w, i) => {
      if (!w) return;
      const p = presence(t, 0.3 + i * 0.05, 0.1 + i * 0.04);
      const dir = i % 2 ? 1 : -1;
      // the wave machine: rows slide against each other and rock
      w.position.x = dir * ((1 - p) * 26 + ((t * 0.8) % (0.9 + i * 0.1)));
      w.position.y = Math.sin(t * 2.6 + i) * 0.06;
      w.rotation.x = Math.sin(t * 2.6 + i) * 0.03;
    });
    const pRail = presence(t, 0.45, 0.05);
    const pSand = presence(t, 0.5, 0);
    if (rail.current) rail.current.position.y = -(1 - pRail) * 4.6;
    if (beach.current) beach.current.position.y = -(1 - pSand) * 1.4;
    cut(3, pRail);
    cut(4, pSand);
    // the huts and umbrellas are trucked on and off from the wings, half each side
    const pHuts = presence(t, 0.42, 0.05);
    huts.current.forEach((h, i) => {
      if (h) h.position.x = (i ? 1 : -1) * (1 - pHuts) * 10;
    });
    if (train.current) {
      const p = seg(t, C.train[0], C.train[1]);
      train.current.position.x = -26 + p * 52;
      train.current.position.y = Math.sin(t * 90) * 0.008;
    }
  });

  return (
    <group ref={root} visible={false}>
      {/* sky pieces, flown */}
      <group ref={sky}>
        <mesh position={[0, 5.3, -10.2]} material={hillMats.sun}>
          <circleGeometry args={[1.35, 64]} />
        </mesh>
        <mesh position={[0, 5.3, -10.25]} material={hillMats.halo}>
          <circleGeometry args={[2.4, 64]} />
        </mesh>
        <mesh ref={rays} position={[0, 5.3, -10.3]} material={hillMats.rays}>
          <planeGeometry args={[8, 8]} />
        </mesh>
        {CLOUDS.map(([x, y, z, s], i) => (
          <group key={i} position={[x, 14, z]} ref={(g) => void (clouds.current[i] = g)}>
            {[-0.55, 0.55].map((wx) => (
              <mesh key={wx} position={[wx * s, -(14 - y) / 2, 0]} material={m.ink}>
                <cylinderGeometry args={[0.006, 0.006, 14 - y, 4]} />
              </mesh>
            ))}
            <mesh position={[0, -(14 - y) - 0.35 * s, 0]} scale={[(x > 0 ? -1 : 1) * 2.9 * s, 1.45 * s, 1]} material={hillMats.clouds[i === 0 || i === 3 ? 0 : 1]}>
              <planeGeometry args={[1, 1]} />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={far}>
        <mesh geometry={geos.far} material={hillMats.far} position={[0, 0, -9.3]} />
      </group>
      <group ref={mid}>
        <mesh geometry={geos.mid} material={hillMats.mid} position={[0, 0, -8.5]} />
      </group>
      <group ref={town} position={[0, 0, -7.7]}>
        <mesh geometry={geos.hill} material={hillMats.hill} position={[0, 1.2, 0]} />
        <group position={[0, 3.75, 0.1]}>
          <House x={-1.5} w={0.55} h={0.5} color="#f2c6c0" />
          <House x={-0.9} w={0.5} h={0.7} color="#f3e3c3" />
          <House x={-0.4} w={0.42} h={0.85} color="#e7b56d" />
          <House x={0.45} w={0.42} h={0.8} color="#eaa9a4" />
          <House x={0.95} w={0.5} h={0.66} color="#f3e3c3" />
          <House x={1.5} w={0.55} h={0.48} color="#f2c6c0" />
          {/* bell tower */}
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.34, 1.6, 0.34]} />
            <meshLambertMaterial color="#f6ecd6" />
          </mesh>
          <mesh position={[0, 1.68, 0]}>
            <sphereGeometry args={[0.22, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshLambertMaterial color="#6fa3a5" />
          </mesh>
          <mesh position={[0, 1.2, 0.18]} material={m.gold}>
            <circleGeometry args={[0.09, 20]} />
          </mesh>
          {[-2.4, -2.05, 2.05, 2.4].map((x) => (
            <mesh key={x} position={[x, -0.25 - Math.abs(x) * 0.18, 0]}>
              <sphereGeometry args={[0.13, 12, 10]} />
              <meshLambertMaterial color="#48704f" />
            </mesh>
          ))}
          {[-2.4, -2.05, 2.05, 2.4].map((x) => (
            <mesh key={`c${x}`} position={[x, -0.1 - Math.abs(x) * 0.18, 0]} scale={[1, 3.2, 1]}>
              <sphereGeometry args={[0.12, 12, 10]} />
              <meshLambertMaterial color="#48704f" />
            </mesh>
          ))}
        </group>
      </group>

      {/* the wave machine */}
      {geos.waves.map((g, i) => (
        <group key={i} ref={(el) => void (waves.current[i] = el)} position={[0, 0, -6.7 + i * 0.6]}>
          <mesh geometry={g} material={hillMats.waves[i]} />
        </group>
      ))}

      {/* a boat between the second and third rows of waves */}
      <group ref={boat} position={[-15, 1.32, -5.8]}>
        <Boat />
      </group>

      {/* two gulls on wires, flapping in unison */}
      {[-1, 1].map((sd, i) => (
        <group key={sd} ref={(g) => void (gulls.current[i] = g)} position={[sd * 2.3, 4.4, -8.0]}>
          <mesh material={hillMats.gull} scale={[sd * 0.7, 0.35, 1]}>
            <planeGeometry args={[1, 1]} />
          </mesh>
        </group>
      ))}

      {/* the railway on its sea wall */}
      <group ref={rail} position={[0, 0, -4.0]}>
        <mesh position={[0, 0.3, 0]} material={hillMats.ochre}>
          <boxGeometry args={[28, 0.6, 1.0]} />
        </mesh>
        {[-0.22, 0.22].map((z) => (
          <mesh key={z} position={[0, 0.63, z]} rotation={[0, 0, Math.PI / 2]} material={m.steel}>
            <cylinderGeometry args={[0.03, 0.03, 28, 6]} />
          </mesh>
        ))}
        {Array.from({ length: 7 }, (_, i) => -12.6 + i * 4.2).map((x) => (
          <group key={x} position={[x, 0.6, -0.55]}>
            <mesh position={[0, 1.6, 0]} material={m.blackMetal}>
              <cylinderGeometry args={[0.04, 0.05, 3.2, 6]} />
            </mesh>
            <mesh position={[0, 2.9, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={m.blackMetal}>
              <cylinderGeometry args={[0.025, 0.025, 0.7, 4]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 3.52, 0]} rotation={[0, 0, Math.PI / 2]} material={m.ink}>
          <cylinderGeometry args={[0.008, 0.008, 28, 4]} />
        </mesh>
        <group ref={train} position={[-26, 0.52, 0]}>
          <Train />
        </group>
      </group>

      {/* the beach: a ground row of sand, and the huts trucked on from the wings */}
      <group ref={beach} position={[0, 0, -2.6]}>
        <mesh geometry={geos.sand} material={hillMats.sand} />
      </group>
      {[-1, 1].map((sd, i) => (
        <group key={sd} ref={(g) => void (huts.current[i] = g)} position={[sd * 10, 0, 0]}>
          <Hut x={sd * 3.3} stripe={hillMats.huts[0]} roof="#c8605a" flip={sd} />
          <Hut x={sd * 4.3} stripe={hillMats.huts[1]} roof="#3f7f83" flip={sd} />
          <Hut x={sd * 5.3} stripe={hillMats.huts[2]} roof="#c98f2e" flip={sd} />
          <group position={[0, 0.72, -2.5]}>
            <Umbrella x={sd * 1.9} />
          </group>
        </group>
      ))}

      {/* the cuts in the stage floor the ground rows travel through */}
      {[
        [26, 0.4, -9.24],
        [26, 0.4, -8.44],
        [9.4, 0.5, -7.62],
        [28, 1.2, -4.0],
        [26, 0.5, -2.42],
      ].map(([w, d, z], i) => (
        <mesh key={i} ref={(el) => void (slots.current[i] = el)} position={[0, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]} material={hillMats.slot} visible={false}>
          <planeGeometry args={[w, d]} />
        </mesh>
      ))}
    </group>
  );
}
