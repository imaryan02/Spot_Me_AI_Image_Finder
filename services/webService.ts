import { DriveFile } from '../types';

export const fetchWebPhotos = async (jsonUrl: string): Promise<DriveFile[]> => {
  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`Failed to load JSON list: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error("JSON format incorrect. Expected an array of image URLs or objects.");
    }

    // Support both ["url1", "url2"] and [{url: "...", name: "..."}] formats
    return data.map((item: any, index: number) => {
      const url = typeof item === 'string' ? item : item.url;
      const name = typeof item === 'string' ? `Image ${index + 1}` : (item.name || `Image ${index + 1}`);
      
      return {
        id: `web-${index}`,
        name: name,
        thumbnailLink: url,
        webContentLink: url
      };
    });
  } catch (err: any) {
    throw new Error(`Error fetching web gallery: ${err.message}`);
  }
};
