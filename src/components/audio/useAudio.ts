import { createSignal, onMount } from 'solid-js'
import WebRenderer from '@elemaudio/web-renderer'
import { unwait } from '../../utils/promise'

/**
 * Low-level hook to provide Elementary web rendering.
 *
 * @returns An object with render and activate functions.
 */
export const useAudio = () => {
  const [core] = createSignal(new WebRenderer())
  const context = new AudioContext()

  onMount(
    unwait(async () => {
      const node = await core().initialize(context, {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      })
      node.connect(context.destination)
    }),
  )

  const render = async (graph: unknown) => {
    await core().render(graph)
  }

  const activate = async () => {
    await context.resume()
  }

  return {
    render,
    activate,
  }
}
