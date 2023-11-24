export const dateToUnixtime = (date: Date) => Math.floor(date.getTime() / 1000);

export const hoursToSeconds = (hours: number) => hours * 3600;
