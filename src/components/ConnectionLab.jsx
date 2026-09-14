import { useEffect, useRef, useState } from 'react'
import CircuitDiagram from './CircuitDiagram.jsx'
import EquipmentPanel from './EquipmentPanel.jsx'
import {
  addAllEndpoints,
  autoConnectTheveninCircuit,
  deleteConnectionsForTerminal,
  lockJsPlumbCircuit,
  resolveJsPlumb,
  unlockJsPlumbCircuit,
  validateTheveninConnections,
  wireHoverPaintStyles,
  wirePaintStyles,
} from '../utils/jsPlumbWiring.js'

const getJsPlumbZoom = (scale) => (
  Number.isFinite(scale) && scale > 0 ? scale : 1
)

const isRetainedPowerConnection = (connection) => {
  const source = connection.sourceId || connection.source?.id
  const target = connection.targetId || connection.target?.id

  return (
    (source === '7-endpoint' && target === '9-endpoint')
    || (source === '9-endpoint' && target === '7-endpoint')
    || (source === '8-endpoint' && target === '10-endpoint')
    || (source === '10-endpoint' && target === '8-endpoint')
  )
}

const hasConnection = (connections, firstId, secondId) => (
  connections.some((connection) => {
    const sourceId = connection.sourceId || connection.source?.id
    const targetId = connection.targetId || connection.target?.id

    return (
      (sourceId === firstId && targetId === secondId)
      || (sourceId === secondId && targetId === firstId)
    )
  })
)

