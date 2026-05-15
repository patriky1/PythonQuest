import { Lesson, Topic } from '@/types/course';
import { topic2ExtraLessons } from '@/data/topic2ExtraLessons';

export const topics: Topic[] = [
  {
    id: 'fundamentos',
    title: 'Fundamentos',
    description: 'Variáveis, tipos, operadores e primeiras instruções em Python.',
    color: '#12B886',
    emoji: '🐣',
    lessonIds: ['boas-vindas-python', 'variaveis', 'tipos-operadores', 'fstrings-formatacao', 'calculo-compra-desconto', 'media-ponderada-comparacao', 'erros-comuns-fundamentos', 'praticas-fundamentos', 'mini-projeto-calculadora-compra']
  },
  {
    id: 'controle-fluxo',
    title: 'Controle de fluxo',
    description: 'if/else, comparações e repetições com loops.',
    color: '#339AF0',
    emoji: '🧭',
    lessonIds: [
  'controle-fluxo-introducao',
  'if-else',
  'elif-classificacao-nota',
  'loops',
  'for-range-acumulador',
  'while-contagem-regressiva',
  'sistema-aprovacao-integrado',
  'erros-comuns-controle-fluxo',
  'praticas-controle-fluxo',
  'mini-projeto-caixa-eletronico'
]
  },
  {
    id: 'funcoes',
    title: 'Funções e escopo',
    description: 'Como organizar código em blocos reutilizáveis.',
    color: '#845EF7',
    emoji: '🛠️',
    lessonIds: ['funcoes-basicas']
  },
  {
    id: 'estruturas',
    title: 'Estruturas de dados',
    description: 'Listas, tuplas, dicionários e sets.',
    color: '#F08C00',
    emoji: '🎒',
    lessonIds: ['listas', 'dicionarios']
  }
];

