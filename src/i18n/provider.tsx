import { FC, PropsWithChildren } from "react";
import {
  preloadDefaultResource,
  ExternalLocaleProvider,
  LocaleCode,
} from "@orderly.network/i18n";
import { YoutubeLiveLocales, TYoutubeLiveLocales } from "./module";

preloadDefaultResource(YoutubeLiveLocales);

const resources = (lang: LocaleCode) => {
  return import(`./locales/${lang}.json`).then(
    (res) => res.default as TYoutubeLiveLocales
  );
};

export const YoutubeLiveLocaleProvider: FC<PropsWithChildren> = (props) => {
  return (
    <ExternalLocaleProvider resources={resources}>
      {props.children}
    </ExternalLocaleProvider>
  );
};
