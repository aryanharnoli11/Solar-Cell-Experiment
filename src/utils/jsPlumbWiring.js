export const POSITIVE_TERMINALS = ['1-endpoint', '3-endpoint', '5-endpoint', '7-endpoint']

export const NEGATIVE_TERMINALS = ['2-endpoint', '4-endpoint', '6-endpoint', '8-endpoint']

export const CIRCUIT_POSITIVE_TERMINALS = [
  '9-endpoint',
  '11-endpoint',
  '12-endpoint',
]

export const CIRCUIT_NEGATIVE_TERMINALS = [
  '10-endpoint',
  '13-endpoint',
  '14-endpoint',
]




export const resolveJsPlumb = (module) => (
  module?.jsPlumb
  || module?.default?.jsPlumb
  || module?.default
  || window.jsPlumb
)

const getAllConnections = (instance) => {
  if (!instance) return []

  if (typeof instance.getAllConnections === 'function') {
    return instance.getAllConnections()
  }

  if (typeof instance.getConnections === 'function') {
    return instance.getConnections()
  }

  return []
}

export const deleteConnectionsForTerminal = (instance, terminalId) => {
  const matchingConnections = getAllConnections(instance).filter((connection) => {
    const sourceId = connection.sourceId || connection.source?.id
    const targetId = connection.targetId || connection.target?.id

    return sourceId === terminalId || targetId === terminalId
  })

  matchingConnections.forEach((connection) => {
    if (typeof instance.deleteConnection === 'function') {
      instance.deleteConnection(connection)
      return
    }

    connection.detach?.()
  })

  return matchingConnections.length
}

const isNegativeTerminal = (terminalId) => (
  NEGATIVE_TERMINALS.includes(terminalId)
  || CIRCUIT_NEGATIVE_TERMINALS.includes(terminalId)
)

const terminalPaintStyles = {
  positive: {
    fill: '#e33024',
    outlineStroke: '#fff8f6',
    outlineWidth: 1.6,
    stroke: '#8f140e',
    strokeWidth: 1.12,
  },
  negative: {
    fill: '#151515',
    outlineStroke: '#f5f5f5',
    outlineWidth: 1.6,
    stroke: '#000000',
    strokeWidth: 1.12,
  },
}

const terminalHoverPaintStyles = {
  positive: {
    fill: '#ff4a3d',
    outlineStroke: '#ffffff',
    outlineWidth: 1.92,
    stroke: '#81130f',
    strokeWidth: 1.28,
  },
  negative: {
    fill: '#303030',
    outlineStroke: '#ffffff',
    outlineWidth: 1.92,
    stroke: '#000000',
    strokeWidth: 1.28,
  },
}

const getTerminalNumber = (terminalId) => terminalId.replace('-endpoint', '')

const getCssValue = (styles, propertyName, fallback) => {
  const value = styles.getPropertyValue(propertyName).trim()

  return value || fallback
}

const getCssNumber = (styles, propertyName, fallback) => {
  const value = Number.parseFloat(styles.getPropertyValue(propertyName))

  return Number.isFinite(value) ? value : fallback
}

const getEndpointPaintStyle = (element, type, state = 'default') => {
  const styles = window.getComputedStyle(element)
  const prefix = state === 'hover' ? '--jtk-endpoint-hover' : '--jtk-endpoint'
  const defaults = state === 'hover'
    ? terminalHoverPaintStyles[type]
    : terminalPaintStyles[type]

  return {
    fill: getCssValue(styles, `${prefix}-fill`, defaults.fill),
    outlineStroke: getCssValue(
      styles,
      `${prefix}-outline-stroke`,
      defaults.outlineStroke,
    ),
    outlineWidth: getCssNumber(
      styles,
      `${prefix}-outline-width`,
      defaults.outlineWidth,
    ),
    stroke: getCssValue(styles, `${prefix}-stroke`, defaults.stroke),
    strokeWidth: getCssNumber(
      styles,
      `${prefix}-stroke-width`,
      defaults.strokeWidth,
    ),
  }
}

const getEndpointRadius = (element) => (
  getCssNumber(window.getComputedStyle(element), '--jtk-endpoint-radius', 4)
)

