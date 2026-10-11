import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { strings } from '../strings';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="plant/new"
          options={{ presentation: 'modal', title: strings.plantForm.newTitle }}
        />
        <Stack.Screen name="plant/[id]" options={{ title: strings.plantForm.editTitle }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
