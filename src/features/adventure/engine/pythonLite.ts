/**
 * PythonLite: interpretador de um subconjunto de Python, feito para o Adventure.
 *
 * Suporta: variáveis, números, textos, True/False/None, listas, operadores
 * aritméticos e de comparação, and/or/not, if/elif/else, while, for (range e
 * listas), def/return, break/continue/pass, e chamadas a objetos do jogo
 * (ex.: hero.moveRight()).
 *
 * É síncrono e determinístico: roda o programa inteiro de uma vez contra um
 * "host" (o motor do jogo), com limite de operações para pegar loop infinito.
 * Todos os erros saem em português, com o número da linha.
 */

export type PyErrorKind = 'syntax' | 'runtime' | 'game' | 'limit';

export class PyError extends Error {
  line: number;
  kind: PyErrorKind;
  /** Dados extras do motor do jogo (ex.: casa contra a qual o herói bateu). */
  detail?: unknown;

  constructor(message: string, line: number, kind: PyErrorKind = 'runtime', detail?: unknown) {
    super(message);
    this.line = line;
    this.kind = kind;
    this.detail = detail;
  }
}

// ---------------------------------------------------------------------------
// Valores
// ---------------------------------------------------------------------------

export type HostFunction = (args: PyValue[], line: number) => PyValue;

/** Objeto do jogo exposto ao código (ex.: hero). */
export type HostObject = {
  kind: 'host';
  name: string;
  methods: Record<string, HostFunction>;
  /** Atributos calculados na hora (ex.: hero.x). */
  getters?: Record<string, () => PyValue>;
};

type BoundMethod = { kind: 'bound'; owner: string; name: string; fn: HostFunction };
type Builtin = { kind: 'builtin'; name: string; fn: (args: PyValue[], line: number) => PyValue };
type UserFunction = { kind: 'function'; name: string; params: string[]; body: Stmt[] };

export type PyValue =
  | number
  | string
  | boolean
  | null
  | PyValue[]
  | HostObject
  | BoundMethod
  | Builtin
  | UserFunction;

function isCallable(value: PyValue): value is BoundMethod | Builtin | UserFunction {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value.kind === 'bound' || value.kind === 'builtin' || value.kind === 'function')
  );
}

function truthy(value: PyValue): boolean {
  if (value === null || value === false || value === 0 || value === '') {
    return false;
  }

  return !(Array.isArray(value) && value.length === 0);
}

export function pyRepr(value: PyValue, nested = false): string {
  if (value === null) return 'None';
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(value);
  if (typeof value === 'string') return nested ? `'${value}'` : value;
  if (Array.isArray(value)) return `[${value.map((item) => pyRepr(item, true)).join(', ')}]`;
  if (value.kind === 'host') return `<${value.name}>`;
  return `<função ${value.name}>`;
}

