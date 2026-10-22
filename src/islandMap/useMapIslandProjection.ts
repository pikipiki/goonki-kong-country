import { useLayoutEffect } from 'react'
import { Vector3, type PerspectiveCamera, type OrthographicCamera } from 'three'

export function useMapIslandProjection(
  camera: PerspectiveCamera | OrthographicCamera,
  lookTarget: number,
  zoom: number,
  nodes: [number, number][],
  onProject: (points: { x: number; y: number }[]) => void,
  width: number,
  height: number,
) {
  useLayoutEffect(() => {
    const activeCamera = camera
    if ('zoom' in activeCamera) {
      // Three.js cameras are mutable scene objects; zoom must update in place.
      // eslint-disable-next-line react-hooks/immutability -- R3F camera ref, not React state
      activeCamera.zoom = zoom
    }
    activeCamera.lookAt(0, 0, lookTarget)
    activeCamera.updateProjectionMatrix()
    activeCamera.updateMatrixWorld()
    onProject(
      nodes.map(([nodeX, nodeZ]) => {
        const point = new Vector3(nodeX, 0.1, nodeZ + 1.35).project(
          activeCamera,
        )
        return {
          x: ((point.x + 1) * width) / 2,
          y: ((1 - point.y) * height) / 2,
        }
      }),
    )
  }, [camera, lookTarget, zoom, nodes, onProject, width, height])
}
