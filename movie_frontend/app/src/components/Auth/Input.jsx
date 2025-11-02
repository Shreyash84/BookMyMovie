import React from "react";
import { TextField, Grid, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Input = ({ name, handleChange, label, autoFocus, handleShowPassword, type, half }) => {
  return (
    <Grid size={{xs:12, sm:half ? 6 : 12}}>
      <TextField
        name={name}
        onChange={handleChange}
        variant="outlined"
        required
        fullWidth
        label={label}
        autoFocus={autoFocus}
        type={type}
        slotProps={{
            input: name === "password"
             ? {
                endAdornment: (
                <InputAdornment position="end">
                <IconButton onClick={handleShowPassword} edge="end">
                    {type === "password" ? <Visibility /> : <VisibilityOff />}
                </IconButton>
                </InputAdornment>
                ),
                }
            : undefined,
        }}
      />
    </Grid>
  );
};

export default Input;
