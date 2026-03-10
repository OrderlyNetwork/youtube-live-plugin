# @orderly.network/youtube-live-plugin

Orderly SDK plugin — YouTube Live floating widget with Picture-in-Picture support.

## Multi-language (i18n)

The plugin uses `@orderly.network/i18n` for all user-facing strings. To enable localized UI, wrap your app (or the part that mounts this plugin) with `YoutubeLiveLocaleProvider`:

```tsx
import { YoutubeLiveLocaleProvider } from "@orderly.network/youtube-live-plugin";

<YoutubeLiveLocaleProvider>
  <YourApp />
</YoutubeLiveLocaleProvider>
```

If the provider is not used, the UI will fall back to the default locale or show raw keys.
