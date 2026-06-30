export function generateId(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateNumber(prefix: string, num: number, pad = 5): string {
  return `${prefix}${String(num).padStart(pad, '0')}`;
}

export function calculateAge(dateOfBirth: string | Date): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function calculateGPA(grades: { point: number; creditUnit: number }[]): number {
  if (!grades.length) return 0;
  const totalPoints = grades.reduce((sum, g) => sum + g.point * g.creditUnit, 0);
  const totalUnits = grades.reduce((sum, g) => sum + g.creditUnit, 0);
  return totalUnits ? Math.round((totalPoints / totalUnits) * 100) / 100 : 0;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}