const getEndpointCssClass = (terminalId, type) => {
  const terminalNumber = getTerminalNumber(terminalId)

  return [
    'jtk-endpoint--terminal',
    `jtk-endpoint--terminal-${terminalNumber}`,
    `jtk-endpoint--${terminalId}`,
    `jtk-endpoint--${type}`,
  ].join(' ')
}

export const wirePaintStyles = {
  positive: {
    outlineStroke: '#771914',
    outlineWidth: 0.92,
    stroke: '#dd342d',
    strokeWidth: 3.68,
  },
  negative: {
    outlineStroke: '#000000',
    outlineWidth: 0.92,
    stroke: '#111111',
    strokeWidth: 3.68,
  },
}

export const wireHoverPaintStyles = {
  positive: {
    outlineStroke: '#5d110d',
    outlineWidth: 1.08,
    stroke: '#f04a42',
    strokeWidth: 4,
  },
  negative: {
    outlineStroke: '#000000',
    outlineWidth: 1.08,
    stroke: '#292929',
    strokeWidth: 4,
  },
}

export const getConnectionBetween = (instance, firstId, secondId) => {
  const connections = getAllConnections(instance)

  return connections.find((connection) => {
    const sourceId = connection.sourceId || connection.source?.id
    const targetId = connection.targetId || connection.target?.id

    return (
      (sourceId === firstId && targetId === secondId)
      || (sourceId === secondId && targetId === firstId)
    )
  })
}

export const hasConnectionBetween = (instance, firstId, secondId) => (
  Boolean(getConnectionBetween(instance, firstId, secondId))
)



export const addTerminalEndpoint = (instance, terminalId, type) => {
  const element = document.getElementById(terminalId)

  if (!element) {
    return
  }

  const endpoint = instance.addEndpoint(element, {
    uuid: terminalId,
    endpoint: ['Dot', { radius: getEndpointRadius(element) }],
    cssClass: getEndpointCssClass(terminalId, type),
    anchor: ['Center'],
    isSource: true,
    isTarget: true,
    connectionType: type,
    connectionsDetachable: true,
    connectorStyle: wirePaintStyles[type],
    connectorHoverStyle: wireHoverPaintStyles[type],
    maxConnections: 1,
    paintStyle: getEndpointPaintStyle(element, type),
    hoverPaintStyle: getEndpointPaintStyle(element, type, 'hover'),
  })

  const terminalTitle =
    element.getAttribute('title') || element.getAttribute('aria-label')

  if (terminalTitle && endpoint?.canvas) {
    endpoint.canvas.setAttribute('aria-label', terminalTitle)
  }
}

export const addAllEndpoints = (
  instance,
  resistancesConfigured,
  showResistanceAlert,
) => {
  POSITIVE_TERMINALS.forEach((terminalId) => {
    addTerminalEndpoint(instance, terminalId, 'positive')
  })

  NEGATIVE_TERMINALS.forEach((terminalId) => {
    addTerminalEndpoint(instance, terminalId, 'negative')
  })

  CIRCUIT_POSITIVE_TERMINALS.forEach((terminalId) => {
    addTerminalEndpoint(instance, terminalId, 'positive')
  })

  CIRCUIT_NEGATIVE_TERMINALS.forEach((terminalId) => {
    addTerminalEndpoint(instance, terminalId, 'negative')
  })
  instance.bind('beforeDrop', () => {

  console.log("BEFORE DROP FIRED")

  if (!resistancesConfigured()) {

    console.log("BLOCKED")

    showResistanceAlert()

    return false
  }

  return true
})
}


export const lockJsPlumbCircuit = (instance, containerElement) => {
  getAllConnections(instance).forEach((connection) => {
    connection.setDetachable?.(false)

    connection.endpoints?.forEach((endpoint) => {
      endpoint.setEnabled?.(false)
    })
  })

  containerElement?.classList.add('connection-lab--locked')
}

export const unlockJsPlumbCircuit = (instance, containerElement) => {
  getAllConnections(instance).forEach((connection) => {
    connection.setDetachable?.(true)

    connection.endpoints?.forEach((endpoint) => {
      endpoint.setEnabled?.(true)
    })
  })

  containerElement?.classList.remove('connection-lab--locked')
}

