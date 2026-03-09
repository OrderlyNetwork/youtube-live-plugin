import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildAutoplayIframeSrc,
  buildPiPIframeHtml,
  getDocumentPiPApi,
  getPositionStyle,
  isDocumentPiPSupported,
  loadStoredLayout,
  saveStoredLayout,
} from "../utils";

const PIP_UNSUPPORTED_MSG = "Current browser does not support";

export type FloatingVideoMode = "inline" | "pip";
export type FloatingVideoPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** Video display mode: iframe for embedded YouTube/web pages; video for direct URLs */
export type VideoDisplayMode = "iframe" | "video";

export interface YoutubeLiveWidgetVideoRef {
  current: HTMLVideoElement | null;
}

export interface UseYoutubeLiveWidgetScriptOptions {
  src: string;
  displayMode?: VideoDisplayMode;
  defaultPosition?: FloatingVideoPosition;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  autoPipOnVisibilityChange?: boolean;
  persistLayout?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  videoRef?: React.MutableRefObject<HTMLVideoElement | null>;
}

export const useYoutubeLiveWidgetScript = (
  options: UseYoutubeLiveWidgetScriptOptions,
) => {
  const {
    src,
    displayMode = "iframe",
    defaultPosition = "bottom-right",
    defaultWidth = 384,
    defaultHeight = 216,
    minWidth: minWidthProp = 400,
    minHeight: minHeightProp = 225,
    maxWidth: maxWidthProp = 425,
    maxHeight: maxHeightProp = 239,
    autoPipOnVisibilityChange = false,
    persistLayout = true,
    autoPlay = true,
    muted = true,
    controls = true,
    videoRef: videoRefProp,
  } = options;

  const [mode, setMode] = useState<FloatingVideoMode>("inline");
  const [pipError, setPipError] = useState<string | null>(null);
  const [position, setPosition] =
    useState<FloatingVideoPosition>(defaultPosition);
  const [size, setSize] = useState({
    width: defaultWidth,
    height: defaultHeight,
  });
  const [pipUsesHtmlDocument, setPipUsesHtmlDocument] = useState(false);

  const videoRefInternal = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const documentPiPWindowRef = useRef<Window | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetParentRef = useRef<HTMLElement | null>(null);
  const widgetNextSiblingRef = useRef<Node | null>(null);
  const pipPageHideHandlerRef = useRef<(() => void) | null>(null);
  const presetSizeRef = useRef({ width: defaultWidth, height: defaultHeight });

  /** Effective iframe src with autoplay/mute params injected. */
  const effectiveSrc = useMemo(
    () => buildAutoplayIframeSrc(src, autoPlay, muted),
    [src, autoPlay, muted],
  );

  /**
   * PiP iframe src: same as effectiveSrc but without mute restriction.
   * Entering PiP requires a user gesture (click), so the browser permits
   * unmuted autoplay — no need to force mute=1 just for policy compliance.
   */
  const pipSrc = useMemo(
    () => buildAutoplayIframeSrc(src, autoPlay, false),
    [src, autoPlay],
  );

  useEffect(() => {
    presetSizeRef.current = { width: defaultWidth, height: defaultHeight };
  }, [defaultWidth, defaultHeight]);

  const videoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      (
        videoRefInternal as React.MutableRefObject<HTMLVideoElement | null>
      ).current = el;
      if (videoRefProp) {
        (
          videoRefProp as React.MutableRefObject<HTMLVideoElement | null>
        ).current = el;
      }
    },
    [videoRefProp],
  );

  const restoreWidgetFromPiP = useCallback(() => {
    const widget = widgetRef.current;
    const parent = widgetParentRef.current;
    if (!widget || !parent) return;
    const nextSibling = widgetNextSiblingRef.current;
    if (nextSibling && nextSibling.parentNode === parent) {
      parent.insertBefore(widget, nextSibling);
      return;
    }
    parent.appendChild(widget);
  }, []);

  const pipSupported = useMemo(() => isDocumentPiPSupported(), []);

  useEffect(() => {
    if (!persistLayout) return;
    const stored = loadStoredLayout();
    if (!stored) return;
    setPosition((stored.position as FloatingVideoPosition) ?? defaultPosition);
    let w = stored.width ?? defaultWidth;
    let h = stored.height ?? defaultHeight;
    if (maxWidthProp != null && w > maxWidthProp) w = maxWidthProp;
    if (maxHeightProp != null && h > maxHeightProp) h = maxHeightProp;
    setSize({ width: w, height: h });
  }, [
    defaultHeight,
    defaultPosition,
    defaultWidth,
    maxHeightProp,
    maxWidthProp,
    persistLayout,
  ]);

  useEffect(() => {
    if (!persistLayout) return;
    saveStoredLayout({
      position,
      width: size.width,
      height: size.height,
    });
  }, [persistLayout, position, size.height, size.width]);

  useEffect(() => {
    if (!persistLayout || typeof ResizeObserver === "undefined") return;
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.round(entry.contentRect.width);
      const nextHeight = Math.round(entry.contentRect.height);
      setSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [persistLayout]);

  const enterPiP = useCallback(async () => {
    setPipError(null);
    if (!pipSupported) {
      setPipError(PIP_UNSUPPORTED_MSG);
      return false;
    }
    const docPiP = getDocumentPiPApi();
    if (!docPiP) {
      setPipError(PIP_UNSUPPORTED_MSG);
      return false;
    }

    // iframe mode: open a fresh iframe in a new PiP document.
    // Moving the iframe DOM node to the PiP window breaks YouTube's referrer
    // identity check (error 153), so we create a new document in PiP and
    // blank out the original iframe to prevent dual-stream playback.
    if (displayMode === "iframe") {
      try {
        const pipWindow = await docPiP.requestWindow({
          width: size.width,
          height: size.height,
        });
        documentPiPWindowRef.current = pipWindow;

        // Stop original iframe before opening PiP to avoid two simultaneous streams.
        const originalIframe = iframeRef.current;
        if (originalIframe) {
          originalIframe.src = "about:blank";
        }

        pipWindow.document.open();
        pipWindow.document.write(buildPiPIframeHtml(pipSrc));
        pipWindow.document.close();

        const onClose = () => {
          // Restore original iframe so it resumes (live stream picks up current position).
          if (originalIframe) {
            originalIframe.src = effectiveSrc;
          }
          documentPiPWindowRef.current = null;
          pipPageHideHandlerRef.current = null;
          pipWindow.removeEventListener("pagehide", onClose);
          const { width: pw, height: ph } = presetSizeRef.current;
          setSize({
            width:
              maxWidthProp != null && pw > maxWidthProp ? maxWidthProp : pw,
            height:
              maxHeightProp != null && ph > maxHeightProp ? maxHeightProp : ph,
          });
          setPipUsesHtmlDocument(false);
          setMode("inline");
        };
        pipPageHideHandlerRef.current = onClose;
        pipWindow.addEventListener("pagehide", onClose);
        setPipUsesHtmlDocument(true);
        setMode("pip");
        return true;
      } catch {
        documentPiPWindowRef.current = null;
        setPipError(PIP_UNSUPPORTED_MSG);
        return false;
      }
    }

    // video mode: move the widget DOM node into the PiP window so the
    // HTMLVideoElement is transferred and playback continues uninterrupted.
    const widget = widgetRef.current;
    if (!widget || !widget.parentElement) {
      setPipError("Video element is not ready");
      return false;
    }

    try {
      widgetParentRef.current = widget.parentElement;
      widgetNextSiblingRef.current = widget.nextSibling;
      const pipWindow = await docPiP.requestWindow({
        width: size.width,
        height: size.height,
      });
      documentPiPWindowRef.current = pipWindow;

      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules]
            .map((rule) => rule.cssText)
            .join("");
          const style = pipWindow.document.createElement("style");
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch {
          if (!styleSheet.href) return;
          const link = pipWindow.document.createElement("link");
          link.rel = "stylesheet";
          link.type = styleSheet.type;
          link.media = styleSheet.media.mediaText;
          link.href = styleSheet.href;
          pipWindow.document.head.appendChild(link);
        }
      });

      const style = pipWindow.document.createElement("style");
      style.textContent = `
        html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
        #youtube-live-widget { position: static !important; inset: auto !important; margin: 0; width: 100%; height: 100%; display: flex; flex-direction: column; }
      `;
      pipWindow.document.head.appendChild(style);

      const onClose = () => {
        documentPiPWindowRef.current = null;
        restoreWidgetFromPiP();
        pipPageHideHandlerRef.current = null;
        pipWindow.removeEventListener("pagehide", onClose);
        const { width: pw, height: ph } = presetSizeRef.current;
        setSize({
          width: maxWidthProp != null && pw > maxWidthProp ? maxWidthProp : pw,
          height:
            maxHeightProp != null && ph > maxHeightProp ? maxHeightProp : ph,
        });
        setMode("inline");
      };
      pipPageHideHandlerRef.current = onClose;
      pipWindow.addEventListener("pagehide", onClose);
      pipWindow.document.body.appendChild(widget);
      setMode("pip");
      return true;
    } catch {
      restoreWidgetFromPiP();
      pipPageHideHandlerRef.current = null;
      documentPiPWindowRef.current = null;
      setPipError(PIP_UNSUPPORTED_MSG);
      return false;
    }
  }, [
    displayMode,
    effectiveSrc,
    maxHeightProp,
    maxWidthProp,
    pipSrc,
    pipSupported,
    restoreWidgetFromPiP,
    size.width,
    size.height,
  ]);

  const togglePiP = useCallback(async () => {
    if (!pipSupported) return;
    if (mode === "pip" || documentPiPWindowRef.current) return;
    await enterPiP();
  }, [pipSupported, mode, enterPiP]);

  useEffect(() => {
    if (!pipSupported || !autoPipOnVisibilityChange) return;
    const onVisibilityChange = async () => {
      if (document.hidden && !documentPiPWindowRef.current) await enterPiP();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [autoPipOnVisibilityChange, pipSupported, enterPiP]);

  const positionStyle = useMemo(() => getPositionStyle(position), [position]);

  return {
    mode,
    pipError,
    position,
    setPosition,
    size,
    minWidthProp,
    minHeightProp,
    maxWidthProp,
    maxHeightProp,
    pipSupported,
    pipUsesHtmlDocument,
    widgetRef,
    wrapperRef,
    iframeRef,
    videoRef,
    togglePiP,
    positionStyle,
    displayMode,
    effectiveSrc,
    autoPlay,
    muted,
    controls,
    PIP_UNSUPPORTED_MSG,
  };
};

export type YoutubeLiveWidgetState = ReturnType<
  typeof useYoutubeLiveWidgetScript
>;
