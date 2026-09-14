import { useEffect, useState } from 'react'
import ElectricalText from './ElectricalText.jsx'
import PowerLoadGraph from './PowerLoadGraph.jsx'
import {
  formatCompactNumber,
  formatFixedNumber,
} from '../utils/numberFormat.js'

const INPUT_TOLERANCES = {
  rth: 0.005,
  vth: 0.005,
}

const INPUT_RANGES = {
  rth: { min: 0, max: 1000 },
  vth: { min: 0, max: 100 },
}

const COMPARISON_EPSILON = 1e-9
const DISPLAY_DECIMAL_PLACES = 2
const MAXIMUM_POWER_TOLERANCE_MILLIWATTS = 0.02
const MILLIWATTS_PER_WATT = 1000

const approximatelyEquals = (value, expected, tolerance) => (
  Number.isFinite(expected)
  && Math.abs(value - expected) <= tolerance + COMPARISON_EPSILON
)

const preventMouseWheelAdjustment = (event) => {
  event.currentTarget.blur()
}

const getLoadPowerMilliwatts = (observation) => {
  const loadCurrentAmperes = Number(observation?.il)
  const loadResistanceOhms = Number(observation?.rl)

  if (
    !Number.isFinite(loadCurrentAmperes)
    || !Number.isFinite(loadResistanceOhms)
  ) {
    return null
  }

  return (loadCurrentAmperes ** 2) * loadResistanceOhms * 1000
}

