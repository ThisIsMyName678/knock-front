import React from 'react';
import { Modal, View, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/tokens';

type Props = {
  imageUrl: string;
  visible: boolean;
  onClose: () => void;
};

export function FullScreenImageViewer({ imageUrl, visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="סגור">
          <MaterialCommunityIcons name="close" size={24} color={Colors.surface} />
        </Pressable>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
