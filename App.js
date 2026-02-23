import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import NewQuoteScreen from './screens/NewQuoteScreen';
import ConfigScreen from './screens/ConfigScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Inicio">
        <Stack.Screen name="Inicio" component={HomeScreen} />
        <Stack.Screen name="Nueva Cotización" component={NewQuoteScreen} />
        <Stack.Screen name="Configuraciones" component={ConfigScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
