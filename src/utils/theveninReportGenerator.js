import { amperesToMilliamperes } from './current.js'

// Edit these values to change the fixed text shown in the generated report.
const REPORT_CONTENT = {
  documentTitle: 'Solar Cell Simulation Report',
  reportHeading: 'Virtual Labs Simulation Report',
  labName: 'AI-Enhanced Basic Electrical Science Lab',
  experimentTitle: 'To Study The VI Characteristics and Fill Factor of a Solar Cell.',
  aim: 'To study the VI characteristics and fill factor of a Solar Cell.',
  simulationSummary: 'The guided walkthrough familiarised the user with the simulation interface. The circuit was connected, and the connections were verified successfully. Short-circuit current (ISC) was measured using an ammeter. The load resistance was then varied one value at a time using the resistance slider, and the corresponding Voltage (V), load current (IL) and power (P) readings were recorded in the observation table for each resistance value. Then, the open-circuit voltage (Voc) was measured using a voltmeter. Thereafter, the VI characteristic was plotted. Finally, the Fill Factor was calculated using the measured readings.',
  apparatus: [
    ['Power Switch: 230 V, 50 Hz', 'AC/DC Voltmeter: 0 - 10 V', 'AC/DC Ammeter: 0 - 20 mA', 'RL: 0  - 1000 Ω'],
    ['Connecting Leads', 'Solar Panel: 2 W, 6 V', 'Light Bulb', 'Bulb Switch'],
  ],
  conclusion: 'The V–I characteristic of the solar cell was plotted, and the fill factor was calculated to analyse the solar cells performance.',
  footer: '© 2026 Virtual Labs, IIT Roorkee',
}

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const REPORT_ELECTRICAL_SYMBOLS = {
  il: ['I', 'L'],
  isc: ['I', 'SC'],
  rl: ['R', 'L'],
  voc: ['V', 'OC'],
}

const formatReportText = (value) => escapeHtml(value).replace(
  /\b(VOC|ISC|IL|RL)\b/gi,
  (symbol) => {
    const [base, subscript] = REPORT_ELECTRICAL_SYMBOLS[symbol.toLowerCase()]

    return `${base}<sub>${subscript}</sub>`
  },
)

const formatReportReading = (value) => {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : ''
}

const REPORT_GRAPH = {
  bottom: 292,
  height: 254,
  left: 76,
  right: 744,
  top: 38,
  width: 668,
  xMaximum: 4,
  xMinimum: 0,
  yMaximum: 5.75,
  yMinimum: 3.75,
}

const REPORT_GRAPH_X_TICKS = Array.from({ length: 9 }, (_, index) => index * 0.5)
const REPORT_GRAPH_Y_TICKS = Array.from(
  { length: 9 },
  (_, index) => REPORT_GRAPH.yMinimum + index * 0.25,
)

