import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'
import circuitImage from '../assets/Circuit.png'
import offButtonImage from '../assets/OFFbutton.png'
import onButtonImage from '../assets/ONbutton.png'
const terminalLabels = [
  {
    id: '7-endpoint',
    label: '7',
    polarity: 'plus',
  },
  {
    id: '8-endpoint',
    label: '8',
    polarity: 'minus',
  },
  {
    id: '9-endpoint',
    label: '9',
    polarity: 'plus',
  },
  {
    id: '11-endpoint',
    label: '11',
    polarity: 'plus',
  },
  {
    id: '10-endpoint',
    label: '10',
    polarity: 'minus',
  },
  {
    id: '12-endpoint',
    label: '12',
    polarity: 'minus',
  },
]

const CircuitDiagram = ({
  circuitSwitchOn = false,
  className = '',
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  onToggleCircuitSwitch,
}) => (
  <section className={`circuit-panel ${className}`} id="circuit-panel">
    <div className="circuit-panel__stage">
      <img alt="Kirchhoff current law circuit diagram" className="circuit-panel__image" src={circuitImage} />
      <span
        aria-hidden="true"
        className="circuit-panel__load-node circuit-panel__load-node--upper"
      />
      <span
        aria-hidden="true"
        className="circuit-panel__load-node circuit-panel__load-node--lower"
      />
      <span
        aria-hidden="true"
        className="circuit-panel__power-control-target"
        id="circuit-power-control"
      />
      <span className="component-label power-label">Power</span>
      <button
        aria-label={circuitSwitchOn ? 'Circuit switch is on' : 'Turn circuit on'}
        aria-pressed={circuitSwitchOn}
        className="circuit-panel__switch-button"
        disabled={circuitSwitchOn}
        id="circuit-switch-button"
        onClick={onToggleCircuitSwitch}
        type="button"
      >
        <img
          alt={circuitSwitchOn ? 'Circuit ON button' : 'Circuit OFF button'}
          className="circuit-panel__switch-image"
          draggable="false"
          src={circuitSwitchOn ? onButtonImage : offButtonImage}
        />
      </button>

      {terminalLabels.map(({ id, label, polarity }) => (
        <div className="circuit-terminal" key={id}>
          <span
            id={id}
            className={`connection-terminal connection-terminal--circuit connection-terminal--endpoint-${label}${getTerminalConnectedClass(connectedTerminalIds, id)}${getTerminalHighlightClass(highlightedTerminalIds, id)}`}
            data-polarity={polarity}
            aria-label={`Circuit terminal ${label}`}
            title={`Drag to connect terminal ${label}`}
          />
          <span
            className={`terminal-number-label terminal-number-label--circuit terminal-number-label--endpoint-${label}${getTerminalNumberHighlightClass(highlightedTerminalIds, id)}`}
            data-terminal-id={id}
            title={`Terminal ${label}. Click to disconnect.`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  </section>
)

export default CircuitDiagram
