import { Fragment } from 'react'

const SYMBOL_PARTS = {
  il: ['I', 'L'],
  r1: ['R', '1'],
  r2: ['R', '2'],
  r3: ['R', '3'],
  rl: ['R', 'L'],
  rth: ['R', 'TH'],
  vs: ['V', 'S'],
  vth: ['V', 'TH'],
}

const ELECTRICAL_SYMBOL_PATTERN = /\b(RTH|VTH|RL|VS|IL|R1|R2|R3)\b/gi

const ElectricalText = ({ text }) => {
  if (typeof text !== 'string') {
    return text ?? null
  }

  return text.split(ELECTRICAL_SYMBOL_PATTERN).map((part, index) => {
    const symbol = SYMBOL_PARTS[part.toLowerCase()]

    if (!symbol) {
      return part
    }

    return (
      <Fragment key={`${part}-${index}`}>
        {symbol[0]}<sub>{symbol[1]}</sub>
      </Fragment>
    )
  })
}

export default ElectricalText
