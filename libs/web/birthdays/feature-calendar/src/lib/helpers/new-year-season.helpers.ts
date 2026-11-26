// The New Year decorations stay up from November 15 through January 14.
export function isNewYearSeason(date: Date): boolean {
  const month: number = date.getMonth();
  const day: number = date.getDate();

  return (month === 10 && day >= 15) || month === 11 || (month === 0 && day <= 14);
}
