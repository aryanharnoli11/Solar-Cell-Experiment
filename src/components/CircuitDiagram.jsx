import { Fragment } from 'react'
import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'
import circuitImage from '../assets/circuit.png'
const terminalLabels = [
  {
    id: '9-endpoint',
    label: '9',
    polarity: 'plus',
  },
  {
    id: '10-endpoint',
    label: '10',
    polarity: 'minus',
  },
  {
    id: '11-endpoint',
    label: '11',
    polarity: 'plus',
  },
  {
    id: '12-endpoint',
    label: '12',
    polarity: 'plus',
  },
  {
    id: '13-endpoint',
    label: '13',
    polarity: 'minus',
  },
  {
    id: '14-endpoint',
    label: '14',
    polarity: 'minus',
  },
]

const CircuitDiagram = ({
  className = '',
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  r1,
  r2,
  r3,
  rl,
}) => (
  <section className={`circuit-panel ${className}`} id="circuit-panel">
    <div className="circuit-panel__stage">
      <img alt="Kirchhoff current law circuit diagram" className="circuit-panel__image" src={circuitImage} />

      <svg
        aria-hidden="true"
        className="load-resistance-arrow"
        viewBox="0 0 64 76"
      >
        <defs>
          <marker
            id="load-resistance-arrowhead"
            markerHeight="5"
            markerWidth="5"
            orient="auto"
            refX="5.5"
            refY="3.5"
            viewBox="0 0 7 7"
          >
            <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="currentColor" />
          </marker>
        </defs>
        <line
          markerEnd="url(#load-resistance-arrowhead)"
          x1="6"
          x2="55"
          y1="68"
          y2="9"
        />
      </svg>

      {terminalLabels.map(({ id, label, polarity }) => (
        <Fragment key={id}>
          <span
            id={id}
className={`connection-terminal connection-terminal--circuit connection-terminal--endpoint-${label}${getTerminalConnectedClass(connectedTerminalIds, id)}${getTerminalHighlightClass(highlightedTerminalIds, id)}`}
            data-polarity={polarity}
            aria-label={`Circuit terminal ${label}`}
          />
          <span
className={`terminal-number-label terminal-number-label--circuit terminal-number-label--endpoint-${label}${getTerminalNumberHighlightClass(highlightedTerminalIds, id)}`}
            data-terminal-id={id}
          >
            {label}
          </span>
        </Fragment>
      ))}

     <span className="resistor-value left-[71.2px] top-[136px]">{r1} &Omega;</span>

<span className="resistor-value left-[225.6px] top-[176px]">{r2} &Omega;</span>

<span className="resistor-value left-[240px] top-[131.2px]">{r3} &Omega;</span>

<span className="resistor-value left-[312px] top-[176px]">
  {rl} &Omega;
</span>
    </div>
  </section>
)

export default CircuitDiagram
