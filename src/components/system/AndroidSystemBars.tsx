import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

export function AndroidSystemBars() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    async function configureNavigationBar() {
      try {
        await NavigationBar.setVisibilityAsync('hidden');

        /*
          overlay-swipe:
          A barra aparece temporariamente quando o usuário arrasta
          de baixo para cima e não empurra o layout do app.
        */
        await NavigationBar.setBehaviorAsync('overlay-swipe');
      } catch (error) {
        console.log('Erro ao configurar NavigationBar:', error);
      }
    }

    configureNavigationBar();
  }, []);

  return null;
}