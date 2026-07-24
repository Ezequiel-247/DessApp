export function scrollToYear(year: number) {
  document.getElementById(`year-${year}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
