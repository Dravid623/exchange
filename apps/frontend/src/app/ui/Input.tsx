"use client";
import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, className, ...props }, ref) => {
    return (
      <div>
        <label
          htmlFor={props.id}
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          {label}
        </label>
        <div className="relative mb-6">
          {icon && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
              icon ? "ps-10" : ""
            } ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  },
);

Input.displayName = "Input";
