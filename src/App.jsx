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
import { generateTheveninReport } from './utils/theveninReportGenerator.js'
import {
  FIXED_NETWORK_RESISTANCES,
  LOAD_RESISTANCE_VALUES,
  RESISTANCE_SLIDER_CONFIG,
} from './utils/resistance.js'

const BASE_WIDTH = 1152
const DEFAULT_CONTENT_HEIGHT = 1440
const PANEL_VIEWPORT_GUTTER = 0
const MIN_OBSERVATION_READINGS = LOAD_RESISTANCE_VALUES.length
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
  const [voltageLocked, setVoltageLocked] = useState(false)
  const [observations, setObservations] = useState([])
  const [calculationDone, setCalculationDone] = useState(false)
  const [calculatedValues, setCalculatedValues] = useState(null)
  const [userCalculatedPmax, setUserCalculatedPmax] = useState('')
  const [verificationResult, setVerificationResult] = useState('')
  const [experimentCase, setExperimentCase] = useState(1)
  const [measuredRth, setMeasuredRth] = useState(null)
  const [measuredVth, setMeasuredVth] = useState(null)
  const [measuredIl, setMeasuredIl] = useState(null)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [reportPrinted, setReportPrinted] = useState(false)
  const [status, setStatus] = useState(
    'Measure VTH to unlock the load-resistance slider.',
  )
  const [checkRequest, setCheckRequest] = useState(0)
  const [resetRequest, setResetRequest] = useState(0)
  const [autoConnectRequest, setAutoConnectRequest] = useState(0)
  const [autoConnectedCase, setAutoConnectedCase] = useState(null)
  const [connectionsVerified, setConnectionsVerified] = useState(false)
  const [sessionStart, setSessionStart] = useState(() => Date.now())
  const [showRth, setShowRth] = useState(false)
  const [case1ConnectionsRemoved, setCase1ConnectionsRemoved] = useState(false)
  const [case2ConnectionsRemoved, setCase2ConnectionsRemoved] = useState(false)
  const [showMultimeter, setShowMultimeter] = useState(false)
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
    typeof row.il === 'number' && Number.isFinite(row.il)
  ))
  const loadReadingCount = loadObservations.length
  const verificationSucceeded = verificationResult.includes(
    'Verified Successfully',
  )
  const expectedLoadResistance = (
    LOAD_RESISTANCE_VALUES[loadReadingCount] ?? null
  )
  const resistanceMinPosition = Math.max(0, loadReadingCount - 1)
  const resistanceMaxPosition = Math.min(
    loadReadingCount,
    LOAD_RESISTANCE_VALUES.length - 1,
  )
  const resistanceSliderDisabled = (
    measuredVth === null || experimentCase !== 3
  )
  const powerToggleLocked = (
    powerOn
    && experimentCase === 3
    && connectionsVerified
    && loadReadingCount < MAX_OBSERVATIONS
  )

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
      description: 'Please perform the first two cases.',
      target: '#resistance-controls',
      title: 'Complete the First Two Cases',
      type: 'RESISTANCE_SLIDER_BLOCKED',
    })
  }, [notifyGuide])

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
  const readingCount = loadReadingCount

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
      setStatus('Autoconnect completed. Click ADD to record the Thevenin equivalent resistance.')
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
          rth: readings.rth,
          vth: null,
          il: null,
          rl,
        },
      ])
      setMeasuredRth(readings.rth)
      setConnectionsVerified(false)
      setExperimentCase(2)
      setCase1ConnectionsRemoved(false)
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
      setCase2ConnectionsRemoved(false)
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
        ? 'VTH recorded. The RL slider is unlocked at 0 Ω. Turn OFF the supply, remove the voltmeter connections, and prepare Case 3.'
        : completedCase === 3
          ? 'All load-power readings were added. Click CALCULATE to continue.'
          : 'Reading added to the observation table.',
    )
  }

  const resetSimulation = useCallback(() => {
    setPowerOn(false)
    setVoltage(1)
    setVoltageLocked(false)
    setRl(RESISTANCE_SLIDER_CONFIG.load.initial)
    setObservations([])
    setCalculationDone(false)
    setCalculatedValues(null)
    setVerificationResult('')
    setUserCalculatedPmax('')
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
    setStatus('Simulation reset. Make the circuit connections again.')
    setShowRth(false)
    setShowMultimeter(false)
    walkthroughCompletionRef.current = completionCount
    void notifyGuide({ type: 'RESET' })
  }, [completionCount, notifyGuide])

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
        description: 'Please click CALCULATE before generating report.',
        target: '#calculate-button',
        title: 'Calculate First',
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
      calculatedPmax: Number(userCalculatedPmax),
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
        setStatus('Right connections! Click ADD to measure RTH.')
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

  const handleTogglePower = () => {
    if (experimentCase === 1) {
      return
    }

    if (powerToggleLocked) {
      setStatus('The MCB must remain ON until all ten load readings are recorded.')
      return
    }

    if (!powerOn && !connectionsVerified) {
      void notifyGuide({
        description: 'Complete all required connections before switching ON the power supply.',
        target: '#check-button',
        title: 'Complete Connections First',
        type: 'POWER_REJECTED',
      })
      setStatus(
        'Complete all required connections before switching ON the power supply.',
      )
      return
    }

    if (powerOn) {
      setPowerOn(false)
      setStatus('Power supply switched off.')
      return
    }

    setPowerOn(true)
    setStatus(
      experimentCase === 3
        ? `Power supply switched on at the previous setting of ${voltage} V. Add the reading.`
        : 'Power supply switched on. Adjust voltage and add the reading.',
    )
    void notifyGuide({
      caseNumber: experimentCase,
      type: 'POWER_ON',
    })
  }

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

  const handleCalculate = () => {
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
  }

  const guideHighlights = {
    5: ['5-endpoint', '11-endpoint'],
    6: ['6-endpoint', '13-endpoint'],
    7: ['9-endpoint', '10-endpoint'],
    17: ['7-endpoint', '9-endpoint'],
    18: ['8-endpoint', '10-endpoint'],
    19: ['1-endpoint', '11-endpoint'],
    20: ['2-endpoint', '13-endpoint'],
    26: ['3-endpoint', '11-endpoint'],
    27: ['4-endpoint', '12-endpoint'],
    28: ['13-endpoint', '14-endpoint'],
  }
  const highlightedTerminalIds = (
    guideHighlights[Number(activeInstructionId)] ?? []
  )
  const activeInstructionStep = (
    experimentCase === 1
        || (experimentCase === 2 && !case1ConnectionsRemoved)
        ? 'case1'
        : experimentCase === 2
          || (experimentCase === 3 && !case2ConnectionsRemoved)
          ? 'case2'
          : experimentCase === 3
            ? 'case3'
            : !calculationDone
              ? 'step3'
              : !verificationSucceeded
                ? 'step4'
                : !reportPrinted
                  ? 'step5'
                  : 'step6'
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
                      || (
                        experimentCase === 3
                        && (
                          expectedLoadResistance === null
                          || rl !== expectedLoadResistance
                          || hasDuplicateReading
                        )
                      )
                    ),
                    onCalculate: experimentCase !== 4,
                    onCheck: autoConnectedCase === experimentCase,
                    onPrint: false,
                  }}
                  onAdd={recordObservation}
                  onAiGuide={handleAiGuide}
                  onAutoConnect={handleAutoConnect}
                  onCalculate={handleCalculate}
                  onCheck={handleCheck}
                  onPrint={handlePrint}
                  onReset={resetSimulation}
                />

                <ControlPanel
                  locked={resistanceSliderDisabled}
                  maxResistancePosition={resistanceMaxPosition}
                  minResistancePosition={resistanceMinPosition}
                  observations={observations}
                  onGenerateReport={handleGenerateReport}
                  onResistanceLocked={
                    experimentCase < 3
                      ? handleLockedResistanceInteraction
                      : undefined
                  }
                  reportGenerated={reportGenerated}
                  rl={rl}
                  setRl={handleResistanceChange}
                  theoremVerified={verificationSucceeded}
                />
              </aside>

              <section className="right-panel">
                <ConnectionLab
                  autoConnectRequest={autoConnectRequest}
                  case1ConnectionsRemoved={case1ConnectionsRemoved}
                  case2ConnectionsRemoved={case2ConnectionsRemoved}
                  checkRequest={checkRequest}
                  experimentCase={experimentCase}
                  highlightedTerminalIds={highlightedTerminalIds}
                  key={`connection-lab-${resetRequest}`}
                  onAutoConnectCompleted={handleAutoConnectCompleted}
                  onCheckConnections={handleCheckConnections}
                  onGuideEvent={notifyGuide}
                  onTogglePower={handleTogglePower}
                  observationIl={loadObservations.at(-1)?.il ?? null}
                  observationVth={observations[0]?.vth ?? null}
                  powerOn={powerOn}
                  powerToggleLocked={powerToggleLocked}
                  r1={r1}
                  r2={r2}
                  r3={r3}
                  readings={readings}
                  resetRequest={resetRequest}
                  resistancesConfigured={resistancesConfigured}
                  rl={rl}
                  scale={scale}
                  setCase1ConnectionsRemoved={setCase1ConnectionsRemoved}
                  setCase2ConnectionsRemoved={setCase2ConnectionsRemoved}
                  setShowMultimeter={setShowMultimeter}
                  setShowRth={setShowRth}
                  setVoltage={handleVoltageChange}
                  showMultimeter={showMultimeter}
                  showRth={showRth}
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
              setUserCalculatedPmax={setUserCalculatedPmax}
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
