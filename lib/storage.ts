import * as DocumentPicker from 'expo-document-picker';
import { backendRequest } from './backend';

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export async function pickFile(imageOnly = false): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: imageOnly ? 'image/*' : '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? 'application/octet-stream';
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType,
    size: asset.size ?? 0,
  };
}

type SignedUploadUrlResponse = {
  signedUrl: string;
  storageKey: string;
};

async function requestSignedUploadUrl(
  filename: string,
  contentType: string,
): Promise<SignedUploadUrlResponse> {
  return backendRequest<SignedUploadUrlResponse>('/documents/upload-url', {
    method: 'POST',
    body: { filename, contentType },
  });
}

async function uploadToSignedUrl(
  signedUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const fileResponse = await fetch(fileUri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Upload failed (${uploadResponse.status}): ${uploadResponse.statusText}`,
    );
  }
}

export function formatSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadDocument(file: PickedFile): Promise<{
  storageKey: string;
  sizeLabel: string;
}> {
  const { signedUrl, storageKey } = await requestSignedUploadUrl(
    file.name,
    file.mimeType,
  );

  await uploadToSignedUrl(signedUrl, file.uri, file.mimeType);

  return {
    storageKey,
    sizeLabel: formatSizeLabel(file.size),
  };
}

export async function getDownloadUrl(documentId: string, module: 'documents' | 'payments' = 'documents'): Promise<string> {
  const { signedUrl } = await backendRequest<{ signedUrl: string }>(
    `/${module}/${documentId}/download-url`,
  );
  return signedUrl;
}

export function getStorageUrl(storageKey: string): string {
  if (!storageKey) {
    console.log('[getStorageUrl] Empty storageKey');
    return '';
  }
  const baseUrl = 'https://rcnzqbcavfpqghxyojfk.supabase.co/storage/v1/object/public/knock';
  const fullUrl = `${baseUrl}/${storageKey}`;
  console.log('[getStorageUrl] Generated:', fullUrl);
  return fullUrl;
}
