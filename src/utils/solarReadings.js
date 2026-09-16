export const SHORT_CIRCUIT_CURRENT_MILLIAMPERES = 5.6
export const SHORT_CIRCUIT_CURRENT_AMPERES = (
  SHORT_CIRCUIT_CURRENT_MILLIAMPERES / 1000
)

export const OPEN_CIRCUIT_VOLTAGE = 4.42

export const LOAD_MEASUREMENTS = [
  { resistance: 100, voltage: 0.56, current: 5.5 },
  { resistance: 200, voltage: 1.10, current: 5.4 },
  { resistance: 300, voltage: 1.63, current: 5.4 },
  { resistance: 400, voltage: 2.17, current: 5.4 },
  { resistance: 500, voltage: 2.70, current: 5.4 },
  { resistance: 600, voltage: 3.10, current: 5.1 },
  { resistance: 700, voltage: 3.38, current: 4.8 },
  { resistance: 800, voltage: 3.36, current: 4.5 },
  { resistance: 900, voltage: 3.73, current: 4.1},
  { resistance: 1000, voltage: 3.82, current: 3.8 },
].map((reading) => ({
  ...reading,
  power: reading.voltage * reading.current,
}))
