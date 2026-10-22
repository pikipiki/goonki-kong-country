import { Component, type ReactNode } from 'react'
import i18n from '../i18n'

export function Icon({
  name,
}: {
  name: 'sound' | 'mute' | 'expand' | 'pause' | 'arrow' | 'back' | 'map'
}) {
  const paths = {
    sound: 'M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
    mute: 'M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6',
    expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
    pause: 'M9 5v14m6-14v14',
    arrow: 'M4 12h15m-6-6 6 6-6 6',
    back: 'M19 12H4m6-6-6 6 6 6',
    map: 'm3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2V5Zm6-2v15m6-12v15',
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

export function Portrait({
  pink = true,
  small = false,
}: {
  pink?: boolean
  small?: boolean
}) {
  return (
    <span
      className={`portrait ${pink ? 'pink' : 'violet'} ${small ? 'small' : ''}`}
      aria-hidden="true"
    >
      <i />
      <i />
      <b />
    </span>
  )
}

export class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError(error: unknown) {
    console.error('[SceneBoundary]', error)
    return { failed: true }
  }
  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error('[SceneBoundary] render failed', error, info.componentStack)
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="webgl-fallback">
          <h2>{i18n.t('scene3dFailedTitle')}</h2>
          <p>{i18n.t('scene3dFailedBody')}</p>
          <button
            className="primary"
            onClick={() => {
              location.reload()
            }}
          >
            {i18n.t('reload')}
          </button>
        </div>
      )
    }

    return <>{this.props.children}</>
  }
}
