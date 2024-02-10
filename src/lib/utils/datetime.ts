export const dateToUnixtime = (date: Date) => Math.floor(date.getTime() / 1000);

export const unixTimeToDate = (unixTimeInSeconds: number) =>
  new Date(+unixTimeInSeconds.toString().replaceAll(',', '') * 1000);

export const hoursToSeconds = (hours: number) => hours * 3600;

export const secondsToHours = (seconds: number) =>
  +seconds.toString().replaceAll(',', '') / 3600;
