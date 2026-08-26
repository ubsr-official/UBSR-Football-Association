export const formatPoints = (value: number | null | undefined) => `${new Intl.NumberFormat("en-IN").format(value ?? 0)} pts`;

export const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "Date to be confirmed";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const statusLabel = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
