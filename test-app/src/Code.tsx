
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

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
