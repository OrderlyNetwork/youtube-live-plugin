import React from "react";
import { createInterceptor } from "@orderly.network/plugin-core";
import type { OrderlySDK } from "@orderly.network/plugin-core";
import type {
  FloatingVideoPosition,
  VideoDisplayMode,
} from "./components/youtubeLiveWidget";
import { YoutubeLiveWidgetWidget } from "./components/youtubeLiveWidget/youtubeLiveWidget.widget";

const YoutubeLiveWidget = YoutubeLiveWidgetWidget;

export { YoutubeLiveWidget };
export { YoutubeLiveLocaleProvider } from "./i18n";
export type { VideoDisplayMode, FloatingVideoPosition };

export interface OrderlyYoutubeLivePluginOptions {
  /** Optional CSS class for the wrapper */
  className?: string;
  /** Video source url for HTML5 <video> or iframe embed URL */
  src: string;
  /** Display mode: iframe (embedded webpage/YouTube) or video (direct URL like m3u8) */
  displayMode?: VideoDisplayMode;
  /** Default floating corner in inline mode */
  defaultPosition?: FloatingVideoPosition;
  /** Default floating width in px */
  defaultWidth?: number;
  /** Default floating height in px */
  defaultHeight?: number;
  /** Min width of video area in px */
  minWidth?: number;
  /** Min height of video area in px */
  minHeight?: number;
  /** Enable auto PiP on tab visibility changes */
  autoPipOnVisibilityChange?: boolean;
  /** Keep layout in localStorage */
  persistLayout?: boolean;
  /** Video autoplay option, default true */
  autoPlay?: boolean;
  /** Video muted option, default true */
  muted?: boolean;
  /** Show native video controls, default true */
  controls?: boolean;
}

/**
 * Register the orderly-youtube-live plugin.
 * Intercepts a target component and injects custom UI.
 */
export function registerOrderlyYoutubeLivePlugin(
  options: OrderlyYoutubeLivePluginOptions,
) {
  return (SDK: OrderlySDK) => {
    SDK.registerPlugin({
      id: "orderly-plugin-orderly-youtube-live-7fcc86f5",
      name: "OrderlyYoutubeLive",
      version: "0.1.0",
      orderlyVersion: ">=2.9.0",

      interceptors: [
        createInterceptor("Trading.TradingPage", (Original, props, _api) => (
          <>
            <Original {...props} />
            <YoutubeLiveWidget
              className={options.className}
              src={options.src}
              displayMode={options.displayMode}
              defaultPosition={options.defaultPosition}
              defaultWidth={options.defaultWidth}
              defaultHeight={options.defaultHeight}
              minWidth={options.minWidth}
              minHeight={options.minHeight}
              autoPipOnVisibilityChange={options.autoPipOnVisibilityChange}
              persistLayout={options.persistLayout}
              autoPlay={options.autoPlay}
              muted={options.muted}
              controls={options.controls}
            />
          </>
        )),
      ],

      setup: (_api) => {
        // Non-UI logic: event subscriptions, logging, etc.
      },
    });
  };
}

export default registerOrderlyYoutubeLivePlugin;
