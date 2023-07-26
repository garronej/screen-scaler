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

> **WARNING**: This library is a work in progress, it is not ready for production use.

React-ScreenScaler is a tool specifically designed for developers who build web applications targeting a specific user base with uniform screen resolutions. This library helps you create applications on a defined screen resolution and takes care of scaling, either by stretching or shrinking, to accommodate deviations.

## Features

-   Automatically scales your React app to fit any screen size different than your target resolution.
-   Emulates a runtime environment where all your users always have the given screen resolution.
-   Overwrites the `getDomRect()` function to provide the size an element would have on your targeted screen resolution.

## Limitations

-   This library only works with Single Page Applications (SPA) using React.
-   Server-side rendering is not supported.
    The use of "vh" and "vw" CSS properties is not supported.

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
