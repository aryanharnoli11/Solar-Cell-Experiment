import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'
import circuitImage from '../assets/Circuit.png'
import offButtonImage from '../assets/OFFbutton.png'
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
    polarity: 'plus',
  },
]

const CircuitDiagram = ({
  className = '',
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
}) => (
  <section className={`circuit-panel ${className}`} id="circuit-panel">
    <div className="circuit-panel__stage">
      <img alt="Kirchhoff current law circuit diagram" className="circuit-panel__image" src={circuitImage} />
      <img
        alt="Circuit OFF button"
        className="circuit-panel__switch-image"
        draggable="false"
        src={offButtonImage}
      />

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
