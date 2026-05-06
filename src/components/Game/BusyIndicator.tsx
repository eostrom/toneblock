import { Component, Show } from 'solid-js'
import { useGame } from '../../stores/GameContext'

export const BusyIndicator: Component = () => {
  const { view: viewState } = useGame()

  return (
    <Show when={viewState.busy}>
      <div class="pointer-events-none absolute top-1 right-1 z-50 flex items-center gap-1.5 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gray-700 uppercase shadow-sm backdrop-blur-sm">
        <svg
          class="h-3 w-3 animate-spin text-pink-600"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>{viewState.busyStatus}</span>
      </div>
    </Show>
  )
}
