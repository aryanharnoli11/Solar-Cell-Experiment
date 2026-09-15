import voltmeterImg from '../assets/Voltmeter.png'
import needleImg from '../assets/needle.png'
import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'
import { getMeterNeedleAngle } from '../utils/meterScale.js'

// Match the 0-50 V scale printed on the voltmeter artwork.
const METER_MAX_VOLTAGE = 50

const Voltmeter = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  value = 0,
}) => {
  const numericValue = Number(value)
  const vth = Number.isFinite(numericValue)
    ? Number(numericValue.toFixed(2))
    : 0
  const displayVoltage = vth > 0 ? vth : 0
  const angle = getMeterNeedleAngle({
    maxValue: METER_MAX_VOLTAGE,
    value: displayVoltage,
  })

  return (
    <article
      className="ammeter ammeter--voltmeter"
      id="voltmeter"
      aria-label={`Voltmeter reading ${displayVoltage.toFixed(2)} volts`}
    >
      <img
        src={voltmeterImg}
        alt="Voltmeter"
        className="ammeter__image"
      />

      <span
        id="3-endpoint"
className={`connection-terminal connection-terminal--meter connection-terminal--meter-plus connection-terminal--endpoint-3${getTerminalConnectedClass(connectedTerminalIds, '3-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '3-endpoint')}`}
        data-polarity="plus"
        aria-label="Voltmeter positive terminal 3"
      />

      <span
className={`terminal-number-label terminal-number-label--meter-plus terminal-number-label--endpoint-3${getTerminalNumberHighlightClass(highlightedTerminalIds, '3-endpoint')}`}
        data-terminal-id="3-endpoint"
      >
        3
      </span>

      <span
        id="4-endpoint"
className={`connection-terminal connection-terminal--meter connection-terminal--meter-minus connection-terminal--endpoint-4${getTerminalConnectedClass(connectedTerminalIds, '4-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '4-endpoint')}`}
        data-polarity="minus"
        aria-label="Voltmeter negative terminal 4"
      />

      <span
className={`terminal-number-label terminal-number-label--meter-minus terminal-number-label--endpoint-4${getTerminalNumberHighlightClass(highlightedTerminalIds, '4-endpoint')}`}
        data-terminal-id="4-endpoint"
      >
        4
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

export default Voltmeter
