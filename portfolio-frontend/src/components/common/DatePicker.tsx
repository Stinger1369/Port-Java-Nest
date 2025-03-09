// src/components/common/DatePicker.tsx
import { useState, useEffect } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";
import { FaCalendarAlt } from "react-icons/fa";

interface DatePickerProps {
  name: string;
  value: string; // Format attendu : "yyyy-MM-dd" ou vide
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  minDate?: string;
}

const DatePicker = ({ name, value, onChange, disabled = false, required = false, label, minDate }: DatePickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);

  useEffect(() => {
    const isValidDate = value && !isNaN(new Date(value).getTime());
    const newDate = isValidDate ? new Date(value) : null;
    setSelectedDate(newDate);
    console.log(`DatePicker [${name}] - value: ${value}, parsed: ${newDate}, selectedDate: ${selectedDate}`);
  }, [value, name]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    const formattedDate = date ? date.toISOString().split("T")[0] : "";
    onChange(name, formattedDate);
  };

  return (
    <div className="date-picker-container">
      {label && <label htmlFor={name}>{label}</label>}
      <div className="date-picker-wrapper">
        <ReactDatePicker
          id={name}
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          showYearDropdown
          scrollableYearDropdown
          yearDropdownItemNumber={15}
          disabled={disabled}
          required={required}
          minDate={minDate ? new Date(minDate) : undefined}
          className="date-picker-input"
          placeholderText="Sélectionner une date"
          isClearable={true}
          todayButton="Aujourd'hui"
        />
        <FaCalendarAlt className="calendar-icon" />
      </div>
    </div>
  );
};

export default DatePicker;