// O app não usa animações do Reanimated nem o menu lateral (drawer) do expo-router.
// Essas bibliotecas chegam apenas como dependências opcionais do expo-router, e o
// código nativo delas estoura o limite de 260 caracteres de caminho do Windows no
// build local. Se um dia o app passar a usá-las, remova as entradas abaixo.
module.exports = {
  dependencies: {
    'react-native-reanimated': {
      platforms: { android: null, ios: null }
    },
    'react-native-worklets': {
      platforms: { android: null, ios: null }
    }
  }
};
