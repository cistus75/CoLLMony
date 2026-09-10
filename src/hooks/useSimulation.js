import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_EXPERIMENT_CONFIG, updateExperimentConfig } from '../config/simulation.js'
import { PLAYBACK_TIMING } from '../config/ui.js'
import { createWorld, getFrontier, stepWorld } from '../simulation/engine.js'

const delay = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration))
const positionsFrom = (world) => Object.fromEntries(world.agents.map((agent) => [agent.id, agent.position]))

export function useSimulation() {
  const [experimentConfig, setExperimentConfig] = useState(DEFAULT_EXPERIMENT_CONFIG)
  const [world, setWorld] = useState(() => createWorld())
  const [displayedPositions, setDisplayedPositions] = useState(() => positionsFrom(world))
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [selectedAgentId, setSelectedAgentId] = useState(1)
  const [observationMode, setObservationMode] = useState(false)
  const worldRef = useRef(world)
  const experimentConfigRef = useRef(experimentConfig)
  const speedRef = useRef(speed)
  const animationLock = useRef(false)
  const generation = useRef(0)

  useEffect(() => { speedRef.current = speed }, [speed])

  const advance = useCallback(async () => {
    if (animationLock.current || worldRef.current.status !== 'RUNNING') return
    animationLock.current = true
    const activeGeneration = generation.current
    const nextWorld = stepWorld(worldRef.current)
    const longestPath = Math.max(0, ...nextWorld.agents.map((agent) => agent.movePath.length))

    for (let step = 0; step < longestPath; step += 1) {
      await delay(Math.max(PLAYBACK_TIMING.minimumMoveStepMs, PLAYBACK_TIMING.moveStepMs / speedRef.current))
      if (activeGeneration !== generation.current) {
        animationLock.current = false
        return
      }
      setDisplayedPositions((current) => Object.fromEntries(nextWorld.agents.map((agent) => [agent.id, agent.movePath[step] ?? current[agent.id]])))
    }

    if (activeGeneration === generation.current) {
      worldRef.current = nextWorld
      setWorld(nextWorld)
      setDisplayedPositions(positionsFrom(nextWorld))
      if (nextWorld.status !== 'RUNNING') setRunning(false)
    }
    animationLock.current = false
  }, [])

  useEffect(() => {
    if (!running || world.status !== 'RUNNING') return undefined
    const timer = window.setTimeout(advance, Math.max(PLAYBACK_TIMING.minimumTickGapMs, PLAYBACK_TIMING.tickGapMs / speed))
    return () => window.clearTimeout(timer)
  }, [advance, running, speed, world.status, world.tick])

  const reset = useCallback((options = {}) => {
    generation.current += 1
    animationLock.current = false
    const nextWorld = createWorld({
      experimentConfig: options.experimentConfig ?? worldRef.current.run.config,
      personaMode: options.personaMode ?? worldRef.current.personaMode,
    })
    worldRef.current = nextWorld
    setWorld(nextWorld)
    setDisplayedPositions(positionsFrom(nextWorld))
    setSelectedAgentId(1)
    setObservationMode(false)
    setRunning(true)
  }, [])

  const updateExperimentSetting = useCallback((section, field, value) => {
    setExperimentConfig((current) => {
      const next = updateExperimentConfig(current, section, field, value)
      experimentConfigRef.current = next
      return next
    })
  }, [])

  const startExperiment = useCallback(() => {
    reset({ experimentConfig: experimentConfigRef.current })
  }, [reset])

  const rerollPersona = useCallback(() => {
    const next = updateExperimentConfig(experimentConfigRef.current, 'experiment', 'seed', experimentConfigRef.current.experiment.seed + 1)
    experimentConfigRef.current = next
    setExperimentConfig(next)
    reset({ experimentConfig: next })
  }, [reset])

  const selectAgent = useCallback((agentId) => {
    setSelectedAgentId(agentId)
    setObservationMode(true)
  }, [])

  const step = useCallback(() => {
    setRunning(false)
    void advance()
  }, [advance])

  const frontier = useMemo(() => getFrontier(world), [world])
  const selectedAgent = world.agents.find((agent) => agent.id === selectedAgentId)
  const completedBuildings = world.buildings.filter((building) => building.status === 'COMPLETE').length
  const experimentDirty = JSON.stringify(experimentConfig) !== JSON.stringify(world.run.config)

  return {
    world,
    experimentConfig,
    experimentDirty,
    displayedPositions,
    running,
    speed,
    selectedAgentId,
    selectedAgent,
    observationMode,
    frontier,
    completedBuildings,
    selectAgent,
    setSpeed,
    setPersonaMode: (personaMode) => reset({ personaMode }),
    rerollPersona,
    updateExperimentSetting,
    startExperiment,
    toggleObservation: () => setObservationMode((value) => !value),
    toggleRunning: () => setRunning((value) => !value),
    step,
    reset,
  }
}
