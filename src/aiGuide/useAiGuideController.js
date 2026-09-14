import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import defaultAiGuideConfig from './aiGuideConfig.json'
import { loadAiGuideConfig } from './aiGuideConfigLoader.js'
import {
  addExclusiveAudioListener,
  dispatchExclusiveAudioStart,
} from '../utils/audioCoordinator.js'

const GUIDE_AUDIO_SOURCE_ID = 'ai-guide-controller'

const AUDIO_PRIORITY = {
  ERROR: 4,
  WRONG_CONNECTION: 3,
  STAGE_INSTRUCTION: 2,
  SUCCESS: 1,
}

const CONNECTION_STAGES = {
  1: [
    { instructionId: '5', pair: ['5-endpoint', '11-endpoint'] },
    { instructionId: '6', pair: ['6-endpoint', '13-endpoint'] },
    { instructionId: '7', pair: ['9-endpoint', '10-endpoint'] },
  ],
  2: [
    { instructionId: '17', pair: ['7-endpoint', '9-endpoint'] },
    { instructionId: '18', pair: ['8-endpoint', '10-endpoint'] },
    { instructionId: '19', pair: ['1-endpoint', '11-endpoint'] },
    { instructionId: '20', pair: ['2-endpoint', '13-endpoint'] },
  ],
  3: [
    { instructionId: '26', pair: ['3-endpoint', '11-endpoint'] },
    { instructionId: '27', pair: ['4-endpoint', '12-endpoint'] },
    { instructionId: '28', pair: ['13-endpoint', '14-endpoint'] },
  ],
}

const CASE_COMPLETE_INSTRUCTION = {
  1: '8',
  2: '21',
  3: '29',
}

const CASE_VERIFIED_INSTRUCTION = {
  1: '14',
  2: '22',
  3: '38',
}

const AUTO_CONNECT_INSTRUCTION = {
  1: '11',
  2: '42',
  3: '43',
}

const REQUIRED_CONNECTION_COUNTS = {
  1: 3,
  2: 4,
  3: 5,
}

const createInitialState = () => ({
  activeAlert: null,
  activeAlertInstruction: null,
  autoConnectUsed: {
    1: false,
    2: false,
    3: false,
  },
  calculationStarted: false,
  case1Completed: false,
  case1ConnectionsVerified: false,
  case1Started: false,
  case2Completed: false,
  case2ConnectionsVerified: false,
  case2Started: false,
  case3Completed: false,
  case3ConnectionsVerified: false,
  case3Started: false,
  connectionStepIndex: 0,
  currentAudio: null,
  currentAudioPriority: null,
  currentCase: 1,
  currentInstruction: null,
  guideStarted: false,
  playedAudioIds: [],
  reportGenerated: false,
  resistanceConfigured: false,
  resistanceSelections: {
    rl: false,
  },
  startupCompleted: false,
  theoremVerified: false,
  ammeterReadingDisplayed: false,
  voltageReadingDisplayed: false,
  walkthroughCompleted: false,
  walkthroughNarrationCompleted: false,
})

const isSamePair = (sourceId, targetId, pair) => (
  (sourceId === pair[0] && targetId === pair[1])
  || (sourceId === pair[1] && targetId === pair[0])
)

const formatConnectionPairs = (pairs) => {
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return []
  }

  return pairs.map(([sourceId, targetId]) => {
    const sourceNumber = String(sourceId).replace('-endpoint', '')
    const targetNumber = String(targetId).replace('-endpoint', '')

    return `${sourceNumber}–${targetNumber}`
  })
}

const getConnectionAlertTarget = (caseNumber) => (
  caseNumber === 1 ? '#circuit-panel' : '#circuit-panel'
)

