export const ALERT_AUDIO_PLACEHOLDER = '#'

const getAlertAudio = (fileName) =>
  `/audios/${fileName}`

const ALERT_AUDIO = {
  resistanceRequired: getAlertAudio(
    'Before resistance set, check & auto connect button click.wav'
  ),

  autoConnect: getAlertAudio(
    'autoconnect.wav'
  ),

  makeConnections: getAlertAudio(
    'After resistance is set, check button.wav'
  ),

  case1Verified: getAlertAudio(
    'After 1st case connections, check.wav'
  ),

  removeCase1: getAlertAudio(
    'After the Rth reading was added.wav'
  ),

  removeExisting: getAlertAudio(
    'After 1st and 2nd cases are completed, click autoconnect.wav'
  ),

  case2Verified: getAlertAudio(
    'After 2nd case connections, check.wav'
  ),

  voltageSet: getAlertAudio(
    'After the voltage value is set.wav'
  ),

  powerOn: getAlertAudio(
    'Regulated DC Power Supply.wav'
  ),

  removeVoltmeter: getAlertAudio(
    'After reading is added for the second case.wav'
  ),

  addFinalReading: getAlertAudio(
    'After reading is added for the third case.wav'
  ),

  calculate: getAlertAudio(
    'After clicking the calculate button.wav'
  ),

  verifyCorrect: getAlertAudio(
    'Verify button click, Correct calculations.wav'
  ),

  verifyWrong: getAlertAudio(
    'Verify button click, Incorrect calculations.wav'
  ),

  reset: getAlertAudio(
    'Reset.wav'
  ),
reportGenerated: getAlertAudio(
  'Generate Report button click.wav'
),
wrongConnection: getAlertAudio(
  'Wrong connection.wav'
),

  print: getAlertAudio(
    'Print.wav'
  ),
  wrongCon:getAlertAudio(
    'Multiple wrong connections.wav'
  )
}
export const EXPERIMENT_ALERTS = {
  connectionMode: {
    dedupeKey: 'step-1-connection-mode',
    description: 'Drag nodes from apparatus to complete the circuit connections.',
    icon: '🔌',
    stepNumber: 1,
    target: '#circuit-panel',
    title: 'Connection Mode Activated',
    type: 'info',
  },
  autoConnectCompleted: {
    audio: ALERT_AUDIO.autoConnect,
    description:
      'Autoconnect completed. The digital multimeter is now displaying the Thevenin equivalent resistance value. Now, click on the add button to add the reading to the observation table.',
    icon: '✅',
    stepNumber: 1,
    target: '#add-reading-button',
    title: 'Auto Connect Completed',
    type: 'success',
  },
  connectionsRequired: {
    audio: ALERT_AUDIO.makeConnections,
    description:
      'Please make the required connections as per the given instructions.',
    icon: '🔌',
    stepNumber: 1,
    target: '#circuit-panel',
    title: 'Circuit Connections Required',
    type: 'warning',
  },
  nextCaseConnectionMode: {
    audio: ALERT_AUDIO.removeExisting,
    description:
      'The previous case connections are cleared. Connect the next case manually or use Auto Connect.',
    icon: '🔌',
    stepNumber: 1,
    target: '#auto-connect-button',
    title: 'Ready for the Next Case',
    type: 'info',
  },
  circuitConnectionsCompleted: {
    description: 'The default wiring path has been placed on the apparatus.',
    icon: '✅',
    stepNumber: 1,
    target: '#circuit-panel',
    title: 'Circuit Connections Completed Successfully',
    type: 'success',
  },
  incorrectNodeConnection: {
    description: 'One or more wires are connected to the wrong node pair.',
    icon: '❌',
    stepNumber: 1,
    target: '#circuit-panel',
    title: 'Incorrect Node Connection Detected',
    type: 'error',
  },
  checkingConnections: {
    description: 'The lab console is validating each wire path.',
    icon: '🎛️',
    stepNumber: 2,
    target: '#check-button',
    title: 'Checking Circuit Connections...',
    type: 'info',
  },
  connectionsVerified: {
  audio: ALERT_AUDIO.case1Verified,
  description:
    'Connections Verified successfully. The digital multimeter is now displaying the Thevenin resistance value. Now, click on the add button to add the reading to the observation table.',
  icon: '✅',
  stepNumber: 2,
  target: '#check-button',
  title: 'Connections Verified',
  type: 'success',
},
connectionsVerifiedCase2: {
  audio: ALERT_AUDIO.case2Verified,
  description:
    'Connections Verified successfully. Now switch ON the power supply and set the required voltage value.',
  icon: '✅',
  stepNumber: 2,
  target: '#power-toggle-button',
  title: 'Connections Verified',
  type: 'success',
},

connectionsVerifiedCase3: {
  audio: ALERT_AUDIO.case2Verified,
  description:
    'Connections verified successfully. Turn ON the power supply at the same voltage setting used in Case 2.',
  icon: '✅',
  stepNumber: 2,
  target: '#power-toggle-button',
  title: 'Connections Verified',
  type: 'success',
},
  connectionsWrong: {
    audio: ALERT_AUDIO.wrongCon,
    description: 'Connections are wrong. Please check the wiring and try again.',
    icon: '⚠️',
    stepNumber: 2,
    target: '#circuit-panel',
    title: 'Connections are wrong',
    type: 'error',
  },
  someConnectionsWrong: {
    audio: ALERT_AUDIO.wrongCon,
    description: 'Some connections are wrong. Please check the wiring and try again.',
    icon: '⚠️',
    stepNumber: 2,
    target: '#circuit-panel',
    title: 'Some connections are wrong',
    type: 'error',
  },
  adjustResistance: {
    dedupeKey: 'step-3-adjust-resistance',
    description: 'Set the load resistance using the RL slider before starting the supply.',
    icon: '🎛️',
    stepNumber: 3,
    target: '#resistance-controls',
    title: 'Set the Load Resistance',
    type: 'info',
  },
  resistanceLocked: {
    description: 'Resistance controls are locked while the circuit is powered.',
    icon: '✅',
    stepNumber: 3,
    target: '#resistance-controls',
    title: 'Resistance Values Locked for Experiment',
    type: 'success',
  },
  powerOn: {
  audio: ALERT_AUDIO.powerOn,
  description:
    'Power supply switched ON successfully.',
  icon: '⚡',
  stepNumber: 4,
  target: '#power-supply',
  title: 'Power Supply Turned ON',
  type: 'success',
},
  cannotStartPower: {
    description: 'Run CHECK and correct the circuit wiring before powering the supply.',
    icon: '⚠️',
    stepNumber: 4,
    target: '#check-button',
    title: 'Cannot Start Power - Complete Connections First',
    type: 'warning',
  },
  adjustVoltage: {
  audio: ALERT_AUDIO.voltageSet,
  dedupeKey: 'step-5-adjust-voltage',
  description:
    'The reading is displayed on the voltmeter. Now, click on the add button to add the reading to the observation table.',
  icon: '⚡',
  stepNumber: 5,
  target: '#voltage-control',
  title: 'Voltage Set Successfully',
  type: 'success',
},
  addingReading: {
    description: 'The measured value is being added to the observation table.',
    icon: '📊',
    stepNumber: 6,
    target: '#observation-table-panel',
   title: 'Adding Reading To Observation Table',
    type: 'info',
  },
 readingAdded: {
  audio: ALERT_AUDIO.addFinalReading,
  description:
      'The final reading is added to the observation table. Now, click on the Calculate button to theoretically verify the theorem.',
  icon: '✅',
  stepNumber: 6,
  target: '#observation-table-panel',
  title: 'Reading Added Successfully',
  type: 'success',
},
readingAddedCase1: {
  audio: ALERT_AUDIO.removeCase1,
  description:
    'Reading is added to the observation table. Now remove the connections 9 to 10, 5 to 11 and 6 to 13.',
  icon: '✅',
  stepNumber: 6,
  target: '#observation-table-panel',
  title: 'Reading Added',
  type: 'success',
},

readingAddedCase2: {
  audio: ALERT_AUDIO.removeVoltmeter,
  description:
    'Reading added to the observation table. The power supply switched OFF automatically. Keep connections 7-9 and 8-10 unchanged, and remove only the voltmeter connections 1-11 and 2-13.',
  icon: '✅',
  stepNumber: 6,
  target: '#observation-table-panel',
  title: 'Reading Added',
  type: 'success',
},
  readingAlreadyExists: {
    description: 'Change the voltage before recording another observation.',
    icon: '⚠️',
    stepNumber: 6,
    target: '#voltage-control',
    title: 'Reading Already Exists',
    type: 'warning',
  },
 calculationReady: {
  audio: ALERT_AUDIO.calculate,
  description:
         'The resistance and source values are displayed in the theoretical verification panel. Enter the calculated values in the input field, and click the Verify button to verify the theorem.',

  icon: '🧮',
  stepNumber: 7,
  target: '#calculation-panel',
  title: 'Theoretical Verification',
  type: 'info',
},

verificationSuccess: {
  audio: ALERT_AUDIO.verifyCorrect,
  description:
         'Calculations are correct. Thevenin\'s Theorem has been verified successfully. Now click on the Generate Report button.',
  icon: '✅',
  stepNumber: 8,
  target: '#generate-report-button',
  title: 'Verification Successful',
  type: 'success',
},

verificationFailed: {
  audio: ALERT_AUDIO.verifyWrong,
  description:
  'Incorrect calculations. The Thevenin\'s Theorem could not be verified. Please review your calculations and try again.',
  icon: '❌',
  stepNumber: 8,
  target: '#calculation-panel',
  title: 'Verification Failed',
  type: 'error',
},
  preparingReport: {
    description: 'The print view is being prepared from the current observations.',
    icon: '📊',
    stepNumber: 10,
    target: '#print-button',
    title: 'Preparing Experiment Report for Printing',
    type: 'info',
  },
printLayoutGenerated: {
  audio: ALERT_AUDIO.print,
  description:
    'Opening the print dialog.',
  icon: '🖨️',
  stepNumber: 10,
  target: '#print-button',
  title: 'Print',
  type: 'success',
},
tingSetup: {
    description:
'Confirm reset before all readings and connections are cleared.',
    icon: '🎛️',
    stepNumber: 11,
    target: '#reset-button',
    title: 'Resetting Experiment Setup...',
    type: 'info',
  },
  resetWarning: {
    confirmLabel: 'OK',
    dedupeKey: 'step-11-reset-warning',
    description: 'Confirm reset before the current table and circuit are cleared.',
    icon: '⚠️',
    placement: 'center',
    requiresConfirmation: true,
    stepNumber: 11,
    target: '#reset-button',
    title: 'All Readings and Connections Will Be Cleared',
    type: 'warning',
  },
  resetSuccess: {
  audio: ALERT_AUDIO.reset,
  description:
    'The simulation has been reset. You can start again.',
  icon: '✅',
  stepNumber: 11,
  target: '#circuit-panel',
  title: 'Experiment Reset Successfully',
  type: 'success',
},
wrongConnection: {
  audio: ALERT_AUDIO.wrongConnection,
  title: 'Wrong Connection',
  description: 'This connection is wrong.',
  icon: '❌',
  stepNumber: 2,
  target: '#circuit-panel',
  type: 'error',
},
reportGenerated: {
  audio: ALERT_AUDIO.reportGenerated,
  title: 'Report Ready',
  description:
    'Your report is ready. Click OK to generate and open it in a new tab.',
  icon: '✅',
  type: 'success',
},
resistanceRequired: {
  audio: ALERT_AUDIO.resistanceRequired,
  title: 'Set Load Resistance First',
  description:
    'Please set RL using the resistance slider.',
  icon: '⚠️',
  type: 'warning',
  target: '#resistance-controls',
},
resistanceRequiredForAutoConnect: {
  audio: ALERT_AUDIO.resistanceRequired,
  title: 'Set Load Resistance First',
  description:
    'Please set RL using the resistance slider.',
  icon: '⚠️',
  type: 'warning',
  target: '#resistance-controls',
},
}
