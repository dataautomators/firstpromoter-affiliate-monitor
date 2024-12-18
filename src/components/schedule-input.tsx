import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

type ScheduleInputProps = {
  value: number;
  onChange: (value: number) => void;
};

const scheduleOptions = [
  { label: "Every 15 minutes", value: "900" },
  { label: "Hourly", value: "3600" },
  { label: "Daily", value: "86400" },
  { label: "Weekly", value: "604800" },
  { label: "Monthly", value: "2629746" },
  { label: "Custom", value: "custom" },
];

export default function ScheduleInput({ value, onChange }: ScheduleInputProps) {
  const [scheduleInput, setScheduleInput] = useState(value.toString());
  const [scheduleType, setScheduleType] = useState(() => {
    const matchingOption = scheduleOptions.find(
      (option) => option.value === value.toString()
    );
    return matchingOption ? matchingOption.value : "custom";
  });

  const handleScheduleTypeChange = (newValue: string) => {
    setScheduleType(newValue);
    if (newValue !== "custom") {
      setScheduleInput(newValue);
      onChange(Number(newValue));
    }
  };

  const handleScheduleInputChange = (newValue: string) => {
    setScheduleInput(newValue);
    onChange(Number(newValue));
    const matchingOption = scheduleOptions.find(
      (option) => option.value === newValue && option.value !== "custom"
    );
    setScheduleType(matchingOption ? matchingOption.value : "custom");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="schedule-type">Schedule Type</Label>
        <Select value={scheduleType} onValueChange={handleScheduleTypeChange}>
          <SelectTrigger id="schedule-type">
            <SelectValue placeholder="Select schedule type" />
          </SelectTrigger>
          <SelectContent>
            {scheduleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schedule-input">Custom Schedule</Label>
        <Input
          id="schedule-input"
          value={scheduleInput}
          onChange={(e) => handleScheduleInputChange(e.target.value)}
          placeholder="Schedule in seconds"
        />
      </div>
    </div>
  );
}
