import { RESISTANCE_SLIDER_CONFIG } from '../utils/resistance.js'

const ResistanceSlider = ({
  disabled = false,
  label,
  maxPosition,
  minPosition,
  onChange,
  onDisabledInteraction,
  onValueReached,
  value,
}) => {
  const config = RESISTANCE_SLIDER_CONFIG.load
  const discreteValues = config.values ?? null

  const normalizeResistance = (inputValue) => {
    const number = Number(inputValue)

    if (discreteValues) {
      return discreteValues.reduce((closest, option) => (
        Math.abs(option - number) < Math.abs(closest - number)
          ? option
          : closest
      ), discreteValues[0])
    }

    const bounded = Math.min(
      Math.max(
        Number.isFinite(number) ? number : config.min,
        config.min,
      ),
      config.max,
    )

    return bounded
  }

  const sliderValue = normalizeResistance(value)
  const sliderPosition = discreteValues
    ? discreteValues.indexOf(normalizeResistance(sliderValue))
    : sliderValue
  const sliderMin = discreteValues ? 0 : config.min
  const sliderMax = discreteValues ? discreteValues.length - 1 : config.max
  const sliderStep = discreteValues ? 1 : config.step

  const getBoundedPosition = (inputPosition) => {
    const numericPosition = Number(inputPosition)

    return Math.min(
      Math.max(
        Number.isFinite(numericPosition) ? numericPosition : sliderMin,
        minPosition ?? sliderMin,
      ),
      maxPosition ?? sliderMax,
    )
  }

  const getValueAtPosition = (inputPosition) => {
    const boundedPosition = getBoundedPosition(inputPosition)

    return discreteValues
      ? discreteValues[boundedPosition]
      : normalizeResistance(boundedPosition)
  }

  return (
    <div className={`resistance-slider ${disabled ? 'resistance-slider--locked' : ''}`}>
      {disabled && onDisabledInteraction ? (
        <button
          aria-label={`${label} resistance is locked`}
          className="resistance-slider__lock-overlay"
          onClick={onDisabledInteraction}
          type="button"
        />
      ) : null}

      <label className="resistance-slider__label" htmlFor={`${label}-slider`}>
        {label.slice(0, 1)}
        <sub>{label.slice(1)}</sub> (&Omega;)
      </label>

      <div className="resistance-slider__control">
        <input
          aria-label={`${label} resistance`}
          aria-valuetext={`${sliderValue} ohms`}
          className="resistance-slider__input"
          disabled={disabled}
          id={`${label}-slider`}
          max={sliderMax}
          min={sliderMin}
          onChange={(event) => {
  const newValue = getValueAtPosition(event.target.value)

  onChange(newValue)

  if (label === 'RL' && Number(newValue) === 100) {
    onValueReached?.(100)
  }
}}
          step={sliderStep}
          type="range"
          value={sliderPosition}
        />
      </div>

      <span className="resistance-slider__value">
        {sliderValue}
      </span>
    </div>
  )
}

export default ResistanceSlider