export const validateTheveninConnections = (
  instance,
  experimentCase,
) => {

  const connections = getAllConnections(instance)
  const totalConnections = connections.length

  const validatePairs = (requiredPairs) => {
    const missingPairs = requiredPairs.filter(([firstId, secondId]) => (
      !hasConnectionBetween(instance, firstId, secondId)
    ))
    const wrongPairs = connections
      .map((connection) => [
        connection.sourceId || connection.source?.id,
        connection.targetId || connection.target?.id,
      ])
      .filter(([sourceId, targetId]) => (
        sourceId
        && targetId
        && !requiredPairs.some(([firstId, secondId]) => (
          (sourceId === firstId && targetId === secondId)
          || (sourceId === secondId && targetId === firstId)
        ))
      ))
    const matchedCount = requiredPairs.length - missingPairs.length

    return {
      isCorrect: missingPairs.length === 0 && wrongPairs.length === 0,
      matchedCount,
      missingPairs,
      totalConnections,
      wrongPairs,
    }
  }

  // CASE 1
  if (experimentCase === 1) {
    return validatePairs([
      ['9-endpoint', '10-endpoint'],
      ['5-endpoint', '11-endpoint'],
      ['6-endpoint', '13-endpoint'],
    ])
  }

  // CASE 2
  if (experimentCase === 2) {
    return validatePairs([
      ['7-endpoint', '9-endpoint'],
      ['8-endpoint', '10-endpoint'],
      ['1-endpoint', '11-endpoint'],
      ['2-endpoint', '13-endpoint'],
    ])
  }

  // CASE 3
  if (experimentCase === 3) {
    return validatePairs([
      ['7-endpoint', '9-endpoint'],
      ['8-endpoint', '10-endpoint'],
      ['3-endpoint', '11-endpoint'],
      ['4-endpoint', '12-endpoint'],
      ['13-endpoint', '14-endpoint'],
    ])
  }

  return {
    isCorrect: false,
    matchedCount: 0,
    missingPairs: [],
    totalConnections,
    wrongPairs: [],
  }
}

export const autoConnectTheveninCircuit = (
  instance,
  experimentCase,
) => {
  const requiredPairsByCase = {
    1: [
      ['9-endpoint', '10-endpoint'],
      ['5-endpoint', '11-endpoint'],
      ['6-endpoint', '13-endpoint'],
    ],
    2: [
      ['7-endpoint', '9-endpoint'],
      ['8-endpoint', '10-endpoint'],
      ['1-endpoint', '11-endpoint'],
      ['2-endpoint', '13-endpoint'],
    ],
    3: [
      ['7-endpoint', '9-endpoint'],
      ['8-endpoint', '10-endpoint'],
      ['3-endpoint', '11-endpoint'],
      ['4-endpoint', '12-endpoint'],
      ['13-endpoint', '14-endpoint'],
    ],
  }
  const requiredPairs = requiredPairsByCase[experimentCase]

  if (!instance || !requiredPairs) {
    return {
      success: false,
      reason: 'INVALID_CASE',
    }
  }

  const isRequiredPair = (sourceId, targetId) => (
    requiredPairs.some(([firstId, secondId]) => (
      (sourceId === firstId && targetId === secondId)
      || (sourceId === secondId && targetId === firstId)
    ))
  )
  let removedCount = 0

  const existingConnections = [...getAllConnections(instance)]

  existingConnections.forEach((connection) => {
    const sourceId = connection.sourceId || connection.source?.id
    const targetId = connection.targetId || connection.target?.id

    if (isRequiredPair(sourceId, targetId)) {
      return
    }

    if (typeof instance.deleteConnection === 'function') {
      instance.deleteConnection(connection)
    } else {
      connection.detach?.()
    }

    removedCount += 1
  })

  let addedCount = 0

  const connectPair = (a, b) => {
    if (hasConnectionBetween(instance, a, b)) return

    instance.connect({
      uuids: [a, b],
      type: isNegativeTerminal(a)
        ? 'negative'
        : 'positive',
    })

    addedCount += 1
  }

  requiredPairs.forEach(([firstId, secondId]) => {
    connectPair(firstId, secondId)
  })

  const validation = validateTheveninConnections(instance, experimentCase)

  return {
    addedCount,
    removedCount,
    ...(validation.isCorrect ? {} : { reason: 'CONNECTION_FAILED' }),
    success: validation.isCorrect,
  }
}
