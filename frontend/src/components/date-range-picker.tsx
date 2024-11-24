"use client";

import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DatePickerWithRangeProps {
  className?: string;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const [year, setYear] = React.useState(new Date().getFullYear());

  const handleYearChange = (change: number) => {
    const newYear = year + change;
    setYear(newYear);
    if (date?.from) {
      setDate({
        from: new Date(newYear, date.from.getMonth(), date.from.getDate()),
        to: date.to
          ? new Date(newYear, date.to.getMonth(), date.to.getDate())
          : undefined,
      });
    }
  };

  const presetOptions = [
    {
      label: "Last 7 days",
      action: () => setDate({ from: subDays(new Date(), 7), to: new Date() }),
    },
    {
      label: "Last 30 days",
      action: () => setDate({ from: subDays(new Date(), 30), to: new Date() }),
    },
    {
      label: "This month",
      action: () =>
        setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
    },
    {
      label: "Last 3 months",
      action: () => setDate({ from: subMonths(new Date(), 3), to: new Date() }),
    },
    {
      label: "This year",
      action: () =>
        setDate({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
    },
    {
      label: "Last year",
      action: () => {
        const lastYear = subYears(new Date(), 1);
        setDate({ from: startOfYear(lastYear), to: endOfYear(lastYear) });
      },
    },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex items-center justify-between px-3 pt-3">
            <Button
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => handleYearChange(-1)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Select
              value={year.toString()}
              onValueChange={(value) =>
                handleYearChange(parseInt(value) - year)
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={year} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => year - 5 + i).map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => handleYearChange(1)}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            // year={year}
          />
          <div className="grid grid-cols-2 gap-2 p-3">
            {presetOptions.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={option.action}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
