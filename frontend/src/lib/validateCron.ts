import cron from "cron-validate";

export const validateCronSchedule = (schedule: string) => {
  const cronResult = cron(schedule);
  return cronResult.isValid();
};

// Add type for the month days mapping
type MonthDays = {
  [key: number]: number;
};

export const convertCronToUTC = (cronExpression: string): string => {
  // Constants for validation
  const CRON_PARTS = 5;
  const MAX_MINUTES = 59;
  const MAX_HOURS = 23;
  const MAX_DAYS: MonthDays = {
    1: 31,
    2: 29,
    3: 31,
    4: 30,
    5: 31,
    6: 30,
    7: 31,
    8: 31,
    9: 30,
    10: 31,
    11: 30,
    12: 31,
  };
  const MAX_MONTHS = 12;
  const MAX_DAYS_WEEK = 6;

  // Input validation
  if (typeof cronExpression !== "string") {
    return cronExpression;
  }

  const cronParts = cronExpression.trim().split(/\s+/);
  if (cronParts.length !== CRON_PARTS) {
    return cronExpression;
  }

  const offsetMinutes = new Date().getTimezoneOffset();
  const offsetHours = Math.floor(offsetMinutes / 60);

  // Parse and validate cron parts
  // eslint-disable-next-line prefer-const
  let [minute, hour, dayOfMonth, month, dayOfWeek]: (string | number)[] =
    cronParts.map((part: string, index: number) => {
      if (part === "*") return part;

      const num = parseInt(part, 10);
      if (isNaN(num)) {
        return part;
      }

      // Validate ranges
      switch (index) {
        case 0: // minute
          if (num < 0 || num > MAX_MINUTES) return part;
          break;
        case 1: // hour
          if (num < 0 || num > MAX_HOURS) return part;
          break;
        case 2: // day of month
          if (num < 1 || num > 31) return part;
          break;
        case 3: // month
          if (num < 1 || num > MAX_MONTHS) return part;
          break;
        case 4: // day of week
          if (num < 0 || num > MAX_DAYS_WEEK) break;
      }
      return num;
    });

  // Adjust minutes and handle overflow/underflow
  if (minute !== "*") {
    const newMinute = (minute as number) + (offsetMinutes % 60);
    if (newMinute < 0) {
      minute = newMinute + 60;
      hour = hour === "*" ? "*" : (parseInt(hour as string) - 1 + 24) % 24;
    } else if (newMinute >= 60) {
      minute = newMinute - 60;
      hour = hour === "*" ? "*" : (parseInt(hour as string) + 1) % 24;
    }
  }

  // Adjust hours and handle overflow/underflow
  let dayShift = 0;
  if (hour !== "*") {
    const newHour = (hour === "*" ? 0 : parseInt(hour as string)) + offsetHours;

    if (offsetHours > 0) {
      // For UTC+ timezones
      if (newHour >= 24) {
        dayShift = 1;
        hour = newHour - 24;
      } else {
        hour = newHour;
      }
    } else {
      // For UTC- timezones
      if (newHour < 0) {
        dayShift = -1;
        hour = newHour + 24;
      } else if (newHour >= 0) {
        dayShift = 0;
        hour = newHour;
      } else {
        hour = newHour;
      }
    }

    // Handle day of month changes
    if (dayOfMonth !== "*") {
      if (dayShift < 0) {
        if (month !== "*") {
          const prevMonth =
            (month as number) === 1 ? 12 : (month as number) - 1;
          dayOfMonth =
            (dayOfMonth as number) === 1
              ? MAX_DAYS[prevMonth]
              : (dayOfMonth as number) - 1;
        } else {
          dayOfMonth =
            (dayOfMonth as number) === 1 ? 31 : (dayOfMonth as number) - 1;
        }
      } else if (dayShift > 0) {
        if (month !== "*") {
          const maxDays = MAX_DAYS[month as number];
          dayOfMonth =
            (dayOfMonth as number) === maxDays ? 1 : (dayOfMonth as number) + 1;
        } else {
          dayOfMonth =
            (dayOfMonth as number) === 31 ? 1 : (dayOfMonth as number) + 1;
        }
      }
    }
  }

  // Adjust day of the week
  if (dayOfWeek !== "*") {
    dayOfWeek = ((parseInt(dayOfWeek as string) + dayShift + 7) % 7).toString();
  }

  // Helper function to get days in a month
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function getDaysInMonth(month: number | string): number {
    if (typeof month === "string") {
      return 31;
    }
    return MAX_DAYS[month] || 31;
  }

  // Return the adjusted cron expression
  return [
    minute === "*" ? "*" : minute.toString().padStart(2, "0"),
    hour === "*" ? "*" : hour.toString().padStart(2, "0"),
    dayOfMonth === "*" ? "*" : dayOfMonth.toString(),
    month === "*" ? "*" : month.toString(),
    dayOfWeek === "*" ? "*" : dayOfWeek.toString(),
  ].join(" ");
};

