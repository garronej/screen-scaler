<p align="center">
    <img src="https://user-images.githubusercontent.com/6702424/80216211-00ef5280-863e-11ea-81de-59f3a3d4b8e4.png">  
</p>
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

## Motivation

Designing a web application that will renders great on every screen size is a very device is a time consuming task, regardless of how
skilled your developers and designers are.

Nowadays, the web is often used as a platform to ship enterprise software to a specific user base with mostly uniform screen resolutions and dimension.  
In particular many of those application will never or rarely be used on mobile devices.

In this context it's a waste of time to spend time on building responsive design, we can instead focus on building a great user experience for a specific screen size.

This is where React-ScreenScaler comes in.
It allows you to assume that all your users have a specific screen resolution and dimension.  
When the actual screen size is different, screen-scaler will just shrink or grow your app to fit the screen.  
screen-scaler fully emulates the targeted screen resolution, all the relevant DOM API are spoofed so that from inside the browser
there is no way to tell that the screen size is different than the targeted one.

For example, if you set the target width resolution to `1920px`.
`window.innerWidth` will be `1920` and regardless of the actual screen size.

## Features

-   Automatically scales your React app to fit any screen size different than your target resolution.
-   The DOM APIs are fully spoofed to emulate your specifications.
-   Works with any CSS framework, a specific adapter is provided for React.
-   Don't require any change to your code base, it's just a function call, it will play well with any
    UI library such as MUI, Ant Design, Chakra UI, etc...
-   Flexible, you can enable the scaling only for a specific screen size range.
    For example if you know your app render fine on big screen but it's only on small screen that it breaks, you can
    enable the scaling only for screen width below `1000px`.
-   Accessibility preserved. Your users can still zoom in and out with `ctrl + mouse wheel` or `⌘ + '+' or ⌘ + '-'`...
    As long as you allow them to do so (You should).

## Usage

Make it so that your app is always rendered as if the user had a screen resolution width of 1920.

```tsx
import { createScreenScaler } from "screen-scaler";

const { ScreenScaler } = createScreenScaler({
    // The zoom factor if for supporting when the use zooms in or out (ctrl + mouse wheel or ⌘ + '+' or ⌘ + '-') ...
    targetWindowInnerWidth: ({ zoomFactor }) => 1920 * zoomFactor

    // If you don't want to enable your user to zoom at all you can provide an absolute value
    //targetWindowInnerWidth: 1920

    // This is the id of the root div of your app. With modern frameworks it's usually "root" or "app".
    rootDivId: "app"
});

export function App() {
    return <ScreenScaler>{/* Your app here */}</ScreenScaler>;
}
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
import { createScreenScaler } from "screen-scaler";

const { ScreenScaler } = createScreenScaler({
    targetWindowInnerWidth: ({ zoomFactor, isPortraitOrientation }) =>
        isPortraitOrientation ? undefined : 1920 * zoomFactor
});

export function App() {
    return <ScreenScaler fallback={<h1>Rotate your phone</h1>}>{/* Your app here */}</ScreenScaler>;
}
```

### Readability issues

The problem with scaling down your app is that the text will become smaller and smaller as the screen size decrease.  
Inertly, on very big screen everything will appear very big, giving the impression that it's an app for kids.  
You can mitigate theses issues by dynamically changing the target width.

```ts
const { ScreenScaler } = createScreenScaler({
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