const buildReportGraphPath = (points) => {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const middleX = (previous.x + point.x) / 2

    return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

const createReportGraph = (observations) => {
  const readings = observations
    .map((row) => ({
      current: Number.isFinite(Number(row?.current))
        ? Number(row.current)
        : amperesToMilliamperes(row?.il),
      voltage: Number(row?.voltage),
    }))
    .filter((reading) => (
      Number.isFinite(reading.voltage)
      && Number.isFinite(reading.current)
      && reading.voltage >= REPORT_GRAPH.xMinimum
      && reading.voltage <= REPORT_GRAPH.xMaximum
      && reading.current >= REPORT_GRAPH.yMinimum
      && reading.current <= REPORT_GRAPH.yMaximum
    ))

  const getX = (voltage) => (
    REPORT_GRAPH.left
    + ((voltage - REPORT_GRAPH.xMinimum) / (REPORT_GRAPH.xMaximum - REPORT_GRAPH.xMinimum))
      * REPORT_GRAPH.width
  )
  const getY = (current) => (
    REPORT_GRAPH.top
    + REPORT_GRAPH.height
    - ((current - REPORT_GRAPH.yMinimum) / (REPORT_GRAPH.yMaximum - REPORT_GRAPH.yMinimum))
      * REPORT_GRAPH.height
  )
  const points = readings.map((reading) => ({
    ...reading,
    x: getX(reading.voltage),
    y: getY(reading.current),
  }))
  const curvePath = buildReportGraphPath(points)
  const areaPath = points.length > 1
    ? `${curvePath} L ${points.at(-1).x} ${REPORT_GRAPH.bottom} L ${points[0].x} ${REPORT_GRAPH.bottom} Z`
    : ''
  const horizontalGrid = REPORT_GRAPH_Y_TICKS.map((tick) => {
    const y = getY(tick)

    return `
      <line class="report-vi-graph__grid" x1="${REPORT_GRAPH.left}" x2="${REPORT_GRAPH.right}" y1="${y}" y2="${y}" />
      <text class="report-vi-graph__tick" text-anchor="end" x="${REPORT_GRAPH.left - 12}" y="${y + 4}">${tick.toFixed(2)}</text>
    `
  }).join('')
  const verticalGrid = REPORT_GRAPH_X_TICKS.map((tick) => {
    const x = getX(tick)
    const label = tick === 0 ? '0' : tick.toFixed(1)

    return `
      <line class="report-vi-graph__grid report-vi-graph__grid--vertical" x1="${x}" x2="${x}" y1="${REPORT_GRAPH.top}" y2="${REPORT_GRAPH.bottom}" />
      <text class="report-vi-graph__tick" text-anchor="middle" x="${x}" y="${REPORT_GRAPH.bottom + 24}">${label}</text>
    `
  }).join('')
  const pointMarkup = points.map((point) => `
    <circle class="report-vi-graph__point" cx="${point.x}" cy="${point.y}" r="5">
      <title>${formatReportReading(point.voltage)} V, ${formatReportReading(point.current)} mA</title>
    </circle>
  `).join('')

  return `
    <div class="report-vi-graph">
      <h3>V&ndash;I Characteristics of Solar Cell</h3>
      <svg
        aria-label="Solar cell current in milliamperes plotted against voltage in volts"
        class="report-vi-graph__svg"
        role="img"
        viewBox="0 0 790 360"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="report-vi-area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#e4a11b" stop-opacity="0.28" />
            <stop offset="100%" stop-color="#e4a11b" stop-opacity="0.03" />
          </linearGradient>
        </defs>
        <rect class="report-vi-graph__background" height="${REPORT_GRAPH.height}" rx="8" width="${REPORT_GRAPH.width}" x="${REPORT_GRAPH.left}" y="${REPORT_GRAPH.top}" />
        ${horizontalGrid}
        ${verticalGrid}
        <path class="report-vi-graph__axis" d="M ${REPORT_GRAPH.left} ${REPORT_GRAPH.top} V ${REPORT_GRAPH.bottom} H ${REPORT_GRAPH.right}" />
        ${areaPath ? `<path class="report-vi-graph__area" d="${areaPath}" />` : ''}
        ${curvePath ? `<path class="report-vi-graph__line" d="${curvePath}" />` : ''}
        ${pointMarkup}
        <text class="report-vi-graph__axis-title" text-anchor="middle" x="${REPORT_GRAPH.left + REPORT_GRAPH.width / 2}" y="350">Voltage (V)</text>
        <text class="report-vi-graph__axis-title" text-anchor="middle" transform="rotate(-90 20 165)" x="20" y="165">Current (mA)</text>
      </svg>
    </div>
  `
}

export const generateTheveninReport = ({
  observations,
  vth,
  fillFactor,
  sessionStart,
}) => {
  const iitLogoSrc =
    new URL('../assets/IIT Logo.png', import.meta.url).href

  const virtualLabsLogoSrc =
    new URL('../assets/image.png', import.meta.url).href

  const reportDate = new Date()
  const sessionEnd = reportDate.getTime()

  const reportDateText = reportDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const storedStart = localStorage.getItem('experimentStartTime')
  const startTime = storedStart ? new Date(storedStart) : new Date(sessionStart)
  const endTime = reportDate

  const startTimeText = startTime.toLocaleTimeString()
  const endTimeText = endTime.toLocaleTimeString()

  const durationMs = Math.max(0, sessionEnd - startTime.getTime())
  const durationTotalSeconds = Math.floor(durationMs / 1000)
  const durationMinutes = Math.floor(durationTotalSeconds / 60)
  const durationSeconds = String(durationTotalSeconds % 60).padStart(2, '0')
  const durationText = `${durationMinutes} min ${durationSeconds} sec`
  const firstObservation = observations[0] ?? {}
  const reportOpenCircuitVoltage = typeof firstObservation.vth === 'number'
    ? firstObservation.vth
    : vth
  const shortCircuitObservation = observations.find((row) => (
    row?.isShortCircuit === true
    || (row?.rl === 0 && typeof row?.il === 'number')
  ))
  const reportShortCircuitCurrent = typeof firstObservation.isc === 'number'
    ? firstObservation.isc
    : shortCircuitObservation
      ? amperesToMilliamperes(shortCircuitObservation.il)
      : null
  const observationRows = observations
    .map((row, index) => {
      const voltage = typeof row?.voltage === 'number'
        ? row.voltage
        : typeof row?.il === 'number' && typeof row?.rl === 'number'
          ? row.il * row.rl
          : null
      const current = typeof row?.current === 'number'
        ? row.current
        : typeof row?.il === 'number'
          ? amperesToMilliamperes(row.il)
          : null
      const power = typeof row?.power === 'number'
        ? row.power
        : voltage !== null && current !== null
          ? voltage * current
          : null

      return `
        <tr>
          <td>${escapeHtml(row?.id ?? index + 1)}</td>
          <td>${formatReportReading(voltage)}</td>
          <td>${formatReportReading(current)}</td>
          <td>${formatReportReading(power)}</td>
        </tr>
      `
    })
    .join('')
  const reportGraph = createReportGraph(observations)

  const css = `
body {
  font-family: 'Inter', 'Segoe UI', sans-serif;
  background: linear-gradient(180deg, #eef4fb 0%, #f7f9fc 100%);
  color: #1f2d3d;
  margin: 0;
  padding: 14px 14px 20px;
  font-size: 13.5px;
  line-height: 1.4;
  overflow-wrap: break-word;
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
.report-page {
  width: min(100%, 960px);
  margin: 0 auto 16px;
  padding: 20px 24px;
  background-color: #ffffff;
  border-radius: 16px;
  border: 1px solid #d3ddea;
  box-shadow: 0 12px 28px rgba(23, 50, 77, 0.1);
  break-inside: auto;
  page-break-inside: auto;
  overflow: visible;
  background-clip: padding-box;
}
.report-page:last-of-type {
  margin-bottom: 0;
}
h1,
h2,
h3 {
  color: #1f2d3d;
  margin-top: 0;
  font-weight: 700;
}
h1 {
  font-size: 24px;
  margin: 0;
  padding: 0;
  line-height: 1.15;
}
h2 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #243b53;
}
h3 {
  font-size: 14px;
  margin-bottom: 5px;
  color: #2d4b68;
}
p {
  margin: 0 0 6px;
}
.section {
  background: linear-gradient(180deg, #f9fbfe 0%, #f4f7fb 100%);
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 12px;
  border: none;
  box-shadow: none;
  break-inside: auto;
  page-break-inside: auto;
  background-clip: padding-box;
}
.section:last-child {
  margin-bottom: 0;
}
.section > h2:first-child {
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e1e9f3;
}
.label {
  font-weight: 600;
  color: #1f2d3d;
  display: block;
  margin-bottom: 2px;
}
.report-overview-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.report-stamp {
  margin: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: #ffffff;
  border: none;
  color: #50657c;
  font-size: 12px;
  font-weight: 600;
}
.report-experiment-label {
  margin: 0 0 4px;
  font-size: 11px;
  text-transform: uppercase;
  color: #60778f;
  font-weight: 700;
}
.report-experiment-title {
  margin: 0 0 10px;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 700;
  color: #16324b;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 8px;
}
.info-card {
  background: #fff;
  border: none;
  border-radius: 9px;
  padding: 8px 10px;
  box-shadow: none;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 2px;
}
.info-card strong {
  font-size: 15px;
  color: #16324b;
  font-weight: 700;
}
.summary-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.summary-sub-section {
  break-inside: avoid;
  page-break-inside: avoid;
}
.summary-sub-section h3 {
  border-left: 3px solid #2f7bfa;
  padding-left: 8px;
  margin-bottom: 4px;
  color: #16324b;
  font-size: 14px;
}
.summary-sub-section p {
  text-align: justify;
  margin: 0;
  color: #2d3e50;
  font-size: 13px;
  line-height: 1.4;
}
.summary-list {
  margin: 0;
  padding-left: 18px;
  color: #2d3e50;
  font-size: 13px;
}
.summary-list li {
  margin-bottom: 2px;
}
.apparatus-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
}
.table-shell {
  display: block;
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  border: none;
  border-radius: 12px;
  max-width: 100%;
  background: #ffffff;
  box-shadow: none;
}
.report-vi-graph {
  width: 100%;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #e1e9f3;
  break-inside: avoid;
  page-break-inside: avoid;
}
.report-vi-graph h3 {
  margin: 0 0 6px;
}
.report-vi-graph__svg {
  display: block;
  width: 100%;
  height: auto;
  background: #fffdf8;
  border: 1px solid #d9e2ec;
  border-radius: 10px;
}
.report-vi-graph__background {
  fill: #fffdf7;
}
.report-vi-graph__grid {
  stroke: rgba(117, 88, 62, 0.2);
  stroke-dasharray: 4 6;
  stroke-width: 1;
}
.report-vi-graph__grid--vertical {
  stroke-opacity: 0.75;
}
.report-vi-graph__axis {
  fill: none;
  stroke: #563927;
  stroke-width: 1.8;
}
.report-vi-graph__area {
  fill: url(#report-vi-area-gradient);
}
.report-vi-graph__line {
  fill: none;
  stroke: #d08000;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
}
.report-vi-graph__point {
  fill: #ffffff;
  stroke: #d08000;
  stroke-width: 3;
}
.report-vi-graph__tick {
  fill: #6a4b34;
  font-size: 13px;
  font-weight: 700;
}
.report-vi-graph__axis-title {
  fill: #38271c;
  font-size: 15px;
  font-weight: 800;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0;
  box-shadow: none;
  background-color: white;
  table-layout: auto;
}
th,
td {
  border: 1px solid #d9e2ec;
  padding: 8px 10px;
  text-align: center;
  font-size: 13px;
  vertical-align: middle;
  overflow-wrap: anywhere;
  word-break: break-word;
}
th {
  background: linear-gradient(135deg, #2f7bfa 0%, #1f62d0 100%);
  border-color: #c6d7ec;
  border-bottom-color: #b4cae5;
  color: white;
  font-weight: 700;
}
thead {
  display: table-header-group;
}
tbody {
  display: table-row-group;
}
tr {
  break-inside: avoid-page;
  page-break-inside: avoid;
}
tr:nth-child(even) {
  background-color: #f8fbff;
}
.results-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}
.results-card--observations {
  grid-column: 1 / -1;
}
.results-card {
  background: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 12px;
  box-shadow: none;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: visible;
  background-clip: padding-box;
}
.results-card h3 {
  margin: 0;
  text-align: left;
}
.badge {
  margin: 0;
  padding: 5px 10px;
  border-radius: 20px;
  background: #e8f1ff;
  color: #1f62d0;
  font-weight: 600;
  font-size: 11px;
}
.header-row {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr) 108px;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  break-inside: avoid-page;
  page-break-inside: avoid;
}
.report-title-block {
  text-align: center;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 3px solid #2f7bfa;
  min-width: 0;
}
.report-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #5c6f84;
}
.report-logo {
  height: auto;
  width: auto;
  max-width: 108px;
  max-height: 80px;
  object-fit: contain;
  flex-shrink: 0;
  justify-self: center;
}
.report-logo--virtual-labs {
  max-width: 190px;
  max-height: 80px;
  justify-self: start;
}
.report-logo--iit {
  max-width: 84px;
  max-height: 84px;
  justify-self: end;
}
.param-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 8px;
}
.param-card {
  background: #fff;
  border-radius: 9px;
  padding: 8px 12px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.param-card .param-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #60778f;
  font-weight: 700;
}
.param-card .param-value {
  font-size: 16px;
  font-weight: 700;
  color: #16324b;
}
.calc-block {
  background: #fff;
  border-radius: 9px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #2d3e50;
  font-family: inherit;
  font-size: inherit;
  font-weight: 400;
  line-height: 1.5;
}
.calc-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 4px;
}
.calc-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.calc-row .calc-label {
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
}
.calc-row .calc-value {
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  text-align: right;
}
.calc-formula {
  background: #f4f7fb;
  border-radius: 6px;
  padding: 6px 10px;
  font-family: monospace;
  font-size: 12.5px;
  color: #2d4b68;
  margin: 2px 0;
}
.conclusion-text {
  text-align: justify;
  line-height: 1.5;
  color: #2d3e50;
  margin: 0;
}
.report-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  width: min(100%, 960px);
  margin: 16px auto 0;
}
.report-footer {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid #d6e1ec;
  color: #52677c;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.print-btn,
.download-btn {
  padding: 10px 20px;
  font-size: 14px;
  border: none;
  border-radius: 30px;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
}
.print-btn {
  background: linear-gradient(to right, #2f7bfa, #1f62d0);
}
.download-btn {
  background: linear-gradient(to right, #28a745, #1f8d38);
}
.print-btn:hover,
.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(31, 45, 61, 0.12);
}
.pdf-exporting .report-page {
  width: 700px !important;
  border-color: transparent !important;
  box-shadow: none !important;
  margin-bottom: 0 !important;
  padding: 8px 12px !important;
  break-inside: avoid-page !important;
  page-break-inside: avoid !important;
}
.pdf-exporting {
  padding: 0 !important;
  background: #ffffff !important;
  font-size: 10.5px !important;
  line-height: 1.25 !important;
}
.pdf-exporting .header-row {
  grid-template-columns: 150px minmax(0, 1fr) 86px !important;
  gap: 14px !important;
  margin-bottom: 8px !important;
}
.pdf-exporting .report-title-block {
  padding-bottom: 6px !important;
}
.pdf-exporting .section {
  padding: 7px 9px !important;
  margin-bottom: 5px !important;
}
.pdf-exporting .section > h2:first-child {
  margin-bottom: 7px !important;
  padding-bottom: 5px !important;
}
.pdf-exporting .report-overview-top {
  margin-bottom: 5px !important;
}
.pdf-exporting .report-experiment-title {
  margin-bottom: 7px !important;
}
.pdf-exporting .info-grid {
  gap: 8px !important;
  margin-top: 6px !important;
}
.pdf-exporting .info-card {
  padding: 6px 8px !important;
}
.pdf-exporting .summary-card {
  padding: 6px 8px !important;
  gap: 4px !important;
}
.pdf-exporting h1 {
  font-size: 19px !important;
}
.pdf-exporting h2 {
  font-size: 14px !important;
}
.pdf-exporting h3,
.pdf-exporting .summary-sub-section h3 {
  font-size: 11px !important;
}
.pdf-exporting .summary-sub-section p,
.pdf-exporting .summary-list,
.pdf-exporting th,
.pdf-exporting td {
  font-size: 10px !important;
}
.pdf-exporting .report-logo,
.pdf-exporting .report-logo--virtual-labs,
.pdf-exporting .report-logo--iit {
  max-height: 54px !important;
}
.pdf-exporting .summary-sub-section h3 {
  margin-bottom: 3px !important;
}
.pdf-exporting .summary-sub-section p,
.pdf-exporting .conclusion-text {
  line-height: 1.34 !important;
}
.pdf-exporting .summary-list li {
  margin-bottom: 1px !important;
}
.pdf-exporting .calc-formula {
  padding: 4px 8px !important;
}
.pdf-exporting .param-grid {
  grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
  gap: 7px !important;
  margin-top: 6px !important;
}
.pdf-exporting .param-card {
  padding: 6px 9px !important;
}
.pdf-exporting .param-card .param-value {
  font-size: 13px !important;
}
.pdf-exporting .results-stack {
  grid-template-columns: minmax(0, 1fr) !important;
  gap: 8px !important;
}
.pdf-exporting .results-card {
  padding: 9px 10px !important;
  gap: 5px !important;
}
.pdf-exporting th,
.pdf-exporting td {
  padding: 6px 8px !important;
}
.pdf-exporting .calc-block {
  padding: 7px 9px !important;
  gap: 3px !important;
}
.pdf-exporting .report-footer {
  margin-top: 8px !important;
  padding-top: 7px !important;
}
@media (max-width: 768px) {
  body {
    padding: 16px 14px 24px;
  }
  .report-page {
    margin-bottom: 14px;
    padding: 16px 16px;
  }
  .header-row {
    grid-template-columns: 1fr;
    gap: 12px;
    text-align: center;
  }
  .report-title-block {
    padding-bottom: 10px;
  }
  .report-logo,
  .report-logo--virtual-labs,
  .report-logo--iit {
    max-height: 64px;
    justify-self: center;
  }
  .report-actions {
    justify-content: center;
  }
  .results-stack {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media print {
  @page {
    size: A4;
    margin: 8mm;
  }
  .print-btn,
  .download-btn,
  .report-actions {
    display: none;
  }
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-size: 10.5px;
    line-height: 1.25;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .report-page {
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    box-shadow: none;
    border-radius: 0;
    break-inside: avoid-page;
    page-break-inside: avoid;
  }
  .header-row {
    grid-template-columns: 150px minmax(0, 1fr) 86px;
    gap: 14px;
    margin-bottom: 5px;
  }
  .report-title-block {
    padding-bottom: 6px;
  }
  .section {
    padding: 7px 9px;
    margin-bottom: 5px;
  }
  .section > h2:first-child {
    margin-bottom: 7px;
    padding-bottom: 5px;
  }
  .report-overview-top {
    margin-bottom: 5px;
  }
  .report-experiment-title {
    margin-bottom: 7px;
  }
  .info-grid {
    gap: 8px;
    margin-top: 6px;
  }
  .info-card {
    padding: 6px 8px;
  }
  .summary-card {
    padding: 6px 8px;
    gap: 4px;
  }
  h1 {
    font-size: 19px;
  }
  h2 {
    font-size: 14px;
  }
  h3,
  .summary-sub-section h3 {
    font-size: 11px;
  }
  .summary-sub-section p,
  .summary-list,
  th,
  td {
    font-size: 10px;
  }
  .report-logo,
  .report-logo--virtual-labs,
  .report-logo--iit {
    max-height: 54px;
  }
  .summary-sub-section h3 {
    margin-bottom: 3px;
  }
  .summary-sub-section p,
  .conclusion-text {
    line-height: 1.34;
  }
  .summary-list li {
    margin-bottom: 1px;
  }
  .calc-formula {
    padding: 4px 8px;
  }
  .param-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 7px;
    margin-top: 6px;
  }
  .param-card {
    padding: 6px 9px;
  }
  .param-card .param-value {
    font-size: 13px;
  }
  .results-stack {
    gap: 8px;
  }
  .results-card {
    padding: 9px 10px;
    gap: 5px;
  }
  th,
  td {
    padding: 6px 8px;
  }
  .calc-block {
    padding: 7px 9px;
    gap: 3px;
  }
  .report-footer {
    margin-top: 8px;
    padding-top: 7px;
  }
  .header-row,
  .results-card,
  .table-shell,
  table,
  .calc-block,
  .info-grid,
  .summary-sub-section,
  thead,
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
  `

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(REPORT_CONTENT.documentTitle)}</title>
  <style>${css}</style>
</head>
<body id="report-root">
  <main class="report-document" id="report-document">

    <div class="report-page">

      <div class="header-row">
        <img
          src="${escapeHtml(virtualLabsLogoSrc)}"
          class="report-logo report-logo--virtual-labs"
          alt="Virtual Labs logo"
        >
        <div class="report-title-block">
          <h1>${escapeHtml(REPORT_CONTENT.reportHeading)}</h1>
        </div>
        <img
          src="${escapeHtml(iitLogoSrc)}"
          class="report-logo report-logo--iit"
          alt="Indian Institute of Technology Roorkee logo"
        >
      </div>

      <div class="section report-overview">
        <div class="report-overview-top">
          <p class="badge">${escapeHtml(REPORT_CONTENT.labName)}</p>
          <p class="report-stamp">Generated on ${escapeHtml(reportDateText)}</p>
        </div>
        <p class="report-experiment-label">Experiment Title</p>
        <p class="report-experiment-title">${escapeHtml(REPORT_CONTENT.experimentTitle)}</p>
        <div class="info-grid">
          <div class="info-card">
            <span class="label">Start Time:</span>
            <strong>${escapeHtml(startTimeText)}</strong>
          </div>
          <div class="info-card">
            <span class="label">End Time:</span>
            <strong>${escapeHtml(endTimeText)}</strong>
          </div>
          <div class="info-card">
            <span class="label">Total Time Spent:</span>
            <strong>${escapeHtml(durationText)}</strong>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Experiment Summary</h2>
        <div class="summary-card">
          <div class="summary-sub-section">
            <h3>Aim</h3>
            <p>${escapeHtml(REPORT_CONTENT.aim)}</p>
          </div>

          <div class="summary-sub-section">
            <h3>Simulation Summary</h3>
            <p>${formatReportText(REPORT_CONTENT.simulationSummary)}</p>
          </div>

          <div class="summary-sub-section" style="margin-bottom: 0;">
            <h3>Apparatus Used</h3>
            <div class="apparatus-grid">
              ${REPORT_CONTENT.apparatus.map((column) => `
                <ul class="summary-list">
                  ${column.map((item) => `<li>${formatReportText(item)}</li>`).join('')}
                </ul>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Results</h2>

        <div class="results-stack">

          <div class="results-card results-card--observations">
            <h3>Observation Table</h3>
            <div class="table-shell">
              <table>
                <thead>
                  <tr>
                    <th colspan="2">V<sub>OC</sub> (V): ${formatReportReading(reportOpenCircuitVoltage)}</th>
                    <th colspan="2">I<sub>SC</sub> (mA): ${formatReportReading(reportShortCircuitCurrent)}</th>
                  </tr>
                  <tr>
                    <th>S.No.</th>
                    <th>Voltage (V)</th>
                    <th>Current (mA)</th>
                    <th>P<sub>max</sub> (mW)</th>
                  </tr>
                </thead>
                <tbody>
                  ${observationRows}
                </tbody>
              </table>
            </div>
            ${reportGraph}
          </div>

          <div class="results-card">
            <h3>Theoretical Calculations</h3>
            <div class="calc-block">
              <div class="calc-row">
                <span class="calc-label">Fill Factor:</span>
                <span class="calc-value">${formatReportReading(fillFactor)}%</span>
              </div>
            </div>
          </div>
          <div class="results-card">
            <h3>Conclusion</h3>
            <p class="conclusion-text">
              ${escapeHtml(REPORT_CONTENT.conclusion)}
            </p>
          </div>

        </div>
      </div>

      <footer class="report-footer">${escapeHtml(REPORT_CONTENT.footer)}</footer>

    </div>

  </main>

  <div class="report-actions" data-html2canvas-ignore="true">
    <button class="print-btn" type="button" onclick="window.print()">PRINT</button>
    <button class="download-btn" type="button" onclick="downloadReport()">DOWNLOAD REPORT</button>
  </div>

  <script>
    function ensureHtml2Pdf() {
      function loadScript(source, isReady) {
        if (isReady()) {
          return Promise.resolve();
        }

        return new Promise(function(resolve, reject) {
        var script = document.createElement('script');
          script.src = source;
          script.onload = function() {
            if (isReady()) {
              resolve();
              return;
            }

            reject(new Error('The PDF dependency did not initialize.'));
          };
        script.onerror = reject;
        document.head.appendChild(script);
        });
      }

      return Promise.all([
        loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
          function() { return Boolean(window.html2canvas); }
        ),
        loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
          function() { return Boolean(window.jspdf && window.jspdf.jsPDF); }
        )
      ]);
    }

    function downloadReport() {
      ensureHtml2Pdf().then(function() {
        var reportPage = document.querySelector('.report-page');

        if (!window.html2canvas || !window.jspdf || !window.jspdf.jsPDF || !reportPage) {
          throw new Error('The one-page PDF renderer is unavailable.');
        }

        var pageWidth = 210;
        var pageHeight = 297;
        var pageMargin = 8;
        var availableWidth = pageWidth - (pageMargin * 2);
        var availableHeight = pageHeight - (pageMargin * 2);
        var pdf = new window.jspdf.jsPDF({
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        });

        document.body.classList.add('pdf-exporting');

        return window.html2canvas(reportPage, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0
        }).then(function(canvas) {
          var widthScale = availableWidth / canvas.width;
          var heightScale = availableHeight / canvas.height;
          var renderScale = Math.min(widthScale, heightScale);
          var renderWidth = canvas.width * renderScale;
          var renderHeight = canvas.height * renderScale;
          var renderX = (pageWidth - renderWidth) / 2;

          pdf.addImage(
            canvas.toDataURL('image/jpeg', 0.98),
            'JPEG',
            renderX,
            pageMargin,
            renderWidth,
            renderHeight
          );
        }).then(function() {
          pdf.save('thevenin-simulation-report.pdf');
        }).finally(function() {
          document.body.classList.remove('pdf-exporting');
        });
      }).catch(function(error) {
        document.body.classList.remove('pdf-exporting');
        console.error('Unable to generate the report PDF.', error);
        alert('Unable to download the report automatically. Please use your browser\\'s Save as PDF option.');
      });
    }
  </script>
</body>
</html>
  `

  const reportBlob = new Blob([html], { type: 'text/html' })
  const reportUrl = URL.createObjectURL(reportBlob)
  const reportWindow = window.open(reportUrl, '_blank')

  if (!reportWindow) {
    URL.revokeObjectURL(reportUrl)
    window.alert('Unable to open report window.')
    return false
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(reportUrl)
  }, 60000)

  reportWindow.focus()

  return true
}
