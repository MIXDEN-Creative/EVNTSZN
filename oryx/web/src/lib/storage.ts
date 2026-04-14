/**
 * Storage & Media Hardening Utility
 * 
 * This utility provides guidance and constants for efficient storage usage
 * on the free/low-cost stack.
 */

export const STORAGE_LIMITS = {
  PLAYER_HEADSHOT_MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  EVENT_BANNER_MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  RESUME_PDF_MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
};

export const STORAGE_PATHS = {
  PLAYER_PHOTOS: "epl-player-photos",
  EVENT_BANNERS: "evntszn-event-banners",
  RESUMES: "epl-staff-resumes",
  VENUE_ASSETS: "evntszn-venue-assets",
};

/**
 * Recommends optimal image dimensions for different surfaces.
 */
export function getRecommendedDimensions(type: keyof typeof STORAGE_PATHS) {
  switch (type) {
    case "PLAYER_PHOTOS":
      return { width: 800, height: 800, fit: "cover" };
    case "EVENT_BANNERS":
      return { width: 1920, height: 1080, fit: "cover" };
    case "VENUE_ASSETS":
      return { width: 1200, height: 800, fit: "inside" };
    default:
      return { width: 1200, height: 1200, fit: "inside" };
  }
}

/**
 * Helper to check if a file exceeds the recommended limit.
 */
export function isFileTooLarge(sizeInBytes: number, limitInBytes: number) {
  return sizeInBytes > limitInBytes;
}

/**
 * Returns a human-readable size.
 */
export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