export const useAiGuideController = ({
  clearAlerts,
  confirmAlert,
  config = defaultAiGuideConfig,
  dismissAlert,
  locale,
  onAudioError,
  showStepAlert,
} = {}) => {
  const guideConfig = useMemo(
    () => loadAiGuideConfig(config, locale ?? config?.defaultLocale),
    [config, locale],
  )
  const instructionsById = useMemo(
    () => new Map(guideConfig.steps.map((instruction) => [
      instruction.id,
      instruction,
    ])),
    [guideConfig.steps],
  )
  const [state, setState] = useState(createInitialState)
  const stateRef = useRef(state)
  const audioPlaybackRef = useRef(null)
  const playedAudioIdsRef = useRef(new Set())
  const sequenceTokenRef = useRef(0)

  const updateState = useCallback((updater) => {
    const nextState = typeof updater === 'function'
      ? updater(stateRef.current)
      : { ...stateRef.current, ...updater }

    stateRef.current = nextState
    setState(nextState)
    return nextState
  }, [])

  const stopCurrentAudio = useCallback((reason = 'interrupted') => {
    const playback = audioPlaybackRef.current

    if (!playback) {
      return
    }

    audioPlaybackRef.current = null
    playback.audio.pause()
    playback.audio.currentTime = 0
    playback.finish(reason)
  }, [])

  const playInstruction = useCallback((instructionId, {
    force = false,
    playbackId = String(instructionId),
    priority = AUDIO_PRIORITY.STAGE_INSTRUCTION,
    recordCompletion = true,
  } = {}) => {
    const normalizedInstructionId = String(instructionId)
    const instruction = instructionsById.get(normalizedInstructionId)

    if (!instruction || !instruction.audio || instruction.audio === '#') {
      onAudioError?.(
        new Error(`AI Guide instruction ${normalizedInstructionId} has no audio file configured.`),
      )
      return Promise.resolve('error')
    }

    if (!force && playedAudioIdsRef.current.has(playbackId)) {
      return Promise.resolve('skipped')
    }

    const activePlayback = audioPlaybackRef.current

    if (!force && activePlayback?.playbackId === playbackId) {
      return activePlayback.promise
    }

    stopCurrentAudio('replaced')
    dispatchExclusiveAudioStart(GUIDE_AUDIO_SOURCE_ID)

    const audio = new Audio(instruction.audio)
    let settlePromise
    const promise = new Promise((resolve) => {
      settlePromise = resolve
    })
    const playback = {
      audio,
      finish: null,
      playbackId,
      promise,
    }
    let settled = false

    const finish = (reason) => {
      if (settled) {
        return
      }

      settled = true
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)

      if (audioPlaybackRef.current === playback) {
        audioPlaybackRef.current = null
      }

      if (reason === 'ended' && recordCompletion) {
        playedAudioIdsRef.current.add(playbackId)
      }

      const completedAlertId = (
        reason === 'ended'
        && stateRef.current.activeAlertInstruction === normalizedInstructionId
      )
        ? stateRef.current.activeAlert
        : null

      if (completedAlertId) {
        dismissAlert?.(completedAlertId)
      }

      updateState((current) => ({
        ...current,
        activeAlert:
          current.activeAlert === completedAlertId
            ? null
            : current.activeAlert,
        activeAlertInstruction:
          current.activeAlert === completedAlertId
            ? null
            : current.activeAlertInstruction,
        currentAudio:
          current.currentAudio === normalizedInstructionId
            ? null
            : current.currentAudio,
        currentAudioPriority:
          current.currentAudio === normalizedInstructionId
            ? null
            : current.currentAudioPriority,
        playedAudioIds: [...playedAudioIdsRef.current],
      }))
      settlePromise(reason)
    }

    const handleEnded = () => finish('ended')
    const handleError = () => {
      onAudioError?.(
        new Error(`Unable to play AI Guide audio: ${instruction.audio}`),
      )
      finish('error')
    }

    playback.finish = finish
    audioPlaybackRef.current = playback
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    updateState((current) => ({
      ...current,
      currentAudio: normalizedInstructionId,
      currentAudioPriority: priority,
    }))

    audio.play().catch(handleError)

    return promise
  }, [
    dismissAlert,
    instructionsById,
    onAudioError,
    stopCurrentAudio,
    updateState,
  ])

  const runInstructionSequence = useCallback(async (entries, {
    onComplete,
  } = {}) => {
    const sequenceToken = sequenceTokenRef.current + 1
    sequenceTokenRef.current = sequenceToken
    stopCurrentAudio('sequence-replaced')

    for (const rawEntry of entries) {
      if (sequenceTokenRef.current !== sequenceToken) {
        return false
      }

      const entry = typeof rawEntry === 'string'
        ? { instructionId: rawEntry }
        : rawEntry
      const instructionId = String(entry.instructionId)

      if (entry.setCurrentInstruction !== false) {
        updateState((current) => ({
          ...current,
          currentInstruction: instructionId,
        }))
      }

      const result = await playInstruction(instructionId, entry)

      if (
        sequenceTokenRef.current !== sequenceToken
        || (result !== 'ended' && result !== 'skipped')
      ) {
        return false
      }
    }

    onComplete?.()
    return true
  }, [playInstruction, stopCurrentAudio, updateState])

  const replayInstruction = useCallback((instructionId) => (
    runInstructionSequence([{
      force: true,
      instructionId: String(instructionId),
      playbackId: `manual-replay:${String(instructionId)}:${Date.now()}`,
    }])
  ), [runInstructionSequence])

  const replayCurrentInstruction = useCallback(() => {
    const instructionId = stateRef.current.currentInstruction

    if (!instructionId) {
      return Promise.resolve(false)
    }

    return replayInstruction(instructionId)
  }, [replayInstruction])

  const showGuideAlert = useCallback((alert, instructionId = null) => {
    clearAlerts?.()

    let alertId = null
    const alertWithControllerAudio = {
      ...alert,
      audio: '#',
      onDismiss: (...args) => {
        alert.onDismiss?.(...args)

        if (stateRef.current.activeAlert === alertId) {
          stopCurrentAudio(`alert-${args[0] ?? 'dismissed'}`)
        }
      },
      onClose: (...args) => {
        alert.onClose?.(...args)
        updateState((current) => (
          current.activeAlert === alertId
            ? {
                ...current,
                activeAlert: null,
                activeAlertInstruction: null,
              }
            : current
        ))
      },
    }

    alertId = showStepAlert?.(alertWithControllerAudio) ?? null
    updateState((current) => ({
      ...current,
      activeAlert: alertId,
      activeAlertInstruction: instructionId
        ? String(instructionId)
        : null,
    }))

    return alertId
  }, [clearAlerts, showStepAlert, stopCurrentAudio, updateState])

  const confirmGuideAlert = useCallback(async (alert) => {
    clearAlerts?.()
    const activeAlertKey = alert.alertKey ?? `confirmation:${alert.title}`

    updateState((current) => ({
      ...current,
      activeAlert: activeAlertKey,
      activeAlertInstruction: null,
    }))

    const result = await (confirmAlert?.({
      ...alert,
      audio: '#',
      onDismiss: (...args) => {
        alert.onDismiss?.(...args)

        if (stateRef.current.activeAlert === activeAlertKey) {
          stopCurrentAudio(`alert-${args[0] ?? 'dismissed'}`)
        }
      },
    }) ?? Promise.resolve(false))

    updateState((current) => (
      current.activeAlert === activeAlertKey
        ? {
            ...current,
            activeAlert: null,
            activeAlertInstruction: null,
          }
        : current
    ))

    return result
  }, [
    clearAlerts,
    confirmAlert,
    stopCurrentAudio,
    updateState,
  ])

  const startCase = useCallback((caseNumber) => {
    const stateKey = `case${caseNumber}Started`

    if (
      stateRef.current[stateKey]
      || stateRef.current[`case${caseNumber}Completed`]
    ) {
      return Promise.resolve(false)
    }

    updateState((current) => ({
      ...current,
      [stateKey]: true,
      connectionStepIndex: 0,
      currentCase: caseNumber,
    }))

    if (!stateRef.current.guideStarted) {
      return Promise.resolve(true)
    }

    const introInstruction = caseNumber === 1
      ? ['3', '4', '5']
      : caseNumber === 2
        ? ['16', '17']
        : ['25', '26']

    return runInstructionSequence(introInstruction)
  }, [runInstructionSequence, updateState])

  const notify = useCallback(async (eventOrType, detail = {}) => {
    const event = typeof eventOrType === 'string'
      ? { ...detail, type: eventOrType }
      : eventOrType
    const type = event?.type

    switch (type) {
      case 'START_GUIDE': {
        if (
          stateRef.current.guideStarted
          && stateRef.current.startupCompleted
        ) {
          return replayCurrentInstruction()
        }

        const guideWasAlreadyStarted = stateRef.current.guideStarted

        if (!guideWasAlreadyStarted) {
          updateState((current) => ({
            ...current,
            guideStarted: true,
          }))
        }

        const completed = await runInstructionSequence([
          guideWasAlreadyStarted
            ? {
                force: true,
                instructionId: '1',
                playbackId: `startup-retry:${Date.now()}`,
              }
            : '1',
        ])

        if (completed) {
          updateState((current) => ({
            ...current,
            startupCompleted: true,
          }))
        }

        return completed
      }

      case 'WALKTHROUGH_COMPLETED': {
        if (stateRef.current.walkthroughCompleted) {
          return false
        }

        updateState((current) => ({
          ...current,
          walkthroughCompleted: true,
        }))

        const completed = await runInstructionSequence(['2'])

        if (!completed) {
          return false
        }

        updateState((current) => ({
          ...current,
          walkthroughNarrationCompleted: true,
        }))

        if (stateRef.current.resistanceConfigured) {
          await startCase(1)
        }

        return true
      }

      case 'RESISTANCE_CONFIGURATION': {
        const selections = event.selections ?? {}
        const wasConfigured = stateRef.current.resistanceConfigured

        updateState((current) => ({
          ...current,
          resistanceConfigured: Boolean(event.configured),
          resistanceSelections: {
            ...current.resistanceSelections,
            ...selections,
          },
        }))

        if (
          !wasConfigured
          && event.configured
          && stateRef.current.walkthroughNarrationCompleted
        ) {
          return startCase(1)
        }

        return true
      }

      case 'RESISTANCE_REQUIRED': {
        showGuideAlert({
          description: 'Please set RL using the resistance slider.',
          target: '#resistance-controls',
          title: 'Set Load Resistance First',
          type: 'warning',
        }, '12')

        return runInstructionSequence([{
          force: true,
          instructionId: '12',
          playbackId: `resistance-required:${Date.now()}`,
          priority: AUDIO_PRIORITY.ERROR,
        }])
      }

      case 'MANUAL_CONNECTION': {
        const caseNumber = Number(event.caseNumber)
        const stages = CONNECTION_STAGES[caseNumber]

        if (!stages || !stateRef.current[`case${caseNumber}Started`]) {
          return false
        }

        const currentIndex = stateRef.current.connectionStepIndex
        const pendingStage = stages[currentIndex]

        if (
          pendingStage
          && isSamePair(event.sourceId, event.targetId, pendingStage.pair)
        ) {
          const nextIndex = currentIndex + 1

          updateState((current) => ({
            ...current,
            connectionStepIndex: nextIndex,
          }))

          if (nextIndex < stages.length) {
            return runInstructionSequence([
              stages[nextIndex].instructionId,
            ])
          }

          return runInstructionSequence([
            CASE_COMPLETE_INSTRUCTION[caseNumber],
          ])
        }

        showGuideAlert({
          description: 'This connection is wrong.',
          target: getConnectionAlertTarget(caseNumber),
          title: 'Wrong Connection',
          type: 'error',
        }, '9')

        return runInstructionSequence([
          {
            force: true,
            instructionId: '9',
            playbackId: `wrong-connection:${Date.now()}`,
            priority: AUDIO_PRIORITY.WRONG_CONNECTION,
            setCurrentInstruction: false,
          },
          {
            force: true,
            instructionId:
              pendingStage?.instructionId
              ?? stateRef.current.currentInstruction
              ?? CASE_COMPLETE_INSTRUCTION[caseNumber],
            playbackId: `retry:${
              pendingStage?.instructionId
              ?? stateRef.current.currentInstruction
              ?? CASE_COMPLETE_INSTRUCTION[caseNumber]
            }:${Date.now()}`,
            priority: AUDIO_PRIORITY.STAGE_INSTRUCTION,
          },
        ])
      }

      case 'AUTO_CONNECT_BLOCKED_EXISTING': {
        return runInstructionSequence([{
          force: true,
          instructionId: '39',
          playbackId: `existing-connections:${Date.now()}`,
          priority: AUDIO_PRIORITY.ERROR,
          setCurrentInstruction: false,
        }])
      }

      case 'AUTO_CONNECT_COMPLETED': {
        const caseNumber = Number(event.caseNumber)
        const stages = CONNECTION_STAGES[caseNumber]
        const instructionId = AUTO_CONNECT_INSTRUCTION[caseNumber]

        if (!stages || !instructionId) {
          return false
        }

        updateState((current) => ({
          ...current,
          autoConnectUsed: {
            ...current.autoConnectUsed,
            [caseNumber]: true,
          },
          [`case${caseNumber}ConnectionsVerified`]: true,
          [`case${caseNumber}Started`]: true,
          connectionStepIndex: stages.length,
          currentCase: caseNumber,
        }))

        showGuideAlert({
          description: caseNumber === 1
            ? 'Autoconnect completed. The digital multimeter is now displaying the Thevenin equivalent resistance value. Now, click on the add button to add the reading to the observation table.'
            : caseNumber === 2
              ? 'Autoconnect completed. Now switch ON the power supply and set the required voltage value.'
              : 'Autoconnect completed. Now turn ON the power supply.',
          target: caseNumber === 1 ? '#add-reading-button' : '#power-toggle-button',
          title: 'Autoconnect Completed',
          type: 'success',
        }, instructionId)

        return runInstructionSequence([{
          instructionId,
          playbackId: `auto-connect-case-${caseNumber}`,
          priority: AUDIO_PRIORITY.SUCCESS,
        }])
      }

      case 'AUTO_CONNECT_UNAVAILABLE': {
        showGuideAlert({
          description: 'Auto Connect is not available for the current experiment stage.',
          title: 'Auto Connect Unavailable',
          type: 'warning',
        })
        return false
      }

      case 'CHECK_RESULT': {
        const caseNumber = Number(event.caseNumber)
        const verifiedStateKey = `case${caseNumber}ConnectionsVerified`

        if (event.result?.isCorrect) {
          if (stateRef.current[verifiedStateKey]) {
            return true
          }

          const instructionId = CASE_VERIFIED_INSTRUCTION[caseNumber]
          const description = instructionsById.get(instructionId)?.text

          updateState((current) => ({
            ...current,
            [verifiedStateKey]: true,
            [`case${caseNumber}Started`]: true,
            connectionStepIndex:
              CONNECTION_STAGES[caseNumber]?.length
              ?? current.connectionStepIndex,
            currentCase: caseNumber,
          }))
          showGuideAlert({
            description,
            target:
              caseNumber === 1
                ? '#add-reading-button'
                : '#power-toggle-button',
            title: 'Connections Verified',
            type: 'success',
          }, instructionId)

          return runInstructionSequence([{
            instructionId,
            priority: AUDIO_PRIORITY.SUCCESS,
          }])
        }

        const totalConnections = Number(event.result?.totalConnections ?? 0)
        const matchedConnections = Number(event.result?.matchedCount ?? 0)
        const requiredConnections = REQUIRED_CONNECTION_COUNTS[caseNumber] ?? 0
        const wrongPairs = Array.isArray(event.result?.wrongPairs)
          ? event.result.wrongPairs
          : []
        const missingPairs = Array.isArray(event.result?.missingPairs)
          ? event.result.missingPairs
          : []
        const wrongConnections = Array.isArray(event.result?.wrongPairs)
          ? wrongPairs.length
          : Math.max(totalConnections - matchedConnections, 0)
        const missingConnections = Array.isArray(event.result?.missingPairs)
          ? missingPairs.length
          : Math.max(requiredConnections - matchedConnections, 0)
        const pendingStage =
          CONNECTION_STAGES[caseNumber]?.[stateRef.current.connectionStepIndex]

        if (wrongConnections === 0 && missingConnections > 0) {
          showGuideAlert({
            connectionDetails: {
              missing: formatConnectionPairs(missingPairs),
            },
            description: 'Please make the required connections as per the given instructions.',
            target: '#circuit-panel',
            title: 'Required Connections',
            type: 'warning',
          }, '13')

          return runInstructionSequence([{
            force: true,
            instructionId: '13',
            playbackId: `connections-required:${Date.now()}`,
            priority: AUDIO_PRIORITY.ERROR,
            setCurrentInstruction: false,
          }])
        }

        const hasMultipleWrongConnections = wrongConnections > 1
        const errorInstructionId = hasMultipleWrongConnections ? '10' : '9'
        const errorText = hasMultipleWrongConnections
          ? 'Some connections are wrong.'
          : 'This connection is wrong.'
        showGuideAlert({
          connectionDetails: {
            missing: formatConnectionPairs(missingPairs),
            wrong: formatConnectionPairs(wrongPairs),
          },
          description: errorText,
          target: '#circuit-panel',
          title: hasMultipleWrongConnections
            ? 'Wrong Connections'
            : 'Wrong Connection',
          type: 'error',
        }, errorInstructionId)

        const entries = [{
          force: true,
          instructionId: errorInstructionId,
          playbackId: `wrong-connections-check:${Date.now()}`,
          priority: hasMultipleWrongConnections
            ? AUDIO_PRIORITY.ERROR
            : AUDIO_PRIORITY.WRONG_CONNECTION,
          setCurrentInstruction: false,
        }]

        if (pendingStage) {
          entries.push({
            force: true,
            instructionId: pendingStage.instructionId,
            playbackId: `retry:${pendingStage.instructionId}:${Date.now()}`,
          })
        }

        return runInstructionSequence(entries)
      }

      case 'READING_ADDED': {
        const caseNumber = Number(event.caseNumber)
        const completedStateKey = `case${caseNumber}Completed`

        if (stateRef.current[completedStateKey]) {
          return false
        }

        updateState((current) => ({
          ...current,
          [completedStateKey]: true,
        }))

        const instructionId = caseNumber === 1
          ? '15'
          : caseNumber === 2
            ? '24'
            : '31'

        if (caseNumber === 3) {
          showGuideAlert({
            description: instructionsById.get(instructionId)?.text,
            target: '#calculate-button',
            title: 'Final Reading Added',
            type: 'success',
          }, instructionId)
        }

        return runInstructionSequence([{
          instructionId,
          priority: AUDIO_PRIORITY.SUCCESS,
        }])
      }

      case 'LOAD_READING_ADDED': {
        const readingCount = Number(event.readingCount)
        const instructionId = readingCount === 1
          ? '44'
          : readingCount === 2
            ? '45'
            : null

        if (!instructionId) {
          return true
        }

        showGuideAlert({
          description: instructionsById.get(instructionId)?.text,
          target: '#resistance-controls',
          title: 'Reading Added Successfully',
          type: 'success',
        }, instructionId)

        return runInstructionSequence([{
          instructionId,
          priority: AUDIO_PRIORITY.SUCCESS,
        }])
      }

      case 'CASE_CONNECTIONS_REMOVED': {
        const completedCase = Number(event.caseNumber)

        if (completedCase === 1) {
          return startCase(2)
        }

        if (completedCase === 2) {
          return startCase(3)
        }

        return false
      }

      case 'VOLTAGE_SET': {
        if (stateRef.current.voltageReadingDisplayed) {
          return false
        }

        updateState((current) => ({
          ...current,
          voltageReadingDisplayed: true,
        }))
        showGuideAlert({
          description: instructionsById.get('23')?.text,
          target: '#add-reading-button',
          title: 'Voltmeter Reading Displayed',
          type: 'success',
        }, '23')

        return runInstructionSequence([{
          instructionId: '23',
          priority: AUDIO_PRIORITY.SUCCESS,
        }])
      }

      case 'POWER_ON': {
        if (Number(event.caseNumber) !== 3 || stateRef.current.ammeterReadingDisplayed) {
          return false
        }

        updateState((current) => ({
          ...current,
          ammeterReadingDisplayed: true,
        }))
        showGuideAlert({
          description: instructionsById.get('30')?.text,
          target: '#add-reading-button',
          title: 'Ammeter Reading Displayed',
          type: 'success',
        }, '30')

        return runInstructionSequence([{
          instructionId: '30',
          priority: AUDIO_PRIORITY.SUCCESS,
        }])
      }

      case 'POWER_REJECTED': {
        showGuideAlert({
          description: event.description,
          target: event.target ?? '#check-button',
          title: event.title ?? 'Power Supply Unavailable',
          type: 'warning',
        })
        return false
      }

      case 'ADD_REJECTED':
      case 'REPORT_BLOCKED':
      case 'CALCULATION_INPUT_INVALID': {
        showGuideAlert({
          description: event.description,
          target: event.target,
          title: event.title,
          type: event.alertType ?? 'warning',
        })
        return false
      }

      case 'RESISTANCE_SLIDER_BLOCKED': {
        const instructionId = '46'

        showGuideAlert({
          description: instructionsById.get(instructionId)?.text,
          target: event.target,
          title: event.title,
          type: event.alertType ?? 'warning',
        }, instructionId)

        return runInstructionSequence([{
          force: true,
          instructionId,
          playbackId: `resistance-slider-blocked:${Date.now()}`,
          priority: AUDIO_PRIORITY.ERROR,
        }])
      }

      case 'CALCULATION_INPUT_REQUIRED': {
        const instructionId = Number(event.missingCount) === 1 ? '40' : '41'

        showGuideAlert({
          description: event.description,
          target: event.target,
          title: event.title,
          type: event.alertType ?? 'warning',
        }, instructionId)

        return runInstructionSequence([{
          force: true,
          instructionId,
          playbackId: `calculation-input-required:${instructionId}:${Date.now()}`,
          priority: AUDIO_PRIORITY.ERROR,
        }])
      }

      case 'CALCULATE': {
        if (!stateRef.current.calculationStarted) {
          updateState((current) => ({
            ...current,
            calculationStarted: true,
          }))
        }

        showGuideAlert({
          description: instructionsById.get('32')?.text,
          target: '#calculation-panel',
          title: 'Calculations Panel',
          type: 'info',
        }, '32')

        return runInstructionSequence([{
          force: true,
          instructionId: '32',
          playbackId: `calculate:${Date.now()}`,
        }])
      }

      case 'VERIFICATION_RESULT': {
        if (event.isCorrect) {
          updateState((current) => ({
            ...current,
            theoremVerified: true,
          }))

          showGuideAlert({
            description: instructionsById.get('34')?.text,
            target: '#generate-report-button',
            title: 'Verification Successful',
            type: 'success',
          }, '34')

          return runInstructionSequence([{
            force: true,
            instructionId: '34',
            playbackId: `correct-calculation:${Date.now()}`,
            priority: AUDIO_PRIORITY.SUCCESS,
          }])
        }

        updateState((current) => ({
          ...current,
          theoremVerified: false,
        }))
        showGuideAlert({
          description: instructionsById.get('33')?.text,
          target: '#calculation-panel',
          title: 'Verification Failed',
          type: 'error',
        }, '33')

        return runInstructionSequence([{
          force: true,
          instructionId: '33',
          playbackId: `incorrect-calculation:${Date.now()}`,
          priority: AUDIO_PRIORITY.ERROR,
        }])
      }

      case 'REPORT_REQUEST': {
        if (stateRef.current.reportGenerated) {
          return true
        }

        const narrationPromise = runInstructionSequence([{
          instructionId: '37',
          priority: AUDIO_PRIORITY.SUCCESS,
        }])
        const shouldOpenReport = await confirmGuideAlert({
          confirmLabel: 'OK',
          description: instructionsById.get('37')?.text,
          target: '#generate-report-button',
          title: 'Report Generated',
          type: 'success',
        })

        if (shouldOpenReport) {
          await narrationPromise
        }

        return shouldOpenReport
      }

      case 'REPORT_GENERATED': {
        updateState((current) => ({
          ...current,
          reportGenerated: true,
        }))
        return true
      }

      case 'PRINT': {
        return runInstructionSequence([{
          force: true,
          instructionId: '36',
          playbackId: `print:${Date.now()}`,
          priority: AUDIO_PRIORITY.SUCCESS,
        }])
      }

      case 'RESET': {
        sequenceTokenRef.current += 1
        stopCurrentAudio('reset')
        clearAlerts?.()
        playedAudioIdsRef.current.clear()
        updateState(createInitialState())
        showGuideAlert({
          description: instructionsById.get('35')?.text,
          target: '#circuit-panel',
          title: 'Simulation Reset',
          type: 'success',
        }, '35')

        return runInstructionSequence([{
          force: true,
          instructionId: '35',
          playbackId: 'reset',
          priority: AUDIO_PRIORITY.SUCCESS,
          recordCompletion: false,
          setCurrentInstruction: false,
        }])
      }

      default:
        return false
    }
  }, [
    clearAlerts,
    confirmGuideAlert,
    instructionsById,
    replayCurrentInstruction,
    runInstructionSequence,
    showGuideAlert,
    startCase,
    stopCurrentAudio,
    updateState,
  ])

  useEffect(() => (
    addExclusiveAudioListener(GUIDE_AUDIO_SOURCE_ID, () => {
      sequenceTokenRef.current += 1
      stopCurrentAudio('interrupted')
    })
  ), [stopCurrentAudio])

  useEffect(() => () => {
    sequenceTokenRef.current += 1
    stopCurrentAudio('unmount')
  }, [stopCurrentAudio])

  return {
    activeInstructionId: state.currentInstruction,
    isAudioPlaying: Boolean(state.currentAudio),
    notify,
    replayCurrentInstruction,
    state,
  }
}
