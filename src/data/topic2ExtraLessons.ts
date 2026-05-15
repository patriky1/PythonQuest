import { Lesson } from '@/types/course';

export const topic2ExtraLessons: Lesson[] = [
  {
    id: 'controle-fluxo-introducao',
    title: 'Visão geral do controle de fluxo',
    subtitle: 'Faça o programa decidir caminhos e repetir tarefas.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 35,
    estimatedMinutes: 7,
    steps: [
      {
        id: 'controle-fluxo-conceito',
        type: 'content',
        title: 'Controle de fluxo é escolha de caminho',
        body: 'Controle de fluxo permite que o programa siga caminhos diferentes conforme uma condição. Em vez de executar tudo sempre igual, o código consegue decidir o que fazer.',
        analogy: 'Imagine uma estrada com placas: se estiver chovendo, leve guarda-chuva; senão, pode sair sem guarda-chuva.',
        code: "esta_chovendo = True\n\nif esta_chovendo:\n    print('Leve guarda-chuva.')\nelse:\n    print('Pode sair sem guarda-chuva.')"
      },
      {
        id: 'if-else-elif-significados',
        type: 'content',
        title: 'if, else e elif',
        body: "O if significa 'se'. O else significa 'senão'. O elif significa 'senão se' e permite criar mais de dois caminhos possíveis.",
        code: "if condicao_1:\n    print('Primeiro caminho')\nelif condicao_2:\n    print('Segundo caminho')\nelse:\n    print('Caminho padrão')"
      },
      {
        id: 'for-while-diferenca',
        type: 'content',
        title: 'for e while repetem tarefas',
        body: 'Além de decidir, programas precisam repetir ações. Use for quando você sabe, ou consegue determinar, quantas vezes quer repetir. Use while quando a repetição depende de uma condição continuar verdadeira.',
        code: "for numero in range(1, 4):\n    print(numero)\n\ncontador = 3\nwhile contador > 0:\n    print(contador)\n    contador = contador - 1"
      },
      {
        id: 'quiz-for-while-diferenca',
        type: 'quiz',
        title: 'Escolha o loop certo',
        question: 'Quando o for costuma ser a melhor escolha?',
        choices: [
          {
            id: 'a',
            text: 'Quando sabemos quantas repetições queremos fazer.',
            isCorrect: true,
            feedback: 'Correto. O for é ideal para percorrer uma sequência ou repetir uma quantidade conhecida.'
          },
          {
            id: 'b',
            text: 'Quando nunca queremos parar a repetição.',
            isCorrect: false,
            feedback: 'Não. Repetições precisam de controle para evitar travamentos.'
          },
          {
            id: 'c',
            text: 'Quando queremos guardar texto em uma variável.',
            isCorrect: false,
            feedback: 'Guardar valores é função das variáveis, não do for.'
          }
        ]
      }
    ]
  },

  {
    id: 'elif-classificacao-nota',
    title: 'Classificação com if, elif e else',
    subtitle: 'Crie várias possibilidades de decisão em ordem.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 40,
    estimatedMinutes: 9,
    steps: [
      {
        id: 'classificacao-contexto',
        type: 'content',
        title: 'Mais de dois caminhos',
        body: 'Quando existem várias respostas possíveis, usamos if, elif e else. Python testa as condições de cima para baixo e para na primeira condição verdadeira.',
        code: "aluno = 'Mariana'\nmedia = 8.4\n\nif media >= 9:\n    classificacao = 'Excelente'\nelif media >= 7:\n    classificacao = 'Aprovado'\nelif media >= 5:\n    classificacao = 'Recuperação'\nelse:\n    classificacao = 'Reprovado'"
      },
      {
        id: 'ordem-condicoes',
        type: 'content',
        title: 'A ordem das condições importa',
        body: 'No exemplo da média, a primeira condição verifica se a nota é pelo menos 9. Se for falsa, Python testa se é pelo menos 7. Se também for falsa, testa se é pelo menos 5. O else cobre o restante.',
        code: "print(f'Aluno: {aluno}')\nprint(f'Média: {media:.1f}')\nprint(f'Classificação: {classificacao}')\n\n# Saída:\n# Aluno: Mariana\n# Média: 8.4\n# Classificação: Aprovado"
      },
      {
        id: 'quiz-classificacao-mariana',
        type: 'quiz',
        title: 'Classificação correta',
        question: 'Se media = 8.4, qual classificação será escolhida nesse código?',
        choices: [
          {
            id: 'a',
            text: 'Aprovado',
            isCorrect: true,
            feedback: 'Correto. 8.4 não chega a 9, mas é maior ou igual a 7.'
          },
          {
            id: 'b',
            text: 'Excelente',
            isCorrect: false,
            feedback: 'Excelente exige media >= 9.'
          },
          {
            id: 'c',
            text: 'Recuperação',
            isCorrect: false,
            feedback: 'Recuperação só seria escolhida se a média fosse menor que 7 e maior ou igual a 5.'
          }
        ]
      },
      {
        id: 'code-elif',
        type: 'code',
        title: 'Complete o caminho intermediário',
        prompt: 'Qual palavra completa a segunda condição?',
        code: "if media >= 9:\n    classificacao = 'Excelente'\n____ media >= 7:\n    classificacao = 'Aprovado'",
        choices: [
          {
            id: 'a',
            text: 'elif',
            isCorrect: true,
            feedback: "Exato. elif significa 'senão se' e testa uma nova condição."
          },
          {
            id: 'b',
            text: 'else',
            isCorrect: false,
            feedback: 'else não recebe condição. Ele cobre o caso padrão.'
          },
          {
            id: 'c',
            text: 'for',
            isCorrect: false,
            feedback: 'for é usado para repetição, não para uma nova condição.'
          }
        ]
      }
    ]
  },

  {
    id: 'for-range-acumulador',
    title: 'for, range e acumulador',
    subtitle: 'Repita cálculos e some valores automaticamente.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 45,
    estimatedMinutes: 10,
    steps: [
      {
        id: 'for-range-conceito',
        type: 'content',
        title: 'range gera uma sequência',
        body: 'A função range() cria uma sequência de números para o for percorrer. Em range(1, quantidade_produtos + 1), o + 1 é necessário porque o limite final não entra na contagem.',
        code: "quantidade_produtos = 3\n\nfor numero_produto in range(1, quantidade_produtos + 1):\n    print(numero_produto)\n\n# Saída: 1, 2, 3"
      },
      {
        id: 'acumulador-total',
        type: 'content',
        title: 'Acumulador soma aos poucos',
        body: 'Um acumulador começa com zero e recebe novos valores a cada repetição. Ele é útil para somar preços, notas, pontos ou qualquer sequência de valores.',
        code: "total = 0.0\nquantidade_produtos = 3\n\nfor numero_produto in range(1, quantidade_produtos + 1):\n    preco = numero_produto * 10.0\n    total = total + preco\n    print(f'Produto {numero_produto}: R$ {preco:.2f}')\n\nprint(f'Total da compra: R$ {total:.2f}')"
      },
      {
        id: 'quiz-range-final',
        type: 'quiz',
        title: 'Limite do range',
        question: 'O que range(1, 4) gera?',
        choices: [
          {
            id: 'a',
            text: '1, 2 e 3',
            isCorrect: true,
            feedback: 'Correto. O 4 é o limite de parada e não entra na sequência.'
          },
          {
            id: 'b',
            text: '1, 2, 3 e 4',
            isCorrect: false,
            feedback: 'O último número do range não entra.'
          },
          {
            id: 'c',
            text: '0, 1, 2 e 3',
            isCorrect: false,
            feedback: 'Isso aconteceria em range(4), não em range(1, 4).'
          }
        ]
      },
      {
        id: 'code-acumulador',
        type: 'code',
        title: 'Atualize o total',
        prompt: 'Qual linha soma o preço atual ao total acumulado?',
        code: 'total = 0.0\npreco = 20.0\ntotal = ____',
        choices: [
          {
            id: 'a',
            text: 'total + preco',
            isCorrect: true,
            feedback: 'Correto. O novo total recebe o valor anterior mais o preço atual.'
          },
          {
            id: 'b',
            text: 'preco - total',
            isCorrect: false,
            feedback: 'Isso subtrai o acumulado em vez de somar.'
          },
          {
            id: 'c',
            text: 'total / preco',
            isCorrect: false,
            feedback: 'Dividir não acumula os valores.'
          }
        ]
      }
    ]
  },

  {
    id: 'while-contagem-regressiva',
    title: 'Repetição com while',
    subtitle: 'Repita enquanto uma condição for verdadeira.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 40,
    estimatedMinutes: 9,
    steps: [
      {
        id: 'while-conceito',
        type: 'content',
        title: 'while depende de uma condição',
        body: 'O while continua repetindo enquanto a condição for verdadeira. Quando a condição fica falsa, o loop termina.',
        code: "contador = 5\n\nwhile contador > 0:\n    print(f'Contagem: {contador}')\n    contador = contador - 1\n\nprint('Fim da contagem!')"
      },
      {
        id: 'while-cuidado',
        type: 'content',
        title: 'Atualize a condição',
        body: 'Dentro do while, é comum mudar uma variável usada na condição. Se ela nunca mudar, o loop pode ficar infinito.',
        code: "contador = 5\n\nwhile contador > 0:\n    print(contador)\n    contador = contador - 1  # aproxima o loop do fim"
      },
      {
        id: 'quiz-while-parada',
        type: 'quiz',
        title: 'Fim do while',
        question: 'No código while contador > 0, quando o loop termina?',
        choices: [
          {
            id: 'a',
            text: 'Quando contador deixa de ser maior que zero.',
            isCorrect: true,
            feedback: 'Correto. Quando contador chega a 0, a condição fica falsa.'
          },
          {
            id: 'b',
            text: 'Quando contador chega a 5.',
            isCorrect: false,
            feedback: '5 é o valor inicial no exemplo, não o ponto de parada.'
          },
          {
            id: 'c',
            text: 'Nunca termina, porque while sempre é infinito.',
            isCorrect: false,
            feedback: 'while só vira infinito quando a condição nunca fica falsa.'
          }
        ]
      },
      {
        id: 'code-decremento',
        type: 'code',
        title: 'Diminua o contador',
        prompt: 'Qual linha reduz o contador em 1 a cada repetição?',
        code: 'while contador > 0:\n    print(contador)\n    ____',
        choices: [
          {
            id: 'a',
            text: 'contador = contador - 1',
            isCorrect: true,
            feedback: 'Exato. Essa linha aproxima o contador de zero.'
          },
          {
            id: 'b',
            text: 'contador = contador + 1',
            isCorrect: false,
            feedback: 'Isso aumenta o contador e pode impedir o fim do loop.'
          },
          {
            id: 'c',
            text: 'contador = 5',
            isCorrect: false,
            feedback: 'Isso reinicia o contador e pode causar repetição sem fim.'
          }
        ]
      }
    ]
  },

  {
    id: 'sistema-aprovacao-integrado',
    title: 'Sistema simples de aprovação',
    subtitle: 'Integre variáveis, for, média e decisão.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 55,
    estimatedMinutes: 12,
    steps: [
      {
        id: 'sistema-aprovacao-objetivo',
        type: 'content',
        title: 'Juntando o que você aprendeu',
        body: 'Um programa mais completo pode repetir a leitura de notas, acumular a soma, calcular a média e decidir a situação final do aluno.',
        code: "aluno = 'Carlos'\nquantidade_notas = 3\nsoma_notas = 0.0"
      },
      {
        id: 'sistema-aprovacao-loop',
        type: 'content',
        title: 'Somando notas com for',
        body: 'O for percorre as notas simuladas. A cada repetição, a nota atual é somada em soma_notas.',
        code: "for numero_nota in range(1, quantidade_notas + 1):\n    nota = 6.0 + numero_nota\n    soma_notas = soma_notas + nota\n    print(f'Nota {numero_nota}: {nota:.1f}')\n\nmedia = soma_notas / quantidade_notas"
      },
      {
        id: 'sistema-aprovacao-decisao',
        type: 'content',
        title: 'Decidindo a situação',
        body: 'Depois do cálculo da média, o if/elif/else classifica o aluno como aprovado, em recuperação ou reprovado.',
        code: "if media >= 7.0:\n    situacao = 'Aprovado'\nelif media >= 5.0:\n    situacao = 'Recuperação'\nelse:\n    situacao = 'Reprovado'\n\nprint(f'Aluno: {aluno}')\nprint(f'Média final: {media:.2f}')\nprint(f'Situação: {situacao}')"
      },
      {
        id: 'quiz-media-carlos',
        type: 'quiz',
        title: 'Média do exemplo',
        question: 'No exemplo, as notas são 7.0, 8.0 e 9.0. Qual é a média final?',
        choices: [
          {
            id: 'a',
            text: '8.00',
            isCorrect: true,
            feedback: 'Correto. A soma é 24.0 e 24.0 dividido por 3 é 8.00.'
          },
          {
            id: 'b',
            text: '7.00',
            isCorrect: false,
            feedback: '7.00 é apenas a primeira nota.'
          },
          {
            id: 'c',
            text: '9.00',
            isCorrect: false,
            feedback: '9.00 é a última nota, não a média.'
          }
        ]
      },
      {
        id: 'code-situacao-aprovado',
        type: 'code',
        title: 'Condição de aprovação',
        prompt: 'Qual condição classifica aprovação direta?',
        code: "if ____:\n    situacao = 'Aprovado'",
        choices: [
          {
            id: 'a',
            text: 'media >= 7.0',
            isCorrect: true,
            feedback: 'Correto. No exemplo, média 7.0 ou mais aprova diretamente.'
          },
          {
            id: 'b',
            text: 'media < 5.0',
            isCorrect: false,
            feedback: 'Essa condição representa reprovação, não aprovação.'
          },
          {
            id: 'c',
            text: "media == 'Aprovado'",
            isCorrect: false,
            feedback: 'media é um número, não o texto Aprovado.'
          }
        ]
      }
    ]
  },

  {
    id: 'erros-comuns-controle-fluxo',
    title: 'Erros comuns no controle de fluxo',
    subtitle: 'Corrija dois-pontos, indentação e conversão de entrada.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 50,
    estimatedMinutes: 12,
    steps: [
      {
        id: 'erro-dois-pontos',
        type: 'content',
        title: 'Erro: esquecer os dois-pontos',
        body: 'As estruturas if, elif, else, for e while precisam de dois-pontos no final da linha. Sem isso, Python gera erro de sintaxe.',
        code: "# Errado\nif idade >= 18\n    print('Maior de idade')\n\n# Correto\nif idade >= 18:\n    print('Maior de idade')"
      },
      {
        id: 'erro-indentacao',
        type: 'content',
        title: 'Erro: errar a indentação',
        body: 'Python usa indentação para saber quais linhas pertencem ao bloco. Depois de um if, for ou while, o código interno precisa ficar recuado.',
        code: "# Errado\nif idade >= 18:\nprint('Maior de idade')\n\n# Correto\nif idade >= 18:\n    print('Maior de idade')"
      },
      {
        id: 'erro-input-texto-numero',
        type: 'content',
        title: 'Erro: comparar texto com número',
        body: 'input() sempre retorna texto. Para comparar uma idade com o número 18, é preciso converter a entrada usando int(). Para preços, use float().',
        code: "# Errado\nidade = input('Digite sua idade: ')\nif idade >= 18:\n    print('Maior de idade')\n\n# Correto\nidade = int(input('Digite sua idade: '))\nif idade >= 18:\n    print('Maior de idade')"
      },
      {
        id: 'quiz-dois-pontos',
        type: 'quiz',
        title: 'Pontuação obrigatória',
        question: 'Qual linha está correta em Python?',
        choices: [
          {
            id: 'a',
            text: 'if idade >= 18:',
            isCorrect: true,
            feedback: 'Correto. A linha do if termina com dois-pontos.'
          },
          {
            id: 'b',
            text: 'if idade >= 18',
            isCorrect: false,
            feedback: 'Faltam os dois-pontos no final.'
          },
          {
            id: 'c',
            text: 'if: idade >= 18',
            isCorrect: false,
            feedback: 'A condição deve vir depois do if e antes dos dois-pontos.'
          }
        ]
      },
      {
        id: 'code-conversao-input',
        type: 'code',
        title: 'Converta a idade',
        prompt: 'Qual função converte a entrada para número inteiro?',
        code: "idade = ____(input('Digite sua idade: '))",
        choices: [
          {
            id: 'a',
            text: 'int',
            isCorrect: true,
            feedback: 'Exato. int() converte o texto digitado para inteiro.'
          },
          {
            id: 'b',
            text: 'str',
            isCorrect: false,
            feedback: 'str() mantém ou converte para texto, não para número inteiro.'
          },
          {
            id: 'c',
            text: 'print',
            isCorrect: false,
            feedback: 'print() exibe informações; não converte para inteiro.'
          }
        ]
      }
    ]
  },

  {
    id: 'praticas-controle-fluxo',
    title: 'Práticas de controle de fluxo',
    subtitle: 'Resolva categorias por idade e desconto por subtotal.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 55,
    estimatedMinutes: 13,
    steps: [
      {
        id: 'exercicio-categoria-idade',
        type: 'content',
        title: 'Exercício: categoria por idade',
        body: 'Leia a idade de uma pessoa e informe a categoria: criança, adolescente, adulto ou idoso. A ordem das condições evita repetir intervalos completos.',
        code: "idade = int(input('Digite sua idade: '))\n\nif idade <= 12:\n    categoria = 'Criança'\nelif idade <= 17:\n    categoria = 'Adolescente'\nelif idade <= 59:\n    categoria = 'Adulto'\nelse:\n    categoria = 'Idoso'\n\nprint(f'Categoria: {categoria}')"
      },
      {
        id: 'quiz-categoria-idade',
        type: 'quiz',
        title: 'Categoria correta',
        question: 'Se a idade digitada for 16, qual categoria o programa exibirá?',
        choices: [
          {
            id: 'a',
            text: 'Adolescente',
            isCorrect: true,
            feedback: 'Correto. 16 é maior que 12 e menor ou igual a 17.'
          },
          {
            id: 'b',
            text: 'Criança',
            isCorrect: false,
            feedback: 'Criança é até 12 anos.'
          },
          {
            id: 'c',
            text: 'Adulto',
            isCorrect: false,
            feedback: 'Adulto começa em 18 nesse exercício.'
          }
        ]
      },
      {
        id: 'exercicio-desconto-produtos',
        type: 'content',
        title: 'Exercício: desconto por subtotal',
        body: 'Leia o valor de três produtos, calcule o subtotal e aplique desconto: abaixo de R$ 100 sem desconto; a partir de R$ 100 com 5%; a partir de R$ 200 com 10%.',
        code: "subtotal = 0.0\nquantidade_produtos = 3\n\nfor numero_produto in range(1, quantidade_produtos + 1):\n    preco = float(input(f'Produto {numero_produto}: '))\n    subtotal = subtotal + preco\n\nif subtotal >= 200:\n    percentual_desconto = 10\nelif subtotal >= 100:\n    percentual_desconto = 5\nelse:\n    percentual_desconto = 0"
      },
      {
        id: 'desconto-calculos-saida',
        type: 'content',
        title: 'Calculando o total final',
        body: 'Depois de definir o percentual, calcule o valor do desconto e subtraia do subtotal.',
        code: "valor_desconto = subtotal * percentual_desconto / 100\ntotal_final = subtotal - valor_desconto\n\nprint(f'Subtotal: R$ {subtotal:.2f}')\nprint(f'Desconto aplicado: {percentual_desconto}%')\nprint(f'Valor do desconto: R$ {valor_desconto:.2f}')\nprint(f'Total final: R$ {total_final:.2f}')"
      },
      {
        id: 'quiz-desconto-230',
        type: 'quiz',
        title: 'Desconto aplicado',
        question: 'Se o subtotal for R$ 230.00, qual desconto deve ser aplicado?',
        choices: [
          {
            id: 'a',
            text: '10%',
            isCorrect: true,
            feedback: 'Correto. Subtotal igual ou maior que R$ 200 recebe 10% de desconto.'
          },
          {
            id: 'b',
            text: '5%',
            isCorrect: false,
            feedback: '5% vale para subtotal entre R$ 100.00 e R$ 199.99.'
          },
          {
            id: 'c',
            text: '0%',
            isCorrect: false,
            feedback: '0% vale apenas para subtotal menor que R$ 100.00.'
          }
        ]
      },
      {
        id: 'code-percentual-desconto',
        type: 'code',
        title: 'Regra de 10%',
        prompt: 'Qual condição aplica 10% de desconto?',
        code: "if ____:\n    percentual_desconto = 10",
        choices: [
          {
            id: 'a',
            text: 'subtotal >= 200',
            isCorrect: true,
            feedback: 'Correto. A regra diz que subtotal igual ou maior que 200 recebe 10%.'
          },
          {
            id: 'b',
            text: 'subtotal < 100',
            isCorrect: false,
            feedback: 'Subtotal menor que 100 não recebe desconto.'
          },
          {
            id: 'c',
            text: 'subtotal == 5',
            isCorrect: false,
            feedback: 'O 5 representa percentual em outra regra, não condição de subtotal.'
          }
        ]
      }
    ]
  },

  {
    id: 'mini-projeto-caixa-eletronico',
    title: 'Mini-projeto: caixa eletrônico',
    subtitle: 'Use menu, while, input e decisões para controlar saldo.',
    topicId: 'controle-fluxo',
    difficulty: 'iniciante',
    xp: 70,
    estimatedMinutes: 16,
    steps: [
      {
        id: 'caixa-objetivo',
        type: 'content',
        title: 'Missão final do Tópico 2',
        body: 'Crie um simulador simples de caixa eletrônico. O programa começa com saldo inicial e mostra um menu repetidamente até o usuário escolher sair.',
        analogy: 'É como um caixa de banco: você escolhe uma operação no menu, o sistema verifica a regra e atualiza o saldo quando necessário.',
        code: "saldo = 1000.0\nopcao = 0\n\nwhile opcao != 4:\n    print('1 - Ver saldo')\n    print('2 - Depositar')\n    print('3 - Sacar')\n    print('4 - Sair')\n    opcao = int(input('Escolha uma opção: '))"
      },
      {
        id: 'caixa-ver-saldo-deposito',
        type: 'content',
        title: 'Ver saldo e depositar',
        body: 'A opção 1 apenas mostra o saldo. A opção 2 lê um valor, soma ao saldo e mostra uma mensagem de confirmação.',
        code: "if opcao == 1:\n    print(f'Saldo atual: R$ {saldo:.2f}')\nelif opcao == 2:\n    valor = float(input('Valor do depósito: '))\n    saldo = saldo + valor\n    print(f'Depósito realizado. Saldo: R$ {saldo:.2f}')"
      },
      {
        id: 'caixa-saque-sair-invalida',
        type: 'content',
        title: 'Sacar, sair e tratar opção inválida',
        body: 'No saque, o programa precisa verificar se existe saldo suficiente. A opção 4 encerra. Qualquer outra opção mostra erro.',
        code: "elif opcao == 3:\n    valor = float(input('Valor do saque: '))\n    if valor <= saldo:\n        saldo = saldo - valor\n        print(f'Saque realizado. Saldo: R$ {saldo:.2f}')\n    else:\n        print('Saldo insuficiente.')\nelif opcao == 4:\n    print('Encerrando atendimento.')\nelse:\n    print('Opção inválida.')"
      },
      {
        id: 'quiz-menu-sair',
        type: 'quiz',
        title: 'Condição de saída',
        question: 'No mini-projeto, qual opção encerra o programa?',
        choices: [
          {
            id: 'a',
            text: '4 - Sair',
            isCorrect: true,
            feedback: 'Correto. O loop roda enquanto opcao != 4.'
          },
          {
            id: 'b',
            text: '1 - Ver saldo',
            isCorrect: false,
            feedback: 'Essa opção só mostra o saldo.'
          },
          {
            id: 'c',
            text: '3 - Sacar',
            isCorrect: false,
            feedback: 'Essa opção tenta realizar um saque.'
          }
        ]
      },
      {
        id: 'quiz-saldo-insuficiente',
        type: 'quiz',
        title: 'Regra do saque',
        question: 'Antes de sacar, o que o programa precisa verificar?',
        choices: [
          {
            id: 'a',
            text: 'Se o valor do saque é menor ou igual ao saldo.',
            isCorrect: true,
            feedback: 'Correto. Só pode sacar quando há saldo suficiente.'
          },
          {
            id: 'b',
            text: 'Se o valor do saque é sempre maior que o saldo.',
            isCorrect: false,
            feedback: 'Isso indicaria saldo insuficiente.'
          },
          {
            id: 'c',
            text: 'Se o saldo é texto.',
            isCorrect: false,
            feedback: 'Saldo deve ser numérico para cálculos.'
          }
        ]
      },
      {
        id: 'code-loop-menu',
        type: 'code',
        title: 'Complete o loop do menu',
        prompt: 'Qual condição mantém o menu rodando até o usuário escolher sair?',
        code: "while ____:\n    print('1 - Ver saldo')\n    print('4 - Sair')",
        choices: [
          {
            id: 'a',
            text: 'opcao != 4',
            isCorrect: true,
            feedback: 'Exato. Enquanto a opção for diferente de 4, o menu continua.'
          },
          {
            id: 'b',
            text: 'opcao == 4',
            isCorrect: false,
            feedback: 'Isso rodaria justamente quando a opção fosse sair.'
          },
          {
            id: 'c',
            text: 'saldo == 0',
            isCorrect: false,
            feedback: 'O menu não deve depender apenas do saldo ser zero.'
          }
        ]
      }
    ]
  }
];