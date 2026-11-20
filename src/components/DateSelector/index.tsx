import React, { useState, useEffect } from 'react';
import { Checkbox, FormControlLabel, Grid, Modal } from '@mui/material';

import styled from "styled-components";
import Select from 'react-select';

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: var(--cinza-claro)
`
const SelectCustomizado = styled(Select)`
    background: #F0F0F0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: 2px 2px 6px rgba(0,0,0, 0.25);
    border-radius: 3px;
    border: none;
`

interface DateSelectorProps {
  onDateChange: (startDate: string, endDate: string) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ onDateChange }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const formattedFirstDay = firstDay.toISOString().split('T')[0];
    const formattedLastDay = lastDay.toISOString().split('T')[0];

    setStartDate(formattedFirstDay);
    setEndDate(formattedLastDay);

    onDateChange(formattedFirstDay, formattedLastDay);
  }, [year, month, onDateChange]);

  const handleYearChange = (option: any) => {
    setYear(option.value);
  };

  const handleMonthChange = (option: any) => {
    setMonth(option.value);
  };

  return (
    <Grid container spacing={2} >
        <Grid item xs={6} md={6}>
            <Rotulo>Ano:</Rotulo>
            <SelectCustomizado
            value={{ value: year, label: year }}
            onChange={(option) => handleYearChange(option)}
            options={Array.from({ length: 10 }, (_, i) => ({
                value: new Date().getFullYear() - i,
                label: new Date().getFullYear() - i,
            }))}
            />      
        </Grid>
        <Grid item xs={6} md={6}>
            <Rotulo>Mês:</Rotulo>
            <SelectCustomizado
                value={{ value: month, label: month }}
                onChange={(option) => handleMonthChange(option)}
                options={Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: i + 1,
                }))}
            />
        </Grid>
    </Grid>
  );
};

export default DateSelector;