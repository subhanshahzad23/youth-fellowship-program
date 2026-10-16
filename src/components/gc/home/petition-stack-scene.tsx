"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { LAYERS, TILES, TILE_NAMES, plateVisibility, splitAmount, type Layer } from "./layers";

/*
 * React Three Fiber scene for "How a Goodcase petition is built": an
 * isometric stack of frosted-glass plates (inspired by Legora's aOS section).
 * Scroll progress arrives through a ref, so scrolling never re-renders React;
 * every frame damps the plates toward their target pose.
 */

const W = 4.4;
const D = 3.0;
const H = 0.2;
const GAP = 0.66;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

type Shared = { stage: React.RefObject<number>; active: number; hovered: number | null; onHover: (i: number | null) => void; onSelect: (i: number) => void };

function fontFamily(name: "--font-newsreader" | "--font-dm-sans") {
  if (typeof document === "undefined") return "serif";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || (name === "--font-newsreader" ? "Georgia, serif" : "system-ui, sans-serif");
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, c: HTMLCanvasElement) => void, fontSpec: string) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const paint = () => {
    const g = c.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, w, h);
    draw(g, c);
    t.needsUpdate = true;
  };
  paint();
  // Redraw once the web font is ready so the label uses Newsreader / DM Sans.
  document.fonts?.load(fontSpec).then(paint).catch(() => {});
  return t;
}

/** Plate label drawn onto a canvas texture (crisp, no font download needed). */
function plateTexture(layer: Layer, index: number) {
  const serif = fontFamily("--font-newsreader");
  const sans = fontFamily("--font-dm-sans");
  return canvasTexture(
    1100,
    750,
    (g, c) => {
      const dark = layer.tone === "ink";
      g.fillStyle = dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
      g.font = `500 40px ${sans}`;
      g.fillText(String(index + 1).padStart(2, "0"), 70, 110);
      g.fillStyle = dark ? "#ffffff" : "#0b0b0b";
      g.font = `italic 300 ${layer.plate.length > 20 ? 92 : 104}px ${serif}`;
      g.fillText(layer.plate, 70, c.height - 70);
      if (dark) {
        const label = "Always yours";
        g.font = `600 38px ${sans}`;
        const w = g.measureText(label).width + 56;
        const x = c.width - w - 70;
        g.fillStyle = "#00c27a";
        g.beginPath();
        g.roundRect(x, 62, w, 70, 35);
        g.fill();
        g.fillStyle = "#000";
        g.fillText(label, x + 28, 110);
      }
    },
    `italic 300 100px ${serif}`,
  );
}

function tileTexture(code: string, name: string) {
  const serif = fontFamily("--font-newsreader");
  const sans = fontFamily("--font-dm-sans");
  return canvasTexture(
    520,
    540,
    (g, c) => {
      g.fillStyle = "#0b0b0b";
      g.font = `600 ${code.length > 5 ? 74 : 92}px ${sans}`;
      g.fillText(code, 50, c.height - 140);
      g.fillStyle = "rgba(0,0,0,0.55)";
      g.font = `italic 300 48px ${serif}`;
      g.fillText(name, 50, c.height - 70);
    },
    `600 80px ${sans}`,
  );
}

type GlassProps = React.ComponentProps<"meshPhysicalMaterial">;
function glass(tone: Layer["tone"]): GlassProps {
  if (tone === "ink") return { color: "#0d0d0d", roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.25, transparent: true, opacity: 0 };
  return {
    color: tone === "jade" ? "#d9fbe8" : tone === "mint" ? "#e9fff1" : "#ffffff",
    transmission: 0.94,
    thickness: 0.8,
    roughness: 0.22,
    ior: 1.38,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    attenuationColor: tone === "jade" ? "#7fe0ae" : tone === "mint" ? "#b4f5c8" : "#e4ebe8",
    attenuationDistance: 2.2,
    transparent: true,
    opacity: 0,
    emissive: "#00c27a",
    emissiveIntensity: 0,
  };
}