export const lessons: Lesson[] = [
  {
    id: 'boas-vindas-python',
    title: 'Primeiro contato com Python',
    subtitle: 'Entenda o que é programar antes de decorar comandos.',
    topicId: 'fundamentos',
    difficulty: 'iniciante',
    xp: 20,
    estimatedMinutes: 4,
    steps: [
      {
        id: 'intro',
        type: 'content',
        title: 'Programar é dar instruções',
        body: 'Python é uma linguagem usada para conversar com o computador. Você escreve instruções, o computador executa e devolve um resultado.',
        analogy: 'Imagine uma receita de bolo: cada linha é uma etapa que precisa estar clara e na ordem certa.',
        code: "print('Olá, PythonQuest!')"
      },
      {
        id: 'quiz-programar',
        type: 'quiz',
        title: 'Missão rápida',
        question: 'Qual frase explica melhor o que é programar?',
        choices: [
          { id: 'a', text: 'Dar instruções claras para o computador executar.', isCorrect: true, feedback: 'Perfeito. Programar é organizar instruções em uma sequência lógica.' },
          { id: 'b', text: 'Apenas decorar palavras em inglês.', isCorrect: false, feedback: 'Não. Algumas palavras são em inglês, mas o principal é lógica.' },
          { id: 'c', text: 'Mexer apenas com jogos e redes sociais.', isCorrect: false, feedback: 'Python pode criar jogos, sites, automações, análises e muito mais.' }
        ]
      },
      {
        id: 'print',
        type: 'code',
        title: 'Complete o comando',
        prompt: 'Qual comando mostra uma mensagem na tela?',
        code: "____('Aprendendo Python')",
        choices: [
          { id: 'a', text: 'print', isCorrect: true, feedback: 'Isso mesmo. print() exibe informações na tela.' },
          { id: 'b', text: 'show', isCorrect: false, feedback: 'show não é o comando padrão do Python para imprimir na tela.' },
          { id: 'c', text: 'text', isCorrect: false, feedback: 'text não executa a saída de mensagem em Python.' }
        ]
      }
    ]
  },
  {
    id: 'variaveis',
    title: 'Variáveis',
    subtitle: 'Guarde informações para usar depois.',
    topicId: 'fundamentos',
    difficulty: 'iniciante',
    xp: 25,
    estimatedMinutes: 6,
    steps: [
      {
        id: 'conceito',
        type: 'content',
        title: 'Variável é uma etiqueta',
        body: 'Uma variável guarda um valor. Em vez de repetir o valor várias vezes, você dá um nome para ele.',
        analogy: 'Pense em uma caixa com etiqueta: a etiqueta é o nome da variável, e o conteúdo da caixa é o valor.',
        code: "nome = 'Ana'\nidade = 16\nprint(nome)"
      },
      {
        id: 'quiz-variavel',
        type: 'quiz',
        title: 'Identifique a variável',
        question: 'No código idade = 20, o que é idade?',
        choices: [
          { id: 'a', text: 'O nome da variável.', isCorrect: true, feedback: 'Correto. idade é o nome usado para guardar o valor 20.' },
          { id: 'b', text: 'O tipo do dado.', isCorrect: false, feedback: 'O tipo do dado é numérico, mas idade é o nome da variável.' },
          { id: 'c', text: 'Um erro obrigatório.', isCorrect: false, feedback: 'Não há erro. Essa é uma atribuição válida em Python.' }
        ]
      },
      {
        id: 'code-atribuicao',
        type: 'code',
        title: 'Complete a atribuição',
        prompt: 'Qual símbolo é usado para guardar um valor em uma variável?',
        code: 'pontuacao ____ 100',
        choices: [
          { id: 'a', text: '=', isCorrect: true, feedback: 'Exato. O sinal = atribui o valor à variável.' },
          { id: 'b', text: '==', isCorrect: false, feedback: '== compara valores. Para atribuir, use =.' },
          { id: 'c', text: '=>', isCorrect: false, feedback: 'Esse símbolo não é usado para atribuição básica em Python.' }
        ]
      }
    ]
  },
  {
    id: 'tipos-operadores',
    title: 'Tipos e operadores',
    subtitle: 'Texto, número, verdadeiro/falso e contas.',
    topicId: 'fundamentos',
    difficulty: 'iniciante',
    xp: 30,
    estimatedMinutes: 7,
    steps: [
      {
        id: 'tipos',
        type: 'content',
        title: 'Cada valor tem um tipo',
        body: 'Python diferencia texto, número inteiro, número decimal e valores lógicos. Isso ajuda o programa a saber o que pode fazer com cada dado.',
        code: "nome = 'Bia'      # str\nidade = 18       # int\naltura = 1.70    # float\naprovado = True  # bool"
      },
      {
        id: 'quiz-tipo',
        type: 'quiz',
        title: 'Tipo correto',
        question: "Qual é o tipo do valor 'Python' entre aspas?",
        choices: [
          { id: 'a', text: 'str', isCorrect: true, feedback: 'Correto. Texto entre aspas é string, abreviado como str.' },
          { id: 'b', text: 'int', isCorrect: false, feedback: 'int é usado para números inteiros.' },
          { id: 'c', text: 'bool', isCorrect: false, feedback: 'bool representa True ou False.' }
        ]
      },
      {
        id: 'operador',
        type: 'code',
        title: 'Complete a conta',
        prompt: 'Qual operador multiplica valores em Python?',
        code: 'resultado = 7 ____ 3',
        choices: [
          { id: 'a', text: '*', isCorrect: true, feedback: 'Isso. O asterisco multiplica.' },
          { id: 'b', text: 'x', isCorrect: false, feedback: 'Em Python, x não é operador de multiplicação.' },
          { id: 'c', text: '^', isCorrect: false, feedback: '^ não multiplica em Python.' }
        ]
      }
    ]
  },
  {
    id: 'fstrings-formatacao',
    title: 'F-strings e formatação',
    subtitle: 'Monte mensagens, veja tipos e formate valores decimais.',
    topicId: 'fundamentos',
    difficulty: 'iniciante',
    xp: 35,
    estimatedMinutes: 8,
    steps: [
      {
        id: 'fstring-conceito',
        type: 'content',
        title: 'Juntando texto e dados',
        body: 'Depois de criar variáveis, precisamos mostrar os valores de forma clara. A f-string permite misturar texto com variáveis usando chaves. Ela evita erros comuns ao juntar texto com números.',
        analogy: 'Imagine um crachá preenchido automaticamente: o modelo tem espaços vazios, e o Python coloca nome, idade e altura nos lugares certos.',
        code: "nome = 'Ana'\nidade = 25\naltura = 1.68\n\nprint(f'Olá, {nome}!')\nprint(f'{nome} tem {idade} anos e mede {altura:.2f} m.')"
      },
      {
        id: 'type-conceito',
        type: 'content',
        title: 'Descobrindo o tipo de dado',
        body: 'A função type() mostra o tipo de um valor. Usar .__name__ deixa a saída mais limpa, mostrando apenas str, int, float ou bool.',
        code: "nome = 'Ana'\nidade = 25\naltura = 1.68\nesta_estudando = True\n\nprint(type(nome).__name__)\nprint(type(idade).__name__)\nprint(type(altura).__name__)\nprint(type(esta_estudando).__name__)"
      },
      {
        id: 'quiz-fstring',
        type: 'quiz',
        title: 'Mensagem dinâmica',
        question: 'Qual alternativa usa f-string corretamente para mostrar o valor de nome?',
        choices: [
          { id: 'a', text: "print(f'Olá, {nome}!')", isCorrect: true, feedback: 'Correto. O f antes das aspas permite inserir variáveis dentro das chaves.' },
          { id: 'b', text: "print('Olá, {nome}!')", isCorrect: false, feedback: 'Sem o f antes das aspas, o Python imprime {nome} como texto comum.' },
          { id: 'c', text: "print(f'Olá, nome!')", isCorrect: false, feedback: 'Assim o Python imprime a palavra nome, não o valor da variável.' }
        ]
      },
      {
        id: 'code-decimais',
        type: 'code',
        title: 'Duas casas decimais',
        prompt: 'Qual trecho completa a f-string para exibir preço com duas casas decimais?',
        code: "preco = 19.9\nprint(f'Preço: R$ {preco____}')",
        choices: [
          { id: 'a', text: ':.2f', isCorrect: true, feedback: 'Perfeito. :.2f formata o número com duas casas decimais.' },
          { id: 'b', text: ',2f', isCorrect: false, feedback: 'Em f-string, a formatação usa dois pontos antes do padrão.' },
          { id: 'c', text: '.2', isCorrect: false, feedback: 'Falta indicar que o resultado deve ser formatado como float com f.' }
        ]
      }
    ]
  },
  {
    id: 'calculo-compra-desconto',
    title: 'Compra com desconto',
    subtitle: 'Use variáveis e operadores para calcular subtotal, desconto e total.',
    topicId: 'fundamentos',
    difficulty: 'iniciante',
    xp: 40,
    estimatedMinutes: 9,
    steps: [
      {
        id: 'compra-contexto',
        type: 'content',
        title: 'Transformando uma compra em código',
        body: 'Um programa pode guardar o produto, o preço, a quantidade e o percentual de desconto. Depois, usa operadores aritméticos para calcular subtotal, valor do desconto e total final.',
        code: "produto = 'Caderno'\npreco_unitario = 18.90\nquantidade = 3\ndesconto_percentual = 10\n\nsubtotal = preco_unitario * quantidade\nvalor_desconto = subtotal * desconto_percentual / 100\ntotal = subtotal - valor_desconto"
      },
      {
        id: 'saida-compra',
        type: 'content',
        title: 'Saída esperada',
        body: 'Com os valores do exemplo, o subtotal é 56.70, o desconto é 5.67 e o total final é 51.03. A formatação monetária deixa a resposta mais profissional.',
        code: "print(f'Produto: {produto}')\nprint(f'Subtotal: R$ {subtotal:.2f}')\nprint(f'Desconto: R$ {valor_desconto:.2f}')\nprint(f'Total a pagar: R$ {total:.2f}')"
      },
      {
        id: 'quiz-subtotal',
        type: 'quiz',
        title: 'Subtotal',
        question: 'Se preco_unitario = 18.90 e quantidade = 3, qual expressão calcula o subtotal?',
        choices: [
          { id: 'a', text: 'subtotal = preco_unitario * quantidade', isCorrect: true, feedback: 'Correto. Multiplicamos preço pela quantidade.' },
          { id: 'b', text: 'subtotal = preco_unitario + quantidade', isCorrect: false, feedback: 'Somar não calcula o valor de vários itens iguais.' },
          { id: 'c', text: 'subtotal = preco_unitario / quantidade', isCorrect: false, feedback: 'Dividir não representa a compra de várias unidades.' }
        ]
      },
      {
        id: 'code-desconto',
        type: 'code',
        title: 'Fórmula do desconto',
        prompt: 'Complete a fórmula para calcular o valor do desconto em percentual.',
        code: 'valor_desconto = subtotal * desconto_percentual ____ 100',
        choices: [
          { id: 'a', text: '/', isCorrect: true, feedback: 'Exato. Percentual significa dividir por 100.' },
          { id: 'b', text: '+', isCorrect: false, feedback: 'Somar 100 não transforma o percentual em proporção.' },
          { id: 'c', text: '-', isCorrect: false, feedback: 'Subtrair 100 não calcula percentual.' }
        ]
      }
    ]
  },
  {
    id: 'media-ponderada-comparacao',
    title: 'Média ponderada e comparação',
    subtitle: 'Calcule média com pesos e verifique aprovação com True ou False.',
    topicId: 'fundamentos',
    difficulty: 'iniciante',
    xp: 45,
    estimatedMinutes: 10,
    steps: [
      {
        id: 'media-conceito',
        type: 'content',
        title: 'Notas podem ter pesos diferentes',
        body: 'Na média ponderada, cada nota pode ter uma importância diferente. Por isso, multiplicamos cada nota pelo seu peso e dividimos pela soma dos pesos.',
        code: "nota_1 = 8.0\nnota_2 = 6.5\nnota_3 = 7.5\npeso_1 = 2\npeso_2 = 3\npeso_3 = 5\n\nmedia = (nota_1 * peso_1 + nota_2 * peso_2 + nota_3 * peso_3) / (peso_1 + peso_2 + peso_3)"
      },
      {
        id: 'aprovacao-conceito',
        type: 'content',
        title: 'Comparações retornam booleanos',
        body: 'Depois de calcular a média, podemos comparar com a nota mínima. O resultado de uma comparação é sempre True ou False.',
        code: "nota_minima = 7.0\nfoi_aprovado = media >= nota_minima\n\nprint(f'Média ponderada: {media:.2f}')\nprint(f'Aprovado? {foi_aprovado}')"
      },
      {
        id: 'quiz-maior-igual',
        type: 'quiz',
        title: 'Operador de aprovação',
        question: 'Qual operador verifica se a média é maior ou igual à nota mínima?',
        choices: [
          { id: 'a', text: '>=', isCorrect: true, feedback: 'Correto. >= significa maior ou igual.' },
          { id: 'b', text: '=>', isCorrect: false, feedback: 'Esse símbolo não é o operador de comparação em Python.' },
          { id: 'c', text: '=', isCorrect: false, feedback: '= atribui valor. Para comparar, usamos operadores como >= ou ==.' }
        ]
      },
      {
        id: 'code-media-ponderada',
        type: 'code',
        title: 'Complete a fórmula',
        prompt: 'Qual parte final divide pela soma dos pesos?',
        code: 'media = (nota_1 * peso_1 + nota_2 * peso_2 + nota_3 * peso_3) ____',
        choices: [
          { id: 'a', text: '/ (peso_1 + peso_2 + peso_3)', isCorrect: true, feedback: 'Perfeito. A média ponderada divide a soma ponderada pela soma dos pesos.' },
          { id: 'b', text: '/ 3', isCorrect: false, feedback: 'Dividir por 3 seria média simples, não ponderada.' },
          { id: 'c', text: '* (peso_1 + peso_2 + peso_3)', isCorrect: false, feedback: 'Multiplicar pela soma dos pesos aumentaria indevidamente o resultado.' }
        ]
      }
    ]
  },
  {
    id: 'erros-comuns-fundamentos',
    title: 'Erros comuns em fundamentos',
    subtitle: 'Evite confundir texto com número, vírgula decimal e comparação.',
    topicId: 'fundamentos',
    difficulty: 'iniciante',
    xp: 45,
    estimatedMinutes: 10,
    steps: [
      {
        id: 'erro-texto-numero',
        type: 'content',
        title: 'Erro: somar texto com número',
        body: 'Python não junta texto e número diretamente com +. Para montar a mensagem, use f-string ou converta o número para texto.',
        code: "# Errado\nidade = 25\nmensagem = 'Idade: ' + idade\n\n# Correto\nmensagem = f'Idade: {idade}'"
      },
      {
        id: 'erro-virgula-decimal',
        type: 'content',
        title: 'Erro: usar vírgula em decimal',
        body: 'Em Python, número decimal usa ponto. Se você escrever 19,90, o Python entende como dois valores agrupados, não como dezenove reais e noventa centavos.',
        code: "# Errado\npreco = 19,90\n\n# Correto\npreco = 19.90\nprint(f'Preço: R$ {preco:.2f}')"
      },
      {
        id: 'erro-igual-comparacao',
        type: 'content',
        title: 'Erro: confundir = com ==',
        body: '= serve para atribuir valor. == serve para comparar valores. Essa diferença é essencial para evitar bugs em condições e testes.',
        code: "idade = 18\nresultado = idade == 18\nprint(f'Idade é igual a 18? {resultado}')"
      },
      {
        id: 'quiz-igual',
        type: 'quiz',
        title: 'Atribuir ou comparar?',
        question: 'Qual símbolo deve ser usado para comparar se idade é igual a 18?',
        choices: [
          { id: 'a', text: '==', isCorrect: true, feedback: 'Correto. == compara dois valores.' },
          { id: 'b', text: '=', isCorrect: false, feedback: '= atribui valor; não é o operador de comparação.' },
          { id: 'c', text: '===', isCorrect: false, feedback: '=== não é usado em Python para comparação.' }
        ]
      },
      {
        id: 'quiz-decimal',
        type: 'quiz',
        title: 'Decimal correto',
        question: 'Qual forma representa corretamente um número decimal em Python?',
        choices: [
          { id: 'a', text: 'preco = 19.90', isCorrect: true, feedback: 'Isso. Python usa ponto como separador decimal.' },
          { id: 'b', text: 'preco = 19,90', isCorrect: false, feedback: 'Com vírgula, Python entende outro tipo de estrutura, não um decimal simples.' },
          { id: 'c', text: "preco = '19,90'", isCorrect: false, feedback: 'Isso vira texto, não número decimal para cálculo.' }
        ]
      }
    ]
  },
  {
    id: 'praticas-fundamentos',
    title: 'Práticas de compra e salário',
    subtitle: 'Resolva exercícios aplicando variáveis, cálculos e formatação.',
    topicId: 'fundamentos',
    difficulty: 'iniciante',
    xp: 50,
    estimatedMinutes: 12,
    steps: [
      {
        id: 'exercicio-compra',
        type: 'content',
        title: 'Exercício: total de compra',
        body: 'Crie um programa que guarde produto, preço unitário e quantidade. Depois, calcule o total da compra e mostre tudo formatado.',
        code: "produto = 'Caneta'\npreco = 2.50\nquantidade = 4\ntotal = preco * quantidade\n\nprint(f'Produto: {produto}')\nprint(f'Preço unitário: R$ {preco:.2f}')\nprint(f'Quantidade: {quantidade}')\nprint(f'Total: R$ {total:.2f}')"
      },
      {
        id: 'quiz-total-caneta',
        type: 'quiz',
        title: 'Total da compra',
        question: 'Se uma caneta custa R$ 2.50 e a quantidade é 4, qual é o total?',
        choices: [
          { id: 'a', text: 'R$ 10.00', isCorrect: true, feedback: 'Correto. 2.50 multiplicado por 4 é 10.00.' },
          { id: 'b', text: 'R$ 6.50', isCorrect: false, feedback: 'Esse resultado soma preço e quantidade, mas o total usa multiplicação.' },
          { id: 'c', text: 'R$ 1.60', isCorrect: false, feedback: 'Esse valor não representa preço vezes quantidade.' }
        ]
      },
      {
        id: 'exercicio-salario',
        type: 'content',
        title: 'Exercício: salário líquido estimado',
        body: 'Agora usamos salário bruto, percentual de imposto e percentual de bônus. A regra é: salário líquido = salário bruto - imposto + bônus.',
        code: "nome = 'Carla'\nsalario_bruto = 3500.00\npercentual_imposto = 11.0\npercentual_bonus = 8.0\n\nvalor_imposto = salario_bruto * percentual_imposto / 100\nvalor_bonus = salario_bruto * percentual_bonus / 100\nsalario_liquido = salario_bruto - valor_imposto + valor_bonus"
      },
      {
        id: 'code-salario-liquido',
        type: 'code',
        title: 'Complete o salário líquido',
        prompt: 'Qual fórmula aplica imposto e bônus corretamente?',
        code: 'salario_liquido = ____',
        choices: [
          { id: 'a', text: 'salario_bruto - valor_imposto + valor_bonus', isCorrect: true, feedback: 'Correto. Primeiro desconta o imposto e depois soma o bônus.' },
          { id: 'b', text: 'salario_bruto + valor_imposto - valor_bonus', isCorrect: false, feedback: 'Essa opção aumenta pelo imposto e reduz pelo bônus, invertendo a lógica.' },
          { id: 'c', text: 'salario_bruto - percentual_imposto + percentual_bonus', isCorrect: false, feedback: 'Você precisa usar os valores calculados em reais, não apenas os percentuais.' }
        ]
      }
    ]
  },
  {
    id: 'mini-projeto-calculadora-compra',
    title: 'Mini-projeto: calculadora de compra',
    subtitle: 'Monte um pequeno programa completo com cliente, produto e desconto.',
    topicId: 'fundamentos',
    difficulty: 'iniciante',
    xp: 60,
    estimatedMinutes: 14,
    steps: [
      {
        id: 'mini-projeto-briefing',
        type: 'content',
        title: 'Missão final do Tópico 1',
        body: 'Crie uma calculadora simples de compra. Ela deve registrar cliente, produto, preço unitário, quantidade e percentual de desconto. Depois, deve calcular subtotal, valor do desconto e total final.',
        analogy: 'É como o caixa de uma loja: primeiro registra os dados da compra, depois calcula o desconto e mostra o total ao cliente.',
        code: "cliente = 'João'\nproduto = 'Mochila'\npreco_unitario = 120.00\nquantidade = 2\ndesconto_percentual = 10"
      },
      {
        id: 'mini-projeto-calculos',
        type: 'content',
        title: 'Cálculos principais',
        body: 'O subtotal vem da multiplicação entre preço e quantidade. O desconto é uma porcentagem do subtotal. O total final é o subtotal menos o desconto.',
        code: "subtotal = preco_unitario * quantidade\nvalor_desconto = subtotal * desconto_percentual / 100\ntotal_final = subtotal - valor_desconto"
      },
      {
        id: 'mini-projeto-saida',
        type: 'content',
        title: 'Saída esperada',
        body: 'A saída deve ser organizada para o usuário entender cada parte do cálculo.',
        code: "Cliente: João\nProduto: Mochila\nPreço unitário: R$ 120.00\nQuantidade: 2\nSubtotal: R$ 240.00\nDesconto: R$ 24.00\nTotal final: R$ 216.00"
      },
      {
        id: 'code-subtotal-mini',
        type: 'code',
        title: 'Complete o subtotal',
        prompt: 'Qual fórmula calcula o subtotal do mini-projeto?',
        code: 'subtotal = ____',
        choices: [
          { id: 'a', text: 'preco_unitario * quantidade', isCorrect: true, feedback: 'Correto. Subtotal é preço unitário vezes quantidade.' },
          { id: 'b', text: 'preco_unitario - quantidade', isCorrect: false, feedback: 'Subtrair não representa a quantidade comprada.' },
          { id: 'c', text: 'preco_unitario / desconto_percentual', isCorrect: false, feedback: 'O desconto entra depois do subtotal.' }
        ]
      },
      {
        id: 'quiz-total-final',
        type: 'quiz',
        title: 'Total final',
        question: 'Com subtotal de R$ 240.00 e desconto de R$ 24.00, qual é o total final?',
        choices: [
          { id: 'a', text: 'R$ 216.00', isCorrect: true, feedback: 'Exato. 240.00 menos 24.00 é 216.00.' },
          { id: 'b', text: 'R$ 264.00', isCorrect: false, feedback: 'Esse valor soma o desconto em vez de subtrair.' },
          { id: 'c', text: 'R$ 24.00', isCorrect: false, feedback: 'Esse é o valor do desconto, não o total final.' }
        ]
      }
    ]
  },
  {
    id: 'if-else',
    title: 'Decisões com if/else',
    subtitle: 'Faça o programa escolher caminhos.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 30,
    estimatedMinutes: 7,
    steps: [
      {
        id: 'if-conceito',
        type: 'content',
        title: 'if é uma bifurcação',
        body: 'O if permite executar uma ação se uma condição for verdadeira. O else define o caminho alternativo.',
        analogy: 'É como uma placa: se estiver chovendo, pegue guarda-chuva; caso contrário, siga sem ele.',
        code: "idade = 18\nif idade >= 18:\n    print('Maior de idade')\nelse:\n    print('Menor de idade')"
      },
      {
        id: 'quiz-if',
        type: 'quiz',
        title: 'Condição',
        question: 'No if idade >= 18:, quando o bloco do if será executado?',
        choices: [
          { id: 'a', text: 'Quando idade for maior ou igual a 18.', isCorrect: true, feedback: 'Correto. Essa é a condição definida.' },
          { id: 'b', text: 'Sempre, sem verificar nada.', isCorrect: false, feedback: 'O if só executa quando a condição é verdadeira.' },
          { id: 'c', text: 'Somente quando idade for texto.', isCorrect: false, feedback: 'A condição compara números.' }
        ]
      }
    ]
  },
  {
    id: 'loops',
    title: 'Loops',
    subtitle: 'Repita tarefas sem escrever tudo de novo.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 30,
    estimatedMinutes: 8,
    steps: [
      {
        id: 'for-conceito',
        type: 'content',
        title: 'Loop é repetição controlada',
        body: 'Um loop executa o mesmo bloco várias vezes. Isso evita repetição manual e torna o código mais limpo.',
        code: "for numero in range(3):\n    print(numero)"
      },
      {
        id: 'quiz-range',
        type: 'quiz',
        title: 'range',
        question: 'O que range(3) gera em um for simples?',
        choices: [
          { id: 'a', text: '0, 1 e 2.', isCorrect: true, feedback: 'Exato. range(3) começa em 0 e para antes do 3.' },
          { id: 'b', text: '1, 2 e 3.', isCorrect: false, feedback: 'Essa é uma confusão comum. Por padrão, range começa em 0.' },
          { id: 'c', text: 'Apenas o número 3.', isCorrect: false, feedback: 'range(3) representa uma sequência, não um único valor.' }
        ]
      }
    ]
  },
  {
    id: 'funcoes-basicas',
    title: 'Funções básicas',
    subtitle: 'Crie comandos próprios e reutilizáveis.',
    topicId: 'funcoes',
    difficulty: 'iniciante',
    xp: 35,
    estimatedMinutes: 8,
    steps: [
      {
        id: 'funcao-conceito',
        type: 'content',
        title: 'Função é uma máquina pequena',
        body: 'Uma função recebe informações, executa uma tarefa e pode devolver um resultado. Ela evita repetir código.',
        analogy: 'Pense em uma máquina de suco: entra fruta, acontece o processo, sai o suco.',
        code: "def somar(a, b):\n    return a + b\n\nprint(somar(2, 3))"
      },
      {
        id: 'quiz-return',
        type: 'quiz',
        title: 'Retorno',
        question: 'Para que serve return dentro de uma função?',
        choices: [
          { id: 'a', text: 'Para devolver um resultado para quem chamou a função.', isCorrect: true, feedback: 'Correto. return entrega o resultado da função.' },
          { id: 'b', text: 'Para mudar a cor do código.', isCorrect: false, feedback: 'Não tem relação com aparência.' },
          { id: 'c', text: 'Para criar uma variável global obrigatória.', isCorrect: false, feedback: 'return não cria variável global.' }
        ]
      }
    ]
  },
  {
    id: 'listas',
    title: 'Listas',
    subtitle: 'Guarde vários valores em uma única variável.',
    topicId: 'estruturas',
    difficulty: 'iniciante',
    xp: 35,
    estimatedMinutes: 8,
    steps: [
      {
        id: 'lista-conceito',
        type: 'content',
        title: 'Lista é uma sequência mutável',
        body: 'Listas guardam vários valores em ordem. Você pode adicionar, remover e acessar itens pelo índice.',
        analogy: 'É como uma lista de compras: os itens ficam organizados e podem mudar.',
        code: "frutas = ['maçã', 'banana', 'uva']\nprint(frutas[0])"
      },
      {
        id: 'quiz-indice',
        type: 'quiz',
        title: 'Índice',
        question: "Em frutas = ['maçã', 'banana'], qual item está em frutas[0]?",
        choices: [
          { id: 'a', text: 'maçã', isCorrect: true, feedback: 'Isso. Em Python, o primeiro índice é 0.' },
          { id: 'b', text: 'banana', isCorrect: false, feedback: 'banana está no índice 1.' },
          { id: 'c', text: 'Nenhum, porque listas começam no 1.', isCorrect: false, feedback: 'Listas em Python começam no índice 0.' }
        ]
      }
    ]
  },
  {
    id: 'dicionarios',
    title: 'Dicionários',
    subtitle: 'Organize dados por chave e valor.',
    topicId: 'estruturas',
    difficulty: 'iniciante',
    xp: 35,
    estimatedMinutes: 8,
    steps: [
      {
        id: 'dict-conceito',
        type: 'content',
        title: 'Dicionário usa chaves',
        body: 'Um dicionário guarda dados no formato chave: valor. É ótimo para representar informações com nomes claros.',
        code: "aluno = {\n    'nome': 'Lia',\n    'idade': 15\n}\nprint(aluno['nome'])"
      },
      {
        id: 'quiz-chave',
        type: 'quiz',
        title: 'Chave e valor',
        question: "No dicionário {'nome': 'Lia'}, o que é 'nome'?",
        choices: [
          { id: 'a', text: 'A chave.', isCorrect: true, feedback: 'Correto. nome é a chave usada para acessar o valor Lia.' },
          { id: 'b', text: 'O valor.', isCorrect: false, feedback: 'O valor associado é Lia.' },
          { id: 'c', text: 'Uma função.', isCorrect: false, feedback: 'Não. É uma chave textual.' }
        ]
      }
    ]
  },
  ...topic2ExtraLessons
];

export const lessonMap = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson])) as Record<string, Lesson>;

export const orderedLessonIds = topics.flatMap((topic) => topic.lessonIds);
