import { useRef } from 'react'
import powerSupplyOff from '../assets/PowerSupply_Off.png'
import powerSupplyOn from '../assets/PowerSupply_ON.png'
import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'
const PowerSupply = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  onTogglePower,
  onVoltageSet,
  powerOn,
  powerToggleLocked = false,
  setVoltage,
  voltage,
  voltageLocked,
}) => {
 const voltageChangedRef = useRef(false)
 const displayedVoltage = powerOn ? `${voltage} V` : ''

const handleVoltageChange = (event) => {
  voltageChangedRef.current = true
  setVoltage(Number(event.target.value))
}

const handleVoltageSet = (event) => {
  if (!voltageChangedRef.current) {
    return
  }

  voltageChangedRef.current = false
  onVoltageSet?.(Number(event.currentTarget.value))
}

const handleVoltageKeyUp = (event) => {
  const adjustmentKeys = [
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'End',
    'Home',
    'PageDown',
    'PageUp',
  ]

  if (adjustmentKeys.includes(event.key)) {
    handleVoltageSet(event)
  }
}

  return (
    <article className="power-supply" id="power-supply">
      <img
        alt={powerOn ? 'Power supply switched on' : 'Power supply switched off'}
        className="power-supply__image"
        src={powerOn ? powerSupplyOn : powerSupplyOff}
      />

     <div className="power-supply__display">{displayedVoltage}</div>

{/* Terminal 7 */}
<span
  id="7-endpoint"
className={`connection-terminal connection-terminal--power connection-terminal--power-plus connection-terminal--endpoint-7${getTerminalConnectedClass(connectedTerminalIds, '7-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '7-endpoint')}`}
  data-polarity="plus"
  aria-label="Power supply positive terminal 7"
/>

<span
className={`terminal-number-label terminal-number-label--power-plus terminal-number-label--endpoint-7${getTerminalNumberHighlightClass(highlightedTerminalIds, '7-endpoint')}`}
  data-terminal-id="7-endpoint"
>
  7
</span>

{/* Terminal 8 */}
<span
  id="8-endpoint"
className={`connection-terminal connection-terminal--power connection-terminal--power-minus connection-terminal--endpoint-8${getTerminalConnectedClass(connectedTerminalIds, '8-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '8-endpoint')}`}
  data-polarity="minus"
  aria-label="Power supply negative terminal 8"
/>

<span
className={`terminal-number-label terminal-number-label--power-minus terminal-number-label--endpoint-8${getTerminalNumberHighlightClass(highlightedTerminalIds, '8-endpoint')}`}
  data-terminal-id="8-endpoint"
>
  8
</span>
     <button
  id="power-toggle-button"
  aria-label={
    powerToggleLocked
      ? 'Power supply must remain on while load readings are being recorded'
      : powerOn
        ? 'Switch power supply off'
        : 'Switch power supply on'
  }
  aria-pressed={powerOn}
  className={`power-supply__button${powerToggleLocked ? ' power-supply__button--disabled' : ''}`}
  disabled={powerToggleLocked}
  onClick={onTogglePower}
  title={
    powerToggleLocked
      ? 'Record all ten load readings before switching the MCB off.'
      : undefined
  }
  type="button"
/>

      <label className="power-supply__control" id="voltage-control">
        <span className="sr-only">Voltage</span>
      <input
  aria-label="Voltage"
  className="voltage-range"
  disabled={!powerOn || voltageLocked}
  id="voltage-slider"
  max="15"
  min="0"
  onChange={handleVoltageChange}
  onKeyUp={handleVoltageKeyUp}
  onPointerUp={handleVoltageSet}
  step="5"
  type="range"
  value={voltage}
/>
      </label>
    </article>
  )
}

export default PowerSupply
