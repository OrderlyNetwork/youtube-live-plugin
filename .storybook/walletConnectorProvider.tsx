import React, { type FC, type ReactNode } from "react";
import { WalletConnectorPrivy } from "./walletConnectorPrivy";

type WalletConnectorProviderProps = {
    children: ReactNode;
    usePrivy?: boolean;
    networkId?: string;
};

export const WalletConnectorProvider: FC<WalletConnectorProviderProps> = (
    props,
) => {
    return (
        <WalletConnectorPrivy usePrivy={props.usePrivy} networkId={props.networkId}>
            {props.children}
        </WalletConnectorPrivy>
    );
};
