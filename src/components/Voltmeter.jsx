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
        id="1-endpoint"
className={`connection-terminal connection-terminal--meter connection-terminal--meter-plus connection-terminal--endpoint-1${getTerminalConnectedClass(connectedTerminalIds, '1-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '1-endpoint')}`}
        data-polarity="plus"
        aria-label="Voltmeter positive terminal 1"
      />

      <span
className={`terminal-number-label terminal-number-label--meter-plus terminal-number-label--endpoint-1${getTerminalNumberHighlightClass(highlightedTerminalIds, '1-endpoint')}`}
        data-terminal-id="1-endpoint"
      >
        1
      </span>

      <span
        id="2-endpoint"
className={`connection-terminal connection-terminal--meter connection-terminal--meter-minus connection-terminal--endpoint-2${getTerminalConnectedClass(connectedTerminalIds, '2-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '2-endpoint')}`}
        data-polarity="minus"
        aria-label="Voltmeter negative terminal 2"
      />

      <span
className={`terminal-number-label terminal-number-label--meter-minus terminal-number-label--endpoint-2${getTerminalNumberHighlightClass(highlightedTerminalIds, '2-endpoint')}`}
        data-terminal-id="2-endpoint"
      >
        2
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
