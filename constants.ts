// Using the official face-api.js models hosted on GitHub Pages or a reliable CDN mirror
// This path points to the weights required for the neural networks
export const FACE_API_MODELS_URI = 'https://justadudewhohacks.github.io/face-api.js/models';

// Threshold for face matching (Euclidean distance)
// 0.6 is typical, but we can be stricter or looser. Lower is stricter.
export const MATCH_THRESHOLD = 0.5;

// API Limit for Google Drive concurrency to avoid browser freezing
export const CONCURRENCY_LIMIT = 3; 

// Initial Config Keys (Empty by default)
export const STORAGE_KEY_CONFIG = 'eventmatch_config';

// Pre-configured keys from Environment Variables (Vite)
// If these are set, the UI will simplify itself for the user.
// Cast to any to avoid TS error: Property 'env' does not exist on type 'ImportMeta'
export const ENV_API_KEY = (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';
export const ENV_FOLDER_ID = (import.meta as any).env?.VITE_GOOGLE_FOLDER_ID || '';