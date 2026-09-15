import Ammeter from './Ammeter.jsx'
import Voltmeter from './Voltmeter.jsx'
import bulbOffImage from '../assets/BulbOff.png'
import solarPanelImage from '../assets/SolarPanel.png'
import switchOffImage from '../assets/switchoff.png'
import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'

const EquipmentPanel = ({
  connectedTerminalIds = [],
  experimentCase,
  highlightedTerminalIds = [],
  observationIl = null,
  observationVth = null,
  powerOn,
  readings,
}) => {
  const voltmeterConnected = ['3-endpoint', '4-endpoint'].every((terminalId) => (
    connectedTerminalIds.includes(terminalId)
  ))
  const ammeterConnected = ['5-endpoint', '6-endpoint'].every((terminalId) => (
    connectedTerminalIds.includes(terminalId)
  ))
  const hasObservationIl = (
    typeof observationIl === 'number'
    && Number.isFinite(observationIl)
  )
  const hasObservationVth = (
    typeof observationVth === 'number'
    && Number.isFinite(observationVth)
  )
  const voltmeterValue = (
    powerOn && experimentCase === 2
      ? readings.vth
      : (hasObservationVth ? observationVth : 0)
  )
  const ammeterValue = (
    powerOn && experimentCase === 3
      ? readings.il
      : (hasObservationIl ? observationIl : 0)
  )

  return (
    <section className="equipment-panel" id="equipment-panel">
      <img
        alt="Bulb switched off"
        className="equipment-panel__bulb-image"
        draggable="false"
        src={bulbOffImage}
      />
      <img
        alt="Switch in the off position"
        className="equipment-panel__switch-image"
        draggable="false"
        src={switchOffImage}
      />
      <div className="equipment-panel__meters">
        <Voltmeter
          connectedTerminalIds={connectedTerminalIds}
          highlightedTerminalIds={highlightedTerminalIds}
          value={voltmeterConnected ? voltmeterValue : 0}
        />
        <Ammeter
          connectedTerminalIds={connectedTerminalIds}
          highlightedTerminalIds={highlightedTerminalIds}
          label="A1"
          value={ammeterConnected ? ammeterValue : 0}
        />
      </div>

      <div className="equipment-panel__solar">
        <img
          alt="Solar panel"
          className="equipment-panel__solar-image"
          draggable="false"
          src={solarPanelImage}
        />

        <span
          id="1-endpoint"
          className={`connection-terminal connection-terminal--solar connection-terminal--endpoint-1${getTerminalConnectedClass(connectedTerminalIds, '1-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '1-endpoint')}`}
          data-polarity="plus"
          aria-label="Solar panel positive terminal 1"
          title="Drag to connect terminal 1"
        />
        <span
          className={`terminal-number-label terminal-number-label--solar terminal-number-label--endpoint-1${getTerminalNumberHighlightClass(highlightedTerminalIds, '1-endpoint')}`}
          data-terminal-id="1-endpoint"
          title="Terminal 1. Click to disconnect."
        >
          1
        </span>

        <span
          id="2-endpoint"
          className={`connection-terminal connection-terminal--solar connection-terminal--endpoint-2${getTerminalConnectedClass(connectedTerminalIds, '2-endpoint')}${getTerminalHighlightClass(highlightedTerminalIds, '2-endpoint')}`}
          data-polarity="minus"
          aria-label="Solar panel negative terminal 2"
          title="Drag to connect terminal 2"
        />
        <span
          className={`terminal-number-label terminal-number-label--solar terminal-number-label--endpoint-2${getTerminalNumberHighlightClass(highlightedTerminalIds, '2-endpoint')}`}
          data-terminal-id="2-endpoint"
          title="Terminal 2. Click to disconnect."
        >
          2
        </span>
      </div>
    </section>
  )
}


export default EquipmentPanel
