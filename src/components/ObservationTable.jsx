import SectionCard from './SectionCard.jsx'
import { amperesToMilliamperes } from '../utils/current.js'
import { formatCompactNumber } from '../utils/numberFormat.js'
import { LOAD_RESISTANCE_VALUES } from '../utils/resistance.js'

const OBSERVATION_ROW_COUNT = LOAD_RESISTANCE_VALUES.length
const DISPLAY_DECIMAL_PLACES = 2
const emptyRows = Array.from({ length: OBSERVATION_ROW_COUNT })

const ObservationTable = ({ observations }) => {
  const summary = observations[0]
  const openCircuitVoltage = typeof summary?.vth === 'number'
    ? summary.vth
    : null
  const shortCircuitObservation = observations.find((row) => (
    row?.rl === 0 && typeof row?.il === 'number'
  ))
  const shortCircuitCurrentMilliamperes = shortCircuitObservation
    ? amperesToMilliamperes(shortCircuitObservation.il)
    : null

  return (
    <SectionCard className="observation-table-card" icon="table" id="observation-table-panel" title="OBSERVATION TABLE">
      <div className="observation-table-wrap">
        <table className="observation-table observation-table--load">
          <caption className="sr-only">Open-circuit voltage, short-circuit current, voltage, current, and power readings</caption>
          <thead>
            <tr className="observation-table__group-headings">
              <th colSpan="2">
                V<sub>OC</sub> (V)
                {openCircuitVoltage !== null ? `: ${formatCompactNumber(openCircuitVoltage, DISPLAY_DECIMAL_PLACES)}` : ''}
              </th>
              <th colSpan="2">
                I<sub>SC</sub> (mA)
                {shortCircuitCurrentMilliamperes !== null ? `: ${formatCompactNumber(shortCircuitCurrentMilliamperes, DISPLAY_DECIMAL_PLACES)}` : ''}
              </th>
            </tr>
            <tr className="observation-table__column-headings">
              <th>S.No.</th>
              <th>Voltage (V)</th>
              <th>Current (I) mA</th>
              <th>Power (P)</th>
            </tr>
          </thead>
          <tbody>
            {emptyRows.map((_, index) => {
              const row = observations[index]
              const hasLoadReading = typeof row?.il === 'number'
              const loadVoltage = hasLoadReading && typeof row?.rl === 'number'
                ? row.il * row.rl
                : null
              const loadPowerMilliwatts = hasLoadReading && typeof row?.rl === 'number'
                ? (row.il ** 2) * row.rl * 1000
                : null

              return (
                <tr key={index}>
                  <td>{hasLoadReading ? row?.id : ''}</td>
                  <td>{loadVoltage !== null ? formatCompactNumber(loadVoltage, DISPLAY_DECIMAL_PLACES) : ''}</td>
                  <td>{hasLoadReading ? formatCompactNumber(amperesToMilliamperes(row.il), DISPLAY_DECIMAL_PLACES) : ''}</td>
                  <td>{loadPowerMilliwatts !== null ? formatCompactNumber(loadPowerMilliwatts, DISPLAY_DECIMAL_PLACES) : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

export default ObservationTable
