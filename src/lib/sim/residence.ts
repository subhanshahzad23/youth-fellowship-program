import type { ResidenceCheck } from "@/lib/domain/types";

/**
 * Deterministic mock of an (unspecified) public address-lookup service.
 *
 * It only answers "is this address inside the program's service area?".
 * It does NOT prove that the applicant lives there — proof of residence is a
 * separate document reviewed by an assigned reviewer. All places and ZIP
 * codes are fictional (000xx codes are not issued).
 */

export const SERVICE_AREA = {
  name: "Greater Larkhaven",
  inside: [
    { district: "Old Quay", zip: "00211" },
    { district: "Eastbank", zip: "00212" },
    { district: "Millbrook", zip: "00213" },
    { district: "Harborside", zip: "00214" },
  ],
  outside: [
    { district: "Westmoor", zip: "00391" },
    { district: "Kingsford", zip: "00377" },
  ],
};

export const RESIDENCE_FIXTURES = [
  { key: "inside", label: "Inside the service area", input: "14 alder row, eastbank 00212" },
  { key: "outside", label: "Outside the service area", input: "220 Quarry Ln, Westmoor 00391" },
  { key: "ambiguous", label: "Ambiguous — two matches", input: "7 Mill St, Larkhaven" },
] as const;

const ABBREVIATIONS: Record<string, string> = {
  st: "Street",
  rd: "Road",
  ave: "Avenue",
  ln: "Lane",
  dr: "Drive",
  ct: "Court",
  pl: "Place",
  sq: "Square",
  apt: "Apt",
  blvd: "Boulevard",
};

/** Streets that exist in more than one district (fictional). */
const AMBIGUOUS_STREETS: Record<string, { district: string; zip: string; inside: boolean }[]> = {
  "mill street": [
    { district: "Millbrook", zip: "00213", inside: true },
    { district: "Kingsford", zip: "00377", inside: false },
  ],
  "harbor road": [
    { district: "Harborside", zip: "00214", inside: true },
    { district: "Westmoor", zip: "00391", inside: false },
  ],
};

function titleCase(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function normalizeAddress(input: string): string {
  const cleaned = input.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
  const zipRe = /\b(\d{5})\b/;
  const zm = cleaned.match(zipRe);
  const withoutZip = zm ? cleaned.replace(zipRe, "").replace(/[,\s]+$/, "").trim() : cleaned;
  const parts = withoutZip
    .split(",")
    .map((part) =>
      part
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((w) => {
          const key = w.toLowerCase().replace(/\.$/, "");
          if (ABBREVIATIONS[key]) return ABBREVIATIONS[key];
          if (/^\d+[a-z]?$/i.test(w)) return w.toUpperCase();
          return titleCase(w);
        })
        .join(" "),
    )
    .filter(Boolean);
  const lower = parts.join(" ").toLowerCase();
  // Add the city name when only a district was given
  const known = [...SERVICE_AREA.inside, ...SERVICE_AREA.outside].find((d) => lower.includes(d.district.toLowerCase()));
  const knownInside = SERVICE_AREA.inside.some((d) => d.district === known?.district);
  if (known && knownInside && !lower.includes("larkhaven")) parts.push("Larkhaven");
  const zip = zm ? zm[1] : known?.zip ?? "";
  const last = parts.pop();
  return [...parts, [last, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

export function checkAddress(input: string, fixture?: string): Omit<ResidenceCheck, "checkedAt"> {
  const normalized = normalizeAddress(input);
  const lower = normalized.toLowerCase();

  const all = [...SERVICE_AREA.inside.map((d) => ({ ...d, inside: true })), ...SERVICE_AREA.outside.map((d) => ({ ...d, inside: false }))];
  const byZip = all.find((d) => lower.includes(d.zip));
  const byDistrict = all.find((d) => lower.includes(d.district.toLowerCase()));
  const match = byZip ?? byDistrict;

  if (match) {
    return { input, normalized, district: match.district, status: match.inside ? "inside" : "outside", fixture };
  }

  const street = Object.keys(AMBIGUOUS_STREETS).find((s) => lower.includes(s));
  if (street) {
    const number = normalized.match(/^\d+[A-Z]?/)?.[0] ?? "";
    const streetName = street.split(" ").map(titleCase).join(" ");
    return {
      input,
      normalized,
      status: "ambiguous",
      fixture,
      candidates: AMBIGUOUS_STREETS[street].map((c) => ({
        label: `${number} ${streetName}, ${c.district}${c.inside ? ", Larkhaven" : ""} ${c.zip}`.trim(),
        district: c.district,
        inside: c.inside,
      })),
    };
  }

  return { input, normalized, status: "not_found", fixture };
}

/** Resolve an ambiguous result once the applicant picks a candidate. */
export function resolveCandidate(check: ResidenceCheck, label: string): ResidenceCheck {
  const c = check.candidates?.find((x) => x.label === label);
  if (!c) return check;
  return { ...check, normalized: c.label, district: c.district, status: c.inside ? "inside" : "outside", candidates: undefined };
}

export const ELIGIBILITY_COPY: Record<ResidenceCheck["status"], { label: string; detail: string }> = {
  unchecked: { label: "Not checked", detail: "Run the location check to see whether this address is in our service area." },
  inside: { label: "In service area", detail: "This address is inside Greater Larkhaven. Location is only one part of eligibility — proof of residence is reviewed separately." },
  outside: { label: "Outside service area", detail: "This address appears to be outside Greater Larkhaven. You can still submit; a reviewer will confirm eligibility." },
  ambiguous: { label: "Needs confirmation", detail: "We found more than one match. Choose the correct address." },
  not_found: { label: "Not recognized", detail: "We couldn't match this address. Check the spelling or add your neighborhood and ZIP code." },
};
