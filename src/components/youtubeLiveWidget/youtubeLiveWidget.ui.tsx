import React, { FC } from "react";
import { Box, cn, Flex, Select, Text } from "@orderly.network/ui";
import PipIcon from "../pip_icon";
import { POSITION_OPTIONS } from "../utils";
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

export type YoutubeLiveWidgetProps = YoutubeLiveWidgetState & {
  className?: string;
  style?: React.CSSProperties;
  /** Extra controls rendered on the right side of the toolbar */
  extraControls?: React.ReactNode;
};

export const YoutubeLiveWidget: FC<YoutubeLiveWidgetProps> = (props) => {
  const {
    className,
    style,
    extraControls,
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
  } = props;

  return (
    <Flex
      ref={widgetRef}
      id="youtube-live-widget"
      className={cn(className)}
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
          className="oui-w-full oui-bg-base-8 oui-rounded-lg oui-px-2.5 oui-py-2 oui-text-white oui-text-xs"
          style={{ zIndex: 1 }}
        >
          <Text size="2xs" className="oui-whitespace-nowrap oui-ml-2">
            Position:
          </Text>
          <Select.options
            size="xs"
            value={position}
            onValueChange={(v) => setPosition(v as typeof position)}
            options={[...POSITION_OPTIONS]}
            classNames={{
              trigger:
                "oui-bg-blue oui-border-0 oui-w-auto oui-px-0 oui-font-normal",
            }}
            contentProps={{ style: { zIndex: 10000 } }}
          />
          <PipIcon
            size={16}
            onClick={togglePiP}
            disabled={!pipSupported}
            className="oui-cursor-pointer oui-text-base-contrast-54 hover:oui-text-base-contrast"
          >
            Enter PiP
          </PipIcon>
          {(pipError || !pipSupported) && (
            <Text size="2xs" className="oui-text-red-400 oui-whitespace-nowrap">
              {pipError || PIP_UNSUPPORTED_MSG}
            </Text>
          )}
          {extraControls}
        </Flex>
      )}
      <Box
        ref={wrapperRef}
        className={cn(
          "oui-resize oui-resize-both oui-overflow-hidden oui-bg-black oui-rounded-xl",
          "oui-shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
        )}
        style={{
          position: "relative",
          zIndex: 2,
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
            title="YouTube Live"
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
};
