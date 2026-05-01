import { createEffect, createSignal, onMount } from 'solid-js'
import WebRenderer from '@elemaudio/web-renderer'
import { el } from '@elemaudio/core'
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

  const [isMuted, setIsMuted] = createSignal(true)
  const silence = el.const({ value: 0 })
  const [currentGraph, setCurrentGraph] = createSignal<unknown>(silence)
  const mute = () => setIsMuted(true)
  const unmute = () => setIsMuted(false)

  createEffect(
    unwait(async () => {
      const graph = currentGraph()

      await core().render(isMuted() ? silence : graph)
    }),
  )

  const render = async (graph: unknown) => {
    setCurrentGraph(graph)
  }

  const activate = async () => {
    await context.resume()
  }

  return { render, activate, isMuted, mute, unmute }
}
