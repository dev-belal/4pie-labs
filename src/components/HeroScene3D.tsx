"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Phase 3 hero 3D scene — port of v2's hero-3d.js to React Three Fiber.
 *
 * Composition: a glassy iridescent icosahedron with a violet inner sphere,
 * two orbit rings (violet + peach), and a 90-particle field. Mouse parallax
 * (smooth lerp) on hover. Theme-aware: a MutationObserver on
 * document.documentElement re-tints materials when data-theme flips, and the
 * scene respects prefers-reduced-motion by freezing on a single render.
 *
 * Mounted via dynamic({ ssr: false }) from Hero.tsx — three.js touches window
 * at module-eval time, so it must never render on the server.
 */

function Scene() {
  const mainRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const mainMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const innerMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ring1MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const particleMatRef = useRef<THREE.PointsMaterial>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const reducedRef = useRef(false);
  const { camera, gl } = useThree();

  // Theme-aware tinting. Re-runs whenever <html data-theme> changes.
  // Amber palette: light uses neutral glass + amber-600 core; dark goes pure
  // amber crystal floating in off-black (the brand image).
  useEffect(() => {
    const apply = () => {
      const dark =
        document.documentElement.getAttribute("data-theme") === "dark";
      if (mainMatRef.current) {
        mainMatRef.current.color.setHex(dark ? 0xfbbf24 : 0xffffff);
        mainMatRef.current.iridescence = dark ? 0.85 : 0.7;
      }
      if (innerMatRef.current) {
        innerMatRef.current.color.setHex(dark ? 0xfde68a : 0xd97706);
      }
      if (ring1MatRef.current) {
        ring1MatRef.current.color.setHex(dark ? 0xfbbf24 : 0xd97706);
        ring1MatRef.current.opacity = dark ? 0.55 : 0.45;
      }
      if (particleMatRef.current) {
        particleMatRef.current.color.setHex(dark ? 0xfbbf24 : 0xd97706);
        particleMatRef.current.opacity = dark ? 0.7 : 0.55;
      }
    };
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  // Reduced-motion subscription.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Mouse parallax — track pointer relative to the canvas.
  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseRef.current.tx =
        ((e.clientX - rect.left) / rect.width - 0.5) * 0.6;
      mouseRef.current.ty =
        ((e.clientY - rect.top) / rect.height - 0.5) * 0.6;
    };
    const onLeave = () => {
      mouseRef.current.tx = 0;
      mouseRef.current.ty = 0;
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [gl.domElement]);

  // Particle field positions (computed once).
  const particleGeometry = useMemo(() => {
    const count = 90;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.6 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (reducedRef.current) return;
    const t = state.clock.getElapsedTime();
    const m = mouseRef.current;
    m.x += (m.tx - m.x) * 0.06;
    m.y += (m.ty - m.y) * 0.06;

    if (mainRef.current) {
      mainRef.current.rotation.x = t * 0.18 + m.y * 0.4;
      mainRef.current.rotation.y = t * 0.22 + m.x * 0.6;
    }
    if (innerRef.current) {
      const pulse = 1 + Math.sin(t * 1.3) * 0.04;
      innerRef.current.scale.setScalar(pulse);
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.12;
      ring2Ref.current.rotation.x = Math.PI / 4 + m.y * 0.3;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.04 + m.x * 0.2;
      particlesRef.current.rotation.x = m.y * 0.2;
    }
    camera.position.x = m.x * 0.4;
    camera.position.y = -m.y * 0.4;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <directionalLight position={[2, 3, 4]} intensity={1.6} />
      <directionalLight
        position={[-3, -2, 2]}
        color={0xfbbf24}
        intensity={0.8}
      />
      <directionalLight
        position={[-2, 4, -3]}
        color={0xe89b7c}
        intensity={0.6}
      />
      <ambientLight intensity={0.4} />

      <mesh ref={mainRef}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshPhysicalMaterial
          ref={mainMatRef}
          color={0xffffff}
          metalness={0.1}
          roughness={0.08}
          transmission={0.92}
          thickness={1.4}
          ior={1.45}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          envMapIntensity={1.2}
          iridescence={0.7}
          iridescenceIOR={1.3}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>

      <mesh ref={innerRef}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial
          ref={innerMatRef}
          color={0xd97706}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Orbit ring 1 — theme-aware amber core ring. */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.0, 0.012, 8, 80]} />
        <meshBasicMaterial
          ref={ring1MatRef}
          color={0xd97706}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Orbit ring 2 — warm peach, kept as a complementary contrast. */}
      <mesh
        ref={ring2Ref}
        rotation={[Math.PI / 4, 0, Math.PI / 3]}
      >
        <torusGeometry args={[2.4, 0.008, 8, 80]} />
        <meshBasicMaterial color={0xe89b7c} transparent opacity={0.35} />
      </mesh>

      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          ref={particleMatRef}
          color={0xd97706}
          size={0.04}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}

export default function HeroScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.5], fov: 40 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <Scene />
    </Canvas>
  );
}
