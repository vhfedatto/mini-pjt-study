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

export function sanitizeStudyStorage() {
  if (typeof window === 'undefined') return

  const rawSubjects = readParsedStorage('subjects', [])
  const sanitizedSubjects = sanitizeSubjectsList(rawSubjects)

  if (JSON.stringify(rawSubjects) !== JSON.stringify(sanitizedSubjects)) {
    window.localStorage.setItem('subjects', JSON.stringify(sanitizedSubjects))
  }
}
