import { selectOracleSmokeActions } from './defaultPolicy.ts'

export const oracleSmokeController = {
  id: 'oracle-smoke-controller',
  decide(observations, { world }) {
    const agentIds = new Set(observations.map((observation) => observation.self.id))
    return selectOracleSmokeActions(world).filter((action) => agentIds.has(action.agentId))
  },
}
