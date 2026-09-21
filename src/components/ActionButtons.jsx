import { useEffect, useRef, useState } from 'react'
import SectionCard from './SectionCard.jsx'
import ElectricalText from './ElectricalText.jsx'
import {
  AddIcon,
  AiGuide,
  ButtonIcon,
  CheckIcon,
  CalculateIcon,
  CloseIcon,
  PrintIcon,
  ResetIcon,
   AutoConnectIcon,
} from './Icons.jsx'

const buttons = [
  {
    id: 'instruction-button',
    label: 'INSTRUCTIONS',
    tone: 'action-button--gold',
    Icon: ButtonIcon,
    opensInstructions: true,
  },
  {
    id: 'ai-guide-button',
    label: 'AI GUIDE',
    tone: 'action-button--cyan',
    Icon: AiGuide,
    handlerName: 'onAiGuide',
  },
  {
  id: 'auto-connect-button',
  label: 'AUTO CONNECT',
  tone: 'action-button--blue',
 Icon: AutoConnectIcon,
  handlerName: 'onAutoConnect',
},
  {
    id: 'check-button',
    label: 'CHECK',
    tone: 'action-button--green',
    Icon: CheckIcon,
    handlerName: 'onCheck',
  },
  {
    id: 'add-reading-button',
    label: 'ADD',
    tone: 'action-button--blue',
    Icon: AddIcon,
    handlerName: 'onAdd',
  },
  {
  id: 'plot-button',
  label: 'PLOT',
  tone: 'action-button--orange',
  Icon: CalculateIcon,
  handlerName: 'onPlot',
},
  {
    id: 'reset-button',
    label: 'RESET',
    tone: 'action-button--red',
    Icon: ResetIcon,
    handlerName: 'onReset',
  },
  {
    id: 'print-button',
    label: 'PRINT',
    tone: 'action-button--purple',
    Icon: PrintIcon,
    handlerName: 'onPrint',
  },
  
 
]

const instructionOrder = [
  'connections',
  'power-switch',
  'bulb-switch',
  'short-circuit-reading',
  'load-readings',
  'remove-ammeter',
  'open-circuit-reading',
  'plot',
  'calculate',
  'report',
  'print',
  'reset',
]

