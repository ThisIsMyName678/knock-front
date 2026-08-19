import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
} from '@/constants/tokens';
import { RTL_ALIGN_END, RTL_ROW } from '@/constants/rtl';
import type { DocumentFileKind } from '@/lib/mocks/documents';

interface DocumentPreviewProps {
  fileKind: DocumentFileKind;
  displayName: string;
  sizeLabel: string;
  downloadUrl: string | null;
  onOpenFullScreen?: () => void;
  onDownload?: () => void;
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

function CardActionButton({
  label,
  icon,
  accessibilityLabel,
  onPress,
  compact,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accessibilityLabel: string;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardActionBtn,
        compact && styles.cardActionBtnCompact,
        pressed && styles.cardActionBtnPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialCommunityIcons name={icon} size={compact ? 14 : 16} color={Colors.primary} />
      <AppText variant="labelMd" color="primary" weight="semiBold">
        {label}
      </AppText>
    </Pressable>
  );
}

function CardMetaRow({
  sizeLabel,
  action,
}: {
  sizeLabel: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.cardMetaRow}>
      <AppText variant="caption" color="muted" style={styles.cardMetaSizeLabel}>
        {sizeLabel}
      </AppText>
      {action ? <View style={styles.cardMetaActionWrap}>{action}</View> : null}
    </View>
  );
}

function ImagePreview({ url, name, onOpenFullScreen }: { url: string | null; name: string; onOpenFullScreen?: () => void }) {
  return (
    <View style={styles.container}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={styles.imageBox}
          resizeMode="contain"
          accessibilityLabel={name}
        />
      ) : (
        <View style={[styles.imageBox, styles.imageLoading]}>
          <ActivityIndicator color="rgba(255,255,255,0.7)" />
        </View>
      )}
      {onOpenFullScreen ? (
        <CardActionButton
          label="פתיחה מלאה"
          icon="open-in-new"
          accessibilityLabel="פתיחה מלאה"
          onPress={onOpenFullScreen}
        />
      ) : null}
    </View>
  );
}

function DocumentCard({
  fileKind,
  displayName,
  sizeLabel,
  downloadUrl,
  onOpenFullScreen,
  onDownload,
}: {
  fileKind: DocumentFileKind;
  displayName: string;
  sizeLabel: string;
  downloadUrl: string | null;
  onOpenFullScreen?: () => void;
  onDownload?: () => void;
}) {
  const style = getFileTypeStyle(fileKind);
  const iconBg = fileKind === 'pdf' ? '#FFCCCC' : style.bg;
  const isPdf = fileKind === 'pdf';
  const isOther = fileKind === 'other';

  const openUrlFallback = () => {
    if (downloadUrl) {
      Linking.openURL(downloadUrl).catch(() => {});
    }
  };

  const handleOpenPdf = () => {
    if (onOpenFullScreen) {
      onOpenFullScreen();
      return;
    }
    openUrlFallback();
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    openUrlFallback();
  };

  const showOpenButton = isPdf && (onOpenFullScreen || downloadUrl);
  const showDownloadButton = isOther && (onDownload || downloadUrl);
  const showMetaRow = isPdf || isOther;

  const metaAction = showOpenButton ? (
    <CardActionButton
      compact
      label="פתיחה מלאה"
      icon="open-in-new"
      accessibilityLabel="פתיחה מלאה"
      onPress={handleOpenPdf}
    />
  ) : showDownloadButton ? (
    <CardActionButton
      compact
      label="הורדה"
      icon="download-outline"
      accessibilityLabel="הורדה"
      onPress={handleDownload}
    />
  ) : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.documentCard}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={style.iconName} size={64} color={style.icon} />
        </View>
        <View style={styles.cardTextBlock}>
          <AppText
            variant="bodyMd"
            weight="semiBold"
            numberOfLines={2}
            style={styles.cardTitle}
          >
            {displayName}
          </AppText>
          {showMetaRow ? (
            <CardMetaRow sizeLabel={sizeLabel} action={metaAction} />
          ) : (
            <AppText variant="caption" color="muted" style={styles.cardSubtitle}>
              {sizeLabel}
            </AppText>
          )}
        </View>
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
  onDownload,
}: DocumentPreviewProps) {
  if (fileKind === 'image') {
    return <ImagePreview url={downloadUrl} name={displayName} onOpenFullScreen={onOpenFullScreen} />;
  }

  return (
    <DocumentCard
      fileKind={fileKind}
      displayName={displayName}
      sizeLabel={sizeLabel}
      downloadUrl={downloadUrl}
      onOpenFullScreen={onOpenFullScreen}
      onDownload={onDownload}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.sm,
  },
  imageBox: {
    height: 300,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  imageLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionBtn: {
    alignSelf: RTL_ALIGN_END,
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  cardActionBtnCompact: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  cardActionBtnPressed: {
    opacity: 0.85,
  },
  cardMetaRow: {
    width: '100%',
    minHeight: 28,
    marginTop: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMetaSizeLabel: {
    textAlign: 'center',
    width: '100%',
  },
  cardMetaActionWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  documentCard: {
    minHeight: 150,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Shadow.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextBlock: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
    width: '100%',
  },
  cardTitle: {
    textAlign: 'center',
  },
  cardSubtitle: {
    textAlign: 'center',
  },
});
