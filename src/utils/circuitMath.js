const toFiniteNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

export const THEVENIN_RESISTANCE_OHMS = 450

export const calculateReadings = ({ voltage, r1, r3, rl }) => {
  const vs = Math.max(toFiniteNumber(voltage), 0)

  const R1 = Math.max(toFiniteNumber(r1), 0)
  const R3 = Math.max(toFiniteNumber(r3), 0)
  const RL = Math.max(toFiniteNumber(rl), 0)

  const rth = THEVENIN_RESISTANCE_OHMS

  const vth =
    (R1 + R3) > 0
      ? vs * (R3 / (R1 + R3))
      : 0

  const il =
    (rth + RL) > 0
      ? vth / (rth + RL)
      : 0

  return {
    rth,
    vth,
    il,
  }
}
