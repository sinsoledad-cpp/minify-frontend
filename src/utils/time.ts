// src/utils/time.ts

/**
 * 格式化 ISO 8601 日期时间字符串 (例如 "2023-10-27T15:04:05Z")
 * @param isoString - 后端返回的 ISO/RFC3339 格式时间
 * @returns 格式化后的本地时间 (例如 "2023-10-27 23:04:05")
 */
export function formatTime(isoString: string): string {
  if (!isoString) {
    return 'N/A'
  }

  try {
    const date = new Date(isoString)

    // 使用 toLocaleString 来获取本地时区的格式化时间
    // options 可以确保输出 YYYY-MM-DD HH:mm:ss 格式
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.error('时间格式化失败:', error)
    return isoString // 格式化失败，返回原始字符串
  }
}
