function readParsedStorage(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function sanitizeSubjectsList(subjects) {
  if (!Array.isArray(subjects)) return []

  return subjects.filter(
    (subject) =>
      subject &&
      typeof subject === 'object' &&
      subject.id !== undefined &&
      subject.name !== undefined
  )
}

function dedupeSubjects(subjects) {
  const seen = new Set()

  return subjects.filter((subject) => {
    const key = String(subject.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function sanitizeStudyStorage() {
  if (typeof window === 'undefined') return

  const rawSubjects = readParsedStorage('subjects', [])
  const backupSubjects = sanitizeSubjectsList(readParsedStorage('subjects_backup', []))
  const sanitizedSubjects = dedupeSubjects(sanitizeSubjectsList(rawSubjects))
  const hasInvalidEntries = JSON.stringify(rawSubjects) !== JSON.stringify(sanitizedSubjects)

  if (hasInvalidEntries && backupSubjects.length > sanitizedSubjects.length) {
    window.localStorage.setItem('subjects', JSON.stringify(backupSubjects))
    window.localStorage.setItem('subjects_backup', JSON.stringify(backupSubjects))
    return
  }

  if (hasInvalidEntries) {
    window.localStorage.setItem('subjects', JSON.stringify(sanitizedSubjects))
  }

  if (sanitizedSubjects.length > 0) {
    window.localStorage.setItem('subjects_backup', JSON.stringify(sanitizedSubjects))
  }
}
