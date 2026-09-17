import { useState } from 'react'
import { FormulaIcon, PdfIcon } from './Icons.jsx'

const FillFactorFormula = () => (
  <div
    aria-label="Fill factor percentage equals V m p times I m p divided by V o c times I s c, multiplied by one hundred"
    className="floating-formula-panel__equation-row"
  >
    <span className="floating-formula-panel__symbol">
      FF&nbsp;(%)
    </span>
    <span aria-hidden="true">=</span>
    <span className="floating-formula-panel__fraction" aria-hidden="true">
      <span className="floating-formula-panel__numerator">
        V<sub>mp</sub> × I<sub>mp</sub>
      </span>
      <span className="floating-formula-panel__denominator">
        V<sub>oc</sub> × I<sub>sc</sub>
      </span>
    </span>
    <span aria-hidden="true">× 100</span>
  </div>
)
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
          <section className="floating-formula-panel__section">
            <h4>Fill Factor</h4>
            <p className="floating-formula-panel__description">
              Fill factor is the ratio of the maximum power produced by a solar
              cell to the product of its open-circuit voltage and short-circuit
              current. It indicates the quality and performance of the solar cell.
            </p>

            <div className="floating-formula-panel__formula">
              <strong className="floating-formula-panel__formula-label">
                Formula
              </strong>
              <FillFactorFormula />
            </div>
          </section>
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
