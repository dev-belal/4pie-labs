"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  OrbitControls,
  Sparkles,
} from "@react-three/drei";
import type { Mesh } from "three";

/**
 * Hero 3D background.
 *
 * Designed to sit absolutely-positioned behind the hero text. Satellites
 * are pushed wider and farther back than the centerpiece so the focal
 * area behind the headline stays soft (no element competes with the type).
 *
 * Loaded via next/dynamic with ssr:false from Hero.tsx — three.js touches
 * `window` at module-eval time, so it must never run on the server.
 */
function CoreMesh() {
  const ref = useRef<Mesh>(null!);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.12;
      ref.current.rotation.x += delta * 0.04;
    }
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.6, 4]} />
      <MeshDistortMaterial
        color="#8b5cf6"
        emissive="#6d28d9"
        emissiveIntensity={0.4}
        distort={0.5}
        speed={1.4}
        roughness={0.15}
        metalness={0.9}
      />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 6, 5]} intensity={1.1} color="#a78bfa" />
      <directionalLight
        position={[-5, -3, -2]}
        intensity={0.7}
        color="#3b82f6"
      />
      <pointLight position={[0, 0, 4]} intensity={0.5} color="#ffffff" />

      <Suspense fallback={null}>
        {/* Centerpiece — pushed back so it sits behind the headline */}
        <Float
          speed={1.2}
          rotationIntensity={0.5}
          floatIntensity={1.2}
          position={[0, 0, -1.5]}
        >
          <CoreMesh />
        </Float>

        {/* Satellite — accent torus, far top-right */}
        <Float
          speed={1.6}
          rotationIntensity={1.4}
          floatIntensity={1.6}
          position={[3.6, 1.6, -0.5]}
        >
          <mesh>
            <torusGeometry args={[0.65, 0.2, 32, 100]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive="#1d4ed8"
              emissiveIntensity={0.35}
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
        </Float>

        {/* Satellite — primary octahedron, far bottom-left */}
        <Float
          speed={1.4}
          rotationIntensity={1.1}
          floatIntensity={1.5}
          position={[-3.6, -1.6, -0.5]}
        >
          <mesh>
            <octahedronGeometry args={[0.85, 0]} />
            <meshStandardMaterial
              color="#a78bfa"
              emissive="#7c3aed"
              emissiveIntensity={0.35}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        </Float>

        {/* Atmospheric sparkles — wider spread for backdrop coverage */}
        <Sparkles
          count={90}
          scale={[12, 7, 5]}
          size={2.2}
          speed={0.35}
          opacity={0.5}
          color="#a78bfa"
        />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
