import React from 'react';
import ReactDOM from 'react-dom/client';
import { evtIsScreenScalerOutOfBound } from "screen-scaler";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";
import App from "./App";
//import GetBoundingClientRectTest from "./GetBoundingClientRectTest";
//import Code from "./Code";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

function Root(){

  useRerenderOnStateChange(evtIsScreenScalerOutOfBound);

  if( evtIsScreenScalerOutOfBound.state === true ){
    return <h1>Rotate your phone</h1>;
  }

  //return <Code />;
  //return <GetBoundingClientRectTest />;
  return <App />;

}

