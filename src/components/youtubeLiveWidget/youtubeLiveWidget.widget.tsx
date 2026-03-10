import React from "react";
import { useYoutubeLiveWidgetScript } from "./youtubeLiveWidget.script";
import type { VideoDisplayMode } from "./youtubeLiveWidget.script";
import {
  YoutubeLiveWidget,
  type YoutubeLiveWidgetProps,
} from "./youtubeLiveWidget.ui";

export type YoutubeLiveWidgetWidgetProps = Pick<
  YoutubeLiveWidgetProps,
  "className" | "style" | "title" | "extraControls"
> & {
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
};

export const YoutubeLiveWidgetWidget: React.FC<YoutubeLiveWidgetWidgetProps> = (
  props,
) => {
  const { className, style, title, extraControls, ...scriptOptions } = props;
  const state = useYoutubeLiveWidgetScript(scriptOptions);
  return (
    <YoutubeLiveWidget
      {...state}
      className={className}
      style={style}
      title={title}
      extraControls={extraControls}
    />
  );
};
