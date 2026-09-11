export function createEpisodeRecorder(initialWorld) {
  const ticks = []
  const events = structuredClone(initialWorld.log)
  const run = {
    id: initialWorld.run.id,
    config: structuredClone(initialWorld.run.config),
  }

  return {
    recordTick({ before, after, observations, actions, controllerId }) {
      const previousEventIds = new Set(before.log.map((event) => event.id))
      events.push(...structuredClone(after.log.filter((event) => !previousEventIds.has(event.id))))
      ticks.push({
        tick: after.tick,
        controllerId,
        observations: structuredClone(observations),
        actions: structuredClone(actions),
        resolvedActions: after.agents.map((agent) => ({ agentId: agent.id, action: structuredClone(agent.action) })),
        state: {
          before: { status: before.status, launchStatus: before.launch.status },
          after: { status: after.status, launchStatus: after.launch.status },
        },
      })
    },
    result(finalWorld) {
      return structuredClone({
        run,
        outcome: { status: finalWorld.status, tick: finalWorld.tick },
        events,
        ticks,
      })
    },
  }
}