export const convertCronFromUTC = (cronExpression: string): string => {
  // Constants for validation
  const CRON_PARTS = 5;
  const MAX_MINUTES = 59;
  const MAX_HOURS = 23;
  const MAX_DAYS: MonthDays = {
    1: 31,
    2: 29,
    3: 31,
    4: 30,
    5: 31,
    6: 30,
    7: 31,
    8: 31,
    9: 30,
    10: 31,
    11: 30,
    12: 31,
  };
  const MAX_MONTHS = 12;
  const MAX_DAYS_WEEK = 6;

  // Input validation
  if (typeof cronExpression !== "string") {
    return cronExpression;
  }

  const cronParts = cronExpression.trim().split(/\s+/);
  if (cronParts.length !== CRON_PARTS) {
    return cronExpression;
  }

  // Use negative offset to convert from UTC to local
  const offsetMinutes = -new Date().getTimezoneOffset();
  const offsetHours = Math.floor(offsetMinutes / 60);

  // Parse and validate cron parts
  // eslint-disable-next-line prefer-const
  let [minute, hour, dayOfMonth, month, dayOfWeek]: (string | number)[] =
    cronParts.map((part: string, index: number) => {
      if (part === "*") return part;

      const num = parseInt(part, 10);
      if (isNaN(num)) {
        return part;
      }

      // Validate ranges
      switch (index) {
        case 0: // minute
          if (num < 0 || num > MAX_MINUTES) return part;
          break;
        case 1: // hour
          if (num < 0 || num > MAX_HOURS) return part;
          break;
        case 2: // day of month
          if (num < 1 || num > 31) return part;
          break;
        case 3: // month
          if (num < 1 || num > MAX_MONTHS) return part;
          break;
        case 4: // day of week
          if (num < 0 || num > MAX_DAYS_WEEK) break;
      }
      return num;
    });

  // Adjust minutes and handle overflow/underflow
  if (minute !== "*") {
    const newMinute = (minute as number) + (offsetMinutes % 60);
    if (newMinute < 0) {
      minute = newMinute + 60;
      hour = hour === "*" ? "*" : (parseInt(hour as string) - 1 + 24) % 24;
    } else if (newMinute >= 60) {
      minute = newMinute - 60;
      hour = hour === "*" ? "*" : (parseInt(hour as string) + 1) % 24;
    } else {
      minute = newMinute;
    }
  }

  // Adjust hours and handle overflow/underflow
  let dayShift = 0;
  if (hour !== "*") {
    const newHour = (hour === "*" ? 0 : parseInt(hour as string)) + offsetHours;

    if (offsetHours > 0) {
      // For UTC+ timezones (converting to later time)
      if (newHour >= 24) {
        dayShift = 1;
        hour = newHour - 24;
      } else {
        hour = newHour;
      }
    } else {
      // For UTC- timezones (converting to earlier time)
      if (newHour < 0) {
        dayShift = -1;
        hour = newHour + 24;
      } else {
        hour = newHour;
      }
    }

    // Handle day of month changes
    if (dayOfMonth !== "*") {
      if (dayShift < 0) {
        if (month !== "*") {
          const prevMonth =
            (month as number) === 1 ? 12 : (month as number) - 1;
          dayOfMonth =
            (dayOfMonth as number) === 1
              ? MAX_DAYS[prevMonth]
              : (dayOfMonth as number) - 1;
        } else {
          dayOfMonth =
            (dayOfMonth as number) === 1 ? 31 : (dayOfMonth as number) - 1;
        }
      } else if (dayShift > 0) {
        if (month !== "*") {
          const maxDays = MAX_DAYS[month as number];
          dayOfMonth =
            (dayOfMonth as number) === maxDays ? 1 : (dayOfMonth as number) + 1;
        } else {
          dayOfMonth =
            (dayOfMonth as number) === 31 ? 1 : (dayOfMonth as number) + 1;
        }
      }
    }
  }

  // Adjust day of the week
  if (dayOfWeek !== "*") {
    dayOfWeek = ((parseInt(dayOfWeek as string) + dayShift + 7) % 7).toString();
  }

  // Return the adjusted cron expression
  return [
    minute === "*" ? "*" : minute.toString().padStart(2, "0"),
    hour === "*" ? "*" : hour.toString().padStart(2, "0"),
    dayOfMonth === "*" ? "*" : dayOfMonth.toString(),
    month === "*" ? "*" : month.toString(),
    dayOfWeek === "*" ? "*" : dayOfWeek.toString(),
  ].join(" ");
};
