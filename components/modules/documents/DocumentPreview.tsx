import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Pressable,
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
  onOpenFullScreen?: () => void;
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
  if (fileKind === 'image') {
    return { bg: Colors.infoContainer, icon: Colors.info, iconName: 'file-image-outline' };
  }
  return { bg: Colors.outline, icon: Colors.onBackground, iconName: 'file-document-outline' };
}

function ImagePreview({ url, name, onOpenFullScreen }: { url: string | null; name: string; onOpenFullScreen?: () => void }) {
  return (
    <View style={styles.imagePreviewContainer}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={styles.imageBox}
          resizeMode="contain"
          accessibilityLabel={name}
        />
      ) : (
        <View style={[styles.imageBox, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color="rgba(255,255,255,0.7)" />
        </View>
      )}
      {onOpenFullScreen && (
        <Pressable
          onPress={onOpenFullScreen}
          style={({ pressed }) => [styles.openFullBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="open-in-new" size={15} color={Colors.primary} />
          <AppText variant="labelMd" color="primary" weight="semiBold">
            פתיחה מלאה
          </AppText>
        </Pressable>
      )}
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
  const iconBg = fileKind === 'pdf' ? '#FFCCCC' : style.bg;

  return (
    <View style={styles.documentCard}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={style.iconName} size={64} color={style.icon} />
      </View>
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
  onOpenFullScreen,
}: DocumentPreviewProps) {
  if (fileKind === 'image') {
    return <ImagePreview url={downloadUrl} name={displayName} onOpenFullScreen={onOpenFullScreen} />;
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
  imagePreviewContainer: {
    gap: Spacing.sm,
  },
  imageBox: {
    height: 300,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  openFullBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  documentCard: {
    height: 150,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Shadow.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
