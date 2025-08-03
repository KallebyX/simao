import React, { useState, useEffect } from 'react';
import { useField } from 'formik';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';

export default function DatePickerField(props) {
  const [field, meta, helper] = useField(props);
  const { touched, error } = meta;
  const { setValue } = helper;
  const isError = touched && error && true;
  const { value } = field;
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const dateString = date.toISOString().split('T')[0];
      setSelectedDate(dateString);
    }
  }, [value]);

  function _onChange(event) {
    const date = event.target.value;
    setSelectedDate(date);
    if (date) {
      try {
        const dateObj = new Date(date);
        const ISODateString = dateObj.toISOString();
        setValue(ISODateString);
      } catch (error) {
        setValue(date);
      }
    } else {
      setValue(date);
    }
  }

  return (
    <Grid container>
      <TextField
        {...props}
        type="date"
        value={selectedDate}
        onChange={_onChange}
        error={isError}
        helperText={isError && error}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
    </Grid>
  );
}