const ActionButtons = ({
  activeButtons = {},
  disabledButtons = {},
  onAdd,
  onAiGuide,
  onCheck,
  onPlot,
  onPrint,
  onReset,
   onAutoConnect,
   activeInstructionStep,
}) => {
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const instructionsBodyRef = useRef(null)
  const activeInstructionIndex = instructionOrder.indexOf(activeInstructionStep)
  const getInstructionProps = (stepId) => {
    const stepIndex = instructionOrder.indexOf(stepId)
    const state =
      stepIndex < activeInstructionIndex
        ? 'completed'
        : stepIndex === activeInstructionIndex
          ? 'active'
          : 'pending'

    return {
      'aria-current': state === 'active' ? 'step' : undefined,
      'aria-disabled': state === 'pending' ? 'true' : undefined,
      className: `action-step action-step--${state}`,
      'data-instruction-step': stepId,
    }
  }

  useEffect(() => {
    if (!instructionsOpen || !instructionsBodyRef.current) {
      return
    }

    const activeStep = instructionsBodyRef.current.querySelector(
      `[data-instruction-step="${activeInstructionStep}"]`,
    )

    const body = instructionsBodyRef.current
    const bodyRect = body.getBoundingClientRect()
    const stepRect = activeStep?.getBoundingClientRect()

    if (!stepRect) {
      return
    }

    const nextScrollTop =
      body.scrollTop
      + stepRect.top
      - bodyRect.top
      - (body.clientHeight - stepRect.height) / 2

    body.scrollTo({
      behavior: 'smooth',
      top: Math.max(0, nextScrollTop),
    })
  }, [activeInstructionStep, instructionsOpen])

  const handlers = {
  onAdd,
  onPlot,
  onCheck,
  onPrint,
  onReset,
  onAiGuide,
  onAutoConnect,
}

  return (
    <SectionCard
      className={`action-buttons-card h-[160px] ${
        instructionsOpen ? 'action-buttons-card--instructions-open' : ''
      }`}
      icon="buttons"
      id="action-buttons-panel"
      title="ACTION BUTTONS"
    >
      <div className="action-buttons__grid">
        {buttons.map(({ id, label, tone, Icon, handlerName, opensInstructions }) => {
          const handler = handlers[handlerName]
          const isActive = !opensInstructions && Boolean(activeButtons[handlerName])
          const isDisabled = !opensInstructions && (!handler || disabledButtons[handlerName])
          const buttonProps = opensInstructions
            ? {
                'aria-controls': 'experiment-instructions-panel',
                'aria-expanded': instructionsOpen,
                onClick: () => setInstructionsOpen((current) => !current),
              }
            : {
                'aria-pressed': handlerName === 'onAiGuide' ? isActive : undefined,
                onClick: handler,
              }

          return (
            <button
              id={id}
              key={label}
              type="button"
              className={`action-button ${tone} ${isActive ? 'action-button--active' : ''}`}
              disabled={isDisabled}
              {...buttonProps}
            >
              <Icon />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {instructionsOpen ? (
        <div
          className="action-instructions-panel"
          id="experiment-instructions-panel"
          role="region"
          aria-labelledby="experiment-instructions-title"
        >
          <div className="action-instructions-panel__header">
            <h3 id="experiment-instructions-title">Instructions</h3>
            <button
              type="button"
              className="action-instructions-panel__close"
              aria-label="Close instructions"
              onClick={() => setInstructionsOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <div
            className="action-instructions-panel__body"
            ref={instructionsBodyRef}
          >
            <p className="action-instructions-panel__guide-note">
              <strong>AI Guide:</strong> The AI guide will assist you in performing the
              simulation accurately at each step.
            </p>
            <ol className="action-instructions-panel__steps">
              <li {...getInstructionProps('connections')}>
                <strong>STEP 1:</strong>{' '}
                Connect terminals 1-7, 2-8, 3-9, 4-10, 5-11 and 6-12 and click on the Check button to verify the connections.
              </li>

              <p className="action-instructions-panel__guide-note">
              <strong>Note:</strong> If a wire is connected incorrectly, click the corresponding label number to remove the connection.

            </p>

              <li {...getInstructionProps('power-switch')}>
                <strong>STEP 2:</strong>{' '}
                Click on the Power Switch to turn it ON.
              </li>

              <li {...getInstructionProps('bulb-switch')}>
                <strong>STEP 3:</strong>{' '}
                Click on the bulb switch to turn ON the light source.
              </li>

              <li {...getInstructionProps('short-circuit-reading')}>
                <strong>STEP 4:</strong>{' '}
                Click the ADD button to add the short-circuit reading to the observation table.
              </li>

              <li {...getInstructionProps('load-readings')}>
                <strong>STEP 5:</strong>{' '}
                <ElectricalText text="Move RL one enabled step at a time and click the ADD button for each of the ten load readings." />
              </li>

              <li {...getInstructionProps('remove-ammeter')}>
                <strong>STEP 6:</strong>{' '}
                After completing all 11 readings, remove the ammeter connections 5–11 and 6–12.

              </li>

              <li {...getInstructionProps('open-circuit-reading')}>
                <strong>STEP 7:</strong>{' '}
                Click on the ADD button to add the Voc value to the observation table.
              </li>

              <li {...getInstructionProps('plot')}>
                <strong>STEP 8:</strong>{' '}
                Click on the PLOT button to draw the V-I characteristics.
              </li>

              <li {...getInstructionProps('calculate')}>
                <strong>STEP 9:</strong>{' '}
                Enter Vmp, Imp, Isc and Voc, then click CALCULATE to obtain the fill factor.
              </li>

              <li {...getInstructionProps('report')}>
                <strong>STEP 10:</strong>{' '}
                Click on the Generate Report button to generate the simulation report.
              </li>

              <li {...getInstructionProps('print')}>
                <strong>STEP 11:</strong>{' '}
                Click on the PRINT button to print the simulation.
              </li>

              <li {...getInstructionProps('reset')}>
                <strong>STEP 12:</strong>{' '}
                Click on the RESET button to restart the experiment.
              </li>
            </ol>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

export default ActionButtons
