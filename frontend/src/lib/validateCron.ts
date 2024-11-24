export const validateCronSchedule = (schedule: string) => {
  // Basic pattern validation
  const cronRegex =
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

  return cronRegex.test(schedule);
};

export const convertCronToUTC = (cronExpression: string) => {
  // Get device's UTC offset in hours
  const offsetMinutes = new Date().getTimezoneOffset();
  const offsetHours = -offsetMinutes / 60; // Convert to hours and invert (getTimezoneOffset returns opposite sign)

  // Split cron expression into parts
  const [minute, hour, ...rest] = cronExpression.split(" ");

  // Convert hour to number and adjust for UTC
  let newHour = parseInt(hour) - offsetHours;

  // Handle day wraparound
  if (newHour < 0) {
    newHour = 24 + newHour;
  } else if (newHour > 23) {
    newHour = newHour - 24;
  }

  // Format hour back to string, ensuring two digits
  const formattedHour = Math.floor(newHour).toString().padStart(2, "0");

  // Return new cron expression
  return `${minute} ${formattedHour} ${rest.join(" ")}`;
};
