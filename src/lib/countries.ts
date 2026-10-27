// Dial codes with the national-number length range for each country, so
// phone validation follows whichever country is picked (ported from the
// Flutter app's country_dial_codes.dart).
export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dial: string;
  flag: string;
  min: number;
  max: number;
  example: string;
}

export const COUNTRIES: Country[] = [
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩", min: 10, max: 11, example: "01712345678" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳", min: 10, max: 10, example: "9876543210" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰", min: 10, max: 11, example: "03001234567" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵", min: 10, max: 10, example: "9841234567" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰", min: 9, max: 10, example: "0712345678" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾", min: 9, max: 11, example: "0123456789" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦", min: 9, max: 10, example: "0512345678" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪", min: 9, max: 10, example: "0501234567" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧", min: 10, max: 11, example: "07400123456" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸", min: 10, max: 10, example: "2025550123" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦", min: 10, max: 10, example: "4165550123" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺", min: 9, max: 10, example: "0412345678" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function findCountry(dial: string | undefined): Country {
  return COUNTRIES.find((c) => c.dial === dial) ?? DEFAULT_COUNTRY;
}

export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function phoneError(phone: string, country: Country): string | undefined {
  const digits = digitsOnly(phone);
  if (digits.length === 0) return undefined;
  if (digits.length < country.min || digits.length > country.max) {
    return country.min === country.max
      ? `${country.name} numbers have ${country.min} digits`
      : `${country.name} numbers have ${country.min}–${country.max} digits`;
  }
  return undefined;
}

export function isValidPhone(phone: string, country: Country): boolean {
  const digits = digitsOnly(phone);
  return digits.length >= country.min && digits.length <= country.max;
}

/** E.164-style number used for SMS / calls: +8801712345678. */
export function toInternational(phone: string, dial: string): string {
  const digits = digitsOnly(phone);
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return `${dial}${digits.replace(/^0+/, "")}`;
}
