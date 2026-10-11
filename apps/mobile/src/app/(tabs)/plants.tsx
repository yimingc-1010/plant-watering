import * as Application from 'expo-application';
import { StyleSheet, Text, View } from 'react-native';

import { format, strings } from '../../strings';
import { testIds } from '../../test-ids';
import { tokens } from '../../theme/tokens';

export default function PlantsScreen() {
  const version = Application.nativeApplicationVersion ?? 'dev';

  return (
    <View testID={testIds.plantsScreen} style={styles.container}>
      <Text style={styles.title}>{strings.plants.title}</Text>
      <View style={styles.spacer} />
      <Text testID={testIds.appVersion} style={styles.footer}>
        {format.version(version)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: tokens.space.lg,
    backgroundColor: tokens.color.background,
  },
  title: {
    ...tokens.font.title,
    color: tokens.color.text,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    ...tokens.font.caption,
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
});
