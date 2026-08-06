import {
  AmbientLight,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  LatheGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  PMREMGenerator,
  PerspectiveCamera,
  PointLight,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  Texture,
  TextureLoader,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * The WebGL layer for the landing page.
 *
 * Everything here is procedural: the bowl is a lathed profile, the steam is
 * one instanced mesh, and the lighting environment is generated in-process.
 * There is no model, no draco decoder and no .hdr to download — the only
 * bytes over the wire are the dish photographs the page was already loading,
 * reused here as textures.
 *
 * One renderer serves every view. Each frame the loop walks the registered
 * view elements, converts each rect into a scissored viewport, and draws that
 * view's scene into it — so a second or third 3D moment on the page costs a
 * draw call, not another WebGL context.
 *
 * This module is only ever reached through a dynamic import, which keeps
 * three.js in its own chunk and off the landing page's critical path.
 */

export interface StageView {
  readonly name: string;
  readonly texture?: string;
}

export interface StageOptions {
  readonly canvas: HTMLCanvasElement;
  /** Reads eased scroll progress by scene name. */
  readonly progress: (name: string) => number;
  /**
   * Viewport rect for a view, measured during the shared scroll tracker's read
   * phase. Measuring there rather than here is the point: reading layout from
   * inside the render loop, after the scene directives have written their
   * custom properties, would force a synchronous re-layout every frame.
   */
  readonly rect: (name: string) => DOMRectReadOnly | null;
  readonly onContextLost?: () => void;
  /** Raised when the stage decides the device isn't keeping up. */
  readonly onDegraded?: () => void;
}

export interface StageHandle {
  syncViews(views: readonly StageView[]): void;
  dispose(): void;
}

const MAX_PIXEL_RATIO = 1.5;
const STEAM_COUNT = 90;

/** Frame budget for the health check. Sustained frames worse than this mean the stage is a liability. */
const SLOW_FRAME_MS = 40;
const SLOW_FRAME_LIMIT = 45;
/** Shader compilation and texture upload make the first second unrepresentative. */
const HEALTH_CHECK_GRACE_MS = 1500;

interface ViewScene {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly bowl: Group;
  readonly contents: Mesh;
  readonly steam: SteamCloud;
  textureUrl: string | null;
  spin: number;
}

export function createStage(options: StageOptions): StageHandle {
  const { canvas, progress } = options;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.autoClear = false;

  // A generated room beats a downloaded HDR here: the bowl only needs
  // something plausible to reflect for its clearcoat to read as glaze.
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const loader = new TextureLoader();
  loader.setCrossOrigin('anonymous');
  const textures = new Map<string, Texture>();

  const views = new Map<string, ViewScene>();
  const disposables: Array<{ dispose(): void }> = [];

  let frameId: number | null = null;
  let lastTime = performance.now();
  let disposed = false;
  let slowFrames = 0;
  const startedAt = performance.now();

  function textureFor(url: string): Texture {
    let texture = textures.get(url);
    if (!texture) {
      texture = loader.load(url, undefined, undefined, () => undefined);
      texture.colorSpace = SRGBColorSpace;
      textures.set(url, texture);
      disposables.push(texture);
    }
    return texture;
  }

  function buildView(): ViewScene {
    const scene = new Scene();
    scene.environment = environment;

    const camera = new PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(0, 1.35, 4.2);
    camera.lookAt(0, 0.1, 0);

    const bowl = createBowl();
    scene.add(bowl);

    const contents = bowl.getObjectByName('contents') as Mesh;

    const steam = createSteam();
    bowl.add(steam.mesh);

    scene.add(new AmbientLight(0xfff6e5, 1.1));

    const key = new DirectionalLight(0xffffff, 2.4);
    key.position.set(2.5, 4, 2.5);
    scene.add(key);

    // A warm bounce from the side, standing in for a kitchen window.
    const warm = new PointLight(0xffb347, 14, 12, 2);
    warm.position.set(-2.2, 1.4, 1.6);
    scene.add(warm);

    return { scene, camera, bowl, contents, steam, textureUrl: null, spin: 0 };
  }

  function syncViews(next: readonly StageView[]): void {
    const seen = new Set<string>();

    for (const view of next) {
      seen.add(view.name);

      let existing = views.get(view.name);
      if (!existing) {
        existing = buildView();
        views.set(view.name, existing);
      }

      const url = view.texture ?? null;
      if (url !== existing.textureUrl) {
        existing.textureUrl = url;
        const material = existing.contents.material as MeshPhysicalMaterial;
        material.map = url ? textureFor(url) : null;
        material.color = new Color(url ? 0xffffff : 0xd97706);
        material.needsUpdate = true;
      }
    }

    for (const [name, view] of views) {
      if (seen.has(name)) continue;
      disposeScene(view);
      views.delete(name);
    }

    if (views.size > 0) {
      start();
    } else {
      stop();
    }
  }

  function render(): void {
    frameId = null;

    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    const frameMs = now - lastTime;
    lastTime = now;

    // Nothing to draw into a backgrounded tab.
    if (!document.hidden) {
      const height = renderer.domElement.clientHeight;
      let drew = false;

      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);

      for (const [name, view] of views) {
        const rect = options.rect(name);
        if (!rect || rect.width === 0) continue;

        const offscreen =
          rect.bottom < 0 ||
          rect.top > window.innerHeight ||
          rect.right < 0 ||
          rect.left > window.innerWidth;
        if (offscreen) continue;

        updateView(view, name, delta);

        const bottom = height - rect.bottom;
        renderer.setViewport(rect.left, bottom, rect.width, rect.height);
        renderer.setScissor(rect.left, bottom, rect.width, rect.height);
        view.camera.aspect = rect.width / rect.height;
        view.camera.updateProjectionMatrix();
        renderer.render(view.scene, view.camera);
        drew = true;
      }

      if (drew && checkHealth(now, frameMs)) return;
    }

    start();
  }

  /**
   * Watches actual frame times and pulls the stage down if the device can't
   * hold a reasonable rate. Capability hints guess; this measures — and the
   * page is fully functional without the 3D, so bailing out costs nothing.
   */
  function checkHealth(now: number, frameMs: number): boolean {
    if (now - startedAt < HEALTH_CHECK_GRACE_MS) return false;

    slowFrames = frameMs > SLOW_FRAME_MS ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames < SLOW_FRAME_LIMIT) return false;

    stop();
    options.onDegraded?.();
    return true;
  }

  function updateView(view: ViewScene, name: string, delta: number): void {
    const time = lastTime / 1000;

    if (name === 'hero') {
      // Mirrors the CSS hero exactly: the ring converges, the bowl turns once
      // and rises into frame over the same scrubbed progress.
      const p = progress('hero');
      view.bowl.rotation.y = p * Math.PI * 2;
      view.bowl.rotation.x = 0.42 - p * 0.2;
      view.bowl.position.y = -0.55 + p * 0.35 + Math.sin(time * 1.1) * 0.03;
      const scale = 0.72 + p * 0.38;
      view.bowl.scale.setScalar(scale);
      view.steam.setStrength(Math.max(0, p - 0.25) * 1.4);
    } else {
      // Carousel: the arrows publish an absolute angle in degrees; easing
      // toward it keeps the 3D turn in step with the card's CSS transition.
      const target = (progress('carousel-spin') * Math.PI) / 180;
      view.spin += (target - view.spin) * Math.min(1, delta * 4.5);
      view.bowl.rotation.y = view.spin;
      view.bowl.rotation.x = 0.36;
      view.bowl.position.y = -0.35 + Math.sin(time * 1.3) * 0.045;
      view.bowl.scale.setScalar(0.98);
      view.steam.setStrength(0.9);
    }

    view.steam.update(delta);
  }

  function start(): void {
    if (disposed || frameId !== null || views.size === 0) return;
    frameId = requestAnimationFrame(render);
  }

  function stop(): void {
    if (frameId === null) return;
    cancelAnimationFrame(frameId);
    frameId = null;
  }

  function resize(): void {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  function handleContextLost(event: Event): void {
    event.preventDefault();
    stop();
    options.onContextLost?.();
  }

  window.addEventListener('resize', resize, { passive: true });
  canvas.addEventListener('webglcontextlost', handleContextLost);

  start();

  return {
    syncViews,
    dispose() {
      disposed = true;
      stop();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);

      views.forEach(disposeScene);
      views.clear();
      disposables.forEach((item) => item.dispose());
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

function disposeScene(view: ViewScene): void {
  view.scene.traverse((object) => {
    const mesh = object as Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material as Material | Material[] | undefined;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else {
      material?.dispose();
    }
  });
}

/**
 * A bowl is a surface of revolution, so a hand-drawn profile lathed around Y
 * gives real geometry — outer wall up to the rim, then back down the inside
 * so the shell has thickness — for the cost of a dozen points.
 */
function createBowl(): Group {
  const profile = [
    new Vector2(0.0, 0.0),
    new Vector2(0.24, 0.0),
    new Vector2(0.4, 0.03),
    new Vector2(0.62, 0.14),
    new Vector2(0.84, 0.36),
    new Vector2(0.96, 0.58),
    new Vector2(1.0, 0.68),
    new Vector2(0.95, 0.7),
    new Vector2(0.88, 0.6),
    new Vector2(0.72, 0.4),
    new Vector2(0.5, 0.22),
    new Vector2(0.28, 0.14),
    new Vector2(0.0, 0.12),
  ];

  const group = new Group();

  const shell = new Mesh(
    new LatheGeometry(profile, 72),
    new MeshPhysicalMaterial({
      color: 0xfffdf7,
      roughness: 0.32,
      metalness: 0,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
    }),
  );
  group.add(shell);

  const rim = new Mesh(
    new TorusGeometry(0.98, 0.022, 10, 72),
    new MeshPhysicalMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.2 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.69;
  group.add(rim);

  // The dish itself — a disc sitting in the bowl that takes the page's own
  // food photograph as its texture.
  const contents = new Mesh(
    new CircleGeometry(0.86, 64),
    new MeshPhysicalMaterial({ color: 0xd97706, roughness: 0.55, clearcoat: 0.35 }),
  );
  contents.name = 'contents';
  contents.rotation.x = -Math.PI / 2;
  contents.position.y = 0.42;
  group.add(contents);

  return group;
}

interface SteamCloud {
  readonly mesh: InstancedMesh;
  update(delta: number): void;
  setStrength(strength: number): void;
}

/**
 * Steam as a single instanced mesh — ninety wisps, one draw call. Each rises
 * at its own speed and recycles at the rim, which reads as convection without
 * a particle system.
 */
function createSteam(): SteamCloud {
  const material = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const mesh = new InstancedMesh(new SphereGeometry(0.045, 6, 6), material, STEAM_COUNT);
  mesh.position.y = 0.45;
  mesh.frustumCulled = false;

  const dummy = new Object3D();
  const speeds = new Float32Array(STEAM_COUNT);
  const heights = new Float32Array(STEAM_COUNT);
  const angles = new Float32Array(STEAM_COUNT);
  const radii = new Float32Array(STEAM_COUNT);

  for (let i = 0; i < STEAM_COUNT; i++) {
    speeds[i] = 0.18 + Math.random() * 0.32;
    heights[i] = Math.random() * 1.6;
    angles[i] = Math.random() * Math.PI * 2;
    radii[i] = Math.random() * 0.55;
  }

  let strength = 0;

  function update(delta: number): void {
    if (material.opacity <= 0.001 && strength <= 0.001) return;

    for (let i = 0; i < STEAM_COUNT; i++) {
      heights[i] += speeds[i] * delta;
      if (heights[i] > 1.6) {
        heights[i] = 0;
        angles[i] = Math.random() * Math.PI * 2;
        radii[i] = Math.random() * 0.55;
      }

      const lift = heights[i];
      // Wisps spread and thin as they climb.
      const spread = radii[i] * (1 + lift * 0.9);
      dummy.position.set(
        Math.cos(angles[i] + lift) * spread,
        lift,
        Math.sin(angles[i] + lift) * spread,
      );
      dummy.scale.setScalar(Math.max(0.05, 1 - lift * 0.55));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }

  return {
    mesh,
    update,
    setStrength(next: number) {
      strength = Math.max(0, Math.min(1, next));
      material.opacity = strength * 0.32;
    },
  };
}
