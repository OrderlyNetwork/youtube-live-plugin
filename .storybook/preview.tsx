import React from "react";
import type { Preview } from "@storybook/react";
import { OrderlyForStoryBookProvider } from "./orderlyForStoryBookProvider";
// import "../src/styles.css";

// window.Buffer = window.Buffer || require("buffer").Buffer;

const preview: Preview = {
  decorators: [
    (Story) => (
      <OrderlyForStoryBookProvider>
        <Story />
      </OrderlyForStoryBookProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
