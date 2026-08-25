const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return TENS[tens] + (ones ? " " + ONES[ones] : "");
}

function threeDigitsToWords(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (hundred) out += ONES[hundred] + " Hundred";
  if (rest) out += (out ? " " : "") + twoDigitsToWords(rest);
  return out;
}

/**
 * Converts a rupee amount into words using the Indian numbering system
 * (crore / lakh / thousand / hundred). Handles paise as well.
 * Correctly decomposes multi-digit groups (e.g. "Twenty Three Thousand"),
 * unlike a naive lookup-table approach.
 */
export function numberToIndianWords(amount) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const rupees = Math.floor(Math.abs(safeAmount));
  const paise = Math.round((Math.abs(safeAmount) - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Rupees Zero Only";

  let rupeeWords;
  if (rupees === 0) {
    rupeeWords = "Zero";
  } else {
    let remaining = rupees;
    const crore = Math.floor(remaining / 10000000);
    remaining %= 10000000;
    const lakh = Math.floor(remaining / 100000);
    remaining %= 100000;
    const thousand = Math.floor(remaining / 1000);
    remaining %= 1000;
    const hundredGroup = remaining;

    const parts = [];
    if (crore) parts.push(twoDigitsToWords(crore) + " Crore");
    if (lakh) parts.push(twoDigitsToWords(lakh) + " Lakh");
    if (thousand) parts.push(twoDigitsToWords(thousand) + " Thousand");
    if (hundredGroup) parts.push(threeDigitsToWords(hundredGroup));

    rupeeWords = parts.join(" ");
  }

  let result = "Rupees " + rupeeWords;
  if (paise) {
    result += " and " + twoDigitsToWords(paise) + " Paise";
  }
  return result + " Only";
}
