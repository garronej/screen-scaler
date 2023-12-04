import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from "./App";
//import { PopperTest } from "./PopperTest";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
    {/*<PopperTest />*/}
  </React.StrictMode>
);

