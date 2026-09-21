export type PersonalGroup = 'routine' | 'health' | 'commitments' | 'completed'

/**
 * Convenção visual inicial (não é estrutura de dados real — é só um
 * agrupamento por palavra-chave de nome de tag, único lugar do
 * código que faz esse tipo de comparação). `tag.scope`/`tag.area`
 * resolveria isso de forma real no futuro; até lá, isso é o melhor
 * que dá pra fazer sem migration.
 */
const GROUP_KEYWORDS: Record<Exclude<PersonalGroup, 'completed'>, string[]> = {
    health: ['saude', 'bem-estar', 'bem estar', 'treino', 'alimentacao'],
    commitments: ['familia', 'vida social', 'financeiro', 'importante'],
    routine: ['casa', 'organizacao', 'compras', 'autocuidado'],
}

/**
 * Prioridade quando uma task tem tags de mais de um grupo — evita
 * duplicar o card em duas colunas. Ordem: saúde > compromissos >
 * rotina. Documentado aqui, não repetido em nenhum outro lugar.
 */
const GROUP_PRIORITY: Array<Exclude<PersonalGroup, 'completed'>> = [
    'health',
    'commitments',
    'routine',
]

function normalize(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
}

interface TaskForGrouping {
    status: string
    tags: Array<{ name: string }>
}

/**
 * Único lugar do código que decide em qual coluna/grupo visual uma
 * task pessoal aparece. Nunca espalhar essa comparação em outros
 * componentes — sempre importar e usar esta função.
 */
export function getPersonalGroup(task: TaskForGrouping): PersonalGroup {
    if (task.status === 'DONE') {
        return 'completed'
    }

    const normalizedTagNames = task.tags.map((t) => normalize(t.name))

    for (const group of GROUP_PRIORITY) {
        const keywords = GROUP_KEYWORDS[group]

        const matches = normalizedTagNames.some((tagName) =>
            keywords.some((keyword) => tagName.includes(keyword))
        )

        if (matches) {
            return group
        }
    }

    // Sem tag suficiente para identificar o grupo → fallback em Rotina
    // (não escondemos a task, e não criamos uma 5ª coluna "Outros").
    return 'routine'
}

export const PERSONAL_GROUP_LABELS: Record<PersonalGroup, string> = {
    routine: 'Rotina',
    health: 'Saúde e bem-estar',
    commitments: 'Compromissos',
    completed: 'Concluído',
}

export const PERSONAL_GROUP_SUBTITLES: Record<PersonalGroup, string> = {
    routine: 'Tarefas do dia a dia para uma vida mais organizada.',
    health: 'Pequenas atitudes, grandes resultados.',
    commitments: 'Pessoas, lugares e momentos que importam.',
    completed: 'Suas tarefas pessoais finalizadas.',
}
