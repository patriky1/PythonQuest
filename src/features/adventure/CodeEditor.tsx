import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  TextInputSelectionChangeEvent,
  View
} from 'react-native';

import { colors, monoFont } from '@/theme/colors';

const FONT_SIZE = 13;
const LINE_HEIGHT = 20;
const PADDING = 8;
const GUTTER_WIDTH = 30;
/** Largura aproximada de um caractere da fonte monoespaçada. */
const CHAR_WIDTH = FONT_SIZE * 0.62;

const SYNTAX = {
  keyword: '#C4B5FD',
  hero: '#93C5FD',
  method: '#FDE68A',
  builtin: '#67E8F9',
  string: '#86EFAC',
  number: '#FDBA74',
  comment: '#64748B',
  plain: colors.codeText
};

const KEYWORDS = new Set([
  'if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'break', 'continue', 'pass',
  'and', 'or', 'not', 'True', 'False', 'None'
]);
const BUILTINS = new Set(['range', 'print', 'len', 'str', 'int', 'abs', 'min', 'max']);

type Span = { text: string; color: string };

const TOKEN = /(#.*$)|("[^"\n]*"?|'[^'\n]*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_À-ÿ][A-Za-z0-9_À-ÿ]*)|(\s+|.)/gm;

/** Divide uma linha em trechos coloridos (destaque de sintaxe). */
function highlightLine(line: string): Span[] {
  const spans: Span[] = [];
  let afterDot = false;
  TOKEN.lastIndex = 0;

  for (let match = TOKEN.exec(line); match; match = TOKEN.exec(line)) {
    const [text, comment, string, number, name] = match;
    let color = SYNTAX.plain;

    if (comment) color = SYNTAX.comment;
    else if (string) color = SYNTAX.string;
    else if (number) color = SYNTAX.number;
    else if (name) {
      if (afterDot) color = SYNTAX.method;
      else if (KEYWORDS.has(name)) color = SYNTAX.keyword;
      else if (name === 'hero') color = SYNTAX.hero;
      else if (BUILTINS.has(name)) color = SYNTAX.builtin;
    }

    afterDot = text === '.';
    const last = spans[spans.length - 1];

    if (last && last.color === color) {
      last.text += text;
    } else {
      spans.push({ text, color });
    }

    if (text === '') {
      break;
    }
  }

  return spans;
}

type CodeEditorProps = {
  code: string;
  onChangeCode: (code: string) => void;
  editable: boolean;
  height: number;
  /** Linha em execução (1 = primeira). */
  activeLine?: number | null;
  /** Linha com erro. */
  errorLine?: number | null;
  /** Posição do cursor a aplicar uma vez (depois de inserir um trecho por botão). */
  forcedCursor?: number | null;
  onCursorChange?: (cursor: number) => void;
};

/**
 * Editor de código do Adventure: destaque de sintaxe, numeração de linhas,
 * linha em execução (azul) e linha com erro (vermelha). As linhas não quebram:
 * código longo rola para o lado, então os números ficam sempre alinhados.
 */
export function CodeEditor({
  code,
  onChangeCode,
  editable,
  height,
  activeLine = null,
  errorLine = null,
  forcedCursor = null,
  onCursorChange
}: CodeEditorProps) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [viewWidth, setViewWidth] = useState(0);

  const lines = useMemo(() => code.split('\n'), [code]);
  const highlighted = useMemo(() => lines.map(highlightLine), [lines]);
  const longest = useMemo(() => lines.reduce((max, line) => Math.max(max, line.length), 0), [lines]);

  const contentHeight = lines.length * LINE_HEIGHT + PADDING * 2;
  const inputWidth = Math.max(viewWidth - GUTTER_WIDTH, longest * CHAR_WIDTH + 48);

  // Durante a execução, mantém a linha ativa (ou a do erro) à vista.
  const focusLine = activeLine ?? errorLine;

  useEffect(() => {
    if (focusLine === null) {
      return;
    }

    scrollRef.current?.scrollTo({
      y: Math.max(0, (focusLine - 1) * LINE_HEIGHT - height / 2 + LINE_HEIGHT),
      animated: true
    });
  }, [focusLine, height]);

  function handleSelection(event: TextInputSelectionChangeEvent) {
    onCursorChange?.(event.nativeEvent.selection.start);
  }

  const marker = (line: number | null, style: object) =>
    line !== null && line >= 1 && line <= lines.length ? (
      <View
        pointerEvents="none"
        style={[styles.marker, style, { top: PADDING + (line - 1) * LINE_HEIGHT }]}
      />
    ) : null;

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.editor, { height }]}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      onLayout={(event) => setViewWidth(event.nativeEvent.layout.width)}
    >
      <View style={[styles.content, { minHeight: Math.max(contentHeight, height) }]}>
        {marker(errorLine, styles.markerError)}
        {marker(activeLine, styles.markerActive)}

        <View style={styles.gutter} pointerEvents="none">
          {lines.map((_, index) => {
            const number = index + 1;

            return (
              <Text
                key={number}
                style={[
                  styles.lineNumber,
                  number === activeLine && styles.lineNumberActive,
                  number === errorLine && styles.lineNumberError
                ]}
              >
                {number}
              </Text>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <TextInput
            multiline
            editable={editable}
            scrollEnabled={false}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            // Não usar keyboardType="visible-password": no Android ele anula o modo
            // multilinha e o teclado perde a tecla Enter (quebra de linha).
            submitBehavior="newline"
            textAlignVertical="top"
            underlineColorAndroid="transparent"
            onChangeText={onChangeCode}
            onSelectionChange={handleSelection}
            selection={
              forcedCursor !== null ? { start: forcedCursor, end: forcedCursor } : undefined
            }
            placeholder="# Escreva seu código aqui"
            placeholderTextColor={SYNTAX.comment}
            accessibilityLabel="Editor de código Python"
            style={[styles.input, { width: inputWidth, minHeight: contentHeight }]}
          >
            {highlighted.map((spans, index) => (
              <Text key={index}>
                {spans.map((span, spanIndex) => (
                  <Text key={spanIndex} style={{ color: span.color }}>
                    {span.text}
                  </Text>
                ))}
                {index < highlighted.length - 1 ? '\n' : ''}
              </Text>
            ))}
          </TextInput>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  editor: {
    backgroundColor: colors.codeBg,
    borderRadius: 12
  },
  content: {
    flexDirection: 'row'
  },
  gutter: {
    width: GUTTER_WIDTH,
    paddingTop: PADDING,
    alignItems: 'flex-end',
    paddingRight: 6
  },
  lineNumber: {
    height: LINE_HEIGHT,
    lineHeight: LINE_HEIGHT,
    color: '#475569',
    fontFamily: monoFont,
    fontSize: 11,
    includeFontPadding: false
  },
  lineNumberActive: {
    color: '#BFDBFE',
    fontWeight: '800'
  },
  lineNumberError: {
    color: '#FCA5A5',
    fontWeight: '800'
  },
  input: {
    color: SYNTAX.plain,
    fontFamily: monoFont,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    paddingTop: PADDING,
    paddingBottom: PADDING,
    paddingHorizontal: 4,
    includeFontPadding: false
  },
  marker: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: LINE_HEIGHT
  },
  markerActive: {
    backgroundColor: 'rgba(37,99,235,0.38)',
    borderLeftWidth: 3,
    borderLeftColor: '#60A5FA'
  },
  markerError: {
    backgroundColor: 'rgba(220,38,38,0.32)',
    borderLeftWidth: 3,
    borderLeftColor: '#F87171'
  }
});
