'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import type { DottedSurfaceVariantProps } from './dotted-surface-types';

function getParticleGrid(width: number, height: number) {
  const amountX = Math.min(160, Math.max(48, Math.round(width / 14)));
  const amountY = Math.min(48, Math.max(24, Math.round(height / 18)));
  const separation = width > 1400 ? 110 : width > 1024 ? 125 : 140;

  return { amountX, amountY, separation };
}

export function DottedSurfaceWebGL({
  className,
  active = true,
}: DottedSurfaceVariantProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let animationId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let cleanupThree: (() => void) | null = null;

    async function init() {
      const THREE = await import('three');
      const mount = containerRef.current;
      if (disposed || !mount) return;

      const initialWidth = mount.clientWidth;
      const initialHeight = mount.clientHeight;
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
        antialias: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x0e141f, 0);
      renderer.domElement.className = 'h-full w-full block';

      mount.appendChild(renderer.domElement);

      const positions: number[] = [];
      const colors: number[] = [];
      const geometry = new THREE.BufferGeometry();

      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
          const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
          positions.push(x, 0, z);
          colors.push(0.9, 0.94, 1);
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 8,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
      });

      scene.add(new THREE.Points(geometry, material));

      let count = 0;

      const updateCameraForSize = (width: number, height: number) => {
        const aspect = width / Math.max(height, 1);
        camera.aspect = aspect;
        camera.fov = Math.min(88, 58 + Math.max(0, aspect - 1.2) * 18);
        camera.position.z = 1220 + Math.max(0, aspect - 1.5) * 520;
        camera.updateProjectionMatrix();
      };

      const resize = (width: number, height: number) => {
        if (width <= 0 || height <= 0) return;
        updateCameraForSize(width, height);
        renderer.setSize(width, height, false);
      };

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        resize(entry.contentRect.width, entry.contentRect.height);
      });

      resizeObserver.observe(mount);
      resize(mount.clientWidth, mount.clientHeight);

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

      cleanupThree = () => {
        resizeObserver?.disconnect();
        cancelAnimationFrame(animationId);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
      };
    }

    void init();

    return () => {
      disposed = true;
      cleanupThree?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      aria-hidden
    />
  );
}
