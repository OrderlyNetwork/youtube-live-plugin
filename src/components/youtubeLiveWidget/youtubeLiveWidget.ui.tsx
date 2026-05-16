import React, { FC, memo } from "react";
import { useTranslation } from "@orderly.network/i18n";
import { Box, cn, Flex, Text } from "@orderly.network/ui";
import PipIcon from "../pip_icon";
import { TLocaleMessages } from "../../i18n/module";
import type { YoutubeLiveWidgetState } from "./youtubeLiveWidget.script";

const MEDIA_FILL_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  zIndex: 1,
};

const TOOLBAR_CLASS =
  "oui-w-full oui-px-2 oui-bg-base-8 oui-rounded-t-lg oui-px-2 oui-py-2 oui-text-white oui-text-xs oui-flex-shrink-0";

export type YoutubeLiveWidgetProps = YoutubeLiveWidgetState & {
  className?: string;
  style?: React.CSSProperties;
  /** Optional title in toolbar (replaces position selector). Supports string or ReactNode. */
  title?: string | React.ReactNode;
  /** Extra controls rendered on the right side of the toolbar */
  extraControls?: React.ReactNode;
};

export const YoutubeLiveWidget: FC<YoutubeLiveWidgetProps> = memo((props) => {
  const { t: tBase } = useTranslation();
  const t = tBase as (key: keyof TLocaleMessages) => string;
  const {
    className,
    style,
    title,
    extraControls,
    mode,
    pipError,
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
    onDragHandlePointerDown,
    isDragging,
    displayMode,
    effectiveSrc,
    autoPlay,
    muted,
    controls,
    pipUnsupportedMsg,
  } = props;

  return (
    <Flex
      ref={widgetRef}
      id="youtube-live-widget"
      className={cn(
        "oui-rounded-lg oui-shadow-lg oui-overflow-hidden oui-border oui-border-line-12",
        className
      )}
      direction="column"
      position="fixed"
      style={{
        zIndex: 9999,
        width: mode === "pip" ? "100%" : undefined,
        height: mode === "pip" ? "100%" : undefined,
        // When PiP is active in iframe mode, the widget stays in the main document
        // but is hidden — the active video lives in the PiP window.
        ...(mode === "pip" && pipUsesHtmlDocument
          ? { visibility: "hidden" as const, pointerEvents: "none" as const }
          : {}),
        ...positionStyle,
        ...style,
      }}
    >
      {mode !== "pip" && (
        <Flex
          direction="row"
          itemAlign="center"
          gap={2}
          className={TOOLBAR_CLASS}
          style={{
            zIndex: 10,
            position: "relative",
            minHeight: 40,
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
          }}
          onPointerDown={onDragHandlePointerDown}
        >
          <div className="oui-flex-1">
            {title != null ? (
              <span>
                {typeof title === "string" ? (
                  <Text
                    size="2xs"
                    className="oui-whitespace-nowrap oui-overflow-hidden oui-text-ellipsis"
                    style={{ maxWidth: "80%", display: "block" }}
                    title={typeof title === "string" ? title : undefined}
                  >
                    {title}
                  </Text>
                ) : (
                  title
                )}
              </span>
            ) : null}
          </div>
          <PipIcon
            data-no-drag
            size={16}
            onClick={togglePiP}
            disabled={!pipSupported}
            className="oui-cursor-pointer oui-text-base-contrast-54 hover:oui-text-base-contrast"
          >
            {t("youtubeLive.enterPip")}
          </PipIcon>
          {(pipError || !pipSupported) && (
            <Text size="2xs" className="oui-text-red-400 oui-whitespace-nowrap">
              {pipError || pipUnsupportedMsg}
            </Text>
          )}
          {extraControls ? <span data-no-drag>{extraControls}</span> : null}
        </Flex>
      )}
      <Box
        ref={wrapperRef}
        className={cn(
          "oui-resize oui-resize-both oui-overflow-hidden oui-bg-base-9",
          "oui-shadow-[0_10px_30px_rgba(0,0,0,0.45)] oui-flex-shrink-0"
        )}
        style={{
          position: "relative",
          zIndex: 1,
          width: mode === "pip" ? "100%" : size.width,
          height: mode === "pip" ? "100%" : size.height,
          minWidth: mode === "pip" ? 0 : minWidthProp,
          minHeight: mode === "pip" ? 0 : minHeightProp,
          ...(mode !== "pip" && {
            ...(maxWidthProp != null && { maxWidth: maxWidthProp }),
            ...(maxHeightProp != null && { maxHeight: maxHeightProp }),
          }),
        }}
      >
        {displayMode === "video" ? (
          <video
            ref={videoRef}
            src={effectiveSrc}
            controls={controls}
            autoPlay={autoPlay}
            muted={muted}
            playsInline
            className="oui-block oui-w-full oui-h-full"
            style={{ ...MEDIA_FILL_STYLE, objectFit: "contain" }}
          />
        ) : (
          <iframe
            ref={iframeRef}
            src={effectiveSrc}
            title={t("youtubeLive.titleYouTubeLive")}
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            className="oui-block oui-w-full oui-h-full"
            style={MEDIA_FILL_STYLE}
            allowFullScreen
          />
        )}
      </Box>
    </Flex>
  );
});
YoutubeLiveWidget.displayName = "YoutubeLiveWidget";
