export const DIAL_START_ANGLE = -90
export const DIAL_SWEEP_ANGLE = 180

export const getMeterNeedleAngle = ({
  maxValue,
  startAngle = DIAL_START_ANGLE,
  sweepAngle = DIAL_SWEEP_ANGLE,
  value,
}) => {
  const numericValue = Number(value)
  const numericMaxValue = Number(maxValue)
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0

  if (!Number.isFinite(numericMaxValue) || numericMaxValue <= 0) {
    return startAngle
  }

  const ratio = Math.min(Math.max(safeValue / numericMaxValue, 0), 1)

  return startAngle + ratio * sweepAngle
}
