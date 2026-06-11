'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

function getParticleGrid(width: number, height: number) {
  if (width < 768) {
    return { amountX: 28, amountY: 32, separation: 140 };
  }

  const amountX = Math.min(160, Math.max(48, Math.round(width / 14)));
  const amountY = Math.min(48, Math.max(24, Math.round(height / 18)));
  const separation = width > 1400 ? 110 : width > 1024 ? 125 : 140;

  return { amountX, amountY, separation };
}

function updateCameraForSize(camera: THREE.PerspectiveCamera, width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  camera.aspect = aspect;
  camera.fov = Math.min(88, 58 + Math.max(0, aspect - 1.2) * 18);
  camera.position.z = 1220 + Math.max(0, aspect - 1.5) * 520;
  camera.updateProjectionMatrix();
}

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
    geometry: THREE.BufferGeometry;
    material: THREE.PointsMaterial;
    resizeObserver: ResizeObserver;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialWidth = container.clientWidth;
    const initialHeight = container.clientHeight;
    const { amountX: AMOUNTX, amountY: AMOUNTY, separation: SEPARATION } = getParticleGrid(
      initialWidth,
      initialHeight
    );

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0e141f, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(60, 1, 1, 10000);
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0e141f, 0);
    renderer.domElement.className = 'h-full w-full block';

    container.appendChild(renderer.domElement);

    const positions: number[] = [];
    const colors: number[] = [];

    const geometry = new THREE.BufferGeometry();

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions.push(x, y, z);
        colors.push(1, 1, 1);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    let animationId = 0;

    const resize = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      updateCameraForSize(camera, width, height);
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      resize(entry.contentRect.width, entry.contentRect.height);
    });

    resizeObserver.observe(container);
    resize(container.clientWidth, container.clientHeight);

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const positionAttribute = geometry.attributes.position;
      const positionArray = positionAttribute.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const index = i * 3;
          positionArray[index + 1] =
            Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
          i++;
        }
      }

      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
      count += 0.1;
    };

    animate();

    sceneRef.current = {
      scene,
      camera,
      renderer,
      animationId,
      geometry,
      material,
      resizeObserver,
    };

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      {...props}
    />
  );
}
