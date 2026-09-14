import { formatCompactNumber } from '../utils/numberFormat.js'
import { LOAD_RESISTANCE_VALUES } from '../utils/resistance.js'

const CHART_WIDTH = 500
const CHART_HEIGHT = 330
const CHART_PADDING = {
  bottom: 54,
  left: 58,
  right: 20,
  top: 25,
}
const X_AXIS_TICKS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
const Y_TICK_COUNT = 10

const getLoadPowerMilliwatts = (observation) => (
  (observation.il ** 2) * observation.rl * 1000
)

const getNiceYAxisMaximum = (maximumValue) => {
  if (!Number.isFinite(maximumValue) || maximumValue <= 0) {
    return 5
  }

  const roughStep = maximumValue / Y_TICK_COUNT
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalizedStep = roughStep / magnitude
  const niceStep = normalizedStep <= 1
    ? 1
    : normalizedStep <= 2
      ? 2
      : normalizedStep <= 5
        ? 5
        : 10

  return niceStep * magnitude * Y_TICK_COUNT
}

const PowerLoadGraph = ({ observations = [] }) => {
  const plottedReadings = observations
    .filter((row) => (
      typeof row?.rl === 'number'
      && Number.isFinite(row.rl)
      && typeof row?.il === 'number'
      && Number.isFinite(row.il)
    ))
    .map((row) => ({
      loadPower: getLoadPowerMilliwatts(row),
      resistance: row.rl,
    }))
    .sort((current, next) => current.resistance - next.resistance)
  const chartInnerWidth = (
    CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  )
  const chartInnerHeight = (
    CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  )
  const xAxisMaximum = LOAD_RESISTANCE_VALUES.at(-1)
  const yAxisMaximum = getNiceYAxisMaximum(
    Math.max(0, ...plottedReadings.map((reading) => reading.loadPower)),
  )
  const getX = (resistance) => (
    CHART_PADDING.left + (resistance / xAxisMaximum) * chartInnerWidth
  )
  const getY = (loadPower) => (
    CHART_PADDING.top
    + chartInnerHeight
    - (loadPower / yAxisMaximum) * chartInnerHeight
  )
  const polylinePoints = plottedReadings
    .map((reading) => `${getX(reading.resistance)},${getY(reading.loadPower)}`)
    .join(' ')
  const peakPower = Math.max(
    Number.NEGATIVE_INFINITY,
    ...plottedReadings.map((reading) => reading.loadPower),
  )

  return (
    <section className="analysis-card power-load-graph-panel" id="power-load-graph-panel">
      <header className="analysis-card__heading">
        <h2>POWER VS LOAD RESISTANCE GRAPH</h2>
      </header>

      <div className="power-load-graph-panel__body">
        <svg
          aria-label="Load power in milliwatts plotted against load resistance in ohms"
          className="power-load-graph"
          role="img"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          <rect
            className="power-load-graph__plot-background"
            height={chartInnerHeight}
            width={chartInnerWidth}
            x={CHART_PADDING.left}
            y={CHART_PADDING.top}
          />

          {Array.from({ length: Y_TICK_COUNT + 1 }, (_, index) => {
            const tickValue = (yAxisMaximum / Y_TICK_COUNT) * index
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
                  x={CHART_PADDING.left - 8}
                  y={y + 4}
                >
                  {formatCompactNumber(tickValue, 2)}
                </text>
              </g>
            )
          })}

          {X_AXIS_TICKS.map((tickValue) => {
            const x = getX(tickValue)

            return (
              <g key={`x-${tickValue}`}>
                <line
                  className="power-load-graph__grid-line"
                  x1={x}
                  x2={x}
                  y1={CHART_PADDING.top}
                  y2={CHART_HEIGHT - CHART_PADDING.bottom}
                />
                <text
                  className="power-load-graph__tick-label"
                  textAnchor="middle"
                  x={x}
                  y={CHART_HEIGHT - CHART_PADDING.bottom + 19}
                >
                  {tickValue}
                </text>
              </g>
            )
          })}

          <line
            className="power-load-graph__axis"
            x1={CHART_PADDING.left}
            x2={CHART_PADDING.left}
            y1={CHART_PADDING.top}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
          />
          <line
            className="power-load-graph__axis"
            x1={CHART_PADDING.left}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y1={CHART_HEIGHT - CHART_PADDING.bottom}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
          />

          {plottedReadings.length > 1 ? (
            <polyline
              className="power-load-graph__line"
              points={polylinePoints}
            />
          ) : null}

          {plottedReadings.map((reading) => {
            const isPeak = reading.loadPower === peakPower && peakPower > 0

            return (
              <g key={reading.resistance}>
                <circle
                  className={`power-load-graph__point${isPeak ? ' power-load-graph__point--peak' : ''}`}
                  cx={getX(reading.resistance)}
                  cy={getY(reading.loadPower)}
                  r={isPeak ? 5.5 : 4}
                >
                  <title>
                    {`RL ${reading.resistance} Ω, PL ${formatCompactNumber(reading.loadPower, 2)} mW`}
                  </title>
                </circle>
                {isPeak ? (
                  <text
                    className="power-load-graph__peak-label"
                    textAnchor="middle"
                    x={getX(reading.resistance)}
                    y={getY(reading.loadPower) - 11}
                  >
                    {`${formatCompactNumber(reading.loadPower, 2)} mW`}
                  </text>
                ) : null}
              </g>
            )
          })}

          <text
            className="power-load-graph__axis-title"
            textAnchor="middle"
            x={CHART_PADDING.left + chartInnerWidth / 2}
            y={CHART_HEIGHT - 8}
          >
            Load Resistance, R
            <tspan baselineShift="sub" fontSize="8">L</tspan>
            {' (Ω)'}
          </text>
          <text
            className="power-load-graph__axis-title"
            textAnchor="middle"
            transform={`rotate(-90 14 ${CHART_PADDING.top + chartInnerHeight / 2})`}
            x={14}
            y={CHART_PADDING.top + chartInnerHeight / 2}
          >
            Load Power, P
            <tspan baselineShift="sub" fontSize="8">L</tspan>
            {' (mW)'}
          </text>
        </svg>

        {plottedReadings.length === 0 ? (
          <p className="power-load-graph-panel__empty">
            Add readings to generate the graph.
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default PowerLoadGraph
