import ammeterImg from '../assets/Ammeter.png'
import needleImg from '../assets/needle.png'
import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'
import { amperesToMilliamperes } from '../utils/current.js'
import { getMeterNeedleAngle } from '../utils/meterScale.js'

// Match the 0-20 mA scale printed on the ammeter artwork.
const METER_MAX_CURRENT_MILLIAMPERES = 20

const ammeterImages = {
  A1: ammeterImg,
}

const terminalNumbers = {
  A1: { positive: 3, negative: 4 },
  A2: { positive: 5, negative: 6 },
  A3: { positive: 7, negative: 8 },
}


const Ammeter = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  label,
  value = 0,
}) => {
  const terminals = terminalNumbers[label]
  const numericValue = Number(value)
  const currentAmperes = Number.isFinite(numericValue) ? numericValue : 0
  const currentMilliamperes = amperesToMilliamperes(currentAmperes)
  const displayCurrentMilliamperes = currentMilliamperes > 0
    ? currentMilliamperes
    : 0
  const angle = getMeterNeedleAngle({
    maxValue: METER_MAX_CURRENT_MILLIAMPERES,
    value: displayCurrentMilliamperes,
  })

  return (
    <article
      className={`ammeter ammeter--${label}`}
      id={`ammeter-${label.toLowerCase()}`}
      aria-label={`${label} ammeter reading ${displayCurrentMilliamperes.toFixed(3)} milliamperes`}
    >
      <img
        src={ammeterImages[label]}
        alt={`${label} ammeter`}
        className="ammeter__image"
      />

      <span
        id={`${terminals.positive}-endpoint`}
className={`connection-terminal connection-terminal--meter connection-terminal--meter-plus connection-terminal--endpoint-${terminals.positive}${getTerminalConnectedClass(connectedTerminalIds, `${terminals.positive}-endpoint`)}${getTerminalHighlightClass(highlightedTerminalIds, `${terminals.positive}-endpoint`)}`}
        data-polarity="plus"
        aria-label={`${label} positive terminal ${terminals.positive}`}
      />
      <span
className={`terminal-number-label terminal-number-label--meter-plus terminal-number-label--endpoint-${terminals.positive}${getTerminalNumberHighlightClass(highlightedTerminalIds, `${terminals.positive}-endpoint`)}`}
        data-terminal-id={`${terminals.positive}-endpoint`}
      >
        {terminals.positive}
      </span>

      <span
        id={`${terminals.negative}-endpoint`}
className={`connection-terminal connection-terminal--meter connection-terminal--meter-minus connection-terminal--endpoint-${terminals.negative}${getTerminalConnectedClass(connectedTerminalIds, `${terminals.negative}-endpoint`)}${getTerminalHighlightClass(highlightedTerminalIds, `${terminals.negative}-endpoint`)}`}
        data-polarity="minus"
        aria-label={`${label} negative terminal ${terminals.negative}`}
      />
      <span
className={`terminal-number-label terminal-number-label--meter-minus terminal-number-label--endpoint-${terminals.negative}${getTerminalNumberHighlightClass(highlightedTerminalIds, `${terminals.negative}-endpoint`)}`}
        data-terminal-id={`${terminals.negative}-endpoint`}
      >
        {terminals.negative}
      </span>

      <div
        className="ammeter__needle"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <img
          src={needleImg}
          alt="Needle"
          className="ammeter__needle-image"
        />
      </div>
    </article>
  )
}

export default Ammeter
