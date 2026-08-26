"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ModelViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const initialCameraPosition = useRef(new THREE.Vector3());
  const resetAnimation = useRef<{
    startedAt: number;
    fromPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
  } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.closest(".modelShowcase")?.querySelectorAll(".viewerHints").forEach((element) => element.remove());

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x10100f, 1);
    renderer.domElement.setAttribute("aria-label", "Интерактивная 3D-модель головы Кирилла");
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI * 0.88;
    const cancelReset = () => { resetAnimation.current = null; };
    controls.addEventListener("start", cancelReset);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x24201e, 2.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xff6a32, 1.15);
    fillLight.position.set(-4, 1, 2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x8aa7ff, 1.35);
    rimLight.position.set(2, 3, -5);
    scene.add(rimLight);

    let model: THREE.Group | null = null;
    const loader = new FBXLoader();
    loader.load(
      "/kirill-pod-partoi.fbx",
      (object) => {
        model = object;
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        object.position.sub(center);

        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        const distance = maxDimension * 2.05;
        camera.near = Math.max(maxDimension / 100, 0.01);
        camera.far = maxDimension * 100;
        camera.position.set(0, maxDimension * 0.03, distance);
        camera.updateProjectionMatrix();
        initialCameraPosition.current.copy(camera.position);
        controls.target.set(0, 0, 0);
        controls.minDistance = maxDimension * 1.05;
        controls.maxDistance = maxDimension * 4.2;
        controls.update();
        scene.add(object);
        setStatus("ready");
      },
      undefined,
      () => setStatus("error")
    );

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let animationFrame = 0;
    const origin = new THREE.Vector3();
    const animate = () => {
      const reset = resetAnimation.current;
      if (reset) {
        const progress = Math.min((performance.now() - reset.startedAt) / 750, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(reset.fromPosition, initialCameraPosition.current, eased);
        controls.target.lerpVectors(reset.fromTarget, origin, eased);
        if (progress === 1) resetAnimation.current = null;
      }
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.removeEventListener("start", cancelReset);
      controls.dispose();
      model?.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const resetView = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    resetAnimation.current = {
      startedAt: performance.now(),
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone()
    };
  };

  return (
    <div className="modelViewer" ref={containerRef}>
      {status === "loading" && <div className="modelStatus"><i /><span>Загрузка 3D-модели</span></div>}
      {status === "error" && <div className="modelStatus error">Не удалось загрузить 3D-модель</div>}
      {status === "ready" && <button className="resetView" onClick={resetView}>Сбросить вид</button>}
    </div>
  );
}
