import { useState } from 'react'
import PowerLoadGraph from './PowerLoadGraph.jsx'
import { formatFixedNumber } from '../utils/numberFormat.js'

const INPUT_FIELDS = {
  imp: { label: 'Imp', min: 1, max: 10, unit: 'mA' },
  isc: { label: 'Isc', min: 1, max: 10, unit: 'mA' },
  vmp: { label: 'Vmp', min: 1, max: 10, unit: 'V' },
  voc: { label: 'Voc', min: 1, max: 10, unit: 'V' },
}
const DISPLAY_DECIMAL_PLACES = 2
const MIN_ACCEPTED_FILL_FACTOR = 64
const MAX_ACCEPTED_FILL_FACTOR = 66

const preventMouseWheelAdjustment = (event) => {
  event.currentTarget.blur()
}

const CalculationPanel = ({
  calculationDone,
  observations,
  onGuideEvent,
  setUserCalculatedFillFactor,
  setVerificationResult,
}) => {
  const [solarInputs, setSolarInputs] = useState({
    imp: '',
    isc: '',
    vmp: '',
    voc: '',
  })
  const [fillFactor, setFillFactor] = useState('')
  const [invalidInputs, setInvalidInputs] = useState({
    imp: false,
    isc: false,
    vmp: false,
    voc: false,
  })

  const handleInputChange = (parameter, value) => {
    const numericValue = Number(value)
    const { min, max } = INPUT_FIELDS[parameter]

    if (
      value !== ''
      && (!Number.isFinite(numericValue) || numericValue < min || numericValue > max)
    ) {
      return
    }

    setSolarInputs((current) => ({ ...current, [parameter]: value }))
    setInvalidInputs((current) => ({ ...current, [parameter]: false }))
    setFillFactor('')
    setUserCalculatedFillFactor('')
    setVerificationResult('')
  }

  const renderInput = (parameter) => {
    const field = INPUT_FIELDS[parameter]

    return (
      <label className="fill-factor-input">
        <span className="fill-factor-input__symbol">
          {field.label.charAt(0)}<sub>{field.label.slice(1)}</sub>
        </span>
        <input
          aria-label={`${field.label} in ${field.unit}`}
          aria-invalid={invalidInputs[parameter]}
          className={`maximum-power-input${invalidInputs[parameter] ? ' maximum-power-input--error' : ''}`}
          disabled={!calculationDone}
          max={field.max}
          min={field.min}
          onChange={(event) => handleInputChange(parameter, event.target.value)}
          onWheel={preventMouseWheelAdjustment}
          placeholder="Enter Value"
          step="any"
          type="number"
          value={solarInputs[parameter]}
        />
      </label>
    )
  }

  const handleCalculate = () => {
    if (!calculationDone) return

    const missingInputKeys = Object.entries(solarInputs)
      .filter(([, value]) => value.trim() === '')
      .map(([parameter]) => parameter)

    if (missingInputKeys.length > 0) {
      setInvalidInputs((current) => ({
        ...current,
        ...Object.fromEntries(missingInputKeys.map((parameter) => [parameter, true])),
      }))
      onGuideEvent?.({
        alertType: 'warning',
        description: missingInputKeys.length === 1
          ? 'Please enter the required value, then click the “Calculate” button.'
          : 'Please enter all the values, then click the “Calculate” button.',
        missingCount: missingInputKeys.length,
        target: '#calculation-panel',
        title: 'Input Required',
        type: 'CALCULATION_INPUT_REQUIRED',
      })
      return
    }

    const vmp = Number(solarInputs.vmp)
    const imp = Number(solarInputs.imp)
    const isc = Number(solarInputs.isc)
    const voc = Number(solarInputs.voc)

    if (isc === 0 || voc === 0) {
      setInvalidInputs((current) => ({
        ...current,
        isc: isc === 0,
        voc: voc === 0,
      }))
      onGuideEvent?.({
        alertType: 'warning',
        description: 'Isc and Voc must be greater than zero to calculate the fill factor.',
        target: '#calculation-panel',
        title: 'Check the Values',
        type: 'CALCULATION_INPUT_INVALID',
      })
      return
    }

    const maximumPower = vmp * imp
    const calculatedFillFactor = (maximumPower / (isc * voc)) * 100
    const fillFactorDisplay = formatFixedNumber(
      calculatedFillFactor,
      DISPLAY_DECIMAL_PLACES,
    )
    const roundedFillFactor = Number(fillFactorDisplay)
    const fillFactorAccepted = (
      roundedFillFactor >= MIN_ACCEPTED_FILL_FACTOR
      && roundedFillFactor <= MAX_ACCEPTED_FILL_FACTOR
    )

    setFillFactor(fillFactorDisplay)

    if (fillFactorAccepted) {
      setUserCalculatedFillFactor(fillFactorDisplay)
      setVerificationResult(
        `✅ Verified Successfully: Fill factor calculated as ${fillFactorDisplay}%.`,
      )
      onGuideEvent?.({ isCorrect: true, type: 'VERIFICATION_RESULT' })
      return
    }

    setUserCalculatedFillFactor('')
    setVerificationResult(
      `Verification Failed: ${fillFactorDisplay}% is outside the accepted 64% to 66% range.`,
    )
    onGuideEvent?.({
      calculatedFillFactor: roundedFillFactor,
      isCorrect: false,
      type: 'VERIFICATION_RESULT',
    })
  }

  return (
    <section className="maximum-power-results" id="maximum-power-results">
      <PowerLoadGraph observations={calculationDone ? observations : []} />

      <section className="analysis-card theoretical-calculation-panel" id="calculation-panel">
        <header className="analysis-card__heading">
          <h2> FILL FACTOR CALCULATION</h2>
        </header>

        <div className="theoretical-calculation-panel__body">
          <section className="fill-factor-card">
            <div
              aria-label="Fill factor equals maximum power divided by short-circuit current multiplied by open-circuit voltage"
              className="fill-factor-definition"
            >
              <span>Fill Factor</span>
              <span>=</span>
              <span className="fill-factor-fraction fill-factor-fraction--compact">
                <span>P<sub>max</sub></span>
                <span>I<sub>sc</sub>&nbsp;× V<sub>oc</sub></span>
              </span>
            </div>

            <div className="fill-factor-calculation">
              <span className="fill-factor-calculation__equals">=</span>
              <span className="fill-factor-fraction">
                <span className="fill-factor-expression">
                  {renderInput('vmp')}
                  <span>×</span>
                  {renderInput('imp')}
                </span>
                <span className="fill-factor-expression">
                  {renderInput('isc')}
                  <span>×</span>
                  {renderInput('voc')}
                </span>
              </span>
              <span className="fill-factor-calculation__times">× 100</span>
              <span>=</span>
              <output className="fill-factor-result" aria-label="Calculated fill factor">
                {fillFactor || ' '}
              </output>
              <span className="fill-factor-result__unit">%</span>
            </div>
          </section>

          <div className="maximum-power-verification">
            <button
              className="verify-btn"
              disabled={!calculationDone}
              onClick={handleCalculate}
              type="button"
            >
              Calculate
            </button>
          </div>
        </div>
      </section>
    </section>
  )
}

export default CalculationPanel
