const ERROR_EXPLANATIONS: Record<string, string> = {
  SyntaxError:
    'Erro de escrita (sintaxe). Confira parênteses, aspas e os dois-pontos (:) no fim de if, for, while e def.',
  IndentationError:
    'Erro de indentação. As linhas dentro de if, for, while e def precisam do mesmo recuo (4 espaços).',
  NameError:
    'Você usou um nome que o Python não conhece. Verifique se a variável foi criada antes e se o nome está escrito igual.',
  TypeError:
    'Tipos misturados. Por exemplo: somar texto com número. Use int(), float() ou str() para converter.',
  ValueError:
    'O valor não serve para essa operação. Ex.: int("abc") falha porque "abc" não é um número.',
  ZeroDivisionError: 'Divisão por zero não existe na matemática nem no Python.',
  IndexError:
    'Posição fora da lista. Lembre-se: o primeiro item é o índice 0 e o último é len(lista) - 1.',
  KeyError: 'Essa chave não existe no dicionário. Confira o nome da chave.',
  AttributeError:
    'Esse tipo de dado não tem esse método. Ex.: listas têm append(), mas números não.',
  EOFError:
    'O código usou input(), mas faltou valor. Escreva uma resposta por linha no campo Entradas.'
};

export function getPythonErrorName(output: string) {
  const match = output.match(/^(\w+(?:Error|Exception))\b/m);

  return match?.[1];
}

export function getCodeReview(code: string, output: string, hasError: boolean) {
  const tips: string[] = [];

  if (hasError) {
    const errorName = getPythonErrorName(output);
    const lineMatch = output.match(/line (\d+)/);

    tips.push(
      errorName && ERROR_EXPLANATIONS[errorName]
        ? `${errorName}: ${ERROR_EXPLANATIONS[errorName]}`
        : 'O Python encontrou um erro. Leia a última linha da saída: ela diz o tipo e a causa.'
    );

    if (lineMatch) {
      tips.push(`Comece olhando a linha ${lineMatch[1]} do seu código.`);
    }

    return tips;
  }

  if (!code.includes('print(') && code.trim().split('\n').length > 1) {
    tips.push('Use print() para mostrar os resultados de cada etapa.');
  }

  tips.push('Sem erros! Agora mude um valor e veja se o resultado muda como você esperava.');

  return tips;
}
