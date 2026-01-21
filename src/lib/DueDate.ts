import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  nextDay,
  parseISO,
  Day,
  setDay,
  differenceInDays
} from 'date-fns'

const dayMap: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
}

// Extract the date parsing logic into a reusable function
export function getDueDate(dateArg: string): Date | null {
  if (!dateArg) return null

  let dueDate: Date | null = null
  const now = new Date()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
    try {
      dueDate = parseISO(dateArg)
    } catch (e) {
      /* ignore */
    }
  } else if (dateArg === 'today') {
    dueDate = now
  } else if (dateArg === 'tomorrow') {
    dueDate = addDays(now, 1)
  } else if (dateArg === 'yesterday') {
    dueDate = addDays(now, -1)
  } else {
    const relativeMatch = dateArg.match(/in (\d+) (day|week|month|year)s?/)
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1])
      const unit = relativeMatch[2]
      if (unit === 'day') dueDate = addDays(now, amount)
      if (unit === 'week') dueDate = addWeeks(now, amount)
      if (unit === 'month') dueDate = addMonths(now, amount)
      if (unit === 'year') dueDate = addYears(now, amount)
    } else {
      const dayMatch = dateArg.match(
        /^(this |next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/
      )
      if (dayMatch) {
        const modifier = dayMatch[1]?.trim()
        const dayName = dayMatch[2]
        const day = dayMap[dayName]

        if (modifier === 'this') {
          dueDate = setDay(now, day)
        } else if (modifier === 'next') {
          dueDate = setDay(addWeeks(now, 1), day)
        } else {
          dueDate = nextDay(now, day)
        }
      }
    }
  }

  return dueDate
}

export function isNearDue(dueDate: string): boolean {
  const nearDays = parseInt(process.env.TODOMD_NEAR_DAYS || '2', 10)
  try {
    const date = parseISO(dueDate)
    return differenceInDays(date, new Date()) <= nearDays
  } catch (e) {
    return false
  }
}
