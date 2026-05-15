import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { colors, spacing } from '@/theme/colors';

type RunnerMessage = {
  type: 'ready' | 'loading' | 'output' | 'error';
  payload?: string;
};

export type PythonRunnerHandle = {
  runCode: (code: string) => void;
  resetSession: () => void;
};

type PythonRunnerWebViewProps = {
  onOutput: (output: string) => void;
  onError: (error: string) => void;
  onReadyChange?: (isReady: boolean) => void;
};

const pyodideHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />

    <script src="https://cdn.jsdelivr.net/pyodide/v0.29.4/full/pyodide.js"></script>
  </head>

  <body>
    <script>
      let pyodide = null;
      let isReady = false;

      function sendMessage(type, payload) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: type,
            payload: payload || ''
          })
        );
      }

      async function bootPyodide() {
        try {
          sendMessage('loading', 'Carregando interpretador Python...');

          pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.4/full/'
          });

          await pyodide.runPythonAsync(\`
if "__pythonquest_globals" not in globals():
    __pythonquest_globals = {"__name__": "__main__"}
\`);

          isReady = true;
          sendMessage('ready', 'Interpretador Python pronto.');
        } catch (error) {
          sendMessage('error', String(error));
        }
      }

      async function runUserCode(code) {
        if (!isReady || !pyodide) {
          sendMessage('error', 'O interpretador Python ainda está carregando.');
          return;
        }

        try {
          pyodide.globals.set('__USER_CODE__', code);

          const result = await pyodide.runPythonAsync(\`
import sys
import io
import ast
import traceback

_stdout = io.StringIO()
_old_stdout = sys.stdout
_old_stderr = sys.stderr

sys.stdout = _stdout
sys.stderr = _stdout

try:
    _source = __USER_CODE__
    _tree = ast.parse(_source, mode="exec")

    if _tree.body and isinstance(_tree.body[-1], ast.Expr):
        _last_expr = ast.Expression(_tree.body.pop().value)

        ast.fix_missing_locations(_tree)
        ast.fix_missing_locations(_last_expr)

        if _tree.body:
            exec(
                compile(_tree, "<pythonquest>", "exec"),
                __pythonquest_globals
            )

        _value = eval(
            compile(_last_expr, "<pythonquest>", "eval"),
            __pythonquest_globals
        )

        if _value is not None:
            print(repr(_value))
    else:
        exec(
            compile(_tree, "<pythonquest>", "exec"),
            __pythonquest_globals
        )

except Exception:
    traceback.print_exc()

finally:
    sys.stdout = _old_stdout
    sys.stderr = _old_stderr

_stdout.getvalue()
\`);

          sendMessage('output', result || 'Código executado sem saída.');
        } catch (error) {
          sendMessage('error', String(error));
        }
      }

      function resetSession() {
        pyodide.runPythonAsync(\`
__pythonquest_globals = {"__name__": "__main__"}
\`);

        sendMessage('output', 'Sessão reiniciada. Variáveis apagadas.');
      }

      window.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'run') {
            runUserCode(data.code || '');
          }

          if (data.type === 'reset') {
            resetSession();
          }
        } catch (error) {
          sendMessage('error', String(error));
        }
      });

      bootPyodide();
    </script>
  </body>
</html>
`;

export const PythonRunnerWebView = forwardRef<
  PythonRunnerHandle,
  PythonRunnerWebViewProps
>(function PythonRunnerWebView(
  { onOutput, onError, onReadyChange },
  ref
) {
  const webViewRef = useRef<WebView>(null);

  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    'Inicializando Python...'
  );

  function sendToWebView(payload: unknown) {
    const jsonPayload = JSON.stringify(JSON.stringify(payload));

    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(
        new MessageEvent('message', {
          data: ${jsonPayload}
        })
      );
      true;
    `);
  }

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as RunnerMessage;

      if (message.type === 'loading') {
        setStatusMessage(message.payload || 'Carregando...');
      }

      if (message.type === 'ready') {
        setIsReady(true);
        setStatusMessage(message.payload || 'Python pronto.');
        onReadyChange?.(true);
      }

      if (message.type === 'output') {
        onOutput(message.payload || '');
      }

      if (message.type === 'error') {
        onError(message.payload || 'Erro ao executar Python.');
      }
    } catch {
      onError('Erro ao ler resposta do interpretador.');
    }
  }

  useImperativeHandle(ref, () => ({
    runCode(code: string) {
      sendToWebView({
        type: 'run',
        code
      });
    },

    resetSession() {
      sendToWebView({
        type: 'reset'
      });
    }
  }));

  return (
    <View style={styles.container}>
      {!isReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{statusMessage}</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: pyodideHtml }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        style={styles.webview}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 1,
    width: 1,
    opacity: 0
  },
  webview: {
    height: 1,
    width: 1
  },
  loadingOverlay: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 16
  },
  loadingText: {
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.sm
  }
});