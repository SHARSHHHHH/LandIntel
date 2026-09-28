export const MAP_TO_DB: Record<string, string> = {
  "Orissa": "Odisha",
  "Uttaranchal": "Uttarakhand",
  "Jammu and Kashmir": "Jammu & Kashmir",
  "Dadra and Nagar Haveli": "Dadra & Nagar Haveli",
  "Andaman and Nicobar": "Andaman & Nicobar Islands",
};

export function mapToDb(name: string): string {
  return MAP_TO_DB[name] || name;
}

export function dbToMap(name: string): string {
  for (const [k, v] of Object.entries(MAP_TO_DB)) {
    if (v === name) return k;
  }
  return name;
}

export const STATE_CODES: Record<string, string> = {
  "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR", "Assam": "AS", "Bihar": "BR",
  "Chhattisgarh": "CG", "Goa": "GA", "Gujarat": "GJ", "Haryana": "HR",
  "Himachal Pradesh": "HP", "Jammu & Kashmir": "JK", "Jharkhand": "JH",
  "Karnataka": "KA", "Kerala": "KL", "Madhya Pradesh": "MP", "Maharashtra": "MH",
  "Manipur": "MN", "Meghalaya": "ML", "Mizoram": "MZ", "Nagaland": "NL",
  "Odisha": "OD", "Punjab": "PB", "Rajasthan": "RJ", "Sikkim": "SK",
  "Tamil Nadu": "TN", "Telangana": "TS", "Tripura": "TR", "Uttar Pradesh": "UP",
  "Uttarakhand": "UK", "West Bengal": "WB", "Delhi": "DL", "Chandigarh": "CH",
  "Lakshadweep": "LD", "Puducherry": "PY", "Andaman & Nicobar Islands": "AN",
  "Dadra & Nagar Haveli": "DN", "Daman and Diu": "DD",
};