import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
//const GetBoundingClientRectTest = lazy(()=> import("./GetBoundingClientRectTest"));
//const App = lazy(() => import('./App'));
const Code = lazy(() => import('./Code'));

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
      <Suspense>
        <Code />
        {/*<App />*/}
        {/*<GetBoundingClientRectTest />*/}
      </Suspense>
  </React.StrictMode>
);

