import type { Assessment, Questionnaire } from './api'
import { competencies, gap, weeks } from './demo'
import { demoOptions } from './demo-options'

export function localQuestionnaire(profession: string): Questionnaire {
  return { profession, clarification: '', source_mode: 'demo', token: 'local-demo',
    notice: 'DEMONSTRAÇÃO — sem análise Gemini. Explore competências e uma trilha de exemplo, sem personalização para a profissão.',
    competencies: competencies.map((c, i) => ({ id: `demo_${i}`, name: c.name, description: 'Competência genérica de demonstração.', question: c.question, expected_level: c.expected,
      options: demoOptions[i].map((label, value) => ({ value, label })) })) }
}
export function localAssessment(questionnaire: Questionnaire, answers: (number | null)[]): Assessment {
  const gaps = questionnaire.competencies.map((c, i) => ({ competency_id: c.id, name: c.name, expected_level: c.expected_level, self_level: answers[i] ?? 0, gap: gap(c.expected_level, answers[i] ?? 0) }))
  return { gaps, source_mode: 'demo', notice: 'DEMONSTRAÇÃO — sem análise Gemini. Narrativa e trilha genéricas calculadas localmente.',
    summary: 'Explore as diferenças como ponto de reflexão e adapte a prática ao seu contexto.',
    strengths: gaps.filter(g => g.gap === 0).map(g => `${g.name}: alcança a referência estimativa na autoavaliação.`),
    priorities: [...gaps].sort((a, b) => b.gap - a.gap).filter(g => g.gap > 0).map(g => `${g.name}: lacuna ${g.gap}.`),
    weeks: weeks.map(([title, action, deliverable], i) => ({ week: i + 1, title, objective: 'Praticar uma competência escolhida por você.', actions: [action], deliverable })),
    limitations: ['Autoavaliação orientativa; não certifica habilidades ou garante emprego.', 'Referências estimativas, sem padrão de mercado verificado.'] }
}
