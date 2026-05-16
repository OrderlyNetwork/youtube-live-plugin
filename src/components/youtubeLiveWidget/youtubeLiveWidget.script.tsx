import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@orderly.network/i18n";
import type { TLocaleMessages } from "../../i18n/module";
import {
  buildAutoplayIframeSrc,
  buildPiPIframeHtml,
  clampPosition,
  getDocumentPiPApi,
  getPositionStyle,
  isDocumentPiPSupported,
  loadStoredLayout,
  saveStoredLayout,
} from "../utils";

export type FloatingVideoMode = "inline" | "pip";
export type FloatingVideoPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** Video display mode: iframe for embedded YouTube/web pages; video for direct URLs */
export type VideoDisplayMode = "iframe" | "video";

interface Size {
  width: number;
  height: number;
}

export interface YoutubeLiveWidgetVideoRef {
  current: HTMLVideoElement | null;
}

const DEFAULT_FIXED_POSITION = "bottom-right" as const;

export interface UseYoutubeLiveWidgetScriptOptions {
  src: string;
  displayMode?: VideoDisplayMode;
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
  options: UseYoutubeLiveWidgetScriptOptions
) => {
  const { t: tBase } = useTranslation();
  const t = tBase as (key: keyof TLocaleMessages) => string;
  const {
    src,
    displayMode = "iframe",
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

  const pipUnsupportedMsg = useMemo(() => t("youtubeLive.pipUnsupported"), [t]);
  const pipTitle = useMemo(() => t("youtubeLive.titleYouTubeLive"), [t]);

  const [mode, setMode] = useState<FloatingVideoMode>("inline");
  const [pipError, setPipError] = useState<string | null>(null);
  const [pixelPosition, setPixelPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState<Size>({
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
    [src, autoPlay, muted]
  );

  /**
   * PiP iframe src: same as effectiveSrc but without mute restriction.
   * Entering PiP requires a user gesture (click), so the browser permits
   * unmuted autoplay — no need to force mute=1 just for policy compliance.
   */
  const pipSrc = useMemo(
    () => buildAutoplayIframeSrc(src, autoPlay, false),
    [src, autoPlay]
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
    [videoRefProp]
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
    let w = stored.width ?? defaultWidth;
    let h = stored.height ?? defaultHeight;
    if (maxWidthProp != null && w > maxWidthProp) w = maxWidthProp;
    if (maxHeightProp != null && h > maxHeightProp) h = maxHeightProp;
    setSize({ width: w, height: h });
    if (typeof stored.left === "number" && typeof stored.top === "number") {
      const clamped = clampPosition(stored.left, stored.top, w, h);
      setPixelPosition({ left: clamped.left, top: clamped.top });
    }
  }, [defaultHeight, defaultWidth, maxHeightProp, maxWidthProp, persistLayout]);

  useEffect(() => {
    if (!persistLayout) return;
    saveStoredLayout({
      position: DEFAULT_FIXED_POSITION,
      width: size.width,
      height: size.height,
      ...(pixelPosition != null && {
        left: pixelPosition.left,
        top: pixelPosition.top,
      }),
    });
  }, [persistLayout, pixelPosition, size.height, size.width]);

  const RESIZE_THRESHOLD = 2;

  const applyClampedSize = useCallback(
    (pw: number, ph: number) => {
      setSize({
        width: maxWidthProp != null && pw > maxWidthProp ? maxWidthProp : pw,
        height:
          maxHeightProp != null && ph > maxHeightProp ? maxHeightProp : ph,
      });
    },
    [maxWidthProp, maxHeightProp]
  );

  useEffect(() => {
    if (!persistLayout || typeof ResizeObserver === "undefined") return;
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.round(entry.contentRect.width);
      const nextHeight = Math.round(entry.contentRect.height);
      setSize((prev: Size) => {
        const dw = Math.abs(prev.width - nextWidth);
        const dh = Math.abs(prev.height - nextHeight);
        if (dw <= RESIZE_THRESHOLD && dh <= RESIZE_THRESHOLD) return prev;
        return prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight };
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [persistLayout]);

  const enterPiP = useCallback(async () => {
    setPipError(null);
    if (!pipSupported) {
      setPipError(pipUnsupportedMsg);
      return false;
    }
    const docPiP = getDocumentPiPApi();
    if (!docPiP) {
      setPipError(pipUnsupportedMsg);
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
        pipWindow.document.write(buildPiPIframeHtml(pipSrc, pipTitle));
        pipWindow.document.close();

        const onClose = () => {
          if (originalIframe) originalIframe.src = effectiveSrc;
          documentPiPWindowRef.current = null;
          pipPageHideHandlerRef.current = null;
          pipWindow.removeEventListener("pagehide", onClose);
          const { width: pw, height: ph } = presetSizeRef.current;
          applyClampedSize(pw, ph);
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
        setPipError(pipUnsupportedMsg);
        return false;
      }
    }

    // video mode: move the widget DOM node into the PiP window so the
    // HTMLVideoElement is transferred and playback continues uninterrupted.
    const widget = widgetRef.current;
    if (!widget || !widget.parentElement) {
      setPipError(t("youtubeLive.videoNotReady"));
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
        applyClampedSize(pw, ph);
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
      setPipError(pipUnsupportedMsg);
      return false;
    }
  }, [
    applyClampedSize,
    displayMode,
    effectiveSrc,
    pipSrc,
    pipSupported,
    pipTitle,
    pipUnsupportedMsg,
    restoreWidgetFromPiP,
    size.width,
    size.height,
    t,
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

  const positionStyle = useMemo(
    () =>
      pixelPosition != null
        ? { left: pixelPosition.left, top: pixelPosition.top }
        : getPositionStyle(DEFAULT_FIXED_POSITION),
    [pixelPosition]
  );

  const onDragHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      // 不拦截 Select、PipIcon 等可交互元素的点击
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      const widget = widgetRef.current;
      const target = e.currentTarget;
      if (!widget) return;
      e.preventDefault();
      target.setPointerCapture(e.pointerId);
      const rect = widget.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = pixelPosition != null ? pixelPosition.left : rect.left;
      const startTop = pixelPosition != null ? pixelPosition.top : rect.top;

      let lastClamped = { left: startLeft, top: startTop };

      const onPointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const next = clampPosition(
          startLeft + dx,
          startTop + dy,
          size.width,
          size.height
        );
        lastClamped = next;
        widget.style.left = `${next.left}px`;
        widget.style.top = `${next.top}px`;
        widget.style.right = "";
        widget.style.bottom = "";
      };

      const exitDrag = (finalPosition: { left: number; top: number }) => {
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {
          // ignore if already released
        }
        target.removeEventListener(
          "pointermove",
          onPointerMove as EventListener
        );
        target.removeEventListener("pointerup", onPointerUp as EventListener);
        target.removeEventListener(
          "pointercancel",
          onPointerCancel as EventListener
        );
        setIsDragging(false);
        setPixelPosition(finalPosition);
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        if (upEvent.button !== 0) return;
        exitDrag(lastClamped);
      };

      const onPointerCancel = () => {
        exitDrag(lastClamped);
      };

      setIsDragging(true);
      target.addEventListener("pointermove", onPointerMove as EventListener);
      target.addEventListener("pointerup", onPointerUp as EventListener);
      target.addEventListener(
        "pointercancel",
        onPointerCancel as EventListener
      );
    },
    [pixelPosition, size.height, size.width]
  );

  return {
    mode,
    pipError,
    pixelPosition,
    setPixelPosition,
    isDragging,
    onDragHandlePointerDown,
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
    pipUnsupportedMsg,
  };
};

export type YoutubeLiveWidgetState = ReturnType<
  typeof useYoutubeLiveWidgetScript
>;
