export function step(title, why, command, expected, explanation, next, expectedCode = 0) {
  return { title, why, command, expected, explanation, next, expectedCode }
}

export function problem(symptom, cause, fix) {
  return { symptom, cause, fix }
}

export function advancedCase(data) {
  return { ...data, level: 'advanced', reviewedAt: '2026-09-03' }
}

export function hypothesis(title, evidence, interpretation, next) {
  return { title, evidence, interpretation, next }
}
