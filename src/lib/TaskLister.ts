import { Task, Status } from '../types/Task'
import { ValidCommands } from '../types/Commands'

export function getListTasks(
  command: string,
  args: string[],
  allTasks: Task[]
): Task[] | string {
  switch (command) {
    case ValidCommands.ListProj:
    case ValidCommands.ListProjAlias: {
      const projectFilter = args[0]
      if (!projectFilter) {
        const allProjects = [
          ...new Set(allTasks.flatMap((t) => t.projects || []))
        ]
        return allProjects.length > 0
          ? allProjects.map((p) => `+${p}`).join('\n')
          : 'No projects found.'
      }
      const results = allTasks.filter((t) =>
        t.projects?.includes(projectFilter.replace(/^\+/, ''))
      )
      if (results.length === 0) {
        return `No tasks found for project "+${projectFilter}"`
      }
      return results
    }
    case ValidCommands.ListCon:
    case ValidCommands.ListConAlias: {
      const contextFilter = args[0]
      if (!contextFilter) {
        const allContexts = [
          ...new Set(allTasks.flatMap((t) => t.contexts || []))
        ]
        return allContexts.length > 0
          ? allContexts.map((c) => `@${c}`).join('\n')
          : 'No contexts found.'
      }
      const results = allTasks.filter((t) =>
        t.contexts?.includes(contextFilter.replace(/^@/, ''))
      )
      if (results.length === 0) {
        return `No tasks found for context "@${contextFilter}"`
      }
      return results
    }
    case ValidCommands.Search: {
      const searchTerm = args.join(' ')
      if (!searchTerm) return 'Error: Please provide a search term'
      const results = allTasks.filter((t) =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (results.length === 0) {
        return `No tasks found matching "${searchTerm}"`
      }
      return results
    }
    case ValidCommands.List:
    case ValidCommands.ListAlias:
    default:
      return allTasks
  }
}
