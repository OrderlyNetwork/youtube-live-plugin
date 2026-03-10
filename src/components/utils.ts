export interface StoredLayout {
  position?: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

export interface DocumentPictureInPictureApi {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  window: Window | null;
}

const POSITION_OFFSET = 20;

export const STORAGE_KEY = "orderly.youtube-live.layout.v1";

const VIEWPORT_MARGIN = 20;

/** Clamp left/top so the widget stays within viewport with margin. */
export function clampPosition(
  left: number,
  top: number,
  width: number,
  height: number,
): { left: number; top: number } {
  if (typeof window === "undefined") {
    return { left, top };
  }
  const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
  return {
    left: Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft)),
    top: Math.max(VIEWPORT_MARGIN, Math.min(top, maxTop)),
  };
}

export function getPositionStyle(position: string): {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
} {
  switch (position) {
    case "top-left":
      return { top: POSITION_OFFSET, left: POSITION_OFFSET };
    case "top-right":
      return { top: POSITION_OFFSET, right: POSITION_OFFSET };
    case "bottom-left":
      return { bottom: POSITION_OFFSET, left: POSITION_OFFSET };
    case "bottom-right":
    default:
      return { bottom: POSITION_OFFSET, right: POSITION_OFFSET };
  }
}

/** Document PiP: supports rendering arbitrary HTML (iframe/video) in a PiP window, Chrome 116+ */
export function isDocumentPiPSupported() {
  if (typeof window === "undefined") {
    return false;
  }

  const win = window as Window & {
    documentPictureInPicture?: DocumentPictureInPictureApi;
  };

  return Boolean(
    "documentPictureInPicture" in window &&
      typeof win.documentPictureInPicture?.requestWindow === "function",
  );
}

export function getDocumentPiPApi(): DocumentPictureInPictureApi | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const win = window as Window & {
    documentPictureInPicture?: DocumentPictureInPictureApi;
  };
  return win.documentPictureInPicture;
}

export function loadStoredLayout(): StoredLayout | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredLayout;
  } catch {
    return null;
  }
}

export function saveStoredLayout(layout: {
  position: string;
  width: number;
  height: number;
  left?: number;
  top?: number;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // localStorage may be unavailable in private mode / sandboxed contexts.
  }
}

/** Inject autoplay/mute params into a YouTube (or other) iframe embed URL. */
export function buildAutoplayIframeSrc(
  src: string,
  autoPlay: boolean,
  muted: boolean,
): string {
  if (!autoPlay) return src;
  try {
    const url = new URL(src);
    url.searchParams.set("autoplay", "1");
    if (muted) url.searchParams.set("mute", "1");
    return url.toString();
  } catch {
    return src;
  }
}

/** Build minimal HTML document for PiP iframe mode (YouTube referrer requirement). */
export function buildPiPIframeHtml(
  src: string,
  title?: string,
): string {
  const safeSrc = src.replace(/"/g, "&quot;");
  const safeTitle = (title ?? "YouTube Live").replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; box-sizing: border-box; }
    #yt-pip-iframe { position: absolute; left: 0; top: 0; width: 100%; height: 100%; border: 0; display: block; }
  </style>
</head>
<body>
  <iframe
    id="yt-pip-iframe"
    src="${safeSrc}"
    referrerpolicy="strict-origin-when-cross-origin"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    title="${safeTitle}"
  ></iframe>
</body>
</html>`;
}
