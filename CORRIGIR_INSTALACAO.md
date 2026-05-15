# Correção de instalação - PythonQuest

Este pacote corrige o erro `ERESOLVE unable to resolve dependency tree` causado por divergência entre `react`, `react-dom` e `react-native-web`.

## Como instalar do zero no Windows

No terminal, dentro da pasta do projeto:

```bat
rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm cache verify
npm install
npx expo start
```

## O que foi corrigido

O `package.json` agora declara explicitamente:

```json
"react": "19.2.0",
"react-dom": "19.2.0",
"react-native": "0.83.2",
"react-native-web": "~0.21.0"
```

Sem `react-dom` fixado, o npm pode tentar instalar uma versão mais nova, como `react-dom@19.2.6`, que exige `react@^19.2.6`. Isso gera conflito porque o projeto usa `react@19.2.0`, versão alinhada ao Expo SDK 55.

## Comandos úteis

Rodar no Android:

```bat
npx expo start --android
```

Rodar no navegador:

```bat
npx expo start --web
```

Verificar dependências Expo:

```bat
npx expo-doctor@latest
```
