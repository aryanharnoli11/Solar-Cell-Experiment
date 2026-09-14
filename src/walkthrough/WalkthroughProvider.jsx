import { useCallback, useEffect, useMemo, useState } from 'react'

import defaultWalkthroughConfig from './walkthroughConfig.json'
import { WalkthroughContext } from './WalkthroughContext.js'
import { loadWalkthroughConfig } from './walkthroughConfigLoader.js'
import WalkthroughOverlay from './components/WalkthroughOverlay.jsx'
import './walkthrough.css'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const SCROLL_SETTLE_FRAMES = 4
const SCROLL_SETTLE_TIMEOUT = 1200
const SCROLL_SETTLE_THRESHOLD = 0.5

const getElementRect = (element) => {
  if (!element) {
    return null
  }

  const rect = element.getBoundingClientRect()

  if (rect.width === 0 && rect.height === 0) {
    return null
  }

  return {
    bottom: rect.bottom,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    width: rect.width,
  }
}

const getViewportCenterRect = () => {
  const visualViewport = window.visualViewport
  const viewportLeft = visualViewport?.offsetLeft ?? 0
  const viewportTop = visualViewport?.offsetTop ?? 0
  const viewportWidth = visualViewport?.width ?? window.innerWidth
  const viewportHeight = visualViewport?.height ?? window.innerHeight
  const left = viewportLeft + viewportWidth / 2
  const top = viewportTop + viewportHeight / 2

  return {
    bottom: top,
    height: 0,
    left,
    right: left,
    top,
    width: 0,
  }
}