function Plate({ layer, index, shared }: { layer: Layer; index: number; shared: Shared }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const labelMat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => plateTexture(layer, index), [layer, index]);
  const isTop = index === LAYERS.length - 1;
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame((_, dt) => {
    const g = group.current;
    const material = mat.current;
    if (!g || !material) return;
    const stage = shared.stage.current ?? 0;
    const v = ease(plateVisibility(stage, index));
    const split = isTop ? splitAmount(stage) : 0;
    const targetY = index * GAP + (1 - v) * 1.8;
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 9, dt);
    const visible = v * (isTop ? 1 - Math.min(1, split * 4) : 1);
    material.opacity = THREE.MathUtils.damp(material.opacity, visible, 12, dt);
    const on = shared.active === index || shared.hovered === index;
    if (layer.tone !== "ink") material.emissiveIntensity = THREE.MathUtils.damp(material.emissiveIntensity, on ? 0.22 : 0, 8, dt);
    if (labelMat.current) labelMat.current.opacity = material.opacity;
    g.visible = material.opacity > 0.01;
  });

  return (
    <group ref={group} position={[0, index * GAP + 1.8, 0]}>
      <RoundedBox
        args={[W, H, D]}
        radius={0.09}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          if ((shared.stage.current ?? 0) + 1 >= index) {
            shared.onHover(index);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          shared.onHover(null);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          shared.onSelect(index);
        }}
      >
        <meshPhysicalMaterial ref={mat} {...glass(layer.tone)} />
      </RoundedBox>
      <mesh position={[0, H / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10 + index}>
        <planeGeometry args={[W - 0.1, D - 0.1]} />
        <meshBasicMaterial ref={labelMat} map={tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Tile({ i, shared }: { i: number; shared: Shared }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const labelMat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => tileTexture(TILES[i], TILE_NAMES[i]), [i]);
  useEffect(() => () => tex.dispose(), [tex]);
  const col = i % 3;
  const row = Math.floor(i / 3);
  const tw = W / 3;
  const td = D / 2;

  useFrame((state, dt) => {
    const g = group.current;
    const material = mat.current;
    if (!g || !material) return;
    const s = splitAmount(shared.stage.current ?? 0);
    const st = Math.min(1, Math.max(0, s * 1.4 - i * 0.07));
    const e = ease(st);
    const spread = 1 + 0.26 * e;
    const x = (col - 1) * tw * spread;
    const z = (row - 0.5) * td * spread;
    const y = (LAYERS.length - 1) * GAP + e * (0.7 + (1 - (i % 3) * 0.12) * 0.1 * Math.sin(state.clock.elapsedTime * 1.4 + i));
    g.position.x = THREE.MathUtils.damp(g.position.x, x, 10, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, z, 10, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, y, 10, dt);
    material.opacity = THREE.MathUtils.damp(material.opacity, s > 0.02 ? 1 : 0, 14, dt);
    if (labelMat.current) labelMat.current.opacity = material.opacity;
    g.visible = material.opacity > 0.01;
  });

  return (
    <group ref={group} position={[(col - 1) * tw, (LAYERS.length - 1) * GAP, (row - 0.5) * td]}>
      <RoundedBox args={[tw - 0.06, H, td - 0.06]} radius={0.07} smoothness={4}>
        <meshPhysicalMaterial ref={mat} {...glass("mint")} />
      </RoundedBox>
      <mesh position={[0, H / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={30 + i}>
        <planeGeometry args={[tw - 0.14, td - 0.14]} />
        <meshBasicMaterial ref={labelMat} map={tex} transparent depthWrite={false} toneMapped={false} opacity={0} />
      </mesh>
    </group>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const framed = useRef("");
  useFrame((state, dt) => {
    const key = `${state.size.width}x${state.size.height}`;
    if (framed.current !== key) {
      framed.current = key;
      const cam = state.camera as THREE.OrthographicCamera;
      cam.zoom = Math.min(state.size.width / 8.4, state.size.height / 8.6);
      cam.lookAt(0, 2.15, 0);
      cam.updateProjectionMatrix();
    }
    const g = group.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.22, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.05, 3, dt);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
  });
  return <group ref={group}>{children}</group>;
}

export default function PetitionStackScene({ stage, active, hovered, onHover, onSelect, running }: Shared & { running: boolean }) {
  const shared: Shared = { stage, active, hovered, onHover, onSelect };
  return (
    <Canvas
      orthographic
      dpr={[1, 1.75]}
      frameloop={running ? "always" : "never"}
      camera={{ position: [10, 8.6, 10], zoom: 60, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => onHover(null)}
      aria-hidden
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 12, 4]} intensity={1.4} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 6, -6]} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-7, 3, 2]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} position={[7, 2, 3]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} color="#d5f8e0" />
        <Lightformer form="circle" intensity={3} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={4} />
      </Environment>
      <Rig>
        {LAYERS.map((l, i) => (
          <Plate key={l.key} layer={l} index={i} shared={shared} />
        ))}
        {TILES.map((t, i) => (
          <Tile key={t} i={i} shared={shared} />
        ))}
      </Rig>
      <ContactShadows position={[0, -0.25, 0]} opacity={0.32} scale={14} blur={2.8} far={7} resolution={512} color="#0b2a1c" />
    </Canvas>
  );
}
