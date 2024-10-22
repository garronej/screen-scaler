
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

export default function Code() {
  const [value, setValue] = React.useState("console.log('hello world!');");
  const onChange = React.useCallback((val: any, viewUpdate: any) => {
    console.log('val:', val);
    setValue(val);
  }, []);
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
        <CodeMirror value={value} height="200px" width="500px" extensions={[javascript({ jsx: true })]} onChange={onChange} />
    </div>
  );
}