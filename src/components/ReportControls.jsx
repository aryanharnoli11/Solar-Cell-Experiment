import { useState } from 'react'
import { FormulaIcon, PdfIcon } from './Icons.jsx'
import ElectricalText from './ElectricalText.jsx'

const formulaSections = [
  {
    description: 'Thevenin resistance (RTH​) is the equivalent resistance of a linear electrical network as seen from the load terminals after removing the load resistance and deactivating all independent sources. It represents the internal resistance of the circuit in its Thevenin equivalent.',
    heading: 'Steps to Calculate RTH',
    id: 'rth',
    steps: [
      'Remove the load resistance (RL​).',
      'Replace all independent voltage sources with short circuits and all independent current sources with open circuits.',
      'Calculate the equivalent resistance seen from the load terminals. This equivalent resistance is the Thevenin resistance (RTH​).',
    ],
  },
  {
    description: 'Thevenin voltage (VTH) is the open-circuit voltage measured across the load terminals after removing the load resistance (RL​).',
    heading: 'Steps to Calculate VTH',
    id: 'vth',
    steps: [
      'Remove the load resistance (RL​).',
      'Keep all independent sources active.',
      'Calculate the voltage across the open terminals using an appropriate circuit analysis method.',
      'The voltage obtained across the open terminals is the Thevenin voltage (VTH​).',
    ],
  },
  {
    description: 'Load Current (IL​) is the current flowing through the load resistor when it is connected to the Thevenin equivalent circuit.',
    id: 'il',
    steps: [],
  },
  {
    description: 'Maximum load power is delivered when the load resistance equals the Thevenin resistance of the source network.',
    id: 'pmax',
    steps: [],
  },
]

const FormulaFraction = ({ denominator, numerator }) => (
  <span className="floating-formula-panel__fraction" aria-hidden="true">
    <span className="floating-formula-panel__numerator">
      <ElectricalText text={numerator} />
    </span>
    <span className="floating-formula-panel__denominator">
      <ElectricalText text={denominator} />
    </span>
  </span>
)

const FormulaSymbol = ({ children, text }) => (
  <span className="floating-formula-panel__symbol">
    {children ?? <ElectricalText text={text} />}
  </span>
)

const FormulaEquation = ({ formulaId }) => {
  if (formulaId === 'rth') {
    return (
      <span
        aria-label="R T H equals R 3 plus R 1 times R 2 divided by R 1 plus R 2"
        className="floating-formula-panel__equation-row"
      >
        <FormulaSymbol text="RTH" />
        <span aria-hidden="true">=</span>
        <FormulaSymbol text="R3" />
        <span aria-hidden="true">+</span>
        <FormulaFraction numerator="R1 × R2" denominator="R1 + R2" />
      </span>
    )
  }

  if (formulaId === 'vth') {
    return (
      <span
        aria-label="V T H equals V S times R 2 divided by R 1 plus R 2"
        className="floating-formula-panel__equation-row"
      >
        <FormulaSymbol text="VTH" />
        <span aria-hidden="true">=</span>
        <FormulaSymbol text="VS" />
        <span aria-hidden="true">×</span>
        <FormulaFraction numerator="R2" denominator="R1 + R2" />
      </span>
    )
  }

  if (formulaId === 'pmax') {
    return (
      <span
        aria-label="Maximum load power equals Thevenin voltage squared divided by four times Thevenin resistance"
        className="floating-formula-panel__equation-row"
      >
        <FormulaSymbol>
          P<sub>L,max</sub>
        </FormulaSymbol>
        <span aria-hidden="true">=</span>
        <FormulaFraction
          denominator="4 × RTH"
          numerator={(
            <FormulaSymbol>
              V<sup>2</sup><sub>TH</sub>
            </FormulaSymbol>
          )}
        />
      </span>
    )
  }

  return (
    <span
      aria-label="I L equals V T H divided by R T H plus R L"
      className="floating-formula-panel__equation-row"
    >
      <FormulaSymbol text="IL" />
      <span aria-hidden="true">=</span>
      <FormulaFraction numerator="VTH" denominator="RTH + RL" />
    </span>
  )
}
const ReportControls = ({
  onGenerateReport,
  reportGenerated,
  theoremVerified,
}) => {
  const [formulasOpen, setFormulasOpen] = useState(false)

  return (
  <div className="report-controls">

    {formulasOpen && (
      <aside
        aria-labelledby="formula-panel-title"
        aria-modal="true"
        className="floating-formula-panel"
        id="equations-panel"
        role="dialog"
      >

        <div className="floating-formula-panel__header">
          <h3 id="formula-panel-title">Equations</h3>
          <button
            aria-label="Close equations panel"
            className="floating-formula-panel__close"
            type="button"
            onClick={() => setFormulasOpen(false)}
          >
            &times;
          </button>
        </div>

        <div className="floating-formula-panel__content">
          {formulaSections.map((section) => (
            <section
              className="floating-formula-panel__section"
              key={section.id}
            >
              <p className="floating-formula-panel__description">
                <ElectricalText text={section.description} />
              </p>

              {section.heading ? (
                <h4><ElectricalText text={section.heading} /></h4>
              ) : null}

              {section.steps.length > 0 ? (
                <ul className="floating-formula-panel__steps">
                  {section.steps.map((step) => (
                    <li key={step}><ElectricalText text={step} /></li>
                  ))}
                </ul>
              ) : null}

              <div className="floating-formula-panel__formula">
                <strong className="floating-formula-panel__formula-label">
                  Formula
                </strong>
                <FormulaEquation formulaId={section.id} />
              </div>
            </section>
          ))}
        </div>

      </aside>
    )}

   
    <button
      id="generate-report-button"
      type="button"
      className="report-button"
      disabled={!theoremVerified}
      aria-label="Generate Report"
      data-report-generated={reportGenerated ? 'true' : 'false'}
      onClick={onGenerateReport}
    >
      <PdfIcon />
      <span>Generate Report</span>
    </button>
 <button
 id="formula-button"
      type="button"
      className="formula-button"
      aria-controls="equations-panel"
      aria-expanded={formulasOpen}
      onClick={() => setFormulasOpen((current) => !current)}
    >
      <FormulaIcon />
      <span>Equations</span>
    </button>

  </div>
)
}

export default ReportControls
