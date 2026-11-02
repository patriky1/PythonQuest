import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

type RunnerMessage =
  | { type: 'ready' }
  | { type: 'loadError'; payload: string }
  | { type: 'result'; payload: { output: string; hasError: boolean } }
  | { type: 'info'; payload: string };

export type PythonRunResult = {
  output: string;
  hasError: boolean;
};

export type PythonRunnerHandle = {
  runCode: (code: string, inputs?: string[]) => void;
  resetSession: () => void;
  // Recarrega o interpretador (ex.: código preso em loop infinito).
  reload: () => void;
};

type PythonRunnerWebViewProps = {
  onResult: (result: PythonRunResult) => void;
  onInfo?: (message: string) => void;
  onReadyChange?: (isReady: boolean) => void;
  onLoadError?: (message: string) => void;
};

const PYODIDE_VERSION = 'v0.29.4';

// O código do aluno roda dentro do Pyodide (Python real compilado para WebAssembly).
const pyodideHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script src="https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/pyodide.js"></script>
  </head>
  <body>
    <script>
      let pyodide = null;

      function send(type, payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
      }

      async function boot() {
        try {
          pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/'
          });

          await pyodide.runPythonAsync(\`
import ast, builtins, io, json, sys, traceback

__pq_globals = {"__name__": "__main__"}

def __pq_run(source, inputs):
    buffer = io.StringIO()
    pending = list(inputs)
    has_error = False

    def fake_input(prompt=""):
        buffer.write(str(prompt))
        if not pending:
            raise EOFError("input() pediu um valor, mas o campo Entradas está vazio.")
        value = pending.pop(0)
        buffer.write(value + "\\\\n")
        return value

    old_stdout, old_stderr, old_input = sys.stdout, sys.stderr, builtins.input
    sys.stdout = sys.stderr = buffer
    builtins.input = fake_input

    try:
        tree = ast.parse(source, mode="exec")
        last_expr = None

        if tree.body and isinstance(tree.body[-1], ast.Expr):
            last_expr = ast.Expression(tree.body.pop().value)
            ast.fix_missing_locations(last_expr)

        ast.fix_missing_locations(tree)
        exec(compile(tree, "<pythonquest>", "exec"), __pq_globals)

        if last_expr is not None:
            value = eval(compile(last_expr, "<pythonquest>", "eval"), __pq_globals)
            if value is not None:
                print(repr(value))
    except BaseException:
        has_error = True
        traceback.print_exc(limit=-1)
    finally:
        sys.stdout, sys.stderr, builtins.input = old_stdout, old_stderr, old_input

    return json.dumps({"output": buffer.getvalue(), "hasError": has_error})
\`);

          send('ready');
        } catch (error) {
          send('loadError', String(error));
        }
      }

      async function run(code, inputs) {
        if (!pyodide) {
          send('info', 'O Python ainda está carregando. Aguarde alguns segundos.');
          return;
        }

        try {
          const runner = pyodide.globals.get('__pq_run');
          const pyInputs = pyodide.toPy(inputs || []);
          const raw = runner(code, pyInputs);
          pyInputs.destroy();
          runner.destroy();
          send('result', JSON.parse(raw));
        } catch (error) {
          send('result', { output: String(error), hasError: true });
        }
      }

      function reset() {
        if (!pyodide) {
          return;
        }

        pyodide.runPython('__pq_globals.clear(); __pq_globals["__name__"] = "__main__"');
        send('info', 'Sessão reiniciada. Variáveis apagadas.');
      }

      window.addEventListener('message', function (event) {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'run') run(data.code || '', data.inputs);
          if (data.type === 'reset') reset();
        } catch (error) {
          send('result', { output: String(error), hasError: true });
        }
      });

      boot();
    </script>
  </body>
</html>
`;

export const PythonRunnerWebView = forwardRef<
  PythonRunnerHandle,
  PythonRunnerWebViewProps
>(function PythonRunnerWebView(
  { onResult, onInfo, onReadyChange, onLoadError },
  ref
) {
  const webViewRef = useRef<WebView<{}>>(null);

  function sendToWebView(payload: unknown) {
    const jsonPayload = JSON.stringify(JSON.stringify(payload));

    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', { data: ${jsonPayload} }));
      true;
    `);
  }

  function handleMessage(event: WebViewMessageEvent) {
    let message: RunnerMessage;

    try {
      message = JSON.parse(event.nativeEvent.data) as RunnerMessage;
    } catch {
      onResult({ output: 'Erro ao ler a resposta do interpretador.', hasError: true });
      return;
    }

    switch (message.type) {
      case 'ready':
        onReadyChange?.(true);
        break;
      case 'loadError':
        onReadyChange?.(false);
        onLoadError?.(
          'Não foi possível carregar o Python. Verifique sua conexão com a internet.'
        );
        break;
      case 'result':
        onResult(message.payload);
        break;
      case 'info':
        onInfo?.(message.payload);
        break;
    }
  }

  useImperativeHandle(ref, () => ({
    runCode(code: string, inputs: string[] = []) {
      sendToWebView({ type: 'run', code, inputs });
    },
    resetSession() {
      sendToWebView({ type: 'reset' });
    },
    reload() {
      onReadyChange?.(false);
      webViewRef.current?.reload();
    }
  }));

  return (
    <View style={styles.hidden} pointerEvents="none">
      {/* Genérico explícito: na v14 o padrão P = undefined torna as props never. */}
      <WebView<{}>
        ref={webViewRef}
        source={{ html: pyodideHtml }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={() =>
          onLoadError?.('Não foi possível iniciar o Python neste aparelho.')
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  hidden: {
    height: 1,
    width: 1,
    opacity: 0,
    position: 'absolute'
  }
});
