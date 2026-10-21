import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  SphereGeometry,
  ConeGeometry,
  CapsuleGeometry,
  BoxGeometry,
  CylinderGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  Group,
  CatmullRomCurve3,
  TubeGeometry,
  Vector3,
  DoubleSide,
} from "three";
import { ENEMY_DESIGNS } from "../game/enemies";
import { enemyRenderVisible, type Enemy, type Game } from "../game/engine";

const shapes = {
  round: new SphereGeometry(1, 18, 12),
  limb: new CapsuleGeometry(0.1, 0.35, 5, 12),
  tooth: new ConeGeometry(1, 1, 7),
  box: new BoxGeometry(1, 1, 1),
  cylinder: new CylinderGeometry(1, 1, 1, 16),
  ring: new TorusGeometry(1, 0.05, 6, 24),
};
const materials = new Map<string, MeshStandardMaterial>();
function material(color: string) {
  if (!materials.has(color))
    materials.set(
      color,
      new MeshStandardMaterial({
        color,
        roughness: 0.68,
        transparent: color === "#ccded3" || color === "#e4ead1",
        opacity: color === "#ccded3" || color === "#e4ead1" ? 0.53 : 1,
        depthWrite: color !== "#ccded3" && color !== "#e4ead1",
      }),
    );
  return materials.get(color)!;
}
function Part({
  color,
  at = [0, 0, 0],
  size = [1, 1, 1],
  rotation = [0, 0, 0],
  shape = "round",
}: {
  color: string;
  at?: [number, number, number];
  size?: [number, number, number];
  rotation?: [number, number, number];
  shape?: keyof typeof shapes;
}) {
  return (
    <mesh
      geometry={shapes[shape]}
      material={material(color)}
      position={at}
      scale={size}
      rotation={rotation}
      castShadow
      dispose={null}
    />
  );
}
const tail = new TubeGeometry(
  new CatmullRomCurve3([
    new Vector3(-0.2, 0.35, 0),
    new Vector3(-0.7, 0.24, 0),
    new Vector3(-1.05, 0.18, 0.1),
    new Vector3(-1.27, 0.25, 0.15),
  ]),
  16,
  0.09,
  8,
  false,
);
function Eye({
  at,
  size = 0.12,
}: {
  at: [number, number, number];
  size?: number;
}) {
  return (
    <group position={at} rotation={[0, at[2] < 0 ? Math.PI : 0, 0]}>
      <Part color="#f6efbb" size={[size, size * 1.14, size * 0.7]} />
      <Part
        color="#a52e22"
        at={[0.035, -0.005, size * 0.6]}
        size={[size * 0.58, size * 0.67, size * 0.32]}
      />
      <Part
        color="#11120c"
        at={[0.045, -0.005, size * 0.83]}
        size={[size * 0.29, size * 0.49, size * 0.12]}
      />
      <Part
        color="#fffef0"
        at={[0.055, 0.035, size * 0.96]}
        size={[size * 0.14, size * 0.18, size * 0.09]}
      />
    </group>
  );
}
function Crocodile({
  helmet = false,
  king = false,
  gait,
}: {
  helmet?: boolean;
  king?: boolean;
  gait: React.RefObject<Group | null>;
}) {
  const green = helmet ? "#738547" : king ? "#5b893b" : "#528638",
    belly = king ? "#d6b24e" : "#bcb76b";
  return (
    <group
      scale={ENEMY_DESIGNS[king ? "boss" : helmet ? "armored" : "croc"].scale}
    >
      <mesh geometry={tail} material={material(green)} dispose={null} />
      <Part
        color={green}
        at={[-0.17, 0.75, 0]}
        size={[king ? 0.59 : helmet ? 0.53 : 0.41, 0.66, helmet ? 0.41 : 0.36]}
      />
      <Part
        color={belly}
        at={[0.12, 0.65, 0.05]}
        size={[helmet ? 0.36 : 0.29, 0.48, helmet ? 0.39 : 0.34]}
      />
      {[0, 1, 2, 3].map((n) => (
        <Part
          key={n}
          color={king ? "#b4953c" : "#929854"}
          at={[0.32, 0.37 + n * 0.16, 0.06]}
          size={[0.013, 0.016, 0.23]}
        />
      ))}
      <Part color={green} at={[0.17, 1.31, 0]} size={[0.36, 0.32, 0.29]} />
      <Part color={green} at={[0.52, 1.15, 0.03]} size={[0.49, 0.19, 0.3]} />
      <Part
        color="#314826"
        at={[0.53, 1.055, 0.04]}
        size={[0.44, 0.045, 0.27]}
      />
      <Part color={belly} at={[0.51, 1.005, 0.04]} size={[0.4, 0.055, 0.25]} />
      <Part
        color="#26381b"
        at={[0.82, 1.25, 0.17]}
        size={[0.032, 0.025, 0.03]}
      />
      {[0, 1, 2].map((n) => (
        <Part
          key={n}
          color="#f5e7b3"
          at={[0.34 + n * 0.19, 1.044, 0.285]}
          size={[0.027, 0.07, 0.032]}
          shape="tooth"
          rotation={[0, 0, Math.PI]}
        />
      ))}
      <Eye at={[0.28, 1.43, 0.245]} />
      <Eye at={[0.28, 1.43, -0.245]} size={0.1} />
      <Part
        color={green}
        at={[0.23, 1.53, 0.25]}
        size={[0.18, 0.055, 0.11]}
        rotation={[0, 0, -0.18]}
      />
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[-0.11, 0.92, side * 0.32]}
          rotation={[0, 0, -0.3]}
        >
          <Part color={green} at={[0.08, -0.14, 0]} size={[0.1, 0.24, 0.11]} />
          <Part color={green} at={[0.16, -0.34, 0]} size={[0.14, 0.14, 0.15]} />
          {[0, 1, 2].map((n) => (
            <Part
              key={n}
              color="#e3dbaa"
              at={[0.28, -0.38, (n - 1) * 0.08]}
              size={[0.06, 0.026, 0.02]}
              shape="tooth"
              rotation={[0, 0, -Math.PI / 2]}
            />
          ))}
        </group>
      ))}
      {helmet && (
        <Part color="#645386" at={[-0.14, 0.32, 0]} size={[0.5, 0.21, 0.39]} />
      )}
      <group ref={gait}>
        {[-1, 1].map((side) => (
          <group key={side} position={[-0.17, 0.26, side * 0.24]}>
            <Part
              color={helmet ? "#645386" : green}
              size={[0.22, 0.28, 0.22]}
            />
            <Part
              color={green}
              at={[0.22, -0.16, 0.025]}
              size={[0.3, 0.105, 0.22]}
            />
            {[0, 1, 2].map((n) => (
              <Part
                key={n}
                color="#e4d8a2"
                at={[0.46, -0.15, (n - 1) * 0.095]}
                size={[0.08, 0.035, 0.025]}
                shape="tooth"
                rotation={[0, 0, -Math.PI / 2]}
              />
            ))}
          </group>
        ))}
      </group>
      {[0, 1, 2, 3, 4].map((n) => (
        <Part
          key={n}
          color="#ba703b"
          at={[-0.48 - n * 0.13, 1.05 - n * 0.16, 0]}
          size={[0.12, 0.2 - n * 0.02, 0.08]}
          shape="tooth"
          rotation={[0, 0, 0.2]}
        />
      ))}
      {helmet && (
        <group position={[0.05, 1.65, 0]}>
          <Part color="#484d29" size={[0.48, 0.23, 0.39]} />
          <Part
            color="#73764b"
            at={[0.11, -0.1, 0]}
            size={[0.53, 0.047, 0.42]}
          />
          <Part
            color="#a8a268"
            at={[0.32, 0.01, 0.27]}
            size={[0.075, 0.06, 0.012]}
            shape="box"
          />
        </group>
      )}
      {king && (
        <>
          <group position={[0.08, 1.67, 0]}>
            <Part color="#e7b538" size={[0.37, 0.14, 0.32]} shape="cylinder" />
            {[0, 1, 2, 3, 4].map((n) => (
              <Part
                key={n}
                color="#ffd66b"
                at={[
                  Math.cos((n * Math.PI * 2) / 5) * 0.3,
                  0.23,
                  Math.sin((n * Math.PI * 2) / 5) * 0.27,
                ]}
                size={[0.1, 0.37, 0.09]}
                shape="tooth"
              />
            ))}
            <Part
              color="#c53c32"
              at={[0.04, 0.02, 0.325]}
              size={[0.065, 0.08, 0.025]}
            />
          </group>
          <Part
            color="#8d2924"
            at={[-0.49, 0.7, -0.08]}
            size={[0.15, 0.69, 0.48]}
            rotation={[0, 0, -0.23]}
          />
          <Part
            color="#c7b271"
            at={[-0.31, 1.18, 0.28]}
            size={[0.24, 0.09, 0.1]}
          />
        </>
      )}
    </group>
  );
}
function Beaver({ gait }: { gait: React.RefObject<Group | null> }) {
  return (
    <group scale={ENEMY_DESIGNS.beetle.scale}>
      <Part
        color="#70442c"
        at={[-0.59, 0.16, -0.03]}
        size={[0.56, 0.085, 0.28]}
        rotation={[0, -0.15, -0.13]}
      />
      {Array.from({ length: 5 }, (_, n) => (
        <Part
          key={n}
          color="#493425"
          at={[-0.8 + n * 0.11, 0.245, -0.025]}
          size={[0.012, 0.008, 0.22]}
          rotation={[0, 0.22, 0]}
        />
      ))}
      <Part color="#9b6439" at={[-0.12, 0.47, 0]} size={[0.56, 0.48, 0.37]} />
      <Part color="#c5a16a" at={[0.18, 0.36, 0.06]} size={[0.37, 0.29, 0.32]} />
      <Part color="#a87844" at={[0.3, 0.65, 0]} size={[0.4, 0.31, 0.31]} />
      <Part color="#ba955c" at={[0.59, 0.48, 0.04]} size={[0.3, 0.18, 0.26]} />
      <Part color="#35291f" at={[0.83, 0.54, 0.07]} size={[0.1, 0.08, 0.12]} />
      <Part color="#4d2b23" at={[0.59, 0.38, 0.12]} size={[0.2, 0.08, 0.15]} />
      {[-1, 1].map((side) => (
        <Part
          key={side}
          color="#fff0bc"
          at={[0.7, 0.32, side * 0.065 + 0.07]}
          size={[0.085, 0.14, 0.07]}
          shape="box"
          rotation={[0, 0, 0.15]}
        />
      ))}
      <Part color="#714628" at={[0.15, 0.92, 0.2]} size={[0.15, 0.16, 0.08]} />
      <Part color="#c5a276" at={[0.17, 0.92, 0.25]} size={[0.08, 0.1, 0.02]} />
      <Eye at={[0.39, 0.76, 0.265]} size={0.105} />
      <Eye at={[0.39, 0.76, -0.265]} size={0.105} />
      <group ref={gait}>
        {[-1, 1].map((side) => (
          <group key={side}>
            <Part
              color="#70482c"
              at={[-0.25, 0.1, side * 0.29]}
              size={[0.3, 0.1, 0.18]}
            />
            <Part
              color="#8c5b34"
              at={[0.32, 0.13, side * 0.25]}
              size={[0.23, 0.11, 0.15]}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
function Zinger({ wings }: { wings: React.RefObject<Group | null> }) {
  return (
    <group position={[0, 0.34, 0]}>
      <Part color="#e9b72b" size={[0.52, 0.3, 0.28]} />
      {[-0.25, 0, 0.25].map((x) => (
        <Part
          key={x}
          color="#29281b"
          at={[x, 0, 0]}
          size={[0.078, 0.293, 0.285]}
        />
      ))}
      <Part color="#edae21" at={[0.48, 0.03, 0]} size={[0.25, 0.25, 0.25]} />
      <Eye at={[0.52, 0.12, 0.21]} size={0.1} />
      <Eye at={[0.52, 0.12, -0.21]} size={0.1} />
      <Part
        color="#e5d6a2"
        at={[-0.7, -0.03, 0]}
        size={[0.13, 0.36, 0.12]}
        shape="tooth"
        rotation={[0, 0, Math.PI / 2]}
      />
      {[0, 1].map((n) => (
        <group key={n}>
          <Part
            color="#46371e"
            at={[0.48 + n * 0.2, 0.31, 0]}
            size={[0.018, 0.22, 0.018]}
            rotation={[0, 0, -0.3 + n * 0.6]}
          />
          <Part
            color="#3c2c1e"
            at={[0.52 + n * 0.12, 0.48, 0]}
            size={[0.055, 0.055, 0.05]}
          />
        </group>
      ))}
      <group ref={wings}>
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[-0.05, 0.2, side * 0.15]}
            rotation={[side * 0.5, 0, 0]}
          >
            <Part
              color="#ccded3"
              at={[-0.15, 0.23, side * 0.2]}
              size={[0.34, 0.035, 0.43]}
              rotation={[0, 0, -0.35]}
            />
            <Part
              color="#e4ead1"
              at={[0.06, 0.3, side * 0.3]}
              size={[0.24, 0.022, 0.39]}
            />
          </group>
        ))}
      </group>
      {[-1, 1].map((side) =>
        [0, 1, 2].map((n) => (
          <Part
            key={`${side}${n}`}
            color="#4d341c"
            at={[-0.25 + n * 0.2, -0.29, side * 0.18]}
            size={[0.019, 0.19, 0.019]}
            rotation={[side * 0.4, 0, 0.3]}
          />
        )),
      )}
    </group>
  );
}
export function EnemyModel({
  enemy,
  game,
  preview = false,
}: {
  enemy: Enemy;
  game?: Game;
  preview?: boolean;
}) {
  const root = useRef<Group>(null),
    body = useRef<Group>(null),
    gait = useRef<Group>(null),
    wings = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (root.current) {
      if (!preview) root.current.position.set(enemy.x, enemy.y, 0);
      root.current.visible = enemyRenderVisible(enemy, t, game, preview);
    }
    if (body.current) {
      body.current.rotation.y = enemy.vx < 0 ? Math.PI - 0.18 : 0.18;
      body.current.position.y =
        enemy.kind === "bee"
          ? Math.sin(t * 10) * 0.035
          : Math.abs(Math.sin(t * 7)) * 0.018;
    }
    gait.current?.children.forEach((limb, n) => {
      limb.rotation.z = Math.sin(t * 8 + n * Math.PI) * 0.28;
    });
    wings.current?.children.forEach((wing, n) => {
      wing.rotation.x = (n === 0 ? -1 : 1) * (0.6 + Math.sin(t * 45) * 0.65);
    });
  });
  return (
    <group ref={root} dispose={null} name="enemy" userData={{ enemy }}>
      <group ref={body}>
        {enemy.kind === "bee" ? (
          <Zinger wings={wings} />
        ) : enemy.kind === "beetle" ? (
          <Beaver gait={gait} />
        ) : (
          <Crocodile
            helmet={enemy.kind === "armored"}
            king={enemy.kind === "boss"}
            gait={gait}
          />
        )}
      </group>
    </group>
  );
}
