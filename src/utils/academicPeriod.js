export function getCurrentAcademicPeriod(referenceDate = new Date()) {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const period = month < 6 ? 1 : 2

  return `${year}.${period}`
}
