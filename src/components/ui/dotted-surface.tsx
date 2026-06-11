'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type DottedSurfaceVariant = 'mobile' | 'desktop';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'> & {
  variant?: DottedSurfaceVariant;
};

type GridConfig = {
  amountX: number;
  amountY: number;
  separation: number;
  pointSize: number;
  maxPixelRatio: number;
  antialias: boolean;
  gridOffsetZ: number;
  cameraY: number;
};

function getParticleGrid(width: number, height: number, variant: DottedSurfaceVariant): GridConfig {
  if (variant === 'mobile') {
    return {
      amountX: Math.min(24, Math.max(18, Math.round(width / 22))),
      amountY: 10,
      separation: width > 400 ? 72 : 64,
      pointSize: 10,
      maxPixelRatio: 1,
      antialias: false,
      gridOffsetZ: 0,
      cameraY: 280,
    };
  }

  const amountX = Math.min(160, Math.max(48, Math.round(width / 14)));
  const amountY = Math.min(48, Math.max(24, Math.round(height / 18)));
  const separation = width > 1400 ? 110 : width > 1024 ? 125 : 140;

  return {
    amountX,
    amountY,
    separation,
    pointSize: 8,
    maxPixelRatio: 1.5,
    antialias: true,
    gridOffsetZ: -120,
    cameraY: 240,
  };
}

function updateCameraForSize(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  variant: DottedSurfaceVariant,
  cameraY: number
) {
  const aspect = width / Math.max(height, 1);
  camera.aspect = aspect;
  camera.position.y = cameraY;

  if (variant === 'mobile') {
    camera.fov = Math.min(82, 56 + Math.max(0, aspect - 1) * 14);
    camera.position.z = 1050 + Math.max(0, aspect - 1.2) * 320;
  } else {
    camera.fov = Math.min(86, 54 + Math.max(0, aspect - 1.2) * 16);
    camera.position.z = 1100 + Math.max(0, aspect - 1.5) * 420;
  }

  camera.updateProjectionMatrix();
}

export function DottedSurface({
  className,
  variant = 'desktop',
  ...props
}: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry?.isIntersecting ?? false;
      },
      { rootMargin: '120px', threshold: 0 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const initialWidth = container.clientWidth;
    const initialHeight = container.clientHeight;
    const grid = getParticleGrid(initialWidth, initialHeight, variant);
    const {
      amountX: AMOUNTX,
      amountY: AMOUNTY,
      separation: SEPARATION,
      pointSize,
      maxPixelRatio,
      antialias,
      gridOffsetZ,
      cameraY,
    } = grid;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0e141f, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(60, 1, 1, 10000);
    camera.position.set(0, cameraY, variant === 'mobile' ? 1050 : 1100);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    renderer.setClearColor(0x0e141f, 0);
    renderer.domElement.className = 'h-full w-full block';

    container.appendChild(renderer.domElement);

    const positions: number[] = [];
    const colors: number[] = [];
    const geometry = new THREE.BufferGeometry();

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2 + gridOffsetZ;
        positions.push(x, 0, z);
        colors.push(1, 1, 1);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    });

    scene.add(new THREE.Points(geometry, material));

    let count = 0;

    const resize = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      updateCameraForSize(camera, width, height, variant, cameraY);
      renderer.setSize(width, height, false);
    };

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      resize(entry.contentRect.width, entry.contentRect.height);
    });

    resizeObserver.observe(container);
    resize(container.clientWidth, container.clientHeight);

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!activeRef.current || document.visibilityState === 'hidden') {
        return;
      }

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

    return () => {
      resizeObserver?.disconnect();
      cancelAnimationFrame(animationId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [variant]);

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      {...props}
    />
  );
}
