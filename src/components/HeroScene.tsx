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
 * Hero 3D element.
 *
 * Three floating primitives in the brand palette — reads as an abstract
 * cluster of "AI nodes" without being literal. Auto-rotates slowly,
 * gently distorts the central mesh, and floats each piece on its own
 * timing for a living, premium-SaaS feel.
 *
 * Loaded via next/dynamic with ssr:false from Hero.tsx — three.js touches
 * `window` at module-eval time, so it must never run on the server.
 */
function CoreMesh() {
  const ref = useRef<Mesh>(null!);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
      ref.current.rotation.x += delta * 0.05;
    }
  });
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <icosahedronGeometry args={[1.4, 4]} />
      <MeshDistortMaterial
        color="#8b5cf6"
        emissive="#6d28d9"
        emissiveIntensity={0.35}
        distort={0.45}
        speed={1.6}
        roughness={0.15}
        metalness={0.85}
      />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <div className="w-full h-[420px] md:h-[520px]">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 6, 5]}
          intensity={1.2}
          color="#a78bfa"
        />
        <directionalLight
          position={[-5, -3, -2]}
          intensity={0.8}
          color="#3b82f6"
        />
        <pointLight position={[0, 0, 4]} intensity={0.6} color="#ffffff" />

        <Suspense fallback={null}>
          {/* Centerpiece — distorted icosahedron */}
          <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.4}>
            <CoreMesh />
          </Float>

          {/* Satellite — accent torus, top-right */}
          <Float
            speed={1.8}
            rotationIntensity={1.5}
            floatIntensity={1.8}
            position={[2.4, 1.1, -0.5]}
          >
            <mesh castShadow>
              <torusGeometry args={[0.55, 0.18, 32, 100]} />
              <meshStandardMaterial
                color="#3b82f6"
                emissive="#1d4ed8"
                emissiveIntensity={0.3}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
          </Float>

          {/* Satellite — primary octahedron, bottom-left */}
          <Float
            speed={1.6}
            rotationIntensity={1.2}
            floatIntensity={1.6}
            position={[-2.4, -1.1, -0.5]}
          >
            <mesh castShadow>
              <octahedronGeometry args={[0.75, 0]} />
              <meshStandardMaterial
                color="#a78bfa"
                emissive="#7c3aed"
                emissiveIntensity={0.3}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          </Float>

          {/* Atmospheric sparkles for depth */}
          <Sparkles
            count={60}
            scale={[8, 5, 4]}
            size={2}
            speed={0.4}
            opacity={0.6}
            color="#a78bfa"
          />
        </Suspense>

        {/* Slow auto-rotate — no zoom, no pan, no user-breakable orbit */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}
