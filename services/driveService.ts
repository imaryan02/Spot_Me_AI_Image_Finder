
import { DriveFile } from '../types';

export const listDriveFiles = async (folderId: string, apiKey: string): Promise<DriveFile[]> => {
  const query = `'${folderId}' in parents and trash = false and mimeType contains 'image/'`;
  const fields = 'files(id, name, thumbnailLink, webContentLink)';
  // Page size 1000 to get max files in one go
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${apiKey}&fields=${encodeURIComponent(fields)}&pageSize=1000`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Drive files: ${response.statusText}`);
  }

  const data = await response.json();
  
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    // Google Drive thumbnails are small by default, request larger size (s600)
    thumbnailLink: file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s600') : '',
    webContentLink: file.webContentLink
  }));
};
