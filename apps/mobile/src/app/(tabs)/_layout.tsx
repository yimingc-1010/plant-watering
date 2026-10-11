import { Tabs } from 'expo-router';

import { strings } from '../../strings';
import { testIds } from '../../test-ids';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: strings.today.title,
          tabBarLabel: strings.tabs.today,
          tabBarButtonTestID: testIds.tabToday,
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: strings.plants.title,
          tabBarLabel: strings.tabs.plants,
          tabBarButtonTestID: testIds.tabPlants,
        }}
      />
    </Tabs>
  );
}
