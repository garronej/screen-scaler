import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from "./App";
import { enableScreenScaler } from "screen-scaler/react";
//import { PopperTest } from "./PopperTest";

const { 
  ScreenScalerOutOfRangeFallbackProvider, 
  // If you prefer a hook instead of a provider, you can use the following:
  //useIsOutOfRange 
} = enableScreenScaler({
    "targetWindowInnerWidth": ({ zoomFactor, isPortraitOrientation, actualWindowInnerWidth }) =>
        isPortraitOrientation ?
            undefined :
            1500 * zoomFactor,
    "rootDivId": "root"
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ScreenScalerOutOfRangeFallbackProvider
      fallback={<h1>Rotate your phone</h1>}
    >
      <App />
    </ScreenScalerOutOfRangeFallbackProvider>
    {/*<PopperTest />*/}
  </React.StrictMode>
);

