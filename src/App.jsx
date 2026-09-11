import { AppHeader } from './components/AppHeader.jsx'
import { Inspector } from './components/inspector/Inspector.jsx'
import { SimulationToolbar } from './components/simulation/SimulationToolbar.jsx'
import { WorldMap } from './components/simulation/WorldMap.jsx'
import { SIMULATION_CONFIG } from './config/simulation.js'
import { useSimulation } from './hooks/useSimulation.js'

export default function App() {
  const simulation = useSimulation()
  const selectedPosition = simulation.displayedPositions[simulation.selectedAgentId]
  const observationConfig = simulation.world.run.config.observation

  return (
    <div className="isolate min-h-dvh bg-neutral-100 text-neutral-950 antialiased">
      <AppHeader world={simulation.world} running={simulation.running} />

      <main className="mx-auto grid max-w-400 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-5 lg:p-8">
        <section className="min-w-0">
          <div className="flex flex-col gap-3 pb-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">World grid</h1>
              <p className="text-base text-neutral-500 sm:text-sm">
                {SIMULATION_CONFIG.width} × {SIMULATION_CONFIG.height} · 1 cell = 1 tile · 1 tick = 최대 {SIMULATION_CONFIG.moveCellsPerTick}개 연속 셀
              </p>
            </div>
            <SimulationToolbar
              observationMode={simulation.observationMode}
              selectedAgentName={simulation.selectedAgent.name}
              running={simulation.running}
              speed={simulation.speed}
              onToggleObservation={simulation.toggleObservation}
              onSpeedChange={simulation.setSpeed}
              onStep={simulation.step}
              onToggleRunning={simulation.toggleRunning}
              onReset={() => simulation.reset()}
            />
          </div>

          <WorldMap
            world={simulation.world}
            displayedPositions={simulation.displayedPositions}
            selectedAgentId={simulation.selectedAgentId}
            observationMode={simulation.observationMode}
            onSelectAgent={simulation.selectAgent}
          />

          <div className="flex flex-col gap-2 py-3 text-base text-neutral-600 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <p>
              선택: <span className="tabular-nums font-medium text-neutral-950">Agent {simulation.selectedAgent.name} · ({selectedPosition.x}, {selectedPosition.y}) · {simulation.selectedAgent.action.type}</span>
            </p>
            <p>{observationConfig.partialObservation ? `관찰 반경 ${observationConfig.fovRadius}칸` : '전체 지도 관찰'} · 건물 좌표는 좌상단 셀 기준</p>
          </div>
        </section>

        <Inspector
          world={simulation.world}
          selectedAgentId={simulation.selectedAgentId}
          frontier={simulation.frontier}
          completedBuildings={simulation.completedBuildings}
          onSelectAgent={simulation.selectAgent}
          onPersonaMode={simulation.setPersonaMode}
          onReroll={simulation.rerollPersona}
          experimentConfig={simulation.experimentConfig}
          experimentDirty={simulation.experimentDirty}
          onExperimentChange={simulation.updateExperimentSetting}
          onExperimentStart={simulation.startExperiment}
        />
      </main>
    </div>
  )
}
