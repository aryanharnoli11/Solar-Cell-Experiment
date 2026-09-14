import { useState } from 'react'
import { RESISTANCE_SLIDER_CONFIG } from '../utils/resistance.js'

const ResistanceSlider = ({
  disabled = false,
  label,
  maxPosition,
  minPosition,
  onChange,
  onDisabledInteraction,
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

  const [draftValue, setDraftValue] = useState(value)
  const [isEditing, setIsEditing] = useState(false)

  const sliderValue = isEditing ? draftValue : value
  const sliderPosition = discreteValues
    ? discreteValues.indexOf(normalizeResistance(sliderValue))
    : sliderValue
  const sliderMin = discreteValues ? 0 : config.min
  const sliderMax = discreteValues ? discreteValues.length - 1 : config.max
  const sliderStep = discreteValues ? 1 : config.step

  const commitValue = () => {
    const committedValue = normalizeResistance(sliderValue)

    setDraftValue(committedValue)
    setIsEditing(false)
    onChange(committedValue)
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
          onBlur={commitValue}
          onChange={(event) => {
            setIsEditing(true)
            const nextPosition = Number(event.target.value)
            const boundedPosition = discreteValues
              ? Math.min(
                  Math.max(nextPosition, minPosition ?? sliderMin),
                  maxPosition ?? sliderMax,
                )
              : nextPosition

            setDraftValue(
              discreteValues
                ? discreteValues[boundedPosition]
                : boundedPosition,
            )
          }}
          onKeyUp={commitValue}
          onPointerCancel={commitValue}
          onPointerUp={commitValue}
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
