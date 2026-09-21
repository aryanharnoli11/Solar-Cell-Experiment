import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './ConnectionEndpoints.css'
import ConnectionLab from './components/ConnectionLab.jsx'
import ActionButtons from './components/ActionButtons.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import HeaderBoard from './components/HeaderBoard.jsx'
import WalkthroughStartButton from './walkthrough/components/WalkthroughStartButton.jsx'
import { useLabAlerts } from './alerts/useLabAlerts.js'
import { useAiGuideController } from './aiGuide/useAiGuideController.js'
import CalculationPanel from './components/CalculationPanel.jsx'
import { useWalkthrough } from './walkthrough/useWalkthrough.js'
import { calculateReadings } from './utils/circuitMath.js'
import {
  LOAD_MEASUREMENTS,
  OPEN_CIRCUIT_VOLTAGE,
  SHORT_CIRCUIT_CURRENT_AMPERES,
  SHORT_CIRCUIT_CURRENT_MILLIAMPERES,
} from './utils/solarReadings.js'
import { generateTheveninReport } from './utils/theveninReportGenerator.js'
import {
  FIXED_NETWORK_RESISTANCES,
  LOAD_RESISTANCE_VALUES,
  RESISTANCE_SLIDER_CONFIG,
} from './utils/resistance.js'

const BASE_WIDTH = 1152
const DEFAULT_CONTENT_HEIGHT = 1440
const PANEL_VIEWPORT_GUTTER = 0
const MIN_OBSERVATION_READINGS = 1 + LOAD_MEASUREMENTS.length
const MAX_OBSERVATIONS = LOAD_RESISTANCE_VALUES.length
const CIRCUIT_RESISTANCE_CONFIGURATION = { rl: true }

const getAvailableWidth = () => {
  if (typeof window === 'undefined') {
    return BASE_WIDTH
  }

  return (
    document.body?.clientWidth
    || document.documentElement.clientWidth
    || window.innerWidth
  ) - (PANEL_VIEWPORT_GUTTER * 2)
}

const getScale = () => Math.min(
  Math.max(getAvailableWidth() / BASE_WIDTH, 0.1),
  1,
)

