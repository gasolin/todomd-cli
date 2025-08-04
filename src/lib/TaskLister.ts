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
          ...new Set(allTasks.flatMap((t) => t.projects || [])),
        ]
        return allProjects.length > 0
          ? allProjects.map((p) => `+${p}`).join('\n')
          : 'No projects found.'
      }
      return allTasks.filter((t) => t.projects?.includes(projectFilter.replace(/^\+/, '')))
    }
    case ValidCommands.ListCon:
    case ValidCommands.ListConAlias: {
      const contextFilter = args[0]
      if (!contextFilter) {
        const allContexts = [
          ...new Set(allTasks.flatMap((t) => t.contexts || [])),
        ]
        return allContexts.length > 0
          ? allContexts.map((c) => `@${c}`).join('\n')
          : 'No contexts found.'
      }
      return allTasks.filter((t) => t.contexts?.includes(contextFilter.replace(/^@/, '')))
    }
    case ValidCommands.Search: {
      const searchTerm = args.join(' ')
      if (!searchTerm) return 'Error: Please provide a search term'
      return allTasks.filter((t) =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    case ValidCommands.List:
    case ValidCommands.ListAlias:
    default:
      return allTasks
  }
}