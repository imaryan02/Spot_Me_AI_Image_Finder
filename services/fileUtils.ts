
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DriveFile } from '../types';

/**
 * Fetches the Blob for a given DriveFile.
 * Handles both local File objects and remote URLs.
 */
export const fetchFileBlob = async (file: DriveFile): Promise<Blob> => {
    if (file.fileObject) {
        return file.fileObject;
    }

    const url = file.webContentLink || file.thumbnailLink;
    if (!url) {
        throw new Error(`File ${file.name} has no valid URL`);
    }

    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`Failed to fetch ${file.name}`);
        return await response.blob();
    } catch (error) {
        console.warn(`CORS or Network error for ${file.name}, trying specific proxy or skipping if impossible.`, error);
        // Fallback: Attempt to fetch without specific CORS mode if it fails, though likely to fail alike if server restricts.
        // In a real prod env, you'd use a proxy.
        throw error;
    }
};

/**
 * Downloads a list of files as a ZIP archive.
 */
export const downloadFilesAsZip = async (files: DriveFile[], zipName: string = 'spotme-photos.zip') => {
    const zip = new JSZip();
    const folder = zip.folder("photos");

    if (!folder) throw new Error("Failed to create zip folder");

    const promises = files.map(async (file) => {
        try {
            const blob = await fetchFileBlob(file);
            // Ensure unique names if possible, but for now use file.name
            folder.file(file.name, blob);
        } catch (err) {
            console.error(`Skipping ${file.name} due to error`, err);
        }
    });

    await Promise.all(promises);

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, zipName);
};

/**
 * Shares files using the Web Share API.
 * Returns true if sharing was initiated, false if not supported or failed.
 */
export const shareFilesNative = async (files: DriveFile[], title: string = 'My Photos'): Promise<boolean> => {
    if (!navigator.share || !navigator.canShare) {
        console.warn("Web Share API not supported");
        return false;
    }

    // Web Share API has limits (usually 10 files).
    // We'll try to share the first 10 if there are too many, or let the user selected specific ones.
    const filesToShare: File[] = [];

    for (const file of files.slice(0, 10)) {
        try {
            const blob = await fetchFileBlob(file);
            // Reconstitute as a File object
            const sharedFile = new File([blob], file.name, { type: blob.type });
            filesToShare.push(sharedFile);
        } catch (err) {
            console.error("Error preparing file for share:", err);
        }
    }

    if (filesToShare.length === 0) return false;

    const shareData = {
        files: filesToShare,
        title: title,
        text: `Here are ${filesToShare.length} photos found with SpotMe!`
    };

    if (navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
            return true;
        } catch (err) {
            if ((err as any).name !== 'AbortError') {
                console.error("Share failed:", err);
            }
            return false;
        }
    } else {
        console.warn("Device cannot share these files.");
        return false;
    }
};