const ConnectionLab = ({
  autoConnectRequest,
  case1ConnectionsRemoved,
  case2ConnectionsRemoved,
  checkRequest,
  experimentCase,
  highlightedTerminalIds = [],
  onAutoConnectCompleted,
  onCheckConnections,
  onGuideEvent,
  observationIl,
  observationVth,
  powerOn,
  r1,
  r2,
  r3,
  readings,
  resetRequest,
  resistancesConfigured,
  rl,
  scale = 1,
  setCase1ConnectionsRemoved,
  setCase2ConnectionsRemoved,
  setShowMultimeter,
  setShowRth,
  showRth,
}) => {
  const containerRef = useRef(null)
  const instanceRef = useRef(null)
  const onAutoConnectCompletedRef = useRef(onAutoConnectCompleted)
  const onCheckConnectionsRef = useRef(onCheckConnections)
  const onGuideEventRef = useRef(onGuideEvent)
  const scaleRef = useRef(getJsPlumbZoom(scale))
  const experimentCaseRef = useRef(experimentCase)
  const autoConnectingRef = useRef(false)
  const lastAutoConnectRequestRef = useRef(0)
  const [isLocked, setIsLocked] = useState(false)
  const [connectedTerminalIds, setConnectedTerminalIds] = useState([])

  useEffect(() => {
    onAutoConnectCompletedRef.current = onAutoConnectCompleted
  }, [onAutoConnectCompleted])

  useEffect(() => {
    onCheckConnectionsRef.current = onCheckConnections
  }, [onCheckConnections])

  useEffect(() => {
    onGuideEventRef.current = onGuideEvent
  }, [onGuideEvent])

  useEffect(() => {
    experimentCaseRef.current = experimentCase
  }, [experimentCase])

  useEffect(() => {
    let cancelled = false

    const initJsPlumb = async () => {
      const jsPlumbModule = await import('jsplumb')
      const jsPlumb = resolveJsPlumb(jsPlumbModule)

      if (cancelled || !containerRef.current || !jsPlumb?.getInstance) {
        return
      }

      instanceRef.current?.reset()
      containerRef.current.classList.remove('connection-lab--locked')
      setIsLocked(false)

      const instance = jsPlumb.getInstance({
        ConnectionsDetachable: true,
        Connector: ['Bezier', { curviness: 57.6 }],
        Container: containerRef.current,
        Endpoint: ['Dot', { radius: 4 }],
        HoverPaintStyle: {
          ...wireHoverPaintStyles.positive,
        },
        PaintStyle: {
          ...wirePaintStyles.positive,
        },
        ReattachConnections: true,
      })

      instanceRef.current = instance
      instance.setZoom?.(scaleRef.current)
      instance.registerConnectionTypes({
        negative: {
          hoverPaintStyle: {
            ...wireHoverPaintStyles.negative,
          },
          paintStyle: {
            ...wirePaintStyles.negative,
          },
        },
        positive: {
          hoverPaintStyle: {
            ...wireHoverPaintStyles.positive,
          },
          paintStyle: {
            ...wirePaintStyles.positive,
          },
        },
      })

      instance.setSuspendDrawing(true)
      addAllEndpoints(
        instance,
        () => resistancesConfigured,
        () => onGuideEventRef.current?.({ type: 'RESISTANCE_REQUIRED' }),
      )
      instance.setSuspendDrawing(false, true)

      instance.bind('connection', (info) => {
        const sourceId = info.sourceId
        const targetId = info.targetId

        setConnectedTerminalIds((current) => [
          ...new Set([...current, sourceId, targetId]),
        ])

        if (autoConnectingRef.current) {
          return
        }

        onGuideEventRef.current?.({
          caseNumber: experimentCaseRef.current,
          sourceId,
          targetId,
          type: 'MANUAL_CONNECTION',
        })
      })

      window.setTimeout(() => {
        instance.repaintEverything()
      }, 100)
    }

    initJsPlumb()

    const handleResize = () => {
      window.setTimeout(() => {
        instanceRef.current?.repaintEverything()
      }, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
      instanceRef.current?.reset()
      instanceRef.current = null
    }
  }, [resetRequest, resistancesConfigured])

  useEffect(() => {
    const instance = instanceRef.current
    const zoom = getJsPlumbZoom(scale)

    scaleRef.current = zoom

    if (!instance?.setZoom) {
      return
    }

    instance.setZoom(zoom, true)
    window.setTimeout(() => {
      instance.repaintEverything?.()
    }, 0)
  }, [scale])

  useEffect(() => {
    const instance = instanceRef.current

    if (!instance) {
      return
    }

    // ADD advances the case, so the verified circuit can now be changed for
    // the next measurement.
    unlockJsPlumbCircuit(instance, containerRef.current)
    setIsLocked(false)

    if (experimentCase !== 3) {
      return
    }

    instance
      .getAllConnections()
      .filter(isRetainedPowerConnection)
      .forEach((connection) => {
        connection.setDetachable?.(false)
      })
  }, [experimentCase])

  useEffect(() => {
    if (checkRequest === 0 || !instanceRef.current) {
      return
    }

    const currentExperimentCase = experimentCaseRef.current
    const result = validateTheveninConnections(
      instanceRef.current,
      currentExperimentCase,
    )

    if (result.isCorrect) {
      lockJsPlumbCircuit(instanceRef.current, containerRef.current)
      setIsLocked(true)
    }

    onCheckConnectionsRef.current?.(result)
  }, [checkRequest])

  const handleLabelClick = (event) => {
    const label = event.target.closest('.terminal-number-label')

    if (!label || !containerRef.current?.contains(label)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (
      isLocked
      || containerRef.current.classList.contains('connection-lab--locked')
    ) {
      return
    }

    if (powerOn) {
      onGuideEventRef.current?.({
        description: 'Switch OFF the power supply before removing circuit connections.',
        target: '#power-toggle-button',
        title: 'Switch OFF the Power Supply',
        type: 'POWER_REJECTED',
      })
      return
    }

    const terminalId = label.dataset.terminalId

    if (!terminalId || !instanceRef.current) {
      return
    }

    if (
      experimentCase === 3
      && ['7-endpoint', '8-endpoint', '9-endpoint', '10-endpoint']
        .includes(terminalId)
    ) {
      return
    }

    deleteConnectionsForTerminal(instanceRef.current, terminalId)

    const remainingConnections = instanceRef.current.getAllConnections()
    const terminals = new Set()

    remainingConnections.forEach((connection) => {
      terminals.add(connection.sourceId)
      terminals.add(connection.targetId)
    })

    setConnectedTerminalIds([...terminals])
    instanceRef.current.repaintEverything?.()

    if (
      experimentCase === 2
      && remainingConnections.length === 0
      && !case1ConnectionsRemoved
    ) {
      setCase1ConnectionsRemoved(true)
      setShowMultimeter(false)
      setShowRth(false)
      onGuideEventRef.current?.({
        caseNumber: 1,
        type: 'CASE_CONNECTIONS_REMOVED',
      })
    }

    const case2Validation = validateTheveninConnections(
      instanceRef.current,
      2,
    )
    const retainedPowerConnectionsOnly = (
      case2Validation.totalConnections === 2
      && hasConnection(
        remainingConnections,
        '7-endpoint',
        '9-endpoint',
      )
      && hasConnection(
        remainingConnections,
        '8-endpoint',
        '10-endpoint',
      )
    )

    if (
      experimentCase === 3
      && retainedPowerConnectionsOnly
      && !case2ConnectionsRemoved
    ) {
      setCase2ConnectionsRemoved(true)
      onGuideEventRef.current?.({
        caseNumber: 2,
        type: 'CASE_CONNECTIONS_REMOVED',
      })
    }
  }

  const meterReadings = {
    il: readings.il ?? 0,
    rth: readings.rth ?? 0,
    showRth,
    vth: readings.vth ?? 0,
  }

  useEffect(() => {
    if (
      autoConnectRequest === 0
      || autoConnectRequest === lastAutoConnectRequestRef.current
      || !instanceRef.current
    ) {
      return
    }

    lastAutoConnectRequestRef.current = autoConnectRequest

    if (!resistancesConfigured) {
      onGuideEventRef.current?.({ type: 'RESISTANCE_REQUIRED' })
      return
    }

    autoConnectingRef.current = true
    const result = autoConnectTheveninCircuit(
      instanceRef.current,
      experimentCase,
    )

    if (!result?.success) {
      autoConnectingRef.current = false
      onGuideEventRef.current?.({ type: 'AUTO_CONNECT_UNAVAILABLE' })
      return
    }

    const terminals = new Set()

    instanceRef.current
      .getAllConnections()
      .forEach((connection) => {
        terminals.add(connection.sourceId)
        terminals.add(connection.targetId)
      })

    setConnectedTerminalIds([...terminals])

    if (experimentCase === 2 && !case1ConnectionsRemoved) {
      setCase1ConnectionsRemoved(true)
      setShowMultimeter(false)
      setShowRth(false)
    }

    if (experimentCase === 3 && !case2ConnectionsRemoved) {
      setCase2ConnectionsRemoved(true)
    }

    lockJsPlumbCircuit(instanceRef.current, containerRef.current)

    instanceRef.current.repaintEverything?.()
    onAutoConnectCompletedRef.current?.(experimentCase)
    onGuideEventRef.current?.({
      caseNumber: experimentCase,
      type: 'AUTO_CONNECT_COMPLETED',
    })

    window.setTimeout(() => {
      autoConnectingRef.current = false
    }, 500)
  }, [
    autoConnectRequest,
    case1ConnectionsRemoved,
    case2ConnectionsRemoved,
    experimentCase,
    resistancesConfigured,
    setCase1ConnectionsRemoved,
    setCase2ConnectionsRemoved,
    setShowMultimeter,
    setShowRth,
  ])

  return (
    <div className="connection-lab" onClick={handleLabelClick} ref={containerRef}>
      <EquipmentPanel
        connectedTerminalIds={connectedTerminalIds}
        experimentCase={experimentCase}
        highlightedTerminalIds={highlightedTerminalIds}
        observationIl={observationIl}
        observationVth={observationVth}
        powerOn={powerOn}
        readings={meterReadings}
      />

      <div className="circuit-workspace">
        <CircuitDiagram
          connectedTerminalIds={connectedTerminalIds}
          highlightedTerminalIds={highlightedTerminalIds}
          r1={r1}
          r2={r2}
          r3={r3}
          rl={rl}
        />
      </div>
    </div>
  )
}

export default ConnectionLab
