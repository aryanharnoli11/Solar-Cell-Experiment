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
  id: 'calculate-button',
  label: 'CALCULATE',
  tone: 'action-button--orange',
  Icon: CalculateIcon,
  handlerName: 'onCalculate',
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
  'step1',
  'case1',
  'case2',
  'case3',
  'step3',
  'step4',
  'step5',
  'step6',
]

const ActionButtons = ({
  activeButtons = {},
  disabledButtons = {},
  onAdd,
  onAiGuide,
  onCheck,
  onCalculate,
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
  onCalculate,
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

  <li {...getInstructionProps('step1')}>
    <strong>STEP 1:</strong>{' '}
    <ElectricalText text="Measure RTH and VTH first. The RL slider remains locked until VTH is recorded." />
  </li>

  <li>
    <strong>STEP 2:</strong> Perform the following cases.
    
    <ol className="action-instructions-panel__substeps" type="a">
      <li {...getInstructionProps('case1')}>
  <strong>Case 1 (Measure <ElectricalText text="RTH" />):</strong>
  <ul>
    <li>Short circuit terminals (9-10).</li>
    <li>Connect the Multimeter (5-11 and 6-13).</li>
    <li>Click CHECK button to verify the connections.</li>
    <li>Click ADD button to record <ElectricalText text="RTH" />.</li>
    <li>Remove connections (9-10), (5-11), (6-13) by clicking the corresponding terminal labels.</li>
  </ul>
</li>

      <li {...getInstructionProps('case2')}>
  <strong>Case 2 (Measure <ElectricalText text="VTH" />):</strong>
  <ul>
    <li>Connect the Power Supply (7-9 and 8-10).</li>
    <li>Connect the Voltmeter (1-11 and 2-13).</li>
    <li>Click CHECK button to verify the connections.</li>
    <li>Turn ON the Power Supply and set the desired voltage.</li>
    <li>Click ADD button to record <ElectricalText text="VTH" />.</li>
    <li>Remove the connections (1-11 and 2-13) by clicking the corresponding terminal labels.</li>
  </ul>
</li>

      <li {...getInstructionProps('case3')}>
        <strong>Case 3 (Measure <ElectricalText text="IL" />):</strong>
        <ul>
<li>Keep the existing Power Supply connections (7-9 and 8-10) unchanged.</li>
<li>Connect the Ammeter (3-11, 4-12 and 13-14).</li>
<li>Click CHECK button to verify the connections.</li>
<li>Turn ON the Power Supply at the same voltage setting used in Case 2.</li>
<li>Click ADD button to record the first <ElectricalText text="IL" /> and <ElectricalText text="PL" /> values.</li>
<li>Move the RL slider one division at a time and click ADD button at each value: 100, 200, 300, 400, 450, 550, 700, 850 and 1000 Ω.</li>
        </ul>
      </li>
    </ol>
  </li>

  <li {...getInstructionProps('step3')}>
    <strong>STEP 3:</strong>{' '}
    <ElectricalText text="Click CALCULATE button to verify the theorem." />
  </li>

  <li {...getInstructionProps('step4')}>
    <strong>STEP 4:</strong>{' '}
    <ElectricalText text="Enter VTH and RTH to calculate maximum power, then click VERIFY button to verify the theorem." />
  </li>

<li {...getInstructionProps('step5')}>
    <strong>STEP 6:</strong> Click the Generate Report button to generate the simulation report.
  </li>

  <li {...getInstructionProps('step5')}>
    <strong>STEP 7:</strong> Click PRINT button to print the experiment report.
  </li>

  <li {...getInstructionProps('step6')}>
    <strong>STEP 8:</strong> Click RESET button to restart the experiment.
  </li>
  <li>
  <strong>Note:</strong> Verified connections are locked and cannot be removed until the current case reading is added to the observation table.
</li>

</ol>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

export default ActionButtons
