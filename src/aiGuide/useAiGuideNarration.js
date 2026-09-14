import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import defaultAiGuideConfig from './aiGuideConfig.json'
import { isConfiguredAudioSource, loadAiGuideConfig } from './aiGuideConfigLoader.js'
import { addExclusiveAudioListener, dispatchExclusiveAudioStart } from '../utils/audioCoordinator.js'

const AI_GUIDE_AUDIO_SOURCE_ID = 'ai-guide'

export const useAiGuideNarration = ({
  config = defaultAiGuideConfig,
  locale,
  onError,
  onFinish,
  onStart,
} = {}) => {
  const guideConfig = useMemo(
    () => loadAiGuideConfig(config, locale ?? config?.defaultLocale),
    [config, locale],
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeStepId, setActiveStepId] = useState(null)
  const isActiveRef = useRef(false)
  const currentPlaybackRef = useRef(null)
  const runIdRef = useRef(0)

  const stopCurrentPlayback = useCallback(() => {
    const currentPlayback = currentPlaybackRef.current

    if (!currentPlayback) {
      return
    }

    currentPlaybackRef.current = null
    currentPlayback.stop()
  }, [])

const stop = useCallback(() => {
  isActiveRef.current = false
  runIdRef.current += 1
  stopCurrentPlayback()
  setActiveStepId(null)
  setIsPlaying(false)
}, [stopCurrentPlayback])

  const playAudio = useCallback((audioSource) => new Promise((resolve, reject) => {
    const audio = new Audio(audioSource)
    let settled = false

    const cleanup = () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }

    const settle = (callback) => {
      if (settled) {
        return
      }

      settled = true
      cleanup()

      if (currentPlaybackRef.current?.audio === audio) {
        currentPlaybackRef.current = null
      }

      callback()
    }

    const handleEnded = () => settle(resolve)
    const handleError = () => settle(() => reject(new Error(`Unable to play AI Guide audio: ${audioSource}`)))

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    dispatchExclusiveAudioStart(AI_GUIDE_AUDIO_SOURCE_ID)

    currentPlaybackRef.current = {
      audio,
      stop: () => {
        audio.pause()
        audio.currentTime = 0
        settle(resolve)
      },
    }

    audio.play().catch((error) => {
      settle(() => reject(error))
    })
  }), [])

  const playStep = useCallback(async (step) => {
    if (!isConfiguredAudioSource(step.audio)) {
      throw new Error(`AI Guide step ${step.id} has no audio file configured.`)
    }

    await playAudio(step.audio)
  }, [playAudio])

  const playStepById = useCallback(async (stepId) => {
    if (guideConfig.steps.length === 0) {
      onError?.(new Error('AI Guide has no configured steps.'))
      return
    }

    if (!isActiveRef.current) {
      return
    }

    const step = guideConfig.steps.find((entry) => entry.id === String(stepId))

    if (!step) {
      return
    }

    const runId = runIdRef.current + 1
    runIdRef.current = runId
    stopCurrentPlayback()
    setActiveStepId(step.id)
    try {
    await playStep(step)

const completed = runIdRef.current === runId

if (completed) {
  setActiveStepId(null)
}

return completed
    } catch (error) {
      if (runIdRef.current === runId) {
  setActiveStepId(null)
  onError?.(error)
}
      return false
    }
  }, [guideConfig.steps, onError, playStep, stopCurrentPlayback])

  const playStepsById = useCallback(async (stepIds) => {
    if (!Array.isArray(stepIds) || !isActiveRef.current) {
      return
    }

    for (const stepId of stepIds) {
      if (!isActiveRef.current) {
        return
      }

      const completed = await playStepById(stepId)

      if (!completed) {
        return
      }
    }
  }, [playStepById])

  const start = useCallback(() => {
    stopCurrentPlayback()

    if (guideConfig.steps.length === 0) {
      isActiveRef.current = false
      setIsPlaying(false)
      onError?.(new Error('AI Guide has no configured steps.'))
      return
    }

    isActiveRef.current = true
    setIsPlaying(true)
    onStart?.(guideConfig)
    playStepById(1)
  }, [guideConfig, onError, onStart, playStepById, stopCurrentPlayback])

  const finish = useCallback(() => {
    isActiveRef.current = false
    runIdRef.current += 1
    stopCurrentPlayback()
    setActiveStepId(null)
    setIsPlaying(false)
    onFinish?.(guideConfig)
  }, [guideConfig, onFinish, stopCurrentPlayback])

  useEffect(() => addExclusiveAudioListener(AI_GUIDE_AUDIO_SOURCE_ID, () => {
    runIdRef.current += 1
    stopCurrentPlayback()
    setActiveStepId(null)
  }), [stopCurrentPlayback])

  useEffect(() => stop, [stop])

  return {
  config: guideConfig,
  activeStepId,
  finish,
  isPlaying,
  playStepById,
  playStepsById,
  start,
  stop,
}
}
