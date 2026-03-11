# @orderly.network/youtube-live-plugin

Orderly SDK plugin — YouTube Live floating widget with Picture-in-Picture support.

## Multi-language (i18n)

The plugin uses `@orderly.network/i18n` for all user-facing strings. The plugin injects its own `YoutubeLiveLocaleProvider` when registered, so translations load automatically and the host app does not need to wrap with it. If your app already uses Orderly’s `LocaleProvider`, the widget will follow the current locale.
