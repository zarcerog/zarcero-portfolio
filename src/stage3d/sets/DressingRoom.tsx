"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";

import { DRESSING_ROOM } from "@/theatre/content";

import { Q } from "../cues";
import { cardboard, haloMaterial, mats, setOpacity } from "../lib/materials";
import {
  certificateTexture,
  codeScreenTexture,
  destinationTexture,
  mirrorTexture,
  sleeveTexture,
  spineTexture,
} from "../lib/paint";
import { wallpaperTexture } from "../lib/signs";
import { Instances, mx, phaseOf, SetShell } from "./shell";

// ACT IV — the dressing room, between shows. The mirror with the manifesto on
// it; his records, books, guitar and drum; the jeans on the rail; and on the
// table, whatever he's building now.

const C = Q.act4;
const CUE = { a: C.setIn[0], b: C.setIn[1], c: C.setOut[0], d: C.setOut[1] };
const WALL_Z = -3.7;

/** The mirror lights: how bright, and where the practical light hangs. */
export function dressingLightAt(t: number) {
  return { k: phaseOf(CUE, t, 0.2), y: -10 * (1 - phaseOf(CUE, t, 0)) };
}

function Jeans() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.22, 0);
    s.lineTo(0.22, 0);
    s.lineTo(0.24, -0.25);
    s.lineTo(0.2, -1.0);
    s.lineTo(0.03, -1.0);
    s.lineTo(0, -0.32);
    s.lineTo(-0.03, -1.0);
    s.lineTo(-0.2, -1.0);
    s.lineTo(-0.24, -0.25);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false });
  }, []);
  return (
    <group>
      <mesh geometry={shape} material={cardboard("#35557a", { plain: true })} />
      <mesh position={[0.1, -0.1, 0.055]} material={cardboard("#9a6a3a")}>
        <planeGeometry args={[0.1, 0.06]} />
      </mesh>
    </group>
  );
}

function Coat() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.2, 0);
    s.lineTo(0.2, 0);
    s.lineTo(0.34, -0.2);
    s.lineTo(0.3, -1.25);
    s.lineTo(-0.3, -1.25);
    s.lineTo(-0.34, -0.2);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false });
  }, []);
  return <mesh geometry={shape} material={cardboard("#8a4b2f", { plain: true })} />;
}

function Guitar() {
  const m = mats();
  const body = cardboard("#d9a05b", { plain: true });
  return (
    <group rotation={[0, 0, 0.06]}>
      {/* the stand */}
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x, 0.18, 0.05]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]} material={m.blackMetal}>
          <cylinderGeometry args={[0.012, 0.012, 0.4, 5]} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0]} scale={[1, 1, 0.3]} material={body}>
        <sphereGeometry args={[0.3, 20, 14]} />
      </mesh>
      <mesh position={[0, 0.8, 0]} scale={[1, 1, 0.3]} material={body}>
        <sphereGeometry args={[0.22, 20, 14]} />
      </mesh>
      <mesh position={[0, 0.62, 0.09]} material={m.ink}>
        <circleGeometry args={[0.07, 20]} />
      </mesh>
      <mesh position={[0, 1.3, 0.02]} material={cardboard("#6b4125")}>
        <boxGeometry args={[0.06, 0.8, 0.04]} />
      </mesh>
      <mesh position={[0, 1.78, 0.02]} material={cardboard("#3a2216")}>
        <boxGeometry args={[0.1, 0.18, 0.04]} />
      </mesh>
    </group>
  );
}

