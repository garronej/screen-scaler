<p align="center">
    <i>One-size-fit-all web design: Screen-size agnostic development environment.</i>
    <br>
    <br>
    <a href="https://github.com/garronej/screen-scaler/actions">
      <img src="https://github.com/garronej/screen-scaler/workflows/ci/badge.svg?branch=main">
    </a>
    <a href="https://bundlephobia.com/package/screen-scaler">
      <img src="https://img.shields.io/bundlephobia/minzip/screen-scaler">
    </a>
    <a href="https://www.npmjs.com/package/screen-scaler">
      <img src="https://img.shields.io/npm/dw/screen-scaler">
    </a>
    <a href="https://github.com/garronej/screen-scaler/blob/main/LICENSE">
      <img src="https://img.shields.io/npm/l/screen-scaler">
    </a>
</p>

https://github.com/garronej/screen-scaler/assets/6702424/d15945b2-e1ac-4e93-a08f-20120a1e01de

## Motivation

Designing a web application that renders well on various screen sizes is a time-consuming task, regardless of the skill level of your developers and designers.

In today's world, the web is often leveraged to deliver enterprise software to a specific user base with largely uniform screen resolutions and dimensions. Specifically, many of these applications are seldom or never used on mobile devices.

In such scenarios, dedicating time to responsive design can be counterproductive. Instead, we can focus on delivering an exceptional user experience for a specific screen size.

This is where React-ScreenScaler comes into play. It allows you to design your application as if all your users have a specific screen resolution and dimension. When the actual screen size varies, React-ScreenScaler will automatically shrink or expand your app to fit. It fully emulates the targeted screen resolution, spoofing all relevant DOM APIs so that it's indistinguishable from the targeted resolution within the browser environment.

For instance, if you set the target width resolution to 1920px, the value of window.innerWidth will be 1920, regardless of the actual screen size.

## Features

-   📏 Automatically scales your React app to fit any screen size that differs from your target resolution.
-   🎭 Fully spoofs DOM APIs to emulate your specified settings.
-   🔌 Requires no changes to your existing code base; it's a simple function call and integrates seamlessly with any CSS Framework and UI library.
-   🛠️ Offers flexibility by enabling scaling only for specific screen size ranges. For instance, if your app renders well on large screens but breaks on smaller ones, you can activate scaling only for screen widths below `1000px`.
-   ♿ Preserves accessibility features, allowing users to zoom in and out with `ctrl + mouse wheel` or `⌘ + '+/-'`, provided you enable this functionality (and you should).

## Usage

Make it so that your app is always rendered as if the user had a screen resolution width of 1920.

```tsx
import { createScreenScaler } from "screen-scaler";

enableScreenScaler({
    // The zoom factor is for supporting when the user zooms in or out (ctrl + mouse wheel or ⌘ + '+' or ⌘ + '-') ...
    targetWindowInnerWidth: ({ zoomFactor }) => 1920 * zoomFactor,

    // If you don't want to enables your user to zoom you can provide an absolute value
    //targetWindowInnerWidth: 1920

    // This is the id of the root div of your app. With modern frameworks it's usually "root" or "app".
    rootDivId: "app"
});
```

## Limitations and workarounds

### Server side rendering

SSR isn't supported, if in Next.js you will have to wrap your all app in a [`no-ssr` component](https://www.npmjs.com/package/react-no-ssr).

### `vh` and `vw` CSS properties

The use of `vh` and `vw` CSS properties is not supported, they can't be spoofed.

If you where using `100vh` to make your app take the full height of the screen, you can use the following workaround:

```diff
 root.render(
   <React.StrictMode>
     <div style={{
        overflow: "hidden",
-       height: "100vh"
+       height: "100%", // Or height: window.innerHeight
     }}>
     </div>
   </React.StrictMode>
 );
```

### Portrait mode

When your app is rendered in a device in portrait mode, if you haven't accommodated for this your
app will appear very tiny at the top of the screen and most of the screen will be unused.

In this case, you have two options:

1: Implement a portrait mode version of your app.
2: Tell your user to rotate their device:

```tsx
import { enableScreenScaler } from "screen-scaler/react";

const { ScreenScalerOutOfRangeFallbackProvider } = enableScreenScaler({
    rootDivId: "root",
    targetWindowInnerWidth: ({ zoomFactor }) => 1920 * zoomFactor
});

export function App() {
    return (
        <ScreenScalerOutOfRangeFallbackProvider
            fallback={<h1>Please Rotate your phone, this app does not render well in portrait mode.</h1>}
        >
            {/* Your app here */}
        </ScreenScalerOutOfRangeFallbackProvider>
    );
}
```

> NOTE: We provide this example using the dedicated React adapter. To do that in another framework you
> will need to replace your app by a fallback element when your `targetWindowInnerWidth` returns `undefined`.
> If you'd like an adapter for your framework of choice, please open an issue.

### Readability issues

The issue with scaling down your app is that the text becomes increasingly smaller as the screen size decreases. Conversely, on very large screens, everything appears disproportionately large, creating the impression that the app is designed for children. These issues can be mitigated by dynamically adjusting the target width.

```ts
enableScreenScaler({
    // Example: Disabling the scaling for screen width above 1100px
    targetWindowInnerWidth: ({ actualWindowInnerWidth }) => Math.max(windowInnerWidth, 1100)
});
```

## Showcases

This library has been used to build the following projects:

<a href="https://youtu.be/FvpNfVrxBFM">
  <img width="1712" alt="image" src="https://user-images.githubusercontent.com/6702424/231314534-2eeb1ab5-5460-4caa-b78d-55afd400c9fc.png">
</a>

## Contributing

```bash
git clone https://github.com/garronej/screen-scaler
cd screen-scaler
yarn

# Start the test app in watch mode
yarn start-test-app

# Link in an external project in watch mode
yarn link-in-app YOUR-APP # ../YOUR-APP is supposed to exist
```
