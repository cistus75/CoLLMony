import { selectDefaultActions } from './defaultPolicy.js'

export const defaultController = {
  id: 'default-policy',
  decide(observations, { world }) {
    const agentIds = new Set(observations.map((observation) => observation.self.id))
    return selectDefaultActions(world).filter((action) => agentIds.has(action.agentId))
  },
}