const App = () => {
  const {
    clearAlerts,
    confirmAlert,
    dismissAlert,
    showStepAlert,
  } = useLabAlerts()
  const { completionCount } = useWalkthrough()
  const [scale, setScale] = useState(getScale)
  const [contentHeight, setContentHeight] = useState(DEFAULT_CONTENT_HEIGHT)
  const postSimulationContentRef = useRef(null)
  const walkthroughCompletionRef = useRef(0)
  const viewportMetricsRef = useRef({
    devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio,
    outerWidth: typeof window === 'undefined' ? BASE_WIDTH : window.outerWidth,
  })
  const { r1, r2, r3 } = FIXED_NETWORK_RESISTANCES
  const [rl, setRl] = useState(RESISTANCE_SLIDER_CONFIG.load.initial)
  const [voltage, setVoltage] = useState(1)
  const [powerOn, setPowerOn] = useState(false)
  const [circuitSwitchOn, setCircuitSwitchOn] = useState(false)
  const [bulbSwitchOn, setBulbSwitchOn] = useState(false)
  const [ammeterRemovalRequired, setAmmeterRemovalRequired] = useState(false)
  const [ammeterConnectionsRemoved, setAmmeterConnectionsRemoved] = useState(false)
  const [voltageLocked, setVoltageLocked] = useState(false)
  const [observations, setObservations] = useState([])
  const [calculationDone, setCalculationDone] = useState(false)
  const [calculatedValues, setCalculatedValues] = useState(null)
  const [userCalculatedFillFactor, setUserCalculatedFillFactor] = useState('')
  const [verificationResult, setVerificationResult] = useState('')
  const [experimentCase, setExperimentCase] = useState(1)
  const [measuredRth, setMeasuredRth] = useState(null)
  const [measuredVth, setMeasuredVth] = useState(null)
  const [measuredIl, setMeasuredIl] = useState(null)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [reportPrinted, setReportPrinted] = useState(false)
  const [status, setStatus] = useState(
    'Make the six required circuit connections manually or use Auto Connect.',
  )
  const [checkRequest, setCheckRequest] = useState(0)
  const [resetRequest, setResetRequest] = useState(0)
  const [autoConnectRequest, setAutoConnectRequest] = useState(0)
  const [autoConnectedCase, setAutoConnectedCase] = useState(null)
  const [connectionsVerified, setConnectionsVerified] = useState(false)
  const [sessionStart, setSessionStart] = useState(() => Date.now())
  const [, setShowRth] = useState(false)
  const [case1ConnectionsRemoved, setCase1ConnectionsRemoved] = useState(false)
  const [case2ConnectionsRemoved, setCase2ConnectionsRemoved] = useState(false)
  const [, setShowMultimeter] = useState(false)
  const handleGuideAudioError = useCallback(() => {
    setStatus('AI Guide could not play its configured audio file.')
  }, [])

  const {
    activeInstructionId,
    notify: notifyGuide,
    replayCurrentInstruction,
    state: guideState,
  } = useAiGuideController({
    clearAlerts,
    confirmAlert,
    dismissAlert,
    onAudioError: handleGuideAudioError,
    showStepAlert,
  })

  const resistancesConfigured = true
  const loadObservations = observations.filter((row) => (
    row?.isLoadReading === true
  ))
  const loadReadingCount = loadObservations.length
  const shortCircuitReadingAdded = observations.some((row) => (
    row?.isShortCircuit === true
  ))
  const loadReadingsComplete = loadReadingCount >= LOAD_MEASUREMENTS.length
  const openCircuitVoltageAdded = observations.some((row) => (
    row?.vocRecorded === true
  ))
  const verificationSucceeded = verificationResult.includes(
    'Verified Successfully',
  )
  const expectedLoadResistance = (
    LOAD_MEASUREMENTS[loadReadingCount]?.resistance ?? null
  )
  const resistanceMinPosition = Math.min(
    loadReadingCount,
    LOAD_RESISTANCE_VALUES.length - 1,
  )
  const resistanceMaxPosition = Math.min(
    loadReadingCount + 1,
    LOAD_RESISTANCE_VALUES.length - 1,
  )
  const resistanceSliderDisabled = (
    !shortCircuitReadingAdded || loadReadingsComplete
  )
  const selectedLoadMeasurement = LOAD_MEASUREMENTS.find((reading) => (
    reading.resistance === rl
  ))
  const meterVoltage = !shortCircuitReadingAdded
    ? 0
    : ammeterConnectionsRemoved
      ? OPEN_CIRCUIT_VOLTAGE
      : selectedLoadMeasurement?.voltage ?? 0
  const meterCurrentAmperes = !shortCircuitReadingAdded
    ? SHORT_CIRCUIT_CURRENT_AMPERES
    : selectedLoadMeasurement
      ? selectedLoadMeasurement.current / 1000
      : SHORT_CIRCUIT_CURRENT_AMPERES
  const handleResistanceChange = (value) => {
    if (resistanceSliderDisabled) {
      return
    }

    const nextPosition = LOAD_RESISTANCE_VALUES.indexOf(value)

    if (
      nextPosition < resistanceMinPosition
      || nextPosition > resistanceMaxPosition
    ) {
      return
    }

    setRl(value)
  }

  const handleLockedResistanceInteraction = useCallback(() => {
    void notifyGuide({
      description: shortCircuitReadingAdded
        ? 'All required load-resistance readings are complete.'
        : 'Add the short-circuit current reading first, or check the bulb switch is ON.',
      instructionId: shortCircuitReadingAdded ? null : '12',
      target: '#resistance-controls',
      title: shortCircuitReadingAdded
        ? 'RL Readings Complete'
        : 'Add ISC First',
      type: 'RESISTANCE_SLIDER_BLOCKED',
    })
  }, [notifyGuide, shortCircuitReadingAdded])

  useEffect(() => {
    let resizeTimer = 0

    const handleResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const previousMetrics = viewportMetricsRef.current
        const nextMetrics = {
          devicePixelRatio: window.devicePixelRatio,
          outerWidth: window.outerWidth,
        }
        const pixelRatioChanged = (
          Math.abs(
            nextMetrics.devicePixelRatio - previousMetrics.devicePixelRatio,
          ) > 0.001
        )
        const outerWidthChanged = (
          nextMetrics.outerWidth !== previousMetrics.outerWidth
        )

        viewportMetricsRef.current = nextMetrics

        // Page zoom changes the device pixel ratio without resizing the
        // browser window. Keep the app scale stable so native zoom is visible.
        if (!pixelRatioChanged || outerWidthChanged) {
          setScale(getScale())
        }
      }, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const content = postSimulationContentRef.current

    if (!content) {
      return undefined
    }

    const updateContentHeight = () => {
      const nextHeight = Math.ceil(content.offsetTop + content.offsetHeight)

      setContentHeight((currentHeight) => (
        currentHeight === nextHeight ? currentHeight : nextHeight
      ))
    }

    updateContentHeight()

    const resizeObserver = new ResizeObserver(updateContentHeight)
    resizeObserver.observe(content)
    window.addEventListener('load', updateContentHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('load', updateContentHeight)
    }
  }, [])

  useEffect(() => {
    const handleAfterPrint = () => setReportPrinted(true)

    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  useEffect(() => {
    if (
      completionCount === 0
      || completionCount === walkthroughCompletionRef.current
    ) {
      return
    }

    walkthroughCompletionRef.current = completionCount

    if (!guideState.guideStarted) {
      return
    }

    void notifyGuide({ type: 'WALKTHROUGH_COMPLETED' })
  }, [completionCount, guideState.guideStarted, notifyGuide])

  useEffect(() => {
    void notifyGuide({
      configured: resistancesConfigured,
      selections: CIRCUIT_RESISTANCE_CONFIGURATION,
      type: 'RESISTANCE_CONFIGURATION',
    })
  }, [notifyGuide, resistancesConfigured])

  const readings = useMemo(
    () => calculateReadings({
      voltage: powerOn ? voltage : 0,
      r1,
      r2,
      r3,
      rl,
    }),
    [powerOn, r1, r2, r3, rl, voltage],
  )
  const normalizedVoltage = Number(voltage.toFixed(1))
  const hasDuplicateReading = loadObservations.some((row) => row.rl === rl)
  const readingCount = observations.length

  const handleAiGuide = useCallback(() => {
    if (guideState.guideStarted) {
      setStatus('AI Guide is replaying the current instruction.')
      if (guideState.startupCompleted) {
        void replayCurrentInstruction()
      } else {
        void notifyGuide({ type: 'START_GUIDE' })
      }
      return
    }

    setStatus('AI Guide narration started.')
    void notifyGuide({ type: 'START_GUIDE' })
  }, [
    guideState.guideStarted,
    guideState.startupCompleted,
    notifyGuide,
    replayCurrentInstruction,
  ])

  const handleAutoConnect = () => {
    if (experimentCase >= 4) {
      return
    }

    if (!resistancesConfigured) {
      void notifyGuide({ type: 'RESISTANCE_REQUIRED' })
      return
    }

    if (
      (experimentCase === 2 && !case1ConnectionsRemoved)
      || (experimentCase === 3 && !case2ConnectionsRemoved)
    ) {
      void notifyGuide({
        caseNumber: experimentCase,
        type: 'AUTO_CONNECT_BLOCKED_EXISTING',
      })
      return
    }

    setAutoConnectRequest((current) => current + 1)
  }

  const handleAutoConnectCompleted = useCallback((caseNumber) => {
    const completedCase = Number(caseNumber)

    if (![1, 2, 3].includes(completedCase)) {
      return
    }

    setAutoConnectedCase(completedCase)
    setConnectionsVerified(true)

    if (completedCase === 1) {
      setShowRth(true)
      setShowMultimeter(true)
      setStatus('Autoconnect completed. Now, turn ON the power switch.')
    } else if (completedCase === 2) {
      setStatus('Autoconnect completed. Turn ON the power supply and set the required voltage.')
    } else {
      setStatus('Autoconnect completed. Turn ON the power supply and add the load-current reading.')
    }
  }, [])

  const recordObservation = () => {
    if (!connectionsVerified) {
      setStatus('Check the circuit connections before adding readings.')
      void notifyGuide({
        description: 'Verify the wiring before storing current readings.',
        target: '#check-button',
        title: 'Check Connections First',
        type: 'ADD_REJECTED',
      })
      return
    }

    if (!circuitSwitchOn || !bulbSwitchOn || !powerOn) {
      setStatus('Turn ON the circuit button and the bulb switch before adding the reading.')
      void notifyGuide({
        description: 'Turn ON the circuit button first, then turn ON the switch beneath the bulb.',
        target: '#bulb-switch-button',
        title: 'Switch On the Circuit',
        type: 'ADD_REJECTED',
      })
      return
    }

    if (experimentCase === 1) {
      if (!shortCircuitReadingAdded) {
        setObservations([
          {
            current: SHORT_CIRCUIT_CURRENT_MILLIAMPERES,
            id: 1,
            il: SHORT_CIRCUIT_CURRENT_AMPERES,
            isShortCircuit: true,
            isc: SHORT_CIRCUIT_CURRENT_MILLIAMPERES,
            power: 0,
            rth: readings.rth,
            rl: 0,
            voltage: 0,
            vth: null,
          },
        ])
        setMeasuredIl(SHORT_CIRCUIT_CURRENT_AMPERES)
        void notifyGuide({
          stage: 'short-circuit',
          type: 'READING_ADDED',
        })
        setReportGenerated(false)
        setReportPrinted(false)
        setStatus('ISC = 5.6 mA added. The RL slider is enabled; move it to 100 Ω.')
        return
      }

      if (!loadReadingsComplete) {
        if (rl !== expectedLoadResistance) {
          setStatus(`Move the RL slider one step to ${expectedLoadResistance} Ω before adding the next reading.`)
          return
        }

        const measurement = LOAD_MEASUREMENTS[loadReadingCount]
        const nextReadingCount = loadReadingCount + 1
        const nextMeasurement = LOAD_MEASUREMENTS[nextReadingCount]

        setObservations((current) => [
          ...current,
          {
            ...measurement,
            id: current.length + 1,
            il: measurement.current / 1000,
            isLoadReading: true,
            rl: measurement.resistance,
          },
        ])

        if (nextReadingCount >= LOAD_MEASUREMENTS.length) {
          setAmmeterRemovalRequired(true)
          void notifyGuide({
            stage: 'load-series-complete',
            type: 'READING_ADDED',
          })
          setStatus('All load readings are added and RL is locked. Remove ammeter connections 5-11 and 6-12.')
        } else {
          void notifyGuide({
            readingCount: nextReadingCount,
            type: 'LOAD_READING_ADDED',
          })
          setStatus(`Reading added. Move the RL slider one step to ${nextMeasurement.resistance} Ω.`)
        }

        setReportGenerated(false)
        setReportPrinted(false)
        return
      }

      if (!ammeterConnectionsRemoved) {
        setStatus('Remove both ammeter connections 5-11 and 6-12 before adding VOC.')
        return
      }

      if (openCircuitVoltageAdded) {
        setStatus('VOC = 4.42 V has already been added.')
        return
      }

      setObservations((current) => current.map((row, index) => (
        index === 0
          ? {
              ...row,
              vocRecorded: true,
              vth: OPEN_CIRCUIT_VOLTAGE,
            }
          : row
      )))
      setMeasuredVth(OPEN_CIRCUIT_VOLTAGE)
      setAmmeterRemovalRequired(false)
      setConnectionsVerified(false)
      setExperimentCase(4)
      void notifyGuide({
        stage: 'open-circuit',
        type: 'READING_ADDED',
      })
      setReportGenerated(false)
      setReportPrinted(false)
      setStatus('VOC = 4.42 V added. All measurements are complete; click PLOT.')
      return
    }

    if (experimentCase === 1 && shortCircuitReadingAdded) {
      setStatus('The short-circuit reading has already been added.')
      return
    }

    if (experimentCase !== 1 && !powerOn) {
      setStatus('Switch on the power supply before adding readings.')
      void notifyGuide({
        description: 'Switch on the verified power supply before adding readings.',
        target: '#power-toggle-button',
        title: 'Switch On the Power Supply',
        type: 'ADD_REJECTED',
      })
      return
    }

    if (experimentCase !== 1 && normalizedVoltage <= 0) {
      setStatus('Set the power supply voltage before adding a reading.')
      void notifyGuide({
        description: 'Increase the voltage above 0 V before adding a reading.',
        target: '#voltage-control',
        title: 'Set the Supply Voltage',
        type: 'ADD_REJECTED',
      })
      return
    }

    if (experimentCase === 3 && readingCount >= MAX_OBSERVATIONS) {
      setStatus('Observation table is full. Reset the experiment for a new run.')
      void notifyGuide({
        description: 'The observation table already contains the maximum number of readings.',
        target: '#observation-table-panel',
        title: 'Observation Table Is Full',
        type: 'ADD_REJECTED',
      })
      return
    }

    if (
      experimentCase === 3
      && rl !== expectedLoadResistance
    ) {
      setStatus(`Move the RL slider one step to ${expectedLoadResistance} Ω before adding the next reading.`)
      void notifyGuide({
        description: `Set RL to the next required value of ${expectedLoadResistance} Ω, then add the reading.`,
        target: '#resistance-controls',
        title: 'Use the Next Resistance Step',
        type: 'ADD_REJECTED',
      })
      return
    }

    if (experimentCase === 3 && hasDuplicateReading) {
      setStatus('The load-power reading at this resistance has already been added.')
      return
    }

    const completedCase = experimentCase

    if (completedCase === 1) {
      setObservations([
        {
          id: 1,
          current: SHORT_CIRCUIT_CURRENT_MILLIAMPERES,
          il: SHORT_CIRCUIT_CURRENT_AMPERES,
          isShortCircuit: true,
          isc: SHORT_CIRCUIT_CURRENT_MILLIAMPERES,
          power: 0,
          rth: readings.rth,
          rl: 0,
          voltage: 0,
          vth: 0,
        },
      ])
      setMeasuredIl(SHORT_CIRCUIT_CURRENT_AMPERES)
    } else if (completedCase === 2) {
      setObservations([
        {
          ...observations[0],
          vth: readings.vth,
        },
      ])
      setMeasuredVth(readings.vth)
      setRl(LOAD_RESISTANCE_VALUES[0])
      setVoltageLocked(true)
      setConnectionsVerified(false)
      setExperimentCase(3)
      setCase2ConnectionsRemoved(true)
    } else if (completedCase === 3) {
      const nextReadingCount = loadReadingCount + 1
      const loadPowerMilliwatts = (readings.il ** 2) * rl * 1000
      const nextObservation = {
        id: nextReadingCount,
        il: readings.il,
        rl,
        rth: observations[0]?.rth ?? measuredRth,
        vth: observations[0]?.vth ?? measuredVth,
      }
      const nextObservations = loadReadingCount === 0
        ? [nextObservation]
        : [...observations, nextObservation]
      const allLoadReadingsAdded = nextReadingCount >= MAX_OBSERVATIONS

      setObservations(nextObservations)
      setMeasuredIl(readings.il)

      if (allLoadReadingsAdded) {
        setConnectionsVerified(false)
        setExperimentCase(4)
      } else {
        const nextResistance = LOAD_RESISTANCE_VALUES[nextReadingCount]

        void notifyGuide({
          readingCount: nextReadingCount,
          type: 'LOAD_READING_ADDED',
        })
        setStatus(
          `PL = ${loadPowerMilliwatts.toFixed(2)} mW recorded at ${rl} Ω. Move RL one step to ${nextResistance} Ω.`,
        )
        setReportGenerated(false)
        setReportPrinted(false)
        return
      }
    }

    void notifyGuide({
      caseNumber: completedCase,
      type: 'READING_ADDED',
    })
    setReportGenerated(false)
    setReportPrinted(false)
    setStatus(
      completedCase === 2
        ? 'VTH recorded. The RL slider is unlocked at 0 Ω. Keep all six connections in place for Case 3.'
      : completedCase === 3
          ? 'All load readings were added. Record VOC, then click PLOT.'
          : 'Reading added: V = 0 V, I = 5.6 mA, P = 0, ISC = 5.6 mA.',
    )
  }

  const resetSimulation = useCallback(() => {
    setPowerOn(false)
    setCircuitSwitchOn(false)
    setBulbSwitchOn(false)
    setAmmeterRemovalRequired(false)
    setAmmeterConnectionsRemoved(false)
    setVoltage(1)
    setVoltageLocked(false)
    setRl(RESISTANCE_SLIDER_CONFIG.load.initial)
    setObservations([])
    setCalculationDone(false)
    setCalculatedValues(null)
    setVerificationResult('')
    setUserCalculatedFillFactor('')
    setReportGenerated(false)
    setReportPrinted(false)
    setCheckRequest(0)
    setAutoConnectRequest(0)
    setAutoConnectedCase(null)
    setExperimentCase(1)
    setConnectionsVerified(false)
    setMeasuredRth(null)
    setMeasuredVth(null)
    setMeasuredIl(null)
    setCase1ConnectionsRemoved(false)
    setCase2ConnectionsRemoved(false)
    setResetRequest((current) => current + 1)
    setSessionStart(Date.now())
    setStatus('Simulation reset. Make the six required circuit connections again.')
    setShowRth(false)
    setShowMultimeter(false)
    walkthroughCompletionRef.current = completionCount
    void notifyGuide({ type: 'RESET' })
  }, [completionCount, notifyGuide])

  const handleReset = useCallback(async () => {
    const shouldReset = await notifyGuide({ type: 'RESET_REQUEST' })

    if (shouldReset) {
      resetSimulation()
    }
  }, [notifyGuide, resetSimulation])

  const handlePrint = async () => {
    await notifyGuide({ type: 'PRINT' })
    window.print()
  }

  const handleGenerateReport = async () => {
    if (!verificationSucceeded) {
      void notifyGuide({
        description: 'Please verify the theorem before generating the report.',
        target: '#calculation-panel',
        title: 'Verification Required',
        type: 'REPORT_BLOCKED',
      })
      return
    }

    if (!calculationDone) {
      void notifyGuide({
        description: 'Please click PLOT before generating the report.',
        target: '#plot-button',
        title: 'Plot First',
        type: 'REPORT_BLOCKED',
      })
      return
    }

    if (readingCount < MIN_OBSERVATION_READINGS) {
      void notifyGuide({
        description: 'Please add at least one observation.',
        target: '#observation-table-panel',
        title: 'Observation Required',
        type: 'REPORT_BLOCKED',
      })
      return
    }

    setStatus('Report is ready. Click OK to open it in a new tab.')
    const shouldOpenReport = await notifyGuide({ type: 'REPORT_REQUEST' })

    if (!shouldOpenReport) {
      setStatus('Report opening cancelled.')
      return
    }

    const reportOpened = generateTheveninReport({
      observations,
      vth: calculatedValues?.vth ?? 0,
      rth: calculatedValues?.rth ?? 0,
      fillFactor: Number(userCalculatedFillFactor),
      sessionStart,
    })

    if (!reportOpened) {
      setStatus('The report window was blocked. Allow popups and try again.')
      return
    }

    setReportGenerated(true)
    void notifyGuide({ type: 'REPORT_GENERATED' })
    setStatus('Report generated and opened in a new tab.')
  }

  const scaledWidth = Math.ceil(BASE_WIDTH * scale)
  const scaledHeight = Math.ceil(contentHeight * scale)

  const handleCheckConnections = useCallback((result) => {
    void notifyGuide({
      caseNumber: experimentCase,
      result,
      type: 'CHECK_RESULT',
    })

    if (result.isCorrect) {
      if (experimentCase === 1) {
        setShowRth(true)
        setShowMultimeter(true)
      }

      setConnectionsVerified(true)

      if (experimentCase === 1) {
        setStatus('Right connections! Click the circuit OFF button to switch it ON.')
      } else if (experimentCase === 2) {
        setStatus(
          'Right connections! Turn ON power supply and click ADD to measure VTH.',
        )
      } else if (experimentCase === 3) {
        setStatus(
          'Right connections! Turn ON power supply and click ADD to measure IL.',
        )
      }

      return
    }

    setConnectionsVerified(false)

    if (result.totalConnections === 0) {
      setStatus('Please make the connections first.')
      return
    }

    setStatus('Invalid connections. Please check the wiring and try again.')
  }, [experimentCase, notifyGuide])

  const handleCheck = () => {
    if (experimentCase >= 4) {
      return
    }

    if (!resistancesConfigured) {
      void notifyGuide({ type: 'RESISTANCE_REQUIRED' })
      return
    }

    setCheckRequest((current) => current + 1)
  }

  const handleCircuitSwitchChange = useCallback((nextSwitchOn) => {
    if (circuitSwitchOn && !nextSwitchOn) {
      return
    }

    setCircuitSwitchOn(nextSwitchOn)

    if (nextSwitchOn) {
      setConnectionsVerified(true)
      setStatus('Power is ON. Now, turn ON the bulb switch.')
      void notifyGuide({ type: 'POWER_SWITCH_ON' })
      return
    }

    setBulbSwitchOn(false)
    setPowerOn(false)
    setStatus('Circuit button is OFF.')
  }, [circuitSwitchOn, notifyGuide])

  const handleCircuitSwitchRejected = useCallback(() => {
    setStatus('Click CHECK and verify the circuit connections before turning ON the power switch.')
    void notifyGuide({
      description: 'Click CHECK to verify the circuit connections before turning ON the power switch.',
      target: '#check-button',
      title: 'Check Connections First',
      type: 'POWER_REJECTED',
    })
  }, [notifyGuide])

  const handleBulbSwitchToggle = useCallback(() => {
    if (!circuitSwitchOn) {
      setStatus('Switch ON the circuit button before operating the bulb switch.')
      void notifyGuide({
        description: 'Complete the connections and switch ON the circuit button first.',
        target: '#circuit-switch-button',
        title: 'Switch On the Circuit First',
        type: 'POWER_REJECTED',
      })
      return
    }

    if (bulbSwitchOn) {
      return
    }

    setBulbSwitchOn(true)
    setPowerOn(true)
    void notifyGuide({ type: 'BULB_SWITCH_ON' })
    setStatus(
      'Bulb and solar panel are ON. Ammeter reading: 5.6 mA. Click ADD.',
    )
  }, [bulbSwitchOn, circuitSwitchOn, notifyGuide])

  const handleAmmeterConnectionsRemoved = useCallback(() => {
    setAmmeterConnectionsRemoved(true)
    void notifyGuide({ type: 'AMMETER_CONNECTIONS_REMOVED' })
    setStatus('Ammeter connections removed. Click ADD to record VOC = 4.42 V.')
  }, [notifyGuide])

  const handleVoltageChange = useCallback((nextVoltage) => {
    if (voltageLocked) {
      return
    }

    setVoltage(nextVoltage)
  }, [voltageLocked])

  const handleVoltageSet = useCallback((nextVoltage) => {
    if (powerOn && experimentCase === 2) {
      void notifyGuide({
        type: 'VOLTAGE_SET',
        voltage: nextVoltage,
      })
    }
  }, [experimentCase, notifyGuide, powerOn])

  const handlePlot = () => {
    if (!loadReadingsComplete || !openCircuitVoltageAdded) {
      setStatus('Record all load readings and VOC before plotting the graph.')
      return
    }

    const latestLoadObservation = loadObservations.at(-1)

    setCalculatedValues({
      r1,
      r2,
      r3,
      rl: latestLoadObservation?.rl ?? rl,
      voltageSource: voltage,
      vth: observations[0]?.vth ?? measuredVth,
      rth: observations[0]?.rth ?? measuredRth,
      observedIL: latestLoadObservation?.il ?? measuredIl,
    })
    setCalculationDone(true)
    void notifyGuide({ type: 'CALCULATE' })
    setStatus('V-I characteristics plotted. Calculate the fill factor in the theoretical verification panel.')
  }

  const guideHighlights = {
    17: ['1-endpoint', '7-endpoint'],
    18: ['2-endpoint', '8-endpoint'],
    19: ['3-endpoint', '9-endpoint'],
    20: ['4-endpoint', '10-endpoint'],
    26: ['5-endpoint', '11-endpoint'],
    27: ['6-endpoint', '12-endpoint'],
  }
  const highlightedTerminalIds = (
    guideHighlights[Number(activeInstructionId)] ?? []
  )
  const activeInstructionStep = (
    !shortCircuitReadingAdded
      ? !connectionsVerified
        ? 'connections'
        : !circuitSwitchOn
          ? 'power-switch'
          : !bulbSwitchOn
            ? 'bulb-switch'
            : 'short-circuit-reading'
      : !loadReadingsComplete
        ? 'load-readings'
        : !ammeterConnectionsRemoved
          ? 'remove-ammeter'
          : !openCircuitVoltageAdded
            ? 'open-circuit-reading'
            : !calculationDone
              ? 'plot'
              : !verificationSucceeded
                ? 'calculate'
                : !reportGenerated
                  ? 'report'
                  : !reportPrinted
                    ? 'print'
                    : 'reset'
  )

  return (
    <div id="app-wrapper">
      <div
        id="app-viewport"
        style={{
          height: `${scaledHeight}px`,
          width: `${scaledWidth}px`,
        }}
      >
        <div
          id="app-scale"
          style={{
            height: `${contentHeight}px`,
            zoom: scale,
          }}
        >
          <main className="simulation-shell" id="walkthrough-demo-experiment">
            <HeaderBoard />
            <WalkthroughStartButton
              highlighted={
                guideState.startupCompleted
                && !guideState.walkthroughCompleted
              }
              variant="side-tab"
            />
            <span className="sr-only" role="status" aria-live="polite">
              {status}
            </span>

            <section className="workspace-grid">
              <aside className="left-panel">
                <ActionButtons
                  activeInstructionStep={activeInstructionStep}
                  activeButtons={{
                    onAiGuide: guideState.guideStarted,
                  }}
                  disabledButtons={{
                    onAdd: (
                      !connectionsVerified
                      || !circuitSwitchOn
                      || !bulbSwitchOn
                      || (
                        shortCircuitReadingAdded
                        && (
                          !loadReadingsComplete
                            ? rl !== expectedLoadResistance
                            : !ammeterConnectionsRemoved
                              || openCircuitVoltageAdded
                        )
                      )
                    ),
                    onPlot: (
                      experimentCase !== 4
                      || !loadReadingsComplete
                      || !openCircuitVoltageAdded
                    ),
                    onCheck: autoConnectedCase === experimentCase,
                    onPrint: false,
                  }}
                  onAdd={recordObservation}
                  onAiGuide={handleAiGuide}
                  onAutoConnect={handleAutoConnect}
                  onPlot={handlePlot}
                  onCheck={handleCheck}
                  onPrint={handlePrint}
                  onReset={handleReset}
                />

                <ControlPanel
  locked={resistanceSliderDisabled}
  maxResistancePosition={resistanceMaxPosition}
  minResistancePosition={resistanceMinPosition}
  observations={observations}
  onGenerateReport={handleGenerateReport}
  onResistanceLocked={
    handleLockedResistanceInteraction
  }
  onGuideEvent={notifyGuide}
  reportGenerated={reportGenerated}
  rl={rl}
  setRl={handleResistanceChange}
  theoremVerified={verificationSucceeded}
/>
              </aside>

              <section className="right-panel">
                <ConnectionLab
                  ammeterRemovalRequired={ammeterRemovalRequired}
                  autoConnectRequest={autoConnectRequest}
                  bulbSwitchOn={bulbSwitchOn}
                  case1ConnectionsRemoved={case1ConnectionsRemoved}
                  case2ConnectionsRemoved={case2ConnectionsRemoved}
                  checkRequest={checkRequest}
                  circuitSwitchOn={circuitSwitchOn}
                  connectionsVerified={connectionsVerified}
                  experimentCase={experimentCase}
                  highlightedTerminalIds={highlightedTerminalIds}
                  key={`connection-lab-${resetRequest}`}
                  meterCurrentAmperes={meterCurrentAmperes}
                  meterVoltage={meterVoltage}
                  onAmmeterConnectionsRemoved={handleAmmeterConnectionsRemoved}
                  onAutoConnectCompleted={handleAutoConnectCompleted}
                  onBulbSwitchToggle={handleBulbSwitchToggle}
                  onCheckConnections={handleCheckConnections}
                  onCircuitSwitchChange={handleCircuitSwitchChange}
                  onCircuitSwitchRejected={handleCircuitSwitchRejected}
                  onGuideEvent={notifyGuide}
                  observationIl={loadObservations.at(-1)?.il ?? null}
                  observationVth={observations[0]?.vth ?? null}
                  powerOn={powerOn}
                  r1={r1}
                  r2={r2}
                  r3={r3}
                  resetRequest={resetRequest}
                  resistancesConfigured={resistancesConfigured}
                  rl={rl}
                  scale={scale}
                  setCase1ConnectionsRemoved={setCase1ConnectionsRemoved}
                  setCase2ConnectionsRemoved={setCase2ConnectionsRemoved}
                  setShowMultimeter={setShowMultimeter}
                  setShowRth={setShowRth}
                  setVoltage={handleVoltageChange}
                  onVoltageSet={handleVoltageSet}
                  voltage={voltage}
                  voltageLocked={voltageLocked}
                />
              </section>
            </section>
          </main>

          <div className="post-simulation-content" ref={postSimulationContentRef}>
            <CalculationPanel
              calculatedValues={calculatedValues}
              calculationDone={calculationDone}
              key={calculationDone ? 'calculation-ready' : 'calculation-reset'}
              observations={observations}
              onGuideEvent={notifyGuide}
              setUserCalculatedFillFactor={setUserCalculatedFillFactor}
              setVerificationResult={setVerificationResult}
            />
            <footer className="site-footer">
              © 2026 Virtual Labs, IIT Roorkee
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
