<p align="center">
    <img src="https://user-images.githubusercontent.com/6702424/80216211-00ef5280-863e-11ea-81de-59f3a3d4b8e4.png">  
</p>
<p align="center">
    <i>Design Once, Render Everywhere: Screen-size agnostic React development for uniform environments </i>
    <br>
    <br>
    <a href="https://github.com/garronej/react-screen-scaler/actions">
      <img src="https://github.com/garronej/react-screen-scaler/workflows/ci/badge.svg?branch=main">
    </a>
    <a href="https://bundlephobia.com/package/react-screen-scaler">
      <img src="https://img.shields.io/bundlephobia/minzip/react-screen-scaler">
    </a>
    <a href="https://www.npmjs.com/package/react-screen-scaler">
      <img src="https://img.shields.io/npm/dw/react-screen-scaler">
    </a>
    <a href="https://github.com/garronej/react-screen-scaler/blob/main/LICENSE">
      <img src="https://img.shields.io/npm/l/react-screen-scaler">
    </a>
</p>

<img width="799" alt="image" src="https://github.com/garronej/react-screen-scaler/assets/6702424/eed06b35-bc7b-4dd9-8d3e-8c1327d6ee5a">

React-ScreenScaler is a tool specifically designed for developers who build web applications targeting a specific user base with uniform screen resolutions. This library helps you create applications on a defined screen resolution and takes care of scaling, either by stretching or shrinking, to accommodate deviations.

## Features

-   Automatically scales your React app to fit any screen size different than your target resolution.
-   Emulates a runtime environment where all your users always have the given screen resolution.
-   Overwrites the `getDomRect()` function to provide the size an element would have on your targeted screen resolution.

## Limitations

-   This library only works with Single Page Applications (SPA) using React.
-   Server-side rendering is not supported.
    The use of "vh" and "vw" CSS properties is not supported because they can't be override.

## Usage

Make it so that your app is always rendered as if the user had a screen resolution width of 1920.

```tsx
import { createScreenScaler } from "react-screen-scaler";

const { ScreenScaler } = createScreenScaler({
    // The zoom factor if for supporting when the use zooms in or out (ctrl + mouse wheel or ⌘ + '+' or ⌘ + '-') ...
    targetWindowInnerWidth: ({ zoomFactor }) => 1920 * zoomFactor

    // If you don't want to enable your user to zoom at all you can provide an absolute value
    //targetWindowInnerWidth: 1920
});

export function App() {
    return <ScreenScaler>{/* Your app here */}</ScreenScaler>;
}
```

### Workaround for portrait mode

When your app is rendered in a device in portrait mode, if you haven't accommodated for this your
app will appear very tiny at the top of the screen and most of the screen will be unused.

In this case, you have two options:

1: Implement a portrait mode version of your app.
2: Tell your user to rotate their device:

```tsx
import { createScreenScaler } from "react-screen-scaler";

const { ScreenScaler } = createScreenScaler({
    targetWindowInnerWidth: ({ zoomFactor, isPortraitOrientation }) =>
        isPortraitOrientation ? undefined : 1920 * zoomFactor
});

export function App() {
    return <ScreenScaler fallback={<h1>Rotate your phone</h1>}>{/* Your app here */}</ScreenScaler>;
}
```

## Contributing

```bash
git clone https://github.com/garronej/react-screen-scaler
cd react-screen-scaler
yarn

# Start the test app in watch mode
yarn start-test-app

# Link in an external project in watch mode
yarn link-in-app YOUR-APP # ../YOUR-APP is supposed to exist
```
