export type PlaygroundExample = {
  title: string;
  code: string;
  inputs?: string;
};

export const INITIAL_CODE = `# Terminal Python
nome = "PythonQuest"
print(f"Olá, {nome}!")

for numero in range(1, 4):
    print(f"Número: {numero}")`;

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    title: 'Variáveis',
    code: `nome = "Ana"
idade = 16
altura = 1.68

print(f"{nome} tem {idade} anos.")
print(f"Altura: {altura:.2f} m")`
  },
  {
    title: 'input()',
    code: `nome = input("Qual é o seu nome? ")
idade = int(input("Quantos anos você tem? "))

print(f"Olá, {nome}! Em 5 anos você terá {idade + 5} anos.")`,
    inputs: 'Bia\n15'
  },
  {
    title: 'if / else',
    code: `media = 8.4

if media >= 7:
    print("Aprovado!")
else:
    print("Recuperação")`
  },
  {
    title: 'Loop for',
    code: `itens = ["Caneta", "Caderno", "Mochila"]

for item in itens:
    print(f"Item: {item}")`
  },
  {
    title: 'while',
    code: `vidas = 3

while vidas > 0:
    print(f"Você tem {vidas} vidas")
    vidas -= 1

print("Game over!")`
  },
  {
    title: 'Função',
    code: `def calcular_media(n1, n2):
    return (n1 + n2) / 2

print(calcular_media(7, 9))`
  },
  {
    title: 'Dicionário',
    code: `jogador = {"nome": "Leo", "pontos": 120}

jogador["pontos"] += 30
print(f"{jogador['nome']} tem {jogador['pontos']} pontos")`
  }
];

// Símbolos difíceis de achar no teclado do celular.
export const EDITOR_SHORTCUTS = ['TAB', ':', '(', ')', '"', '=', '[', ']', '{', '}', '#', '+', '-', '*', '/', '<', '>'];
