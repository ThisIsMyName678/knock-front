import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  type DimensionValue,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import type { DocumentFileKind } from '@/lib/mocks/documents';

interface DocumentPreviewProps {
  fileKind: DocumentFileKind;
  displayName: string;
  sizeLabel: string;
  downloadUrl: string | null;
}

interface FileTypeStyle {
  bg: string;
  icon: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

function getFileTypeStyle(fileKind: DocumentFileKind): FileTypeStyle {
  if (fileKind === 'pdf') {
    return { bg: Colors.errorContainer, icon: Colors.error, iconName: 'file-pdf-box' };
  }
  return { bg: Colors.surfaceVariant, icon: Colors.onSurfaceVariant, iconName: 'file-outline' };
}

function ImagePreview({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={styles.imageBox}
        resizeMode="contain"
        accessibilityLabel={name}
      />
    );
  }
  return (
    <View style={[styles.imageBox, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color="rgba(255,255,255,0.7)" />
    </View>
  );
}

function DocumentCard({
  fileKind,
  displayName,
  sizeLabel,
}: {
  fileKind: DocumentFileKind;
  displayName: string;
  sizeLabel: string;
}) {
  const style = getFileTypeStyle(fileKind);

  return (
    <View style={[styles.documentCard, { backgroundColor: style.bg }]}>
      <MaterialCommunityIcons name={style.iconName} size={64} color={style.icon} />
      <View style={{ marginTop: Spacing.md, gap: Spacing.xs }}>
        <AppText
          variant="bodyMd"
          weight="semiBold"
          numberOfLines={2}
          style={{ textAlign: 'center' }}
        >
          {displayName}
        </AppText>
        <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>
          {sizeLabel}
        </AppText>
      </View>
    </View>
  );
}

export function DocumentPreview({
  fileKind,
  displayName,
  sizeLabel,
  downloadUrl,
}: DocumentPreviewProps) {
  if (fileKind === 'image') {
    return <ImagePreview url={downloadUrl} name={displayName} />;
  }

  return (
    <DocumentCard
      fileKind={fileKind}
      displayName={displayName}
      sizeLabel={sizeLabel}
    />
  );
}

const styles = StyleSheet.create({
  imageBox: {
    height: 300,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  documentCard: {
    height: 300,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Shadow.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingVertical: Spacing.lg + 1,
  },
});
