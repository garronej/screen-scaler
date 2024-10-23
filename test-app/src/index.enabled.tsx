import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { enableScreenScaler } from "screen-scaler/react";
//const GetBoundingClientRectTest = lazy(()=> import("./GetBoundingClientRectTest"));
const App = lazy(() => import('./App'));
//const Code = lazy(() => import('./Code'));

//delete (window as any).EditContext;

const { 
  ScreenScalerOutOfRangeFallbackProvider, 
  // If you prefer a hook instead of a provider, you can use the following:
  //useIsOutOfRange 
} = enableScreenScaler({
    "targetWindowInnerWidth": ({ zoomFactor, isPortraitOrientation, actualWindowInnerWidth }) =>
        isPortraitOrientation ?
            undefined :
            1500 * zoomFactor,
    //"targetWindowInnerWidth": ({ actualWindowInnerWidth }) => actualWindowInnerWidth,
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
      <Suspense>
        <App />
        {/*<Code />*/}
        {/*<GetBoundingClientRectTest />*/}
      </Suspense>
    </ScreenScalerOutOfRangeFallbackProvider>
  </React.StrictMode>
);

