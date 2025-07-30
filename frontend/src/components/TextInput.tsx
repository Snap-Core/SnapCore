import React from "react";
import './TextInput.css';

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, id, ...props }, ref) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
      {label && (
        <label htmlFor={id} style={{ fontWeight: 500, color: "#222" }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className="TextInput"
        {...props}
      />
    </div>
  )
);

TextInput.displayName = "TextInput";