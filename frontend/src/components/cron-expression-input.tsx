"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { validateCronSchedule } from "@/lib/validateCron";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";

interface CronExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
}

const scheduleOptions = [
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Daily", value: "0 0 * * *" },
  { label: "Weekly", value: "0 0 * * 0" },
  { label: "Monthly", value: "0 0 1 * *" },
  { label: "Custom", value: "custom" },
];

export function CronExpressionInput({
  value,
  onChange,
}: CronExpressionInputProps) {
  const [scheduleType, setScheduleType] = useState(() => {
    const matchingOption = scheduleOptions.find(
      (option) => option.value === value
    );
    return matchingOption ? matchingOption.value : "custom";
  });
  const [cronExpression, setCronExpression] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setCronExpression(value);
    const matchingOption = scheduleOptions.find(
      (option) => option.value === value
    );
    setScheduleType(matchingOption ? matchingOption.value : "custom");
  }, [value]);

  const handleScheduleTypeChange = (newValue: string) => {
    setScheduleType(newValue);
    if (newValue !== "custom") {
      setCronExpression(newValue);
      onChange(newValue);
    }
  };

  const handleCronExpressionChange = (newValue: string) => {
    setCronExpression(newValue);
    setScheduleType("custom");
    setIsValid(validateCronSchedule(newValue));
    if (isValid) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-4">
      <div>
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

      <div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="cron-expression">Cron Expression</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Cron expression format: minute hour day-of-month month
                  day-of-week
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="cron-expression"
          value={cronExpression}
          onChange={(e) => handleCronExpressionChange(e.target.value)}
          placeholder="Cron expression (e.g., */15 * * * *)"
          className={!isValid ? "border-red-500" : ""}
        />
        {!isValid && (
          <p className="text-sm text-red-500 mt-1">Invalid cron expression</p>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <a
          href="https://crontab.guru/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Learn more about cron expressions
        </a>
      </div>
    </div>
  );
}
