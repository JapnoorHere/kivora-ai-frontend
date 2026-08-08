import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
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
  /** Ceramic materials, kept for the fade. Steam manages its own opacity. */
  readonly surfaces: readonly MeshPhysicalMaterial[];
  textureUrl: string | null;
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
      // Stock food photography frames the plate, the table and usually a fork.
      // Mapped whole onto the dish that surrounding context is what gives the
      // sticker impression, so only the middle of the frame reaches the bowl.
      // Scaling about `center` is the whole crop — adding an `offset` on top
      // would shift the window a second time and sample a corner instead.
      texture.center.set(0.5, 0.5);
      texture.repeat.set(FOOD_CROP, FOOD_CROP);
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

    // Collected before the steam joins the group, so the fade never fights the
    // steam's own opacity.
    const surfaces: MeshPhysicalMaterial[] = [];
    bowl.traverse((object) => {
      const material = (object as Mesh).material;
      if (material instanceof MeshPhysicalMaterial) surfaces.push(material);
    });

    const steam = createSteam();
    bowl.add(steam.mesh);

    // Exposure is deliberately restrained. White glazed ceramic under a bright
    // rig clips to flat white, and once the bowl clips the food clips with it —
    // the dish stops reading as a separate object sitting inside.
    scene.add(new AmbientLight(0xfff6e5, 0.7));

    const key = new DirectionalLight(0xffffff, 1.5);
    key.position.set(2.5, 4, 2.5);
    scene.add(key);

    // A warm bounce from the side, standing in for a kitchen window.
    const warm = new PointLight(0xffb347, 7, 12, 2);
    warm.position.set(-2.2, 1.4, 1.6);
    scene.add(warm);

    return { scene, camera, bowl, contents, steam, surfaces, textureUrl: null };
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
      view.steam.setStrength(Math.max(0, p - 0.45) * 1.8);

      // Held back until the first screen's copy has scrolled clear — the bowl
      // lands centre-screen, which is exactly where the headline sits.
      setSurfaceOpacity(view, Math.min(1, Math.max(0, (p - 0.38) * 4)));
    } else {
      // The wheel's hub. The bowl turns with the trolley, against the plates
      // orbiting it, and holds a steady simmer throughout.
      const p = progress('wheel');
      view.bowl.rotation.y = p * Math.PI * 2;
      view.bowl.rotation.x = 0.36;
      view.bowl.position.y = -0.35 + Math.sin(time * 1.3) * 0.045;
      view.bowl.scale.setScalar(0.98);
      view.steam.setStrength(0.9);
    }

    view.steam.update(delta);
  }

  function setSurfaceOpacity(view: ViewScene, opacity: number): void {
    for (const material of view.surfaces) {
      material.opacity = opacity;
    }
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
      disposeGeneratedTextures();
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
      color: 0xf7f3ea,
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.28,
      // Declared transparent up front so the scene can fade in without a
      // per-frame shader recompile, which toggling `transparent` would cost.
      transparent: true,
    }),
  );
  group.add(shell);

  // A fine glaze line, not a band: a thick saturated ring reads as a toy.
  const rim = new Mesh(
    new TorusGeometry(0.985, 0.013, 10, 72),
    new MeshPhysicalMaterial({
      color: 0xdca94e,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
    }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.69;
  group.add(rim);

  const contents = createFoodSurface();
  group.add(contents);

  return group;
}

/**
 * The fill line has to sit on the bowl's inner wall, or the food cuts through
 * the ceramic and reads as a lid rather than contents. The lathe profile runs
 * through (0.72, 0.40) and (0.88, 0.60), so radius 0.848 meets the wall at
 * height 0.56. Move one of these and the other has to move with it.
 *
 * Sitting high is deliberate: viewed from above, a bowl filled near the rim
 * shows food across most of its opening, where a low fill line shows mostly
 * empty white wall — which is what made the dish look lost inside it.
 */
const FOOD_RADIUS = 0.848;
const FOOD_LINE = 0.56;
/** Mound above the fill line. Must keep the crown under the 0.70 rim. */
const FOOD_RISE = 0.1;
/** Fraction of the source photograph that survives the crop. */
const FOOD_CROP = 0.6;

/**
 * The dish sitting in the bowl.
 *
 * A flat disc with a photograph on it always reads as a sticker, whatever the
 * photograph is. Three things fix that, and none of them costs a download:
 *
 *  - the surface is a shallow dome, so it catches light across a curve the way
 *    a sauce or a mound of rice does, and the photo shifts as the bowl turns
 *  - a generated radial gradient serves as both alpha and ambient occlusion,
 *    so the food fades into shadow where it meets the wall instead of ending
 *    at a hard circle
 *  - generated two-octave noise drives a bump map, giving the surface relief
 *    that breaks up the flatness of the photograph under moving light
 */
function createFoodSurface(): Mesh {
  const falloff = foodFalloffTexture();

  const mesh = new Mesh(
    domeGeometry(FOOD_RADIUS, FOOD_RISE),
    new MeshPhysicalMaterial({
      color: 0xd97706,
      roughness: 0.76,
      metalness: 0,
      // Food has a wet sheen, not a lacquered one.
      clearcoat: 0.16,
      clearcoatRoughness: 0.55,
      envMapIntensity: 0.55,
      bumpMap: foodReliefTexture(),
      bumpScale: 0.012,
      alphaMap: falloff,
      aoMap: falloff,
      aoMapIntensity: 0.9,
      transparent: true,
    }),
  );

  mesh.name = 'contents';
  mesh.position.y = FOOD_LINE;
  return mesh;
}

/**
 * A spherical cap of the given base radius and height, re-projected so its UVs
 * are a straight top-down plan. The sphere's own equirectangular UVs would
 * smear the photograph radially out of the centre like a polar map.
 */
function domeGeometry(radius: number, rise: number): BufferGeometry {
  const sphereRadius = (rise * rise + radius * radius) / (2 * rise);
  const cap = Math.asin(radius / sphereRadius);

  const geometry = new SphereGeometry(sphereRadius, 64, 24, 0, Math.PI * 2, 0, cap);
  // Drop the sphere so the cap's rim sits at y = 0 and its crown at y = rise.
  geometry.translate(0, -(sphereRadius - rise), 0);

  const position = geometry.attributes['position'];
  const uv = geometry.attributes['uv'];
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, 0.5 + position.getX(i) / (2 * radius), 0.5 - position.getZ(i) / (2 * radius));
  }
  uv.needsUpdate = true;

  // aoMap reads the second UV channel, and here it wants the same projection.
  geometry.setAttribute('uv1', uv.clone());

  return geometry;
}

