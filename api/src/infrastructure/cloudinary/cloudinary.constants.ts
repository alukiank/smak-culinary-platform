export const CLOUDINARY_CONSTANTS = {
  FOLDERS: {
    RECIPES: 'recipes',
  },
  DEFAULT_FETCH_OPTIONS: {
    width: 768,
    crop: 'limit',
    quality: 'auto',
  },
  DEFAULT_MIME_TYPE: 'image/jpeg',
} as const;