function typeName(value: PyValue): string {
  if (value === null) return 'None';
  if (typeof value === 'number') return 'número';
  if (typeof value === 'string') return 'texto';
  if (typeof value === 'boolean') return 'True/False';
  if (Array.isArray(value)) return 'lista';
  if (value.kind === 'host') return value.name;
  return 'função';
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

type TokenType = 'number' | 'string' | 'name' | 'op' | 'newline' | 'indent' | 'dedent' | 'eof';
type Token = { type: TokenType; value: string; line: number };

const KEYWORDS = new Set([
  'if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'break', 'continue', 'pass',
  'and', 'or', 'not', 'True', 'False', 'None'
]);

const OPERATORS = ['//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '+', '-', '*', '/', '%', '<', '>', '=', '(', ')', '[', ']', ',', ':', '.'];

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const indents = [0];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let depth = 0; // parênteses/colchetes abertos (linhas continuam dentro deles)
  let openLine = 0;

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    const text = rawLine.replace(/\t/g, '    ');
    const trimmed = text.trim();

    if (depth === 0) {
      if (trimmed === '' || trimmed.startsWith('#')) {
        return;
      }

      const indent = text.length - text.trimStart().length;
      const current = indents[indents.length - 1];

      if (indent > current) {
        indents.push(indent);
        tokens.push({ type: 'indent', value: '', line });
      } else if (indent < current) {
        while (indents.length > 1 && indents[indents.length - 1] > indent) {
          indents.pop();
          tokens.push({ type: 'dedent', value: '', line });
        }

        if (indents[indents.length - 1] !== indent) {
          throw new PyError(
            'O recuo desta linha não combina com nenhum bloco acima. Use 4 espaços por nível.',
            line,
            'syntax'
          );
        }
      }
    }

    let position = text.length - text.trimStart().length;

    while (position < text.length) {
      const char = text[position];

      if (char === ' ') {
        position += 1;
        continue;
      }

      if (char === '#') {
        break;
      }

      if (/[0-9]/.test(char)) {
        const match = /^[0-9]+(\.[0-9]+)?/.exec(text.slice(position))!;
        tokens.push({ type: 'number', value: match[0], line });
        position += match[0].length;
        continue;
      }

      if (/[A-Za-z_À-ÿ]/.test(char)) {
        const match = /^[A-Za-z_À-ÿ][A-Za-z0-9_À-ÿ]*/.exec(text.slice(position))!;
        tokens.push({ type: 'name', value: match[0], line });
        position += match[0].length;
        continue;
      }

      if (char === '"' || char === "'") {
        const end = text.indexOf(char, position + 1);

        if (end === -1) {
          throw new PyError(`O texto não foi fechado: faltou ${char} no fim.`, line, 'syntax');
        }

        tokens.push({ type: 'string', value: text.slice(position + 1, end), line });
        position = end + 1;
        continue;
      }

      const operator = OPERATORS.find((candidate) => text.startsWith(candidate, position));

      if (!operator) {
        throw new PyError(`Não entendi o símbolo "${char}".`, line, 'syntax');
      }

      if (operator === '(' || operator === '[') {
        if (depth === 0) openLine = line;
        depth += 1;
      } else if (operator === ')' || operator === ']') {
        depth -= 1;

        if (depth < 0) {
          throw new PyError(`Há um "${operator}" sobrando nesta linha.`, line, 'syntax');
        }
      }

      tokens.push({ type: 'op', value: operator, line });
      position += operator.length;
    }

    if (depth === 0) {
      tokens.push({ type: 'newline', value: '', line });
    }
  });

  if (depth > 0) {
    throw new PyError('Faltou fechar um parêntese ")" ou colchete "]".', openLine, 'syntax');
  }

  const lastLine = lines.length;

  while (indents.length > 1) {
    indents.pop();
    tokens.push({ type: 'dedent', value: '', line: lastLine });
  }

  tokens.push({ type: 'eof', value: '', line: lastLine });
  return tokens;
}

// ---------------------------------------------------------------------------
// Árvore sintática
// ---------------------------------------------------------------------------

type Expr =
  | { type: 'num'; value: number; line: number }
  | { type: 'str'; value: string; line: number }
  | { type: 'const'; value: boolean | null; line: number }
  | { type: 'name'; name: string; line: number }
  | { type: 'list'; items: Expr[]; line: number }
  | { type: 'call'; callee: Expr; args: Expr[]; line: number }
  | { type: 'attr'; object: Expr; name: string; line: number }
  | { type: 'index'; object: Expr; index: Expr; line: number }
  | { type: 'unary'; op: '-' | 'not'; operand: Expr; line: number }
  | { type: 'binary'; op: string; left: Expr; right: Expr; line: number };

type Stmt =
  | { type: 'expr'; expr: Expr; line: number }
  | { type: 'assign'; target: Expr; op: string; value: Expr; line: number }
  | { type: 'if'; branches: { test: Expr; body: Stmt[] }[]; orelse: Stmt[] | null; line: number }
  | { type: 'while'; test: Expr; body: Stmt[]; line: number }
  | { type: 'for'; name: string; iterable: Expr; body: Stmt[]; line: number }
  | { type: 'def'; name: string; params: string[]; body: Stmt[]; line: number }
  | { type: 'return'; value: Expr | null; line: number }
  | { type: 'break'; line: number }
  | { type: 'continue'; line: number }
  | { type: 'pass'; line: number };

class Parser {
  private position = 0;

  constructor(private tokens: Token[]) {}

  parseProgram(): Stmt[] {
    const body: Stmt[] = [];

    while (this.peek().type !== 'eof') {
      if (this.peek().type === 'indent') {
        throw new PyError(
          'Recuo inesperado: esta linha não está dentro de nenhum bloco (if, for, while ou def).',
          this.peek().line,
          'syntax'
        );
      }

      body.push(this.statement());
    }

    return body;
  }

  private peek(offset = 0) {
    return this.tokens[Math.min(this.position + offset, this.tokens.length - 1)];
  }

  private next() {
    const token = this.peek();
    this.position += 1;
    return token;
  }

