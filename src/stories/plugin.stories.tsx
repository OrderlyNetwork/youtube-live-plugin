import type { Meta, StoryObj } from "@storybook/react";

import { expect, userEvent, within } from "storybook/test";

import { registerOrderlyYoutubeLivePlugin } from "../index";

import { TradingPage } from "@orderly.network/trading";
import { OrderlyPluginProvider } from '@orderly.network/ui'
import { useEffect, useState } from "react";
import { tradingPageConfig } from "./orderlyConfig";
// import '@orderly.network/trading/dist/index.css';
// import './styles.css'
import '@orderly.network/ui/dist/styles.css';

const meta = {
  title: "YouTube Live Plugin",
  component: TradingPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TradingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (arg) => {
    const [symbol, setSymbol] = useState("PERP_BTC_USDC");

    useEffect(() => {
      // updateSymbol(symbol);
    }, [symbol]);

    return <OrderlyPluginProvider plugins={[registerOrderlyYoutubeLivePlugin({
      src: "https://www.youtube.com/embed/YOUR_VIDEO_ID",
      className: "my-youtube-live", // optional
      displayMode: "iframe", // "iframe" | "video"
      title: "Live", // optional
      defaultWidth: 384,
      defaultHeight: 216,
      autoPipOnVisibilityChange: false,
      persistLayout: true,
      autoPlay: true,
      muted: true,
      controls: true,
    })]}>
      <TradingPage
        {...arg}
        tradingViewConfig={tradingPageConfig.tradingViewConfig}
        sharePnLConfig={tradingPageConfig.sharePnLConfig}
        symbol={symbol}
        onSymbolChange={(symbol) => {
          setSymbol(symbol.symbol);
        }}
      />
    </OrderlyPluginProvider>


  },
  args: {
  },
};