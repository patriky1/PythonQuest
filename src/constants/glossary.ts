export type GlossaryTerm = {
  term: string;
  description: string;
  example: string;
};

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'print()',
    description: 'Mostra uma informação na tela.',
    example: 'print("Olá, mundo!")'
  },
  {
    term: 'Comentário',
    description: 'Texto depois de # que o Python ignora. Serve para explicar o código.',
    example: '# Isto é um comentário\nprint("Oi")'
  },
  {
    term: 'Variável',
    description: 'Nome usado para guardar um valor e reutilizá-lo depois.',
    example: 'nome = "Ana"\nidade = 16'
  },
  {
    term: 'String (str)',
    description: 'Texto em Python, escrito entre aspas simples ou duplas.',
    example: 'mensagem = "Python é legal"'
  },
  {
    term: 'int e float',
    description: 'int é número inteiro (10). float é número decimal e usa ponto (9.5).',
    example: 'pontos = 10\nmedia = 7.5'
  },
  {
    term: 'bool',
    description: 'Valor lógico: True (verdadeiro) ou False (falso).',
    example: 'aprovado = True'
  },
  {
    term: 'f-string',
    description: 'Monta textos com variáveis usando f antes das aspas e {} em volta da variável.',
    example: 'nome = "Leo"\nprint(f"Olá, {nome}!")'
  },
  {
    term: 'Operadores aritméticos',
    description: '+ soma, - subtrai, * multiplica, / divide, // divisão inteira, % resto, ** potência.',
    example: 'print(7 // 2)  # 3\nprint(7 % 2)   # 1'
  },
  {
    term: 'Operadores de comparação',
    description: 'Comparam valores e retornam True ou False: ==, !=, >, <, >=, <=.',
    example: 'print(8 >= 7)  # True'
  },
  {
    term: 'input()',
    description: 'Lê o que o usuário digita. O resultado é sempre texto (str).',
    example: 'nome = input("Seu nome: ")\nprint(f"Oi, {nome}")'
  },
  {
    term: 'Conversão de tipos',
    description: 'int(), float() e str() transformam um valor em outro tipo.',
    example: 'idade = int(input("Idade: "))'
  },
  {
    term: 'if / elif / else',
    description: 'Toma decisões: executa um bloco só se a condição for verdadeira.',
    example: 'if nota >= 7:\n    print("Aprovado")\nelif nota >= 5:\n    print("Recuperação")\nelse:\n    print("Reprovado")'
  },
  {
    term: 'Indentação',
    description: 'Recuo (4 espaços) que mostra quais linhas pertencem a um if, for, while ou def.',
    example: 'if True:\n    print("dentro do if")\nprint("fora do if")'
  },
  {
    term: 'for e range()',
    description: 'Repete um bloco para cada item. range(1, 4) gera 1, 2 e 3.',
    example: 'for i in range(1, 4):\n    print(i)'
  },
  {
    term: 'while',
    description: 'Repete enquanto a condição for verdadeira. Cuidado com o loop infinito!',
    example: 'contador = 3\nwhile contador > 0:\n    print(contador)\n    contador -= 1'
  },
  {
    term: 'Lista',
    description: 'Guarda vários valores em ordem, entre colchetes. O primeiro índice é 0.',
    example: 'frutas = ["maçã", "uva"]\nfrutas.append("pera")\nprint(frutas[0])'
  },
  {
    term: 'len()',
    description: 'Retorna o tamanho de uma lista ou texto.',
    example: 'print(len("Python"))  # 6'
  },
  {
    term: 'Dicionário',
    description: 'Guarda pares chave: valor, entre chaves.',
    example: 'aluno = {"nome": "Bia", "nota": 9}\nprint(aluno["nome"])'
  },
  {
    term: 'Função (def)',
    description: 'Bloco de código com nome que pode ser reutilizado.',
    example: 'def saudar(nome):\n    print(f"Olá, {nome}!")\n\nsaudar("Rafa")'
  },
  {
    term: 'return',
    description: 'Devolve um resultado de dentro da função para quem a chamou.',
    example: 'def dobro(n):\n    return n * 2\n\nprint(dobro(5))'
  },
  {
    term: 'Erro (Traceback)',
    description: 'Mensagem do Python quando algo dá errado. A última linha diz o tipo e a causa.',
    example: 'print(10 / 0)\n# ZeroDivisionError: division by zero'
  },
  {
    term: 'try / except',
    description: 'Tenta executar um código e trata o erro sem o programa parar.',
    example: 'try:\n    n = int("abc")\nexcept ValueError:\n    print("Digite um número!")'
  }
];
