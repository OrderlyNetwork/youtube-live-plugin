import type { Meta, StoryObj } from "@storybook/react";


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
  args: {
    symbol: "PERP_BTC_USDC",
    tradingViewConfig: tradingPageConfig.tradingViewConfig,
    sharePnLConfig: tradingPageConfig.sharePnLConfig,
    src: "https://www.youtube.com/embed/lfDr_glhN64?si=UcTI5GvRwjWH6i5W",
    title: 'How LayerZero Powers Omni-chain Trading on Orderly'
  },
  argTypes: {
    symbol: {
      control: "select",
      options: ["PERP_BTC_USDC", "PERP_ETH_USDC"],
    },
    src: {
      control: "text",
      description: "The source URL of the YouTube video",
    },
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
      src: arg.src,
      className: "my-youtube-live", // optional
      displayMode: "iframe", // "iframe" | "video"
      title: arg.title, // optional
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