const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const numberFormatter = new Intl.NumberFormat("en-US");

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(value);

export const formatNumber = (value: number): string =>
  numberFormatter.format(value);

export const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString();