  private isOp(value: string) {
    const token = this.peek();
    return token.type === 'op' && token.value === value;
  }

  private isName(value: string) {
    const token = this.peek();
    return token.type === 'name' && token.value === value;
  }

  private expectOp(value: string, message: string) {
    if (!this.isOp(value)) {
      throw new PyError(message, this.lineForError(), 'syntax');
    }

    return this.next();
  }

  /** Erros no fim da linha apontam para a linha que ficou incompleta. */
  private lineForError() {
    const token = this.peek();

    if ((token.type === 'newline' || token.type === 'eof' || token.type === 'dedent') && this.position > 0) {
      return this.tokens[this.position - 1].line;
    }

    return token.line;
  }

  private endOfStatement() {
    if (this.peek().type === 'newline') {
      this.next();
      return;
    }

    if (this.peek().type === 'eof' || this.peek().type === 'dedent') {
      return;
    }

    const token = this.peek();
    throw new PyError(
      token.type === 'op' && token.value === '='
        ? 'Aqui não dá para usar "=". Para comparar, use "==".'
        : `Não esperava "${token.value}" aqui. Confira se falta algum símbolo antes.`,
      token.line,
      'syntax'
    );
  }

  private block(owner: string): Stmt[] {
    if (this.isOp('=')) {
      throw new PyError(
        'Aqui não dá para usar "=". Para comparar dois valores, use "==".',
        this.peek().line,
        'syntax'
      );
    }

    this.expectOp(':', `Faltou ":" no fim da linha do ${owner}.`);

    if (this.peek().type !== 'newline') {
      throw new PyError(
        `Depois do ":" do ${owner}, o bloco começa na linha de baixo, com recuo.`,
        this.peek().line,
        'syntax'
      );
    }

    const headerLine = this.next().line;

    if (this.peek().type !== 'indent') {
      throw new PyError(
        `O bloco do ${owner} está vazio. Recue as linhas de dentro com 4 espaços.`,
        headerLine,
        'syntax'
      );
    }

    this.next();
    const body: Stmt[] = [];

    while (this.peek().type !== 'dedent' && this.peek().type !== 'eof') {
      if (this.peek().type === 'indent') {
        throw new PyError('Recuo a mais nesta linha.', this.peek().line, 'syntax');
      }

      body.push(this.statement());
    }

    if (this.peek().type === 'dedent') {
      this.next();
    }

    return body;
  }

  private statement(): Stmt {
    const token = this.peek();
    const line = token.line;

    if (token.type === 'name') {
      switch (token.value) {
        case 'if': {
          this.next();
          const branches = [{ test: this.expression(), body: this.block('if') }];
          let orelse: Stmt[] | null = null;

          while (this.isName('elif')) {
            this.next();
            branches.push({ test: this.expression(), body: this.block('elif') });
          }

          if (this.isName('else')) {
            this.next();
            orelse = this.block('else');
          }

          return { type: 'if', branches, orelse, line };
        }
        case 'elif':
        case 'else':
          throw new PyError(
            `"${token.value}" só pode vir depois de um if, com o mesmo recuo dele.`,
            line,
            'syntax'
          );
        case 'while': {
          this.next();
          return { type: 'while', test: this.expression(), body: this.block('while'), line };
        }
        case 'for': {
          this.next();
          const variable = this.next();

          if (variable.type !== 'name' || KEYWORDS.has(variable.value)) {
            throw new PyError('Depois de "for" vem o nome de uma variável, como: for i in range(3):', line, 'syntax');
          }

          if (!this.isName('in')) {
            throw new PyError('Faltou o "in" no for. Exemplo: for i in range(3):', line, 'syntax');
          }

          this.next();
          return { type: 'for', name: variable.value, iterable: this.expression(), body: this.block('for'), line };
        }
        case 'def': {
          this.next();
          const name = this.next();

          if (name.type !== 'name' || KEYWORDS.has(name.value)) {
            throw new PyError('Depois de "def" vem o nome da função, como: def caminho():', line, 'syntax');
          }

          this.expectOp('(', `Faltaram os parênteses depois do nome da função: def ${name.value}():`);
          const params: string[] = [];

          while (!this.isOp(')')) {
            const param = this.next();

            if (param.type !== 'name') {
              throw new PyError('Os parâmetros da função devem ser nomes, separados por vírgula.', line, 'syntax');
            }

            params.push(param.value);

            if (!this.isOp(')')) {
              this.expectOp(',', 'Separe os parâmetros da função com vírgula.');
            }
          }

          this.next();
          return { type: 'def', name: name.value, params, body: this.block('def'), line };
        }
        case 'return': {
          this.next();
          const value =
            this.peek().type === 'newline' || this.peek().type === 'eof' || this.peek().type === 'dedent'
              ? null
              : this.expression();
          this.endOfStatement();
          return { type: 'return', value, line };
        }
        case 'break':
        case 'continue':
        case 'pass':
          this.next();
          this.endOfStatement();
          return { type: token.value, line };
        default:
          break;
      }
    }

    const expr = this.expression();
    const operator = this.peek();

    if (operator.type === 'op' && ['=', '+=', '-=', '*=', '/='].includes(operator.value)) {
      if (expr.type !== 'name' && expr.type !== 'index') {
        throw new PyError(
          'Do lado esquerdo do "=" deve ficar o nome de uma variável.',
          line,
          'syntax'
        );
      }

      this.next();
      const value = this.expression();
      this.endOfStatement();
      return { type: 'assign', target: expr, op: operator.value, value, line };
    }

    this.endOfStatement();
    return { type: 'expr', expr, line };
  }

