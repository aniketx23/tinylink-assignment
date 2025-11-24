const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidCode(code: string): boolean {
  return CODE_REGEX.test(code);
}

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateRandomCode(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * ALPHANUM.length);
    result += ALPHANUM[index];
  }
  return result;
}
