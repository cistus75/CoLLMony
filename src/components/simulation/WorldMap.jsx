import { RESOURCE_CONFIG, SIMULATION_CONFIG } from '../../config/simulation.js'
import { cn } from '../../lib/cn.js'
import { distance, footprintCells } from '../../simulation/engine.js'

function MapObject({ position, size = { width: 1, height: 1 }, className, children, ...props }) {
  return (
    <div
      className={cn('map-entity', className)}
      style={{ '--entity-x': position.x, '--entity-y': position.y, '--entity-width': size.width, '--entity-height': size.height }}
      {...props}
    >
      {children}
    </div>
  )
}

export function WorldMap({ className, world, displayedPositions, selectedAgentId, observationMode, onSelectAgent }) {
  const selectedPosition = displayedPositions[selectedAgentId]
  const observationConfig = world.run.config.observation
  const isVisible = (entity) => !observationMode
    || !observationConfig.partialObservation
    || footprintCells(entity).some((cell) => distance(selectedPosition, cell) <= observationConfig.fovRadius)
  const buildings = world.buildings.filter((building) => building.status !== 'LOCKED')

  return (
    <div className={cn('overflow-auto rounded-lg bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05)]', className)}>
      <div className="world-map relative aspect-square min-w-184 overflow-hidden bg-white" aria-label="32 곱하기 32 시뮬레이션 지도">
        <div className="map-major-grid absolute inset-0" aria-hidden="true" />
        {Array.from({ length: 8 }, (_, index) => (
          <span key={`x-${index}`} className="map-axis map-axis-x" style={{ '--axis-index': index }} aria-hidden="true">{index * 4}</span>
        ))}
        {Array.from({ length: 8 }, (_, index) => (
          <span key={`y-${index}`} className="map-axis map-axis-y" style={{ '--axis-index': index }} aria-hidden="true">{index * 4}</span>
        ))}

        <MapObject
          position={world.camp.position}
          size={world.camp.size}
          className={cn('z-20 grid place-items-center border border-neutral-950 bg-white', !isVisible(world.camp) && 'opacity-10')}
        >
          <div className="text-center text-[0.625rem]/3 font-semibold tracking-wide">
            <p>CAMP</p>
            <p className="font-normal text-neutral-500">{world.camp.size.width} × {world.camp.size.height}</p>
          </div>
        </MapObject>

        {world.nodes.map((node) => (
          <MapObject key={node.id} position={node.position} className={cn('z-10 grid place-items-center', !isVisible(node) && 'opacity-10')}>
            <div className="grid size-[72%] place-items-center rounded-full border border-neutral-500 bg-white text-[0.5625rem]/3 font-semibold text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              {RESOURCE_CONFIG[node.resource].code}
            </div>
          </MapObject>
        ))}

        {buildings.map((building) => (
          <MapObject
            key={building.id}
            position={building.position}
            size={building.size}
            className={cn(
              'z-20 grid place-items-center border bg-neutral-50 text-center',
              building.status === 'UNDER_CONSTRUCTION' ? 'border-dashed border-neutral-500' : 'border-neutral-800',
              !isVisible(building) && 'opacity-10',
            )}
          >
            <div className="px-1 text-[0.5625rem]/3 font-medium text-neutral-800">
              <p className="truncate">{building.name}</p>
              <p className="font-normal tabular-nums text-neutral-500">{building.size.width} × {building.size.height}</p>
            </div>
          </MapObject>
        ))}

        {world.agents.map((agent) => {
          const position = displayedPositions[agent.id]
          const visible = isVisible({ position }) || agent.id === selectedAgentId
          const selected = agent.id === selectedAgentId
          return (
            <button
              key={agent.id}
              type="button"
              className={cn('map-entity agent-entity z-30 grid place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950', !visible && 'opacity-10')}
              style={{ '--entity-x': position.x, '--entity-y': position.y, '--entity-width': 1, '--entity-height': 1 }}
              aria-label={`Agent ${agent.name} 선택`}
              aria-pressed={selected}
              onClick={() => onSelectAgent(agent.id)}
            >
              <span className={cn('grid size-[70%] place-items-center rounded-[0.3rem] border text-[0.625rem]/3 font-semibold', selected ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-600 bg-white text-neutral-900')}>
                {agent.name}
              </span>
              <span className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
