import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Label } from 'recharts';
import styled from "styled-components";
import { useTheme } from "@mui/material/styles";

const Rotulo = styled.label`
display: block;
font-weight: 700;
font-size: 16px;
line-height: 19px;
color: var(--cinza-claro)
`

interface Props {  
  label?: string;
  onChange?: (value: string | null) => void;

}

export default function DatePickerValue({ label, onChange} : Props) {
  const theme = useTheme();
  const dtHoje = new Date().toISOString().split('T')[0];
  const [value, setValue] = React.useState<Dayjs | null>(dayjs(dtHoje));

  const handleDateChange = (newValue: Dayjs | null) => {
    setValue(newValue);
    if (newValue && onChange) {
      const formattedDate = newValue.format('YYYY-MM-DD');
      onChange(formattedDate);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={['DatePicker', 'DatePicker']}>
        {/* <Rotulo>{label}</Rotulo> */}
        <DatePicker
          label={label}
          value={value}
          onChange={handleDateChange}
          format='DD/MM/YYYY'
          sx={{ 
            '.MuiInputBase-root': { backgroundColor: '#fff',
              marginTop: '2px',
              marginBottom: '2px',
             },  // Cor do campo de entrada
            '.MuiCalendarPicker-root': { backgroundColor: '#FFF',
              paddingTop: '0px',
              
              
             },
            '.MuiInputBase-input': { padding: '8px' },
            '.MuiFormLabel-root':{color: theme.palette.mode === "light" ? theme.palette.text.primary : 'var(--cinza-claro)',
              position: 'relative',
              left: '-12px',
              top: '14px',
              fontWeight: '700',
              fontSize: '20px',
              fontFamily: 'Roboto',
              lineHeight: '23px'
              
            },
            '.MuiStack-root.css-4jnixx-MuiStack-root': {
              marginTop: '-12px',
            } // Cor do texto
          }}
          
        />
      </DemoContainer>
    </LocalizationProvider>
  );
}