import { formatCompactNumber } from '../utils/numberFormat.js'

const CHART_WIDTH = 560
const CHART_HEIGHT = 350
const CHART_PADDING = {
  bottom: 58,
  left: 66,
  right: 26,
  top: 28,
}
const X_AXIS_MINIMUM = 0
const X_AXIS_MAXIMUM = 4
const Y_AXIS_MINIMUM = 3.75
const Y_AXIS_MAXIMUM = 5.75
const X_TICKS = Array.from({ length: 9 }, (_, index) => index * 0.5)
const Y_TICKS = Array.from({ length: 9 }, (_, index) => Y_AXIS_MINIMUM + index * 0.25)

const buildSmoothPath = (points) => {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const midX = (previous.x + point.x) / 2

    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

const PowerLoadGraph = ({ observations = [] }) => {
  const plottedReadings = observations
    .filter((row) => (
      Number.isFinite(Number(row?.voltage))
      && Number.isFinite(Number(row?.current))
      && Number(row.voltage) >= X_AXIS_MINIMUM
      && Number(row.voltage) <= X_AXIS_MAXIMUM
      && Number(row.current) >= Y_AXIS_MINIMUM
      && Number(row.current) <= Y_AXIS_MAXIMUM
    ))
    .map((row) => ({
      current: Number(row.current),
      voltage: Number(row.voltage),
    }))

  const chartInnerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const chartBottom = CHART_PADDING.top + chartInnerHeight
  const getX = (voltage) => (
    CHART_PADDING.left
    + ((voltage - X_AXIS_MINIMUM) / (X_AXIS_MAXIMUM - X_AXIS_MINIMUM)) * chartInnerWidth
  )
  const getY = (current) => (
    CHART_PADDING.top
    + chartInnerHeight
    - ((current - Y_AXIS_MINIMUM) / (Y_AXIS_MAXIMUM - Y_AXIS_MINIMUM)) * chartInnerHeight
  )
  const points = plottedReadings.map((reading) => ({
    ...reading,
    x: getX(reading.voltage),
    y: getY(reading.current),
  }))
  const curvePath = buildSmoothPath(points)
  const areaPath = points.length > 1
    ? `${curvePath} L ${points.at(-1).x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`
    : ''

  return (
    <section className="analysis-card power-load-graph-panel" id="power-load-graph-panel">
      <header className="analysis-card__heading">
        <h2>VI Characteristics of Solar Cell</h2>
      </header>

      <div className="power-load-graph-panel__body">
        <svg
          aria-label="Solar cell current in milliamperes plotted against voltage in volts"
          className="power-load-graph"
          role="img"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          <defs>
            <linearGradient id="vi-plot-background" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fffdf7" />
              <stop offset="100%" stopColor="#f5f8ef" />
            </linearGradient>
            <linearGradient id="vi-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e4a11b" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#e4a11b" stopOpacity="0.02" />
            </linearGradient>
            <filter id="vi-point-shadow" height="180%" width="180%" x="-40%" y="-40%">
              <feDropShadow dx="0" dy="2" floodColor="#493017" floodOpacity="0.28" stdDeviation="2" />
            </filter>
          </defs>

          <rect
            className="power-load-graph__plot-background"
            height={chartInnerHeight}
            rx="8"
            width={chartInnerWidth}
            x={CHART_PADDING.left}
            y={CHART_PADDING.top}
          />

          {Y_TICKS.map((tickValue) => {
            const y = getY(tickValue)

            return (
              <g key={`y-${tickValue}`}>
                <line
                  className="power-load-graph__grid-line"
                  x1={CHART_PADDING.left}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y1={y}
                  y2={y}
                />
                <text
                  className="power-load-graph__tick-label"
                  textAnchor="end"
                  x={CHART_PADDING.left - 11}
                  y={y + 4}
                >
                  {tickValue.toFixed(2)}
                </text>
              </g>
            )
          })}

          {X_TICKS.map((tickValue) => {
            const x = getX(tickValue)

            return (
              <g key={`x-${tickValue}`}>
                <line
                  className="power-load-graph__grid-line power-load-graph__grid-line--vertical"
                  x1={x}
                  x2={x}
                  y1={CHART_PADDING.top}
                  y2={chartBottom}
                />
                <text
                  className="power-load-graph__tick-label"
                  textAnchor="middle"
                  x={x}
                  y={chartBottom + 22}
                >
                  {tickValue === 0 ? '0' : tickValue.toFixed(1)}
                </text>
              </g>
            )
          })}

          <path
            className="power-load-graph__axis"
            d={`M ${CHART_PADDING.left} ${CHART_PADDING.top - 5} V ${chartBottom} H ${CHART_WIDTH - CHART_PADDING.right + 5}`}
          />

          {areaPath ? <path className="power-load-graph__area" d={areaPath} /> : null}
          {points.length > 1 ? (
            <path className="power-load-graph__line" d={curvePath} />
          ) : null}

          {points.map((point, index) => (
            <circle
              className="power-load-graph__point"
              cx={point.x}
              cy={point.y}
              key={`${point.voltage}-${point.current}-${index}`}
              r="4.5"
            >
              <title>
                {`${formatCompactNumber(point.voltage, 2)} V, ${formatCompactNumber(point.current, 2)} mA`}
              </title>
            </circle>
          ))}

          <text
            className="power-load-graph__axis-title"
            textAnchor="middle"
            x={CHART_PADDING.left + chartInnerWidth / 2}
            y={CHART_HEIGHT - 9}
          >
            Voltage (V)
          </text>
          <text
            className="power-load-graph__axis-title"
            textAnchor="middle"
            transform={`rotate(-90 17 ${CHART_PADDING.top + chartInnerHeight / 2})`}
            x={17}
            y={CHART_PADDING.top + chartInnerHeight / 2}
          >
            Current (mA)
          </text>
        </svg>

        {plottedReadings.length === 0 ? (
          <p className="power-load-graph-panel__empty">
            Complete all readings and click PLOT to generate the V–I curve.
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default PowerLoadGraph