  private expression(): Expr {
    return this.orExpr();
  }

  private orExpr(): Expr {
    let left = this.andExpr();

    while (this.isName('or')) {
      const line = this.next().line;
      left = { type: 'binary', op: 'or', left, right: this.andExpr(), line };
    }

    return left;
  }

  private andExpr(): Expr {
    let left = this.notExpr();

    while (this.isName('and')) {
      const line = this.next().line;
      left = { type: 'binary', op: 'and', left, right: this.notExpr(), line };
    }

    return left;
  }

  private notExpr(): Expr {
    if (this.isName('not')) {
      const line = this.next().line;
      return { type: 'unary', op: 'not', operand: this.notExpr(), line };
    }

    return this.comparison();
  }

  private comparison(): Expr {
    let left = this.additive();

    for (;;) {
      const token = this.peek();

      if (token.type === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(token.value)) {
        this.next();
        left = { type: 'binary', op: token.value, left, right: this.additive(), line: token.line };
      } else if (token.type === 'name' && token.value === 'in') {
        this.next();
        left = { type: 'binary', op: 'in', left, right: this.additive(), line: token.line };
      } else {
        return left;
      }
    }
  }

  private additive(): Expr {
    let left = this.multiplicative();

    while (this.isOp('+') || this.isOp('-')) {
      const token = this.next();
      left = { type: 'binary', op: token.value, left, right: this.multiplicative(), line: token.line };
    }

    return left;
  }

  private multiplicative(): Expr {
    let left = this.unary();

    while (this.isOp('*') || this.isOp('/') || this.isOp('//') || this.isOp('%')) {
      const token = this.next();
      left = { type: 'binary', op: token.value, left, right: this.unary(), line: token.line };
    }

    return left;
  }

  private unary(): Expr {
    if (this.isOp('-')) {
      const line = this.next().line;
      return { type: 'unary', op: '-', operand: this.unary(), line };
    }

    return this.postfix();
  }

  private postfix(): Expr {
    let expr = this.atom();

    for (;;) {
      if (this.isOp('(')) {
        const line = this.next().line;
        const args: Expr[] = [];

        while (!this.isOp(')')) {
          args.push(this.expression());

          if (!this.isOp(')')) {
            this.expectOp(',', 'Separe os valores dentro dos parênteses com vírgula.');
          }
        }

        this.next();
        expr = { type: 'call', callee: expr, args, line };
      } else if (this.isOp('.')) {
        const line = this.next().line;
        const name = this.next();

        if (name.type !== 'name') {
          throw new PyError('Depois do ponto vem o nome de um comando, como hero.moveRight().', line, 'syntax');
        }

        expr = { type: 'attr', object: expr, name: name.value, line };
      } else if (this.isOp('[')) {
        const line = this.next().line;
        const index = this.expression();
        this.expectOp(']', 'Faltou fechar o colchete "]".');
        expr = { type: 'index', object: expr, index, line };
      } else {
        return expr;
      }
    }
  }

