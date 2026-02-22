function dec2hex(dec: number): string {
  return dec.toString(16).padStart(2, '0');
}

export function uniqId(length = 7): string {
  if (typeof crypto === 'undefined') {
    return fallbackGenerator(length);
  }

  const arr = new Uint8Array((length || 40) / 2);

  crypto.getRandomValues(arr);

  return Array.from(arr, dec2hex).join('');
}

function fallbackGenerator(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;

  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  return result;
}
