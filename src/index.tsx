import React from "react";
import { createInterceptor } from "@orderly.network/plugin-core";
import type { OrderlySDK } from "@orderly.network/plugin-core";
import type { VideoDisplayMode } from "./components/youtubeLiveWidget";
import { YoutubeLiveWidgetWidget } from "./components/youtubeLiveWidget/youtubeLiveWidget.widget";
import { LocaleProvider } from "./i18n";

const YoutubeLiveWidget = YoutubeLiveWidgetWidget;

export { YoutubeLiveWidget };
export { LocaleProvider as YoutubeLiveLocaleProvider } from "./i18n";
export type { VideoDisplayMode };

export interface OrderlyYoutubeLivePluginOptions {
  /** Optional CSS class for the wrapper */
  className?: string;
  /** Video source url for HTML5 <video> or iframe embed URL */
  src: string;
  /** Display mode: iframe (embedded webpage/YouTube) or video (direct URL like m3u8). Default iframe. */
  displayMode?: VideoDisplayMode;
  /** Optional toolbar title (string or ReactNode). Shown in place of the removed position selector. */
  title?: string | React.ReactNode;
  /** Default floating width in px */
  defaultWidth?: number;
  /** Default floating height in px */
  defaultHeight?: number;
  /** Min width of video area in px */
  minWidth?: number;
  /** Min height of video area in px */
  minHeight?: number;
  /** Enable auto PiP when tab becomes hidden. Default false. */
  autoPipOnVisibilityChange?: boolean;
  /** Keep layout in localStorage. Default true. */
  persistLayout?: boolean;
  /** Autoplay: in video mode sets <video> autoPlay; in iframe mode appends autoplay=1 to embed URL. Default true. */
  autoPlay?: boolean;
  /** Muted: in video mode sets <video> muted; in iframe mode appends mute=1 to embed URL (often required for autoplay). Default true. */
  muted?: boolean;
  /** Show native video controls. Default true. Only applies when displayMode is "video". */
  controls?: boolean;
}

/**
 * Register the orderly-youtube-live plugin.
 * Intercepts a target component and injects custom UI.
 */
export function registerOrderlyYoutubeLivePlugin(
  options: OrderlyYoutubeLivePluginOptions
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
            <LocaleProvider>
              <YoutubeLiveWidget
                className={options.className}
                src={options.src}
                displayMode={options.displayMode}
                title={options.title}
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
            </LocaleProvider>
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