  private atom(): Expr {
    const token = this.peek();
    const line = token.line;

    if (token.type === 'number') {
      this.next();
      return { type: 'num', value: Number(token.value), line };
    }

    if (token.type === 'string') {
      this.next();
      return { type: 'str', value: token.value, line };
    }

    if (token.type === 'name') {
      if (token.value === 'True' || token.value === 'False') {
        this.next();
        return { type: 'const', value: token.value === 'True', line };
      }

      if (token.value === 'None') {
        this.next();
        return { type: 'const', value: null, line };
      }

      if (KEYWORDS.has(token.value)) {
        throw new PyError(`"${token.value}" é uma palavra reservada e não pode ser usada aqui.`, line, 'syntax');
      }

      this.next();
      return { type: 'name', name: token.value, line };
    }

    if (token.type === 'op' && token.value === '(') {
      this.next();
      const expr = this.expression();
      this.expectOp(')', 'Faltou fechar o parêntese ")".');
      return expr;
    }

    if (token.type === 'op' && token.value === '[') {
      this.next();
      const items: Expr[] = [];

      while (!this.isOp(']')) {
        items.push(this.expression());

        if (!this.isOp(']')) {
          this.expectOp(',', 'Separe os itens da lista com vírgula.');
        }
      }

      this.next();
      return { type: 'list', items, line };
    }

    throw new PyError(
      token.type === 'newline' || token.type === 'eof' || token.type === 'dedent'
        ? 'A linha terminou antes da hora: falta um valor aqui.'
        : `Não esperava "${token.value}" aqui.`,
      this.lineForError(),
      'syntax'
    );
  }
}

// ---------------------------------------------------------------------------
// Análise do código (para conquistas, dicas e avaliação)
// ---------------------------------------------------------------------------

export type CodeUsage = {
  loops: boolean;
  conditionals: boolean;
  functions: boolean;
  variables: boolean;
};