function Drum() {
  const m = mats();
  return (
    <group>
      {[0, 2.1, 4.2].map((a) => (
        <mesh key={a} position={[Math.sin(a) * 0.2, 0.28, Math.cos(a) * 0.2]} rotation={[Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3]} material={m.steel}>
          <cylinderGeometry args={[0.012, 0.012, 0.6, 5]} />
        </mesh>
      ))}
      <mesh position={[0, 0.66, 0]} material={cardboard("#a3232e", { plain: true })}>
        <cylinderGeometry args={[0.34, 0.34, 0.2, 28]} />
      </mesh>
      <mesh position={[0, 0.765, 0]} material={m.cream}>
        <cylinderGeometry args={[0.33, 0.33, 0.012, 28]} />
      </mesh>
      {[-0.08, 0.08].map((x, i) => (
        <mesh key={x} position={[x, 0.8, 0.05]} rotation={[0, i ? 0.4 : -0.4, Math.PI / 2 - 0.12]} material={cardboard("#e6cfa2")}>
          <cylinderGeometry args={[0.012, 0.008, 0.42, 6]} />
        </mesh>
      ))}
    </group>
  );
}

export function DressingRoom() {
  const m = mats();
  const mirror = useMemo(() => mirrorTexture(DRESSING_ROOM.manifesto), []);
  const honour = DRESSING_ROOM.honour;
  const cert = useMemo(() => certificateTexture(honour.title, honour.from, honour.for, honour.date), [honour]);
  const sleeve = useMemo(() => sleeveTexture("Kind of Blue", "Miles Davis", "1959"), []);
  const board = useMemo(() => destinationTexture("BARCELONA  →  ??"), []);
  const paper = useMemo(() => {
    const t = wallpaperTexture("#3f5e4f", "stripe");
    t.repeat.set(6, 3);
    return t;
  }, []);
  const spines = useMemo(
    () => [spineTexture("Giovanni's Room", "Baldwin", "#2f5e57"), spineTexture("Kafka on the Shore", "Murakami", "#a3232e"), spineTexture("The Stranger", "Camus", "#dcae45")],
    [],
  );
  const screen = useMemo(() => new THREE.MeshBasicMaterial({ map: codeScreenTexture(21, true), toneMapped: false }), []);
  const bulbMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff1cf", toneMapped: false }), []);
  const glow = useMemo(() => haloMaterial("#ffdca0", 0), []);
  const record = useRef<THREE.Mesh>(null);
  // the bulbs round the mirror, all the way round
  const bulbs = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    const w = 3.3;
    const h = 2.3;
    for (let i = 0; i <= 8; i++) {
      const x = -w / 2 + (w * i) / 8;
      out.push(mx(x, h / 2 + 0.12, 0), mx(x, -h / 2 - 0.12, 0));
    }
    for (let i = 1; i < 6; i++) {
      const y = -h / 2 + (h * i) / 6;
      out.push(mx(-w / 2 - 0.12, y, 0), mx(w / 2 + 0.12, y, 0));
    }
    return out;
  }, []);
  const bulbGeo = useMemo(() => new THREE.SphereGeometry(0.07, 10, 8), []);

  const onFrame = (t: number) => {
    const k = dressingLightAt(t).k;
    bulbMat.color.setRGB(1, 0.94, 0.8).multiplyScalar(0.5 + k * 0.8);
    setOpacity(glow, k * 0.55);
    if (record.current) record.current.rotation.y = performance.now() / 300;
  };

  const frameMat = cardboard("#e8d6b0");

  return (
    <SetShell
      cue={CUE}
      onFrame={onFrame}
      drop={3}
      trap={[3.0, 1.4, -2.75]}
      flown={
        <>
          <mesh position={[0, 4.1, WALL_Z]}>
            <planeGeometry args={[16, 8.2]} />
            <meshLambertMaterial map={paper} />
          </mesh>
          <mesh position={[0, 0.6, WALL_Z + 0.04]} material={cardboard("#5a2226")}>
            <boxGeometry args={[16, 1.2, 0.08]} />
          </mesh>
          <mesh position={[0, 1.22, WALL_Z + 0.09]} material={m.cream}>
            <boxGeometry args={[16, 0.07, 0.08]} />
          </mesh>
          {/* the mirror, ringed with bulbs, the manifesto upon it */}
          <group position={[0, 3.25, WALL_Z + 0.08]}>
            <mesh material={frameMat}>
              <boxGeometry args={[3.9, 2.9, 0.08]} />
            </mesh>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[3.3, 2.26]} />
              <meshBasicMaterial map={mirror} color="#e2e2dc" />
            </mesh>
            <group position={[0, 0, 0.08]}>
              <Instances geometry={bulbGeo} material={bulbMat} matrices={bulbs} />
            </group>
            <mesh position={[0, 0, 0.3]} material={glow}>
              <planeGeometry args={[6.4, 5]} />
            </mesh>
          </group>
          {/* either side: the honour, and the record */}
          {[
            [-4.3, cert, 1.4, 1.1],
            [4.3, sleeve, 1.0, 1.0],
          ].map(([x, map, w, h]) => (
            <group key={x as number} position={[x as number, 3.6, WALL_Z + 0.06]}>
              <mesh material={m.goldDull}>
                <boxGeometry args={[(w as number) + 0.16, (h as number) + 0.16, 0.05]} />
              </mesh>
              <mesh position={[0, 0, 0.03]}>
                <planeGeometry args={[w as number, h as number]} />
                <meshLambertMaterial map={map as THREE.Texture} />
              </mesh>
            </group>
          ))}
          {/* where next: a destination board, hung from the grid */}
          <group position={[0, 5.45, WALL_Z + 0.4]}>
            {[-1.4, 1.4].map((x) => (
              <mesh key={x} position={[x, 2, 0]} material={m.ink}>
                <cylinderGeometry args={[0.006, 0.006, 4, 4]} />
              </mesh>
            ))}
            <mesh>
              <boxGeometry args={[3.6, 0.56, 0.05]} />
              <meshLambertMaterial attach="material-0" color="#1f3b5c" />
              <meshLambertMaterial attach="material-1" color="#1f3b5c" />
              <meshLambertMaterial attach="material-2" color="#1f3b5c" />
              <meshLambertMaterial attach="material-3" color="#1f3b5c" />
              <meshLambertMaterial attach="material-4" map={board} />
              <meshLambertMaterial attach="material-5" color="#1f3b5c" />
            </mesh>
          </group>
        </>
      }
      left={
        <group>
          {/* the costume rail: the jeans (1988, the real ones) and a coat */}
          <group position={[-4.7, 0, -2.4]}>
            {[-0.9, 0.9].map((x) => (
              <mesh key={x} position={[x, 1.1, 0]} material={m.steel}>
                <cylinderGeometry args={[0.025, 0.025, 2.2, 8]} />
              </mesh>
            ))}
            <mesh position={[0, 2.18, 0]} rotation={[0, 0, Math.PI / 2]} material={m.steel}>
              <cylinderGeometry args={[0.022, 0.022, 1.86, 8]} />
            </mesh>
            {[-0.9, 0.9].map((x) => (
              <mesh key={`f${x}`} position={[x, 0.03, 0]} material={m.steel}>
                <boxGeometry args={[0.08, 0.06, 0.6]} />
              </mesh>
            ))}
            <group position={[-0.35, 2.05, 0]}>
              <Jeans />
            </group>
            <group position={[0.35, 2.08, -0.05]}>
              <Coat />
            </group>
          </group>
          <group position={[-3.0, 0, -1.1]} rotation={[0, 0.3, 0]}>
            <Guitar />
          </group>
        </group>
      }
      right={
        <group>
          {/* the books, one of them on its third reading */}
          <group position={[3.3, 0, -1.2]}>
            <mesh position={[0, 0.3, 0]} material={cardboard("#6b4125")}>
              <boxGeometry args={[0.8, 0.6, 0.6]} />
            </mesh>
            {spines.map((map, i) => (
              <group key={i} position={[0, 0.65 + i * 0.1, 0]} rotation={[0, (i - 1) * 0.12, 0]}>
                <mesh material={m.cream}>
                  <boxGeometry args={[0.62, 0.095, 0.44]} />
                </mesh>
                <mesh position={[0, 0, 0.222]}>
                  <planeGeometry args={[0.62, 0.095]} />
                  <meshLambertMaterial map={map} />
                </mesh>
              </group>
            ))}
          </group>
          <group position={[4.8, 0, -2.0]}>
            <Drum />
          </group>
        </group>
      }
      centre={
        <group position={[0, 0, -2.75]}>
          {/* the dressing table, and what's on it tonight */}
          <mesh position={[0, 0.78, 0]} material={cardboard("#6b4125")}>
            <boxGeometry args={[2.6, 0.07, 0.8]} />
          </mesh>
          {[-1.22, 1.22].map((x) => (
            <mesh key={x} position={[x, 0.38, 0]} material={cardboard("#5a361f")}>
              <boxGeometry args={[0.07, 0.76, 0.72]} />
            </mesh>
          ))}
          {/* a record player, with the one record */}
          <group position={[-0.75, 0.82, 0.05]}>
            <mesh position={[0, 0.05, 0]} material={cardboard("#3a2216")}>
              <boxGeometry args={[0.6, 0.1, 0.46]} />
            </mesh>
            <mesh ref={record} position={[-0.04, 0.115, 0]} material={m.ink}>
              <cylinderGeometry args={[0.19, 0.19, 0.012, 32]} />
            </mesh>
            <mesh position={[-0.04, 0.124, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.004, 20]} />
              <meshLambertMaterial color="#2f5e9a" />
            </mesh>
            <mesh position={[0.18, 0.15, 0.03]} rotation={[0, 0.5, 0]} material={m.steel}>
              <boxGeometry args={[0.02, 0.02, 0.3]} />
            </mesh>
          </group>
          {/* the laptop: Ara, coming soon(ish) */}
          <group position={[0.2, 0.82, 0.05]}>
            <mesh position={[0, 0.012, 0.08]} material={cardboard("#aab2b6")}>
              <boxGeometry args={[0.42, 0.025, 0.28]} />
            </mesh>
            <group position={[0, 0.14, -0.07]} rotation={[-0.2, 0, 0]}>
              <mesh material={cardboard("#aab2b6")}>
                <boxGeometry args={[0.42, 0.28, 0.02]} />
              </mesh>
              <mesh position={[0, 0, 0.012]} material={screen}>
                <planeGeometry args={[0.38, 0.24]} />
              </mesh>
            </group>
          </group>
          {/* a coffee, and a jar of brushes */}
          <mesh position={[0.75, 0.87, 0.1]} material={m.cream}>
            <cylinderGeometry args={[0.05, 0.045, 0.1, 16]} />
          </mesh>
          <mesh position={[1.0, 0.9, -0.1]} material={cardboard("#9fcde0", { plain: true })}>
            <cylinderGeometry args={[0.07, 0.07, 0.16, 16]} />
          </mesh>
          {/* and his chair, back to us */}
          <group position={[0, 0, 0.75]} rotation={[0, Math.PI, 0]}>
            <mesh position={[0, 0.47, 0]} material={cardboard("#a3232e")}>
              <boxGeometry args={[0.5, 0.05, 0.46]} />
            </mesh>
            {[-0.22, 0.22].map((x) => (
              <group key={x}>
                <mesh position={[x, 0.225, 0]} material={cardboard("#a3232e")}>
                  <boxGeometry args={[0.035, 0.45, 0.42]} />
                </mesh>
                <mesh position={[x, 0.5, -0.21]} material={cardboard("#a3232e")}>
                  <boxGeometry args={[0.04, 1.0, 0.04]} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 0.82, -0.21]} material={cardboard("#a3232e")}>
              <boxGeometry args={[0.5, 0.34, 0.03]} />
            </mesh>
          </group>
        </group>
      }
    />
  );
}
