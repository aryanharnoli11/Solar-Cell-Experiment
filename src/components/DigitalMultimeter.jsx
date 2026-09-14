import multimeterImg from '../assets/multimeter.png'
import knobImg from '../assets/knob.png'
import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'
import { formatCompactNumber } from '../utils/numberFormat.js'
const DigitalMultimeter = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  value = 0,
  showValue = false,
}) => {
 const resistance =
  showValue && Number.isFinite(value)
    ? value
    : 0
let knobAngle = 0

if (resistance > 0) {
  if (resistance <= 2)
    knobAngle = 30
  else if (resistance <= 20)
    knobAngle = 60
  else if (resistance <= 200)
    knobAngle = 90
  else if (resistance <= 2000)
    knobAngle = 120
  else
    knobAngle = 150
}
  return (
    <article
      className="ammeter ammeter--multimeter"
      id="multimeter"
      aria-label="Digital Multimeter"
    >
      <img
        src={multimeterImg}
        alt="Digital Multimeter"
        className="ammeter__image"
      />
<div
  className="multimeter-knob"
  
>
 <img
  src={knobImg}
  alt="Knob"
  className="multimeter-knob-image"
  style={{
  transform: `rotate(${knobAngle}deg)`,

}}
/>
</div>
      <span
        id="5-endpoint"
className={`connection-terminal connection-terminal--meter connection-terminal--meter-plus connection-terminal--endpoint-5${getTerminalConnectedClass(connectedTerminalIds, '5-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '5-endpoint')}`}
        data-polarity="plus"
        aria-label="Digital multimeter positive terminal 5"
      />

      <span
className={`terminal-number-label terminal-number-label--meter-plus terminal-number-label--endpoint-5${getTerminalNumberHighlightClass(highlightedTerminalIds, '5-endpoint')}`}
        data-terminal-id="5-endpoint"
      >
        5
      </span>

      <span
        id="6-endpoint"
className={`connection-terminal connection-terminal--meter connection-terminal--meter-minus connection-terminal--endpoint-6${getTerminalConnectedClass(connectedTerminalIds, '6-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '6-endpoint')}`}
        data-polarity="minus"
        aria-label="Digital multimeter negative terminal 6"
      />

      <span
className={`terminal-number-label terminal-number-label--meter-minus terminal-number-label--endpoint-6${getTerminalNumberHighlightClass(highlightedTerminalIds, '6-endpoint')}`}
        data-terminal-id="6-endpoint"
      >
        6
      </span>

<div className="multimeter-display">
  {showValue
    ? `${formatCompactNumber(resistance, 0)} Ω`
    : ''}
</div>
    </article>
  )
}

export default DigitalMultimeter