const WalkthroughProvider = ({
  autoPlayAudio = false,
  children,
  config = defaultWalkthroughConfig,
  locale,
}) => {
  const walkthroughConfig = useMemo(
    () => loadWalkthroughConfig(config, locale ?? config?.defaultLocale),
    [config, locale],
  )
  const [isOpen, setIsOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPositioningTarget, setIsPositioningTarget] = useState(false)
  const [targetRect, setTargetRect] = useState(null)
  const [completionCount, setCompletionCount] = useState(0)

  const totalSteps = walkthroughConfig.steps.length
  const activeStep = isOpen ? walkthroughConfig.steps[currentStepIndex] : null
  const activeTargetSelector = activeStep?.target
  const currentStep = currentStepIndex + 1
  const canGoPrevious = currentStepIndex > 0
  const canGoNext = currentStepIndex < totalSteps - 1
  const autoPlayAudioForStep = Boolean(
    activeStep?.autoplayAudio
    ?? walkthroughConfig.audio?.autoplay
    ?? autoPlayAudio
  )

  const readActiveTarget = useCallback(() => {
    if (!activeTargetSelector) {
      setTargetRect(null)
      return null
    }

    const target = document.querySelector(activeTargetSelector)
    const nextRect = getElementRect(target)

    setTargetRect(nextRect)

    return target
  }, [activeTargetSelector])

  const moveToStep = useCallback((stepIndex) => {
    if (totalSteps === 0) {
      return
    }

    setTargetRect(null)
    setIsPositioningTarget(true)
    setCurrentStepIndex(clamp(stepIndex, 0, totalSteps - 1))
  }, [totalSteps])

  const start = useCallback((stepIndex = 0) => {
    moveToStep(stepIndex)
    setIsOpen(true)
  }, [moveToStep])

  const close = useCallback(() => {
    setIsOpen(false)
    setIsPositioningTarget(false)
    setTargetRect(null)
  }, [])

  const complete = useCallback(() => {
    setCompletionCount((current) => current + 1)
    close()
  }, [close])

  const next = useCallback(() => {
    moveToStep(currentStepIndex + 1)
  }, [currentStepIndex, moveToStep])

  const previous = useCallback(() => {
    moveToStep(currentStepIndex - 1)
  }, [currentStepIndex, moveToStep])

  const goToStep = useCallback((stepIndex) => {
    moveToStep(stepIndex)
  }, [moveToStep])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    let animationFrame = null
    const showFallback = () => {
      animationFrame = window.requestAnimationFrame(() => {
        setTargetRect(getViewportCenterRect())
        setIsPositioningTarget(false)
      })

      return () => window.cancelAnimationFrame(animationFrame)
    }

    if (!activeTargetSelector) {
      return showFallback()
    }

    const target = document.querySelector(activeTargetSelector)

    if (!target) {
      return showFallback()
    }

    let cancelled = false
    let lastRect = null
    let stableFrames = 0
    const startedAt = performance.now()
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const trackTargetUntilSettled = () => {
      if (cancelled) {
        return
      }

      const nextRect = getElementRect(target)

      if (!nextRect) {
        setTargetRect(getViewportCenterRect())
        setIsPositioningTarget(false)
        return
      }

      setTargetRect(nextRect)

      if (lastRect) {
        const movement = Math.max(
          Math.abs(nextRect.left - lastRect.left),
          Math.abs(nextRect.top - lastRect.top),
        )

        stableFrames = movement <= SCROLL_SETTLE_THRESHOLD
          ? stableFrames + 1
          : 0
      }

      const timedOut =
        performance.now() - startedAt >= SCROLL_SETTLE_TIMEOUT

      if (stableFrames >= SCROLL_SETTLE_FRAMES || timedOut) {
        setIsPositioningTarget(false)
        return
      }

      lastRect = nextRect
      animationFrame = window.requestAnimationFrame(
        trackTargetUntilSettled,
      )
    }

    target.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    })

    animationFrame = window.requestAnimationFrame(
      trackTargetUntilSettled,
    )

    return () => {
      cancelled = true

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }

      window.scrollTo({
        behavior: 'auto',
        left: window.scrollX,
        top: window.scrollY,
      })
    }
  }, [activeTargetSelector, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    let animationFrame = null

    const scheduleRefresh = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }

      animationFrame = window.requestAnimationFrame(readActiveTarget)
    }

    const target = activeTargetSelector
      ? document.querySelector(activeTargetSelector)
      : null
    const resizeObserver = target
      ? new ResizeObserver(scheduleRefresh)
      : null

    resizeObserver?.observe(target)
    window.addEventListener('scroll', scheduleRefresh, {
      capture: true,
      passive: true,
    })
    window.addEventListener('resize', scheduleRefresh)
    window.visualViewport?.addEventListener('scroll', scheduleRefresh)
    window.visualViewport?.addEventListener('resize', scheduleRefresh)

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }

      resizeObserver?.disconnect()
      window.removeEventListener('scroll', scheduleRefresh, true)
      window.removeEventListener('resize', scheduleRefresh)
      window.visualViewport?.removeEventListener('scroll', scheduleRefresh)
      window.visualViewport?.removeEventListener('resize', scheduleRefresh)
    }
  }, [activeTargetSelector, isOpen, readActiveTarget])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const bodyStyle = document.body.style
    const documentStyle = document.documentElement.style
    const originalStyles = {
      body: {
        height: bodyStyle.height,
        left: bodyStyle.left,
        overflow: bodyStyle.overflow,
        overscrollBehavior: bodyStyle.overscrollBehavior,
        position: bodyStyle.position,
        right: bodyStyle.right,
        top: bodyStyle.top,
        width: bodyStyle.width,
      },
      document: {
        height: documentStyle.height,
        overflow: documentStyle.overflow,
        overscrollBehavior: documentStyle.overscrollBehavior,
        position: documentStyle.position,
      },
    }
    const closeForPageChange = () => close()

    bodyStyle.overflow = 'hidden'
    bodyStyle.overscrollBehavior = 'none'
    documentStyle.overflow = 'hidden'
    documentStyle.overscrollBehavior = 'none'

    window.addEventListener('hashchange', closeForPageChange)
    window.addEventListener('pagehide', closeForPageChange)
    window.addEventListener('popstate', closeForPageChange)

    return () => {
      Object.assign(bodyStyle, originalStyles.body)
      Object.assign(documentStyle, originalStyles.document)
      window.removeEventListener('hashchange', closeForPageChange)
      window.removeEventListener('pagehide', closeForPageChange)
      window.removeEventListener('popstate', closeForPageChange)
    }
  }, [close, isOpen])

  useEffect(() => {
    if (!isOpen || !activeTargetSelector) {
      return undefined
    }

    const target = document.querySelector(activeTargetSelector)

    if (!target) {
      return undefined
    }

    target.classList.add('walkthrough-active-target')

    return () => {
      target.classList.remove('walkthrough-active-target')
    }
  }, [activeTargetSelector, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      if (event.key === 'ArrowRight' && canGoNext) {
        event.preventDefault()
        next()
        return
      }

      if (event.key === 'ArrowLeft' && canGoPrevious) {
        event.preventDefault()
        previous()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canGoNext, canGoPrevious, close, isOpen, next, previous])

  const contextValue = useMemo(() => ({
    activeStep,
    autoPlayAudioForStep,
    canGoNext,
    canGoPrevious,
    close,
    complete,
    completionCount,
    config: walkthroughConfig,
    currentStep,
    currentStepIndex,
    experimentName: walkthroughConfig.experimentName,
    goToStep,
    isOpen,
    isPositioningTarget,
    locale: walkthroughConfig.locale,
    next,
    previous,
    start,
    targetRect,
    totalSteps,
  }), [
    activeStep,
    autoPlayAudioForStep,
    canGoNext,
    canGoPrevious,
    close,
    complete,
    completionCount,
    currentStep,
    currentStepIndex,
    goToStep,
    isOpen,
    isPositioningTarget,
    next,
    previous,
    start,
    targetRect,
    totalSteps,
    walkthroughConfig,
  ])

  return (
    <WalkthroughContext.Provider value={contextValue}>
      {children}
      <WalkthroughOverlay />
    </WalkthroughContext.Provider>
  )
}

export default WalkthroughProvider
