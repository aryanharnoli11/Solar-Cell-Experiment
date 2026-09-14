import Ammeter from './Ammeter.jsx'
import Voltmeter from './Voltmeter.jsx'

const EquipmentPanel = ({
  connectedTerminalIds = [],
  experimentCase,
  highlightedTerminalIds = [],
  observationIl = null,
  observationVth = null,
  powerOn,
  readings,
}) => {
  const voltmeterConnected = ['1-endpoint', '2-endpoint'].every((terminalId) => (
    connectedTerminalIds.includes(terminalId)
  ))
  const ammeterConnected = ['3-endpoint', '4-endpoint'].every((terminalId) => (
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
    </section>
  )
}


export default EquipmentPanel
