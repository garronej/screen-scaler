
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { injectDomDependencies } from "@codemirror/view";
import { performActionWithoutScreenScaler} from "screen-scaler";

injectDomDependencies({
  "getResizeObserver": ()=> performActionWithoutScreenScaler(()=> ResizeObserver),
  "getBoundingClientRect_Element": element => performActionWithoutScreenScaler(()=> element.getBoundingClientRect()),
  "getBoundingClientRect_Range": range => performActionWithoutScreenScaler(()=> range.getBoundingClientRect()),
  "getClientRects_Element": element => performActionWithoutScreenScaler(()=> element.getClientRects()),
  "getClientRects_Range": range => performActionWithoutScreenScaler(()=> range.getClientRects()),
  "getMouseEventClientXOrY": (event, axis) => performActionWithoutScreenScaler(()=> {
    switch(axis){
      case "x": return event.clientX;
      case "y": return event.clientY;
    }
  }),
});

export default function Code() {
  const [value, setValue] = React.useState([
    "console.log('hello world!');",
    "",
    "function add(a, b) {",
    "  return a + b;",
    "}",
    "",
    "// This is a very long line that will wrap on smaller screens, I mean really, really long.",
    "add(1 + 2, 3);",
    "",
    "console.log('hello world!');",
    "",
    "function add(a, b) {",
    "  return a + b;",
    "}",
    "",
    "// This is a very long line that will wrap on smaller screens, I mean really, really long.",
    "add(1 + 2, 3);",
  ].join("\n"));
  const onChange = React.useCallback((val: any, viewUpdate: any) => {
    console.log('val:', val);
    setValue(val);
  }, []);
  return (
    <div style={{ display: "flex", justifyContent: "center",  }}>
        <CodeMirror value={value} height="500px" width="1000px" extensions={[javascript({ jsx: true })]} onChange={onChange} />
    </div>
  );
}