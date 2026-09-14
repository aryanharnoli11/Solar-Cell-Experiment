import { useCallback, useEffect, useRef, useState } from 'react'
import ElectricalText from '../components/ElectricalText.jsx'

const EXIT_DURATION = 180

const isConfiguredAudioSource = (audioSource) => (
  typeof audioSource === 'string' &&
  audioSource.trim() !== '' &&
  audioSource.trim() !== '#'
)

const dispatchLabAlertEvent = (eventName, detail) => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail }))
}

const LabAlertCard = ({ alert, onDismiss }) => {
  const [isClosing, setIsClosing] = useState(false)
  const dismissTimerRef = useRef(null)
  const {
    canGoNext,
    canGoPrevious,
    confirmLabel = 'OK',
    connectionDetails,
    description,
    icon,
    id,
    onConfirm,
    onNext,
    onPrevious,
    placement,
    requiresConfirmation,
    title,
    tutorialMode,
    type,
  } = alert
  const audioSource = alert.audio ?? alert.audioSource


  const waitsForAudio = (
    !requiresConfirmation
    && isConfiguredAudioSource(audioSource)
  )

  const titleId = `lab-alert-title-${id}`
  const descriptionId = `lab-alert-description-${id}`
  const role = type === 'error' || type === 'warning' ? 'alert' : 'status'
  const showTutorialControls = Boolean(tutorialMode || onNext || onPrevious)
  const connectionDetailGroups = [
    {
      key: 'wrong',
      label: 'Wrong connection',
      values: connectionDetails?.wrong,
    },
    {
      key: 'missing',
      label: 'Missing connection',
      values: connectionDetails?.missing,
    },
  ].filter(({ values }) => Array.isArray(values) && values.length > 0)
  const hasDescription = Boolean(
    description || connectionDetailGroups.length > 0,
  )

  const dismiss = useCallback((reason = 'dismiss', callClose = true) => {
    if (isClosing) {
      return
    }
    dispatchLabAlertEvent('lab-alert:sound-stop', { id, reason })
    alert.onDismiss?.(reason, alert)
    setIsClosing(true)

    dismissTimerRef.current = window.setTimeout(() => {
      if (callClose) {
        alert.onClose?.(reason, alert)
      }

      onDismiss(id)
    }, EXIT_DURATION)
  }, [alert, id, isClosing, onDismiss])

useEffect(() => {

  dispatchLabAlertEvent('lab-alert:sound', {
    audio: audioSource,
    id,
    sound: alert.sound ?? type,
    title,
    type,
  })

}, [
  audioSource,
  alert.sound,
  id,
  title,
  type,
])
  useEffect(() => {
  if (!waitsForAudio) return

const handleEnded = (event) => {
  if (
    event.detail?.id === id
    && event.detail?.reason === 'ended'
  ) {
    dismiss('audio-ended')
  }
}

  window.addEventListener(
    'lab-alert:sound-ended',
    handleEnded
  )

  return () =>
    window.removeEventListener(
      'lab-alert:sound-ended',
      handleEnded
    )
}, [dismiss, id, waitsForAudio])
  useEffect(() => () => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current)
    }
  }, [])

  const handleConfirm = () => {
    onConfirm?.(alert)
    dismiss('confirm', false)
  }

  const handleOk = () => {
    dismiss('ok')
  }

  return (
    <article
      aria-describedby={hasDescription ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={`lab-alert-card lab-alert-card--${type} ${isClosing ? 'lab-alert-card--closing' : ''}`}
      data-placement={placement}
      role={role}
    >
      <div className="lab-alert-card__glow" aria-hidden="true" />

      <div className="lab-alert-card__main">
        <span className="lab-alert-card__icon" aria-hidden="true">{icon}</span>

        <div className="lab-alert-card__content">
          <div className="lab-alert-card__meta">
            <span>{type.toUpperCase()}</span>
          </div>
          <h2 id={titleId}><ElectricalText text={title} /></h2>
          {hasDescription ? (
            <div className="lab-alert-card__message" id={descriptionId}>
              {description ? <p><ElectricalText text={description} /></p> : null}
              {connectionDetailGroups.length > 0 ? (
                <dl className="lab-alert-card__connection-details">
                  {connectionDetailGroups.map(({ key, label, values }) => (
                    <div className="lab-alert-card__connection-row" key={key}>
                      <dt>{label}{values.length > 1 ? 's' : ''}</dt>
                      <dd>{values.join(', ')}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="lab-alert-card__tools">
          <button
            aria-label="Close alert"
            className="lab-alert-card__icon-button"
            onClick={() => dismiss('close')}
            type="button"
          >
            ×
          </button>
        </div>
      </div>

      <div className="lab-alert-card__actions">
        {showTutorialControls ? (
          <>
            <button
              className="lab-alert-card__button lab-alert-card__button--secondary"
              disabled={canGoPrevious === false}
              onClick={onPrevious}
              type="button"
            >
              Previous
            </button>
            <button
              className="lab-alert-card__button lab-alert-card__button--secondary"
              disabled={canGoNext === false}
              onClick={onNext}
              type="button"
            >
              Next
            </button>
          </>
        ) : null}

        <button
          className="lab-alert-card__button lab-alert-card__button--primary"
          onClick={requiresConfirmation ? handleConfirm : handleOk}
          type="button"
        >
          {requiresConfirmation ? confirmLabel : 'OK'}
        </button>
      </div>
    </article>
  )
}

export default LabAlertCard
