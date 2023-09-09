import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

export  function BasicSelect() {
  const [age, setAge] = useState('');

  const handleChange = (event: SelectChangeEvent) => {
    setAge(event.target.value as string);
  };

  const [ref, setRef] = useState<React.ElementRef<"div"> | null>(null);

  useEffect(() => {
      if (ref === null) {
          return;
      }

      console.log("=========>", ref);

      const domRect = ref.getBoundingClientRect();

      console.log({
        "domRect.top": domRect.top,
        "domRect.left": domRect.left,

      });

  }, [ref]);



  return (
    <Box sx={{ width: 200 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Age</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={age}
          label="Age"
          onChange={handleChange}
          ref={setRef}
        >
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}