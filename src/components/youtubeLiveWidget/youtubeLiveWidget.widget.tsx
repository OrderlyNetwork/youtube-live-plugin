import React from "react";
import { useYoutubeLiveWidgetScript } from "./youtubeLiveWidget.script";
import type {
  FloatingVideoPosition,
  VideoDisplayMode,
} from "./youtubeLiveWidget.script";
import {
  YoutubeLiveWidget,
  type YoutubeLiveWidgetProps,
} from "./youtubeLiveWidget.ui";

export type YoutubeLiveWidgetWidgetProps = Pick<
  YoutubeLiveWidgetProps,
  "className" | "style" | "extraControls"
> & {
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
};

export const YoutubeLiveWidgetWidget: React.FC<YoutubeLiveWidgetWidgetProps> = (
  props,
) => {
  const { className, style, extraControls, ...scriptOptions } = props;
  const state = useYoutubeLiveWidgetScript(scriptOptions);
  return (
    <YoutubeLiveWidget
      {...state}
      className={className}
      style={style}
      extraControls={extraControls}
    />
  );
};
