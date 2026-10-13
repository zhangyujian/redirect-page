import { createSandbox, executeSandbox } from '../sandbox/index.js'

export function createPracticeSession(distro) {
  return { sandbox: createSandbox(distro), nextStep: 0, results: [] }
}

export function advancePracticeSession(session, practice) {
  const step = practice.steps[session.nextStep]
  if (!step) return session
  let response
  try {
    response = executeSandbox(session.sandbox, step.command)
  } catch {
    response = { code: -1, lines: ['演练未能执行，请重试或重置本案例。'] }
  }
  const accepted = response.code === step.expectedCode
  const results = [...session.results]
  results[session.nextStep] = { code: response.code, lines: response.lines, accepted }
  // Unexpected failures leave the prior sandbox intact so retries cannot compound partial writes.
  return { sandbox: accepted ? response.state : session.sandbox, nextStep: session.nextStep + (accepted ? 1 : 0), results }
}

export function formatPracticeReport(practice, session) {
  return [
    practice.title,
    '离线演练：' + session.nextStep + ' / ' + practice.steps.length + ' 步；不代表真实环境已验证。',
    ...practice.steps.map((step, index) => {
      const result = session.results[index]
      return [
        '\n' + (index + 1) + '. ' + step.title,
        '$ ' + step.command,
        result ? '实际退出码：' + result.code + '；预期退出码：' + step.expectedCode : '本步尚未执行',
        result ? result.lines.join('\n') || '（没有文本输出）' : '',
        result && !result.accepted ? '输出未符合预期，未推进步骤。' : '',
      ].filter(Boolean).join('\n')
    }),
    '\n复盘模板（示例，请按实际观察修改；不是自动生成的真实环境结论）：',
    practice.report,
  ].join('\n')
}
