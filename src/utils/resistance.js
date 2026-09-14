export const OHMS_PER_KILOHM = 1000

export const LOAD_RESISTANCE_VALUES = [
  0,
  100,
  200,
  300,
  400,
  450,
  550,
  700,
  850,
  1000,
]

export const FIXED_NETWORK_RESISTANCES = {
  r1: 466,
  r2: 216,
  r3: 470,
}

export const RESISTANCE_SLIDER_CONFIG = {
  load: {
    initial: LOAD_RESISTANCE_VALUES[0],
    max: LOAD_RESISTANCE_VALUES.at(-1),
    min: LOAD_RESISTANCE_VALUES[0],
    step: null,
    values: LOAD_RESISTANCE_VALUES,
  },
}

export const ohmsToKilohms = (value) => Number(value) / OHMS_PER_KILOHM

export const kilohmsToOhms = (value) => Number(value) * OHMS_PER_KILOHM

export const formatKilohms = (value, fractionDigits = 1) => (
  ohmsToKilohms(value).toFixed(fractionDigits)
)
