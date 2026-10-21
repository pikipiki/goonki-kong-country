import {
  AmbientLight,
  BufferGeometry,
  CapsuleGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  OrthographicCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { PLUSH_BODY, PINK_NOSE, VIOLET_NOSE } from "../game3d/plushGoonk/mesh";
import { BODY_PROFILE, bodyPoint } from "../game3d/plushGoonk/profile";
import { sharedVelourTexture } from "../game3d/plushGoonk/velour";
import { themeColors, WHITE } from "../game3d/theme";

const plush = themeColors.plush;
const sphere = new SphereGeometry(1, 16, 12);
const arm = new CapsuleGeometry(0.045, 0.19, 6, 10);

export interface PlushPoseState {
  pink: boolean;
  facing: number;
  walking: number;
  grounded: boolean;
  roll: boolean;
  rollAngle: number;
  rollFacing: number;
  cannonFlight: boolean;
  swapping: boolean;
  swapHop: number;
  companion: boolean;
  riding: boolean;
  carrying: boolean;
  time: number;
}

interface PlushRig {
  root: Group;
  body: Group;
  limbs: Group[];
  eyes: Group[];
}

function buildFurGeometry() {
  const positions: number[] = [];
  let seed = 37;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let strand = 0; strand < 2400; strand++) {
    const alongProfile = 0.04 + random() * 0.91;
    const angle = random() * Math.PI * 2;
    const point = bodyPoint(alongProfile, angle, 0.001);
    const end = bodyPoint(
      alongProfile + 0.003 * random(),
      angle + 0.004,
      0.004 + random() * 0.003,
    );
    positions.push(...point.toArray(), ...end.toArray());
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geometry;
}

function buildStitchGeometry() {
  const points: number[] = [];
  for (const angle of [
    Math.PI / 4,
    -Math.PI / 4,
    Math.PI * 0.75,
    -Math.PI * 0.75,
  ]) {
    for (let stitch = 3; stitch < 58; stitch++) {
      const start = bodyPoint(stitch / 64, angle - 0.008, 0.0015);
      const end = bodyPoint((stitch + 0.45) / 64, angle + 0.008, 0.0015);
      points.push(...start.toArray(), ...end.toArray());
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  return geometry;
}

function buildTuftGeometry() {
  const points: number[] = [];
  for (let tuft = 0; tuft < 85; tuft++) {
    const angle = tuft * 2.39996;
    const posX = Math.sin(angle) * 0.033;
    const posZ = Math.cos(angle) * 0.025;
    const height = 0.065 + (Math.sin(tuft * 71) + 1) * 0.035;
    points.push(
      posX,
      0.755,
      posZ,
      posX * 1.4,
      0.755 + height * 0.55,
      posZ - 0.008,
      posX * 1.4,
      0.755 + height * 0.55,
      posZ - 0.008,
      posX * 1.8 + 0.015,
      0.755 + height,
      posZ - 0.023,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  return geometry;
}

const FUR_GEOM = buildFurGeometry();
const STITCH_GEOM = buildStitchGeometry();
const TUFT_GEOM = buildTuftGeometry();

function createPlushRig(pink: boolean): PlushRig {
  const map = sharedVelourTexture();
  const fabric = new MeshLambertMaterial({
    color: pink ? plush.fabricPink : plush.fabricPurple,
    map,
    emissive: pink ? plush.sheenPink : plush.sheenPurple,
    emissiveIntensity: 0.16,
  });

  const root = new Group();
  root.scale.setScalar(pink ? 2.2 : 2.05);

  const body = new Group();
  body.position.set(0, 0.4, 0);
  root.add(body);

  const inner = new Group();
  inner.position.set(0, -0.4, 0);
  body.add(inner);

  inner.add(new Mesh(PLUSH_BODY, fabric));
  inner.add(new Mesh(pink ? PINK_NOSE : VIOLET_NOSE, fabric));

  inner.add(
    new LineSegments(
      FUR_GEOM,
      new LineBasicMaterial({
        color: pink ? plush.furPink : plush.furPurple,
        transparent: true,
        opacity: 0.28,
      }),
    ),
  );
  inner.add(
    new LineSegments(
      STITCH_GEOM,
      new LineBasicMaterial({
        color: pink ? plush.stitchPink : plush.stitchPurple,
        transparent: true,
        opacity: 0.7,
      }),
    ),
  );

  if (pink) {
    inner.add(
      new LineSegments(
        TUFT_GEOM,
        new LineBasicMaterial({ color: plush.tuftYellow }),
      ),
    );
  }

  const eyes: Group[] = [];
  for (const side of [-1, 1]) {
    const eyeSocket = new Group();
    eyeSocket.position.set(side * 0.105, 0.575, 0.232);
    eyeSocket.rotation.set(0.12, side * 0.28, -side * 0.12);
    const eyeGroup = new Group();
    const whiteMesh = new Mesh(
      sphere,
      new MeshBasicMaterial({ color: plush.eyeWhite }),
    );
    whiteMesh.scale.set(0.05, 0.065, 0.012);
    eyeGroup.add(whiteMesh);

    const pupilMesh = new Mesh(
      sphere,
      new MeshBasicMaterial({ color: plush.eyeInk }),
    );
    pupilMesh.position.set(-side * 0.011, -0.015, 0.012);
    pupilMesh.scale.set(0.029, 0.038, 0.007);
    eyeGroup.add(pupilMesh);

    const glintMesh = new Mesh(sphere, new MeshBasicMaterial({ color: WHITE }));
    glintMesh.position.set(-side * 0.011 - 0.009, 0.001, 0.019);
    glintMesh.scale.set(0.007, 0.01, 0.002);
    eyeGroup.add(glintMesh);

    eyeSocket.add(eyeGroup);
    inner.add(eyeSocket);
    eyes.push(eyeGroup);
  }

  const limbs: Group[] = [];
  for (const side of [-1, 1]) {
    const limb = new Group();
    limb.position.set(side * 0.28, 0.43, 0);
    const tilted = new Group();
    tilted.rotation.set(0, 0, side * 0.25);

    const armMesh = new Mesh(arm, fabric);
    armMesh.position.set(0, -0.11, 0);
    tilted.add(armMesh);

    const handMesh = new Mesh(sphere, fabric);
    handMesh.scale.set(0.075, 0.064, 0.05);
    handMesh.position.set(0, -0.255, 0.015);
    tilted.add(handMesh);

    for (const finger of [-1, 0, 1]) {
      const fMesh = new Mesh(sphere, fabric);
      fMesh.scale.set(0.02, 0.044, 0.022);
      fMesh.position.set(finger * 0.038, -0.29, 0.02);
      tilted.add(fMesh);
    }
    limb.add(tilted);
    inner.add(limb);
    limbs.push(limb);
  }

  for (const side of [-1, 1]) {
    const footLimb = new Group();
    footLimb.position.set(side * 0.145, 0.075, 0.04);
    const footMesh = new Mesh(sphere, fabric);
    footMesh.scale.set(0.09, 0.055, 0.13);
    footMesh.position.set(0, -0.02, 0.06);
    footLimb.add(footMesh);

    for (const toe of [-1, 0, 1]) {
      const tMesh = new Mesh(sphere, fabric);
      tMesh.scale.set(0.032, 0.032, 0.045);
      tMesh.position.set(toe * 0.043, -0.025, 0.16);
      footLimb.add(tMesh);
    }
    inner.add(footLimb);
    limbs.push(footLimb);
  }

  return { root, body, limbs, eyes };
}

function applyPlushPose(rig: PlushRig, state: PlushPoseState) {
  const {
    pink,
    facing,
    walking,
    grounded,
    roll,
    rollAngle,
    rollFacing,
    cannonFlight,
    swapping,
    swapHop,
    companion,
    riding,
    carrying,
    time: t,
  } = state;

  rig.root.scale.setScalar((pink ? 2.2 : 2.05) * (riding ? 0.78 : 1));
  rig.body.rotation.z = roll
    ? -rollAngle * rollFacing
    : cannonFlight
      ? t * 14 * facing
      : swapping
        ? (companion ? -1 : 1) * swapHop * (pink ? 0.35 : 0.85)
        : Math.sin(t * 2.1) * 0.025;
  rig.body.rotation.y = facing * (walking > 0.3 ? 1.05 : 0.65);
  rig.body.position.y =
    (roll ? 0.3 : 0.4) +
    (grounded
      ? Math.abs(Math.sin(t * walking * 2.1)) * Math.min(0.045, walking * 0.01)
      : 0.025);
  rig.body.scale.set(
    1,
    grounded && walking > 0.2 ? 1 + Math.sin(t * walking * 4.2) * 0.025 : 1,
    1,
  );

  const seed = pink ? 1 : 2;
  const blinkPhase = (t + seed * 0.67) % (3.8 + seed * 0.13);
  const eyeScaleY =
    blinkPhase < 0.13
      ? Math.max(0.09, Math.abs(Math.cos((blinkPhase / 0.13) * Math.PI)))
      : 1;
  rig.eyes.forEach((eye) => {
    eye.scale.y = eyeScaleY;
  });

  rig.limbs.forEach((limb, i) => {
    const swing = Math.sin(t * walking * 2.1 + (i % 2) * Math.PI);
    if (swapping) {
      limb.rotation.x = (i < 2 ? -1.1 : 0.65) * swapHop;
      limb.rotation.z = (i % 2 ? 1 : -1) * swapHop * (pink ? 0.35 : 1.05);
      return;
    }
    limb.rotation.x =
      walking > 0.1
        ? swing * (i < 2 ? 0.7 : 0.95)
        : Math.sin(t * 1.5 + i) * 0.07;
    if (!grounded) limb.rotation.x = i < 2 ? -0.6 : 0.4;
    if (carrying && i < 2 && !companion) limb.rotation.x = -2.3;
    limb.rotation.z = riding ? (i % 2 ? 1 : -1) * (i < 2 ? 0.45 : 0.7) : 0;
    if (riding) limb.rotation.x = i < 2 ? -0.9 : -0.65;
    if (roll) {
      limb.rotation.z = (i % 2 ? 1 : -1) * (pink ? 0.18 : 1.05);
      limb.rotation.x = pink ? -1.4 : 0;
    }
  });
}

export class PlushSpriteRenderer {
  private gl: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private rigs: { pink: PlushRig; violet: PlushRig } | null = null;
  private scratch: HTMLCanvasElement;
  private scratchCtx: CanvasRenderingContext2D;
  readonly size = 64;

  constructor() {
    this.scratch = document.createElement("canvas");
    this.scratch.width = this.size;
    this.scratch.height = this.size;
    this.scratchCtx = this.scratch.getContext("2d")!;

    try {
      const gl = new WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
      gl.setSize(this.size, this.size, false);
      gl.setPixelRatio(1);
      const scene = new Scene();
      scene.add(new AmbientLight("#ffffff", 1.15));
      const key = new DirectionalLight("#fff2dd", 1.35);
      key.position.set(2, 4, 5);
      scene.add(key);
      const rim = new DirectionalLight("#d8c4ff", 0.65);
      rim.position.set(-3, 2, -2);
      scene.add(rim);

      const camera = new OrthographicCamera(-1.15, 1.15, 1.2, -1.1, 0.1, 20);
      camera.position.set(0, 0.85, 6);
      camera.lookAt(0, 0.85, 0);

      const pinkRig = createPlushRig(true);
      const violetRig = createPlushRig(false);
      scene.add(pinkRig.root);
      scene.add(violetRig.root);

      this.gl = gl;
      this.scene = scene;
      this.camera = camera;
      this.rigs = { pink: pinkRig, violet: violetRig };
    } catch {
      this.gl = null;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    state: PlushPoseState,
  ) {
    if (this.gl && this.scene && this.camera && this.rigs) {
      this.rigs.pink.root.visible = state.pink;
      this.rigs.violet.root.visible = !state.pink;
      const rig = state.pink ? this.rigs.pink : this.rigs.violet;
      applyPlushPose(rig, state);
      this.gl.render(this.scene, this.camera);
      ctx.drawImage(
        this.gl.domElement,
        Math.round(screenX - this.size * 0.5),
        Math.round(screenY - this.size * 0.82),
        this.size,
        this.size,
      );
      return;
    }
    this.drawFallback2D(ctx, screenX, screenY, state);
  }

  private drawFallback2D(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    state: PlushPoseState,
  ) {
    const { pink, facing, walking, grounded, roll, rollAngle, time: t } = state;
    const scale = (pink ? 42 : 39) * (state.riding ? 0.78 : 1);
    const bounce = grounded
      ? Math.abs(Math.sin(t * walking * 2.1)) * Math.min(2.5, walking * 0.5)
      : 1;

    ctx.save();
    ctx.translate(Math.round(screenX), Math.round(screenY - scale * 0.42 - bounce));
    if (roll) {
      ctx.rotate(-rollAngle * state.rollFacing);
    } else if (state.cannonFlight) {
      ctx.rotate(t * 14 * facing);
    }
    ctx.scale(facing < 0 ? -1 : 1, 1);

    const swing = walking > 0.1 ? Math.sin(t * walking * 2.1) * 4 : 0;
    const bodyCol = pink ? plush.fabricPink : plush.fabricPurple;
    const sheenCol = pink ? plush.sheenPink : plush.sheenPurple;
    const stitchCol = pink ? plush.stitchPink : plush.stitchPurple;

    // Back foot & arm
    ctx.fillStyle = stitchCol;
    ctx.beginPath();
    ctx.ellipse(-3 - swing, scale * 0.38, 5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plush silhouette from BODY_PROFILE
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const p = BODY_PROFILE.getPoint(i / 20);
      const px = p.x * scale;
      const py = (0.42 - p.y) * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = 20; i >= 0; i--) {
      const p = BODY_PROFILE.getPoint(i / 20);
      const px = -p.x * scale;
      const py = (0.42 - p.y) * scale;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Soft belly sheen
    ctx.fillStyle = sheenCol;
    ctx.beginPath();
    ctx.ellipse(2, 0, scale * 0.18, scale * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose (elongated plush trunk/snout)
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.ellipse(
      scale * 0.26,
      -scale * 0.02,
      scale * (pink ? 0.18 : 0.15),
      scale * 0.08,
      0.32,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Yellow tuft for Rose
    if (pink) {
      ctx.strokeStyle = plush.tuftYellow;
      ctx.lineWidth = 1.6;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(k * 1.2, -scale * 0.35);
        ctx.lineTo(k * 2.2, -scale * 0.45);
        ctx.stroke();
      }
    }

    // FlatEye
    ctx.fillStyle = plush.eyeWhite;
    ctx.beginPath();
    ctx.ellipse(scale * 0.11, -scale * 0.16, 2.6, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = plush.eyeInk;
    ctx.beginPath();
    ctx.ellipse(scale * 0.13, -scale * 0.15, 1.5, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front arm & foot
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    const armY = state.carrying ? -scale * 0.28 : 2 + swing * 0.5;
    ctx.ellipse(-1 + swing * 0.5, armY, 3.2, 6.5, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3 + swing, scale * 0.39, 5.2, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  dispose() {
    this.gl?.dispose();
  }
}
