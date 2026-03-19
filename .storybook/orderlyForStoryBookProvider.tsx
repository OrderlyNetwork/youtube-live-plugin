import React from "react";
import { OrderlyAppProvider } from "@orderly.network/react-app";
import { useConfigStore } from "./contants";
import { WalletConnectorProvider } from "./walletConnectorProvider";

export const OrderlyForStoryBookProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const configStore = useConfigStore({});
  return (
    <WalletConnectorProvider>
      <OrderlyAppProvider configStore={configStore}>
        {children}
      </OrderlyAppProvider>
    </WalletConnectorProvider>
  );
};
