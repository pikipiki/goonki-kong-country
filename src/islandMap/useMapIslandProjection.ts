import { useLayoutEffect } from 'react'
import { Vector3, type PerspectiveCamera } from 'three'

export function useMapIslandProjection(
  camera: PerspectiveCamera,
  lookTarget: number,
  nodes: [number, number][],
  onProject: (points: { x: number; y: number }[]) => void,
  width: number,
  height: number,
) {
  useLayoutEffect(() => {
    camera.lookAt(0, 0, lookTarget)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    onProject(
      nodes.map(([nodeX, nodeZ]) => {
        const point = new Vector3(nodeX, 0.1, nodeZ + 1.35).project(camera)
        return {
          x: ((point.x + 1) * width) / 2,
          y: ((1 - point.y) * height) / 2,
        }
      }),
    )
  }, [camera, lookTarget, nodes, onProject, width, height])
}
