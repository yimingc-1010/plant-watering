import { StyleSheet, Text, View } from 'react-native';

import { strings } from '../../strings';
import { testIds } from '../../test-ids';
import { tokens } from '../../theme/tokens';

export default function EditPlantScreen() {
  return (
    <View testID={testIds.plantFormScreen} style={styles.container}>
      <Text style={styles.title}>{strings.plantForm.editTitle}</Text>
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
});
