'use client';

import { useRef, useEffect } from "react";
import * as THREE from "three";

export const FloatingLines = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // SCENE SETUP
        const scene = new THREE.Scene();

        // CAMERA SETUP
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        // RENDERER SETUP
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        // MATERIAL SETUP
        const material = new THREE.LineBasicMaterial({
            color: 0xff5722, // Orange from the design
            transparent: true,
            opacity: 0.5,
            linewidth: 1,
        });

        // CREATE LINES
        const lineCount = 40;
        const pointsCount = 150;
        const lines: THREE.Line[] = [];
        const initialYOffsets: number[] = [];

        for (let i = 0; i < lineCount; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(pointsCount * 3);

            const yOffset = (i / lineCount) * 12 - 6; // Spread across y axis
            initialYOffsets.push(yOffset);

            for (let j = 0; j < pointsCount; j++) {
                const x = (j / pointsCount) * 24 - 12;
                positions[j * 3] = x;
                positions[j * 3 + 1] = yOffset;
                positions[j * 3 + 2] = 0;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const line = new THREE.Line(geometry, material);
            lines.push(line);
            scene.add(line);
        }

        // ANIMATION LOOP
        let time = 0;
        let animationFrameId: number;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            time += 0.005;

            lines.forEach((line, i) => {
                const positions = line.geometry.attributes.position.array as Float32Array;
                const initialYOffset = initialYOffsets[i];

                for (let j = 0; j < pointsCount; j++) {
                    const x = positions[j * 3];

                    // Complex wave calculation
                    const wave1 = Math.sin(x * 0.5 + time) * 0.5;
                    const wave2 = Math.cos(x * 0.3 - time * 1.5) * 0.3;

                    positions[j * 3 + 1] = initialYOffset + wave1 + wave2;

                    // Add a subtle wave to z-axis for extra depth
                    positions[j * 3 + 2] = Math.sin(x * 0.4 + time * 2) * 0.5;
                }

                line.geometry.attributes.position.needsUpdate = true;
            });

            // Slowly rotate the entire scene for a dynamic feel
            scene.rotation.y = Math.sin(time * 0.1) * 0.2;
            scene.rotation.x = Math.cos(time * 0.1) * 0.1;

            renderer.render(scene, camera);
        };

        animate();

        // RESIZE HANDLER
        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener("resize", handleResize);

        // CLEANUP
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
            if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
            lines.forEach(line => {
                line.geometry.dispose();
            });
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} className="w-full h-full absolute inset-0 z-[-1] pointer-events-none" style={{ opacity: 0.6 }} />;
};
