// Plano de demonstração só para conhecer o app. Substitua pelas suas fichas em Ajustes > Importar ficha.
export const EXEMPLO = {
  exercicios: [
    { id: 'supino-maquina', nome: 'Supino na máquina', grupo: 'Peito',
      dicas: ['Ombros para trás e para baixo, encostados no banco.', 'Empurre sem travar os cotovelos no final.', 'Volte devagar, contando 2 segundos.'] },
    { id: 'remada-baixa', nome: 'Remada baixa no cabo', grupo: 'Costas',
      dicas: ['Peito aberto e coluna neutra.', 'Puxe os cotovelos para trás, perto do corpo.', 'Não balance o tronco para ajudar.'] },
    { id: 'desenvolvimento-halteres', nome: 'Desenvolvimento com halteres', grupo: 'Ombros',
      dicas: ['Abdômen firme para não arquear a lombar.', 'Suba sem encostar os halteres no topo.'] },
    { id: 'elevacao-pelvica', nome: 'Elevação pélvica', grupo: 'Glúteos',
      dicas: ['Queixo levemente recolhido, olhar à frente.', 'Suba com a força do glúteo e segure 1 segundo no topo.', 'Costelas para baixo, sem exagerar na lombar.'] },
    { id: 'mesa-flexora', nome: 'Mesa flexora', grupo: 'Posteriores',
      dicas: ['Quadril colado no banco.', 'Suba sem balançar e desça em 3 segundos.'] },
    { id: 'cadeira-abdutora', nome: 'Cadeira abdutora', grupo: 'Glúteos',
      dicas: ['Tronco levemente inclinado à frente aumenta o glúteo médio.', 'Abra sem pressa e controle a volta.'] },
    { id: 'prancha', nome: 'Prancha', grupo: 'Abdômen',
      dicas: ['Linha reta da cabeça aos calcanhares.', 'Aperte glúteos e abdômen o tempo todo.'] }
  ],
  fichas: [
    { id: 'exemplo-a', nome: 'Exemplo: superiores', foco: 'Peito, costas e ombros', itens: [
      { ex: 'supino-maquina', series: 3, reps: '10-12', descanso: 60 },
      { ex: 'remada-baixa', series: 3, reps: '10-12', descanso: 60 },
      { ex: 'desenvolvimento-halteres', series: 3, reps: '10', descanso: 60 },
      { ex: 'prancha', series: 3, reps: '30s', descanso: 45 }
    ] },
    { id: 'exemplo-b', nome: 'Exemplo: inferiores', foco: 'Glúteos e posteriores', itens: [
      { ex: 'elevacao-pelvica', series: 3, reps: '12', descanso: 75 },
      { ex: 'mesa-flexora', series: 3, reps: '12', descanso: 60 },
      { ex: 'cadeira-abdutora', series: 3, reps: '15', descanso: 45 }
    ] }
  ],
  agenda: {}
};
