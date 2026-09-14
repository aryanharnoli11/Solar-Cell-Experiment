import SectionCard from './SectionCard.jsx'
import { amperesToMilliamperes } from '../utils/current.js'
import { formatCompactNumber } from '../utils/numberFormat.js'
import { LOAD_RESISTANCE_VALUES } from '../utils/resistance.js'

const OBSERVATION_ROW_COUNT = LOAD_RESISTANCE_VALUES.length
const DISPLAY_DECIMAL_PLACES = 2
const emptyRows = Array.from({ length: OBSERVATION_ROW_COUNT })

const ObservationTable = ({ observations }) => {
  const summary = observations[0]

  return (
    <SectionCard className="observation-table-card" icon="table" id="observation-table-panel" title="OBSERVATION TABLE">
      <div className="observation-table-wrap">
        <table className="observation-table observation-table--load">
          <caption className="sr-only">Thevenin and load readings</caption>
          <thead>
            <tr className="observation-table__group-headings">
              <th colSpan="2">
                R<sub>TH</sub> (&Omega;)
                {typeof summary?.rth === 'number' ? `: ${formatCompactNumber(summary.rth, DISPLAY_DECIMAL_PLACES)}` : ''}
              </th>
              <th colSpan="2">
                V<sub>TH</sub> (V)
                {typeof summary?.vth === 'number' ? `: ${formatCompactNumber(summary.vth, DISPLAY_DECIMAL_PLACES)}` : ''}
              </th>
            </tr>
            <tr className="observation-table__column-headings">
              <th>S.No.</th>
              <th>R<sub>L</sub> (&Omega;)</th>
              <th>I<sub>L</sub> (mA)</th>
              <th>P<sub>L</sub> = I<sub>L</sub><sup>2</sup> &times; R<sub>L</sub> (mW)</th>
            </tr>
          </thead>
          <tbody>
            {emptyRows.map((_, index) => {
              const row = observations[index]
              const hasLoadReading = typeof row?.il === 'number'
              const loadPowerMilliwatts = hasLoadReading && typeof row?.rl === 'number'
                ? (row.il ** 2) * row.rl * 1000
                : null

              return (
                <tr key={index}>
                  <td>{hasLoadReading ? row?.id : ''}</td>
                  <td>{hasLoadReading && typeof row?.rl === 'number' ? formatCompactNumber(row.rl, DISPLAY_DECIMAL_PLACES) : ''}</td>
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
