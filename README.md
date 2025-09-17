<p align="center">
    <i>One-size-fit-all web design: Screen-size agnostic development environment.</i>
    <br>
    <br>
    <a href="https://github.com/garronej/screen-scaler/actions">
      <img src="https://github.com/garronej/screen-scaler/workflows/ci/badge.svg?branch=main">
    </a>
    <a href="https://www.npmjs.com/package/screen-scaler">
      <img src="https://img.shields.io/npm/dw/screen-scaler">
    </a>
    <a href="https://github.com/garronej/screen-scaler/blob/main/LICENSE">
      <img src="https://img.shields.io/npm/l/screen-scaler">
    </a>
</p>

https://github.com/garronej/screen-scaler/assets/6702424/d15945b2-e1ac-4e93-a08f-20120a1e01de

<a href="https://youtu.be/Ou2I4oWuUj8?si=Gftx15nVVXWSvzxH&t=268">
  <img width="1712" alt="image" src="https://github.com/garronej/screen-scaler/assets/6702424/0845ead0-1bbb-4fa2-80c2-5aa919dd2717">
</a>

## Motivation and Warning

**Screen-Scaler is a niche tool designed for very specific use cases.** It enables you to design your application as though every user has the same screen size, automating the adjustment process for different screen dimensions by scaling your app to fit. While this can significantly streamline development for certain projects, **it is not a replacement for responsive design** and is not recommended for general-purpose applications.

Responsive design remains the gold standard for creating web applications that offer the best user experience across a wide range of devices. Screen-Scaler should be considered either a temporary hack or a solution for projects where user screens are highly uniform and predictable.

## Features

-   📏 Automatically scales your app to fit any screen size that differs from your target resolution.
-   🎭 Fully spoofs DOM APIs to emulate your specified settings.
-   🔌 Requires no changes to your existing code base; it's a simple function call and integrates seamlessly with any CSS Framework and UI library.
-   🛠️ Offers flexibility by enabling scaling only for specific screen size ranges. For instance, if your app renders well on large screens but breaks on smaller ones, you can activate scaling only for screen widths below `1000px`.
-   ♿ Preserves accessibility features, allowing users to zoom in and out with `ctrl + mouse wheel` or `⌘ + '+/-'`, provided you enable this functionality (and you should).

## Installation

```bash
npm install --save screen-scaler evt
```

## Usage

Make it so that your app is always rendered as if the user had a screen resolution width of 1920.

Screen scaler must run before any other UI related code runs, you should first enable screen-scaler
then load your app asynchronously.

`src/main.tsx`

```tsx
import { enableScreenScaler } from "screen-scaler";

enableScreenScaler({
    // The zoom factor is for supporting when the user zooms in or out (ctrl + mouse wheel or ⌘ + '+' or ⌘ + '-') ...
    // You can prevent the users from being able to zoom with `()=> 1920`
    getTargetWindowInnerWidth: ({ zoomFactor }) => 1920 * zoomFactor,

    // This is the id of the root div of your app. With modern frameworks, it's "root" by default in Vite projects.
    rootDivId: "root"
});

import("./main.lazy");
```

`src/main.lazy.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
```

## Run the test App

```bash
git clone https://github.com/garronej/screen-scaler
cd screen-scaler
yarn
yarn start-test-app
```

Screen scaler is setup in [the `src/index.tsx` file](https://github.com/garronej/screen-scaler/blob/6afbbf54c2d0b650f4f746b9e03eb17a8499b7aa/test-app/src/index.tsx#L7-L17).

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

`src/main.tsx`

```tsx
import { enableScreenScaler } from "screen-scaler";

enableScreenScaler({
    // The zoom factor is for supporting when the user zooms in or out (ctrl + mouse wheel or ⌘ + '+' or ⌘ + '-') ...
    getTargetWindowInnerWidth: ({ zoomFactor }) => 1920 * zoomFactor,

    // If you don't want to enables your user to zoom you can provide an absolute value
    //targetWindowInnerWidth: 1920

    // This is the id of the root div of your app. With modern frameworks it's usually "root" or "app".
    rootDivId: "app"
});

import("./main.lazy");
```

`src/main.lazy.tsx`

```tsx
import { evtIsScreenScalerOutOfBound } from "screen-scaler";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";

export function App() {
    useRerenderOnStateChange(evtIsScreenScalerOutOfBound);

    const isScreenScalerEnabled = evtIsScreenScalerOutOfBound.state !== undefined;
    const isScreenScalerOutOfBound = evtIsScreenScalerOutOfBound.state;

    if (isScreenScalerEnabled && isScreenScalerOutOfBound) {
        return <h1>Please Rotate your phone, this app does not render well in portrait mode.</h1>;
    }

    return <>{/* ... Your App ... */}</>;
}
```

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