let falloffTexture: CanvasTexture | null = null;
let reliefTexture: CanvasTexture | null = null;

/** White at the centre, black at the rim: transparency and occlusion in one map. */
function foodFalloffTexture(): CanvasTexture {
  if (falloffTexture) return falloffTexture;

  const size = 256;
  const context = createCanvasContext(size);
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.2,
    size / 2,
    size / 2,
    size * 0.5,
  );
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.68, '#efefef');
  gradient.addColorStop(0.92, '#4a4a4a');
  gradient.addColorStop(1, '#000000');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  falloffTexture = new CanvasTexture(context.canvas);
  return falloffTexture;
}

/** Two octaves of value noise, smoothed by the canvas's own bilinear upscale. */
function foodReliefTexture(): CanvasTexture {
  if (reliefTexture) return reliefTexture;

  const size = 256;
  const context = createCanvasContext(size);
  context.fillStyle = '#808080';
  context.fillRect(0, 0, size, size);

  drawNoiseOctave(context, size, 14, 0.65);
  drawNoiseOctave(context, size, 44, 0.35);
  context.globalAlpha = 1;

  reliefTexture = new CanvasTexture(context.canvas);
  return reliefTexture;
}

function drawNoiseOctave(
  context: CanvasRenderingContext2D,
  size: number,
  cells: number,
  alpha: number,
): void {
  const source = createCanvasContext(cells);
  const image = source.createImageData(cells, cells);

  for (let i = 0; i < image.data.length; i += 4) {
    const value = 70 + Math.random() * 185;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  source.putImageData(image, 0, 0);

  context.globalAlpha = alpha;
  context.drawImage(source.canvas, 0, 0, size, size);
}

function createCanvasContext(size: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas unavailable');
  return context;
}

function disposeGeneratedTextures(): void {
  falloffTexture?.dispose();
  reliefTexture?.dispose();
  falloffTexture = null;
  reliefTexture = null;
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