const CalculationPanel = ({
  calculationDone,
  calculatedValues,
  observations,
  onGuideEvent,
  setUserCalculatedPmax,
  setVerificationResult,
}) => {
  const r1 = calculatedValues?.r1 ?? ''
  const r2 = calculatedValues?.r2 ?? ''
  const r3 = calculatedValues?.r3 ?? ''
  const voltageSource = calculatedValues?.voltageSource ?? ''
  const [theveninInputs, setTheveninInputs] = useState({
    rth: '',
    vth: '',
  })
  const [incorrectInputs, setIncorrectInputs] = useState({
    rth: false,
    vth: false,
  })
  const missingInputKeys = Object.entries(theveninInputs)
    .filter(([, value]) => value.trim() === '')
    .map(([parameter]) => parameter)
  const enteredRthOhms = Number(theveninInputs.rth)
  const enteredVth = Number(theveninInputs.vth)
  const inputsAreValid = (
    missingInputKeys.length === 0
    && Number.isFinite(enteredVth)
    && Number.isFinite(enteredRthOhms)
    && enteredRthOhms !== 0
  )
  const calculatedMaximumPowerMilliwatts = inputsAreValid
    ? ((enteredVth ** 2) / (4 * enteredRthOhms)) * MILLIWATTS_PER_WATT
    : null
  const calculatedMaximumPowerDisplay = (
    calculatedMaximumPowerMilliwatts === null
      ? ''
      : formatFixedNumber(
          calculatedMaximumPowerMilliwatts,
          DISPLAY_DECIMAL_PLACES,
        )
  )
  const maximumObservedLoadPowerMilliwatts = observations.reduce(
    (maximumPower, observation) => {
      const loadPowerMilliwatts = getLoadPowerMilliwatts(observation)

      return loadPowerMilliwatts === null
        ? maximumPower
        : Math.max(maximumPower, loadPowerMilliwatts)
    },
    Number.NEGATIVE_INFINITY,
  )
  const maximumObservedLoadPowerDisplay = Number.isFinite(
    maximumObservedLoadPowerMilliwatts,
  )
    ? formatFixedNumber(
        maximumObservedLoadPowerMilliwatts,
        DISPLAY_DECIMAL_PLACES,
      )
    : ''
  const maximumPowerMatchesObservation = (
    calculatedMaximumPowerDisplay !== ''
    && maximumObservedLoadPowerDisplay !== ''
    && Math.abs(
      Number(calculatedMaximumPowerDisplay)
      - Number(maximumObservedLoadPowerDisplay)
    ) <= MAXIMUM_POWER_TOLERANCE_MILLIWATTS + COMPARISON_EPSILON
  )

  useEffect(() => {
    setUserCalculatedPmax(calculatedMaximumPowerDisplay)
  }, [calculatedMaximumPowerDisplay, setUserCalculatedPmax])

  const handleTheveninInputChange = (parameter, value) => {
    const { min, max } = INPUT_RANGES[parameter]
    const numericValue = Number(value)

    if (
      value !== ''
      && (
        !Number.isFinite(numericValue)
        || numericValue < min
        || numericValue > max
      )
    ) {
      return
    }

    setTheveninInputs((current) => ({
      ...current,
      [parameter]: value,
    }))
    setIncorrectInputs((current) => ({
      ...current,
      [parameter]: false,
    }))
    setVerificationResult('')
  }

  const handleTheveninInputBlur = (parameter) => {
    setTheveninInputs((current) => {
      const currentValue = current[parameter]

      if (currentValue.trim() === '') return current

      const numericValue = Number(currentValue)

      if (!Number.isFinite(numericValue)) return current

      return {
        ...current,
        [parameter]: formatCompactNumber(
          numericValue,
          DISPLAY_DECIMAL_PLACES,
        ),
      }
    })
  }

  const handleVerify = () => {
    if (!calculationDone) return

    if (missingInputKeys.length > 0) {
      const onlyOneValueIsMissing = missingInputKeys.length === 1

      onGuideEvent?.({
        alertType: 'warning',
        description: onlyOneValueIsMissing
          ? 'Please enter the required value, then click the “Verify” button to verify the theorem.'
          : 'Please enter all the values, then click the “Verify” button to verify the theorem.',
        missingCount: missingInputKeys.length,
        target: '#calculation-panel',
        title: 'Input Required',
        type: 'CALCULATION_INPUT_REQUIRED',
      })
      return
    }

    const expectedVth = Number(calculatedValues?.vth)
    const expectedRthOhms = Number(calculatedValues?.rth)
    const nextIncorrectInputs = {
      rth: (
        !Number.isFinite(enteredRthOhms)
        || !approximatelyEquals(
          enteredRthOhms,
          expectedRthOhms,
          INPUT_TOLERANCES.rth,
        )
      ),
      vth: (
        !Number.isFinite(enteredVth)
        || !approximatelyEquals(
          enteredVth,
          expectedVth,
          INPUT_TOLERANCES.vth,
        )
      ),
    }
    const isCorrect = (
      !Object.values(nextIncorrectInputs).some(Boolean)
      && maximumPowerMatchesObservation
    )

    setIncorrectInputs(nextIncorrectInputs)
    onGuideEvent?.({
      isCorrect,
      type: 'VERIFICATION_RESULT',
    })
    setVerificationResult(
      isCorrect
        ? `✅ Verified Successfully: Pmax (${calculatedMaximumPowerDisplay} mW) agrees with the maximum PL (${maximumObservedLoadPowerDisplay} mW) within ${MAXIMUM_POWER_TOLERANCE_MILLIWATTS.toFixed(2)} mW.`
        : '❌ Incorrect Calculation',
    )
  }

  const renderCircuitValue = (label, value, unit) => (
    <div className="maximum-power-parameter">
      <span className="maximum-power-parameter__label">{label}</span>
      <output className="maximum-power-parameter__value">
        {calculationDone && value !== ''
          ? formatCompactNumber(value, DISPLAY_DECIMAL_PLACES)
          : ''}
      </output>
      <span className="maximum-power-parameter__unit">{unit}</span>
    </div>
  )

  return (
    <section className="maximum-power-results" id="maximum-power-results">
      <PowerLoadGraph observations={observations} />

      <section className="analysis-card theoretical-calculation-panel" id="calculation-panel">
        <header className="analysis-card__heading">
          <h2>THEORETICAL VERIFICATION</h2>
        </header>

        <div className="theoretical-calculation-panel__body">
          <section className="maximum-power-values-card">
            <div className="maximum-power-values-card__section">
              <h3>Resistance Values</h3>
              <div className="maximum-power-values-card__resistances">
                {renderCircuitValue(<ElectricalText text="R1:" />, r1, 'Ω')}
                {renderCircuitValue(<ElectricalText text="R2:" />, r2, 'Ω')}
                {renderCircuitValue(<ElectricalText text="R3:" />, r3, 'Ω')}
              </div>
            </div>

            <div className="maximum-power-values-card__section maximum-power-values-card__source">
              <h3>Source Value</h3>
              <div>
                {renderCircuitValue('Voltage Source:', voltageSource, 'V')}
              </div>
            </div>
          </section>

          <section className="maximum-power-formula-card">
            <h3>Maximum Power</h3>
            <div
              aria-label="Maximum load power equals Thevenin voltage squared divided by four times Thevenin resistance"
              className="maximum-power-equation"
            >
              <span className="maximum-power-equation__lead">
                P<sub>L,max</sub> =
              </span>

              <div className="maximum-power-equation__fraction">
                <label className="maximum-power-equation__term maximum-power-equation__numerator">
                  <span
                    aria-hidden="true"
                    className="maximum-power-equation__voltage-symbol"
                  >
                    V<sup>2</sup><sub>TH</sub>
                  </span>
                  <input
                    aria-label="Enter Thevenin voltage in volts"
                    aria-invalid={incorrectInputs.vth}
                    className={`maximum-power-input${incorrectInputs.vth ? ' maximum-power-input--error' : ''}`}
                    disabled={!calculationDone}
                    max={INPUT_RANGES.vth.max}
                    min={INPUT_RANGES.vth.min}
                    onBlur={() => handleTheveninInputBlur('vth')}
                    onChange={(event) => handleTheveninInputChange('vth', event.target.value)}
                    onWheel={preventMouseWheelAdjustment}
                    placeholder="Enter Value"
                    step="any"
                    title="Enter VTH from 0 to 100 volts"
                    type="number"
                    value={theveninInputs.vth}
                  />
                  <span className="maximum-power-equation__unit">V</span>
                </label>

                <div className="maximum-power-equation__denominator">
                  <span>4 ×</span>
                  <label className="maximum-power-equation__term">
                    <ElectricalText text="Rth" />
                    <input
                      aria-label="Enter Thevenin resistance in ohms"
                      aria-invalid={incorrectInputs.rth}
                      className={`maximum-power-input${incorrectInputs.rth ? ' maximum-power-input--error' : ''}`}
                      disabled={!calculationDone}
                      max={INPUT_RANGES.rth.max}
                      min={INPUT_RANGES.rth.min}
                      onBlur={() => handleTheveninInputBlur('rth')}
                      onChange={(event) => handleTheveninInputChange('rth', event.target.value)}
                      onWheel={preventMouseWheelAdjustment}
                      placeholder="Enter Value"
                      step="any"
                      title="Enter RTH from 0 to 1000 ohms"
                      type="number"
                      value={theveninInputs.rth}
                    />
                    <span className="maximum-power-equation__unit">Ω</span>
                  </label>
                </div>
              </div>

              <span className="maximum-power-equation__equals">=</span>
              <output
                aria-label="Calculated maximum power in milliwatts"
                className="maximum-power-result"
              >
                {calculatedMaximumPowerDisplay}
              </output>
              <span className="maximum-power-equation__result-unit">mW</span>
            </div>
          </section>

          <div className="maximum-power-verification">
            <button
              className="verify-btn"
              disabled={!calculationDone}
              onClick={handleVerify}
              type="button"
            >
              Verify
            </button>
          </div>
        </div>
      </section>
    </section>
  )
}

export default CalculationPanel
