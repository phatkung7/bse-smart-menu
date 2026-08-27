/**
 * Admin authentication helper
 * ตรวจสอบว่า userId เป็น Admin หรือไม่
 */
export function verifyAdmin(userId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  return adminIds.includes(userId)
}