function analyze(body: Stmt[], usage: CodeUsage) {
  for (const stmt of body) {
    switch (stmt.type) {
      case 'while':
      case 'for':
        usage.loops = true;
        analyze(stmt.body, usage);
        break;
      case 'if':
        usage.conditionals = true;
        stmt.branches.forEach((branch) => analyze(branch.body, usage));
        if (stmt.orelse) analyze(stmt.orelse, usage);
        break;
      case 'def':
        usage.functions = true;
        analyze(stmt.body, usage);
        break;
      case 'assign':
        usage.variables = true;
        break;
      default:
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

class BreakSignal {}
class ContinueSignal {}
class ReturnSignal {
  constructor(public value: PyValue) {}
}

/** Distância de edição, para sugerir o nome certo em erros de digitação. */
function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }

  return row[b.length];
}

export function closestName(name: string, candidates: string[]) {
  let best: string | null = null;
  let bestDistance = Math.max(2, Math.floor(name.length / 3)) + 1;

  for (const candidate of candidates) {
    const distance = editDistance(name.toLowerCase(), candidate.toLowerCase());

    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}

export type RunOptions = {
  /** Objetos do jogo disponíveis no código (ex.: { hero }). */
  globals: Record<string, HostObject>;
  /** Limite de operações antes de considerar loop infinito. */
  maxOperations?: number;
  onPrint?: (text: string, line: number) => void;
};

export type ProgramInfo = {
  usage: CodeUsage;
  /** Linhas com código (sem contar vazias e comentários). */
  codeLines: number;
};

export function countCodeLines(source: string) {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#')).length;
}

class Interpreter {
  private globals = new Map<string, PyValue>();
  private operations = 0;
  private callDepth = 0;
  private maxOperations: number;

  constructor(private options: RunOptions) {
    this.maxOperations = options.maxOperations ?? 4000;

    for (const [name, object] of Object.entries(options.globals)) {
      this.globals.set(name, object);
    }

    const builtin = (name: string, fn: Builtin['fn']) =>
      this.globals.set(name, { kind: 'builtin', name, fn });

    builtin('print', (args, line) => {
      options.onPrint?.(args.map((arg) => pyRepr(arg)).join(' '), line);
      return null;
    });
    builtin('range', (args, line) => {
      const numbers = args.map((arg) => this.number(arg, line, 'range()'));
      const [start, stop, step] =
        numbers.length === 1 ? [0, numbers[0], 1] : [numbers[0], numbers[1], numbers[2] ?? 1];

      if (numbers.length === 0 || numbers.length > 3) {
        throw new PyError('range() recebe de 1 a 3 números, como range(3) ou range(1, 4).', line);
      }

      if (step === 0) {
        throw new PyError('O passo do range() não pode ser 0.', line);
      }

      const result: number[] = [];

      for (let value = start; step > 0 ? value < stop : value > stop; value += step) {
        result.push(value);

        if (result.length > 500) {
          throw new PyError('Esse range() é grande demais para o jogo (máximo de 500).', line, 'limit');
        }
      }

      return result;
    });
    builtin('len', (args, line) => {
      const value = args[0];

      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length;
      }

      throw new PyError('len() funciona com listas e textos.', line);
    });
    builtin('str', (args) => pyRepr(args[0] ?? ''));
    builtin('int', (args, line) => {
      const value = args[0];
      const number = typeof value === 'string' ? Number(value) : value;

      if (typeof number !== 'number' || Number.isNaN(number)) {
        throw new PyError(`int() não conseguiu converter ${pyRepr(value ?? null, true)} em número.`, line);
      }

      return Math.trunc(number);
    });
    builtin('abs', (args, line) => Math.abs(this.number(args[0], line, 'abs()')));
    builtin('min', (args, line) => Math.min(...this.numbers(args, line, 'min()')));
    builtin('max', (args, line) => Math.max(...this.numbers(args, line, 'max()')));
  }

  private number(value: PyValue | undefined, line: number, where: string): number {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value !== 'number') {
      throw new PyError(`${where} esperava um número, mas recebeu ${typeName(value ?? null)}.`, line);
    }

    return value;
  }

  private numbers(args: PyValue[], line: number, where: string): number[] {
    const values = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;

    if (values.length === 0) {
      throw new PyError(`${where} precisa de pelo menos um número.`, line);
    }

    return values.map((value) => this.number(value, line, where));
  }

  private tick(line: number) {
    this.operations += 1;

    if (this.operations > this.maxOperations) {
      throw new PyError(
        'O código repetiu vezes demais e foi interrompido. Parece um loop infinito: confira se a condição do while muda em algum momento.',
        line,
        'limit'
      );
    }
  }

  run(body: Stmt[]) {
    try {
      this.execBlock(body, null);
    } catch (signal) {
      if (signal instanceof ReturnSignal) {
        return;
      }

      if (signal instanceof BreakSignal || signal instanceof ContinueSignal) {
        return;
      }

      throw signal;
    }
  }

  private execBlock(body: Stmt[], locals: Map<string, PyValue> | null) {
    for (const stmt of body) {
      this.exec(stmt, locals);
    }
  }

  private lookup(name: string, locals: Map<string, PyValue> | null, line: number): PyValue {
    if (locals?.has(name)) {
      return locals.get(name)!;
    }

    if (this.globals.has(name)) {
      return this.globals.get(name)!;
    }

    const known = [...this.globals.keys(), ...(locals ? locals.keys() : [])];
    const suggestion = closestName(name, known);

    throw new PyError(
      `O nome "${name}" não existe.${suggestion ? ` Você quis dizer "${suggestion}"?` : ' Crie a variável antes de usar, ou confira a digitação.'}`,
      line
    );
  }

  private store(name: string, value: PyValue, locals: Map<string, PyValue> | null) {
    (locals ?? this.globals).set(name, value);
  }

  private exec(stmt: Stmt, locals: Map<string, PyValue> | null) {
    this.tick(stmt.line);

    switch (stmt.type) {
      case 'expr': {
        const value = this.evaluate(stmt.expr, locals);

        // hero.moveRight sem parênteses não faz nada em Python: erro comum de iniciante.
        if (isCallable(value) && stmt.expr.type !== 'call') {
          const label = value.kind === 'bound' ? `${value.owner}.${value.name}` : value.name;
          throw new PyError(
            `Faltaram os parênteses. Para executar o comando, escreva ${label}().`,
            stmt.line,
            'syntax'
          );
        }

        return;
      }
      case 'assign': {
        let value = this.evaluate(stmt.value, locals);

        if (stmt.op !== '=') {
          const current = this.evaluate(stmt.target, locals);
          value = this.binary(stmt.op[0], current, value, stmt.line);
        }

        if (stmt.target.type === 'name') {
          this.store(stmt.target.name, value, locals);
        } else if (stmt.target.type === 'index') {
          const list = this.evaluate(stmt.target.object, locals);
          const index = this.evaluate(stmt.target.index, locals);

          if (!Array.isArray(list)) {
            throw new PyError('Só dá para trocar um item usando colchetes em listas.', stmt.line);
          }

          list[this.listIndex(list, index, stmt.line)] = value;
        }

        return;
      }
      case 'if': {
        for (const branch of stmt.branches) {
          if (truthy(this.evaluate(branch.test, locals))) {
            this.execBlock(branch.body, locals);
            return;
          }
        }

        if (stmt.orelse) {
          this.execBlock(stmt.orelse, locals);
        }

        return;
      }
      case 'while': {
        while (truthy(this.evaluate(stmt.test, locals))) {
          this.tick(stmt.line);

          try {
            this.execBlock(stmt.body, locals);
          } catch (signal) {
            if (signal instanceof BreakSignal) break;
            if (!(signal instanceof ContinueSignal)) throw signal;
          }
        }

        return;
      }
      case 'for': {
        const iterable = this.evaluate(stmt.iterable, locals);
        const items =
          typeof iterable === 'string' ? iterable.split('') : Array.isArray(iterable) ? [...iterable] : null;

        if (!items) {
          throw new PyError(
            typeof iterable === 'number'
              ? `O for precisa de uma sequência. Para repetir ${iterable} vezes, use range(${iterable}).`
              : 'O for precisa de uma lista ou de um range().',
            stmt.line
          );
        }

        for (const item of items) {
          this.tick(stmt.line);
          this.store(stmt.name, item, locals);

          try {
            this.execBlock(stmt.body, locals);
          } catch (signal) {
            if (signal instanceof BreakSignal) break;
            if (!(signal instanceof ContinueSignal)) throw signal;
          }
        }

        return;
      }
      case 'def':
        this.store(stmt.name, { kind: 'function', name: stmt.name, params: stmt.params, body: stmt.body }, locals);
        return;
      case 'return':
        throw new ReturnSignal(stmt.value ? this.evaluate(stmt.value, locals) : null);
      case 'break':
        throw new BreakSignal();
      case 'continue':
        throw new ContinueSignal();
      case 'pass':
        return;
    }
  }

  private listIndex(list: PyValue[] | string, index: PyValue, line: number) {
    const position = this.number(index, line, 'O índice');
    const resolved = position < 0 ? list.length + position : position;

    if (!Number.isInteger(resolved) || resolved < 0 || resolved >= list.length) {
      throw new PyError(
        `Índice ${position} fora da lista: ela tem ${list.length} ${list.length === 1 ? 'item' : 'itens'} (de 0 a ${list.length - 1}).`,
        line
      );
    }

    return resolved;
  }

  private binary(op: string, left: PyValue, right: PyValue, line: number): PyValue {
    if (op === '+') {
      if (typeof left === 'string' && typeof right === 'string') return left + right;
      if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right];

      if (typeof left === 'string' || typeof right === 'string') {
        throw new PyError(
          'Não dá para somar texto com número. Converta com str(), como "Moedas: " + str(total).',
          line
        );
      }
    }

    if (op === '*' && typeof left === 'string' && typeof right === 'number') {
      return left.repeat(Math.max(0, right));
    }

    const a = this.number(left, line, `O operador ${op}`);
    const b = this.number(right, line, `O operador ${op}`);

    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
      case '//':
      case '%':
        if (b === 0) {
          throw new PyError('Divisão por zero não existe.', line);
        }

        return op === '/' ? a / b : op === '//' ? Math.floor(a / b) : a - b * Math.floor(a / b);
      default:
        throw new PyError(`Operador "${op}" não suportado.`, line);
    }
  }

  private equals(left: PyValue, right: PyValue): boolean {
    if (Array.isArray(left) && Array.isArray(right)) {
      return left.length === right.length && left.every((item, index) => this.equals(item, right[index]));
    }

    return left === right;
  }

  private evaluate(expr: Expr, locals: Map<string, PyValue> | null): PyValue {
    switch (expr.type) {
      case 'num':
      case 'str':
      case 'const':
        return expr.value;
      case 'name':
        return this.lookup(expr.name, locals, expr.line);
      case 'list':
        return expr.items.map((item) => this.evaluate(item, locals));
      case 'unary': {
        const value = this.evaluate(expr.operand, locals);
        return expr.op === 'not' ? !truthy(value) : -this.number(value, expr.line, 'O sinal de menos');
      }
      case 'binary': {
        if (expr.op === 'and') {
          const left = this.evaluate(expr.left, locals);
          return truthy(left) ? this.evaluate(expr.right, locals) : left;
        }

        if (expr.op === 'or') {
          const left = this.evaluate(expr.left, locals);
          return truthy(left) ? left : this.evaluate(expr.right, locals);
        }

        const left = this.evaluate(expr.left, locals);
        const right = this.evaluate(expr.right, locals);

        switch (expr.op) {
          case '==':
            return this.equals(left, right);
          case '!=':
            return !this.equals(left, right);
          case 'in':
            if (Array.isArray(right)) return right.some((item) => this.equals(item, left));
            if (typeof right === 'string' && typeof left === 'string') return right.includes(left);
            throw new PyError('"in" funciona com listas e textos.', expr.line);
          case '<':
          case '>':
          case '<=':
          case '>=': {
            if (typeof left === 'string' && typeof right === 'string') {
              return expr.op === '<' ? left < right : expr.op === '>' ? left > right : expr.op === '<=' ? left <= right : left >= right;
            }

            const a = this.number(left, expr.line, `A comparação ${expr.op}`);
            const b = this.number(right, expr.line, `A comparação ${expr.op}`);
            return expr.op === '<' ? a < b : expr.op === '>' ? a > b : expr.op === '<=' ? a <= b : a >= b;
          }
          default:
            return this.binary(expr.op, left, right, expr.line);
        }
      }
      case 'attr': {
        const object = this.evaluate(expr.object, locals);

        if (typeof object === 'object' && object !== null && !Array.isArray(object) && object.kind === 'host') {
          const getter = object.getters?.[expr.name];

          if (getter) {
            return getter();
          }

          const method = object.methods[expr.name];

          if (method) {
            return { kind: 'bound', owner: object.name, name: expr.name, fn: method };
          }

          const suggestion = closestName(expr.name, [
            ...Object.keys(object.methods),
            ...Object.keys(object.getters ?? {})
          ]);

          throw new PyError(
            `${object.name} não tem "${expr.name}".${suggestion ? ` Você quis dizer "${suggestion}"?` : ''} Maiúsculas e minúsculas fazem diferença.`,
            expr.line
          );
        }

        throw new PyError(`Não dá para usar ".${expr.name}" em ${typeName(object)}.`, expr.line);
      }
      case 'index': {
        const object = this.evaluate(expr.object, locals);
        const index = this.evaluate(expr.index, locals);

        if (Array.isArray(object) || typeof object === 'string') {
          return object[this.listIndex(object, index, expr.line)];
        }

        throw new PyError('Colchetes só funcionam com listas e textos.', expr.line);
      }
      case 'call': {
        const callee = this.evaluate(expr.callee, locals);
        const args = expr.args.map((arg) => this.evaluate(arg, locals));

        if (!isCallable(callee)) {
          throw new PyError(
            `${expr.callee.type === 'name' ? `"${expr.callee.name}"` : 'Isso'} não é uma função, então não pode ser chamado com ().`,
            expr.line
          );
        }

        if (callee.kind === 'bound' || callee.kind === 'builtin') {
          return callee.fn(args, expr.line);
        }

        if (args.length !== callee.params.length) {
          throw new PyError(
            `A função ${callee.name}() espera ${callee.params.length} ${callee.params.length === 1 ? 'valor' : 'valores'}, mas recebeu ${args.length}.`,
            expr.line
          );
        }

        this.callDepth += 1;

        if (this.callDepth > 40) {
          throw new PyError(
            `A função ${callee.name}() chamou a si mesma vezes demais. Ela precisa de uma condição para parar.`,
            expr.line,
            'limit'
          );
        }

        const scope = new Map<string, PyValue>();
        callee.params.forEach((param, index) => scope.set(param, args[index]));

        try {
          this.execBlock(callee.body, scope);
          return null;
        } catch (signal) {
          if (signal instanceof ReturnSignal) {
            return signal.value;
          }

          throw signal;
        } finally {
          this.callDepth -= 1;
        }
      }
    }
  }
}

/** Analisa o código sem executar. Lança PyError (kind "syntax") se houver erro de escrita. */
export function parseProgram(source: string): { body: Stmt[]; info: ProgramInfo } {
  const body = new Parser(tokenize(source)).parseProgram();
  const usage: CodeUsage = { loops: false, conditionals: false, functions: false, variables: false };
  analyze(body, usage);

  return { body, info: { usage, codeLines: countCodeLines(source) } };
}

/** Executa o programa inteiro. Lança PyError em qualquer erro (escrita, execução, jogo ou limite). */
export function runProgram(source: string, options: RunOptions): ProgramInfo {
  const { body, info } = parseProgram(source);
  new Interpreter(options).run(body);
  return info;
}
