"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

const LAYERS = 7;

export default function SliceModelViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.localClippingEnabled = true;
    renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia("(pointer: coarse)").matches ? 1.4 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setClearColor(0x0b0b0a, 1);
    renderer.domElement.setAttribute("aria-label", "Интерактивная послойная 3D-модель фигурки Кирилла");
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .075; controls.enablePan = false;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x201a16, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(4, 6, 7); scene.add(key);
    const orange = new THREE.DirectionalLight(0xff5a1f, 2); orange.position.set(-5, 1, 3); scene.add(orange);
    const rim = new THREE.DirectionalLight(0x7196ff, 1.2); rim.position.set(3, 4, -5); scene.add(rim);

    const layerGroups: THREE.Group[] = [];
    let hoverLayer = -1;
    let pointerX = 0;
    let modelHeight = 1;
    let source: THREE.Group | null = null;
    new FBXLoader().load("/kirill-slice.fbx", (object) => {
      source = object;
      object.updateMatrixWorld(true);
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const geometry = child.geometry as THREE.BufferGeometry;
        // FBX can contain mirrored objects and stale custom normals. Rebuilding
        // them before cloning prevents holes and inverted lighting in the viewer.
        geometry.deleteAttribute("normal");
        geometry.computeVertexNormals();
        geometry.normalizeNormals();
      });
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      object.position.sub(center);
      const centeredBox = new THREE.Box3().setFromObject(object);
      modelHeight = size.y || 1;
      const band = modelHeight / LAYERS;
      for (let index = 0; index < LAYERS; index += 1) {
        const clone = skeletonClone(object) as THREE.Group;
        const low = centeredBox.min.y + index * band;
        const high = low + band;
        const baseY = (index - (LAYERS - 1) / 2) * modelHeight * .012;
        clone.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const original = Array.isArray(child.material) ? child.material : [child.material];
          const materials = original.map((item) => {
            const material = item.clone();
            // Some parts of the source FBX use mirrored transforms. DoubleSide
            // lets WebGL shade both orientations instead of culling those faces.
            material.side = THREE.DoubleSide;
            material.shadowSide = THREE.DoubleSide;
            material.clippingPlanes = [
              // Three.js keeps the negative half-space of a clipping plane.
              // These normals therefore point out of the retained Y band.
              new THREE.Plane(new THREE.Vector3(0, -1, 0), low + baseY),
              new THREE.Plane(new THREE.Vector3(0, 1, 0), -(high + baseY))
            ];
            material.clipShadows = true; material.needsUpdate = true;
            return material;
          });
          child.material = Array.isArray(child.material) ? materials : materials[0];
        });
        const group = new THREE.Group();
        group.userData.baseY = baseY;
        group.position.y = group.userData.baseY;
        group.add(clone); layerGroups.push(group); scene.add(group);
      }
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      camera.near = maxDimension / 100; camera.far = maxDimension * 100;
      camera.position.set(maxDimension * .15, maxDimension * .08, maxDimension * 2.25);
      controls.target.set(0, 0, 0); controls.minDistance = maxDimension * 1.25; controls.maxDistance = maxDimension * 4;
      camera.updateProjectionMatrix(); controls.update(); setStatus("ready");
    }, undefined, () => setStatus("error"));

    const pointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const normalizedY = 1 - (event.clientY - rect.top) / rect.height;
      hoverLayer = Math.max(0, Math.min(LAYERS - 1, Math.floor(normalizedY * LAYERS)));
    };
    const pointerLeave = () => { hoverLayer = -1; pointerX = 0; };
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerleave", pointerLeave);

    const resize = () => { const width = mount.clientWidth, height = mount.clientHeight; renderer.setSize(width, height, false); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();
    let frame = 0;
    const animate = () => {
      layerGroups.forEach((group, index) => {
        const active = index === hoverLayer;
        const targetX = active ? -pointerX * modelHeight * .055 : 0;
        const targetZ = active ? modelHeight * .075 : 0;
        group.position.x += (targetX - group.position.x) * .11;
        group.position.z += (targetZ - group.position.z) * .11;
        group.position.y += (group.userData.baseY - group.position.y) * .11;
      });
      controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate);
    }; animate();

    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener("pointermove", pointerMove); renderer.domElement.removeEventListener("pointerleave", pointerLeave);
      layerGroups.forEach((group) => group.traverse((child) => { if (child instanceof THREE.Mesh) { const mats = Array.isArray(child.material) ? child.material : [child.material]; mats.forEach((m) => m.dispose()); } }));
      source?.traverse((child) => { if (child instanceof THREE.Mesh) child.geometry.dispose(); });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <div className="sliceViewer" ref={mountRef}>{status === "loading" && <div className="modelStatus"><i /><span>Подготовка печатных слоёв</span></div>}{status === "error" && <div className="modelStatus error">Не удалось загрузить модель</div>}</div>;
}
