import ObservationTable from './ObservationTable.jsx'
import ReportControls from './ReportControls.jsx'
import ResistanceSlider from './ResistanceSlider.jsx'
import SectionCard from './SectionCard.jsx'

const ControlPanel = ({
  locked,
  maxResistancePosition,
  minResistancePosition,
  onGenerateReport,
  onResistanceLocked,
  observations,
  reportGenerated,
  rl,
  setRl,
  theoremVerified,
}) => (
  <>
    <SectionCard
      className="h-[104px]"
      icon="sliders"
      id="resistance-controls"
      title="RESISTANCE SLIDER"
    >
      <div className="flex flex-col gap-[14.4px] px-[20.8px] pt-[30.8px]">

        <ResistanceSlider
          disabled={locked}
          label="RL"
          maxPosition={maxResistancePosition}
          minPosition={minResistancePosition}
          onChange={setRl}
          onDisabledInteraction={onResistanceLocked}
          value={rl}
        />

      </div>
    </SectionCard>

    <ObservationTable observations={observations} />

    <ReportControls
      onGenerateReport={onGenerateReport}
      reportGenerated={reportGenerated}
      theoremVerified={theoremVerified}
    />
  </>
)

export default ControlPanel
