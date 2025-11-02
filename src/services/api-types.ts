/**
 * 后端统一响应体 (匹配 go-zero 和你的 response.go)
 * T 是泛型，代表 data 字段的具体类型
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  code: number // 业务码
  msg: string // 消息
  data: T // 数据
}

// --- 匹配 user-api 的 DTO ---
export interface LoginResponse {
  accessToken: string
  accessExpire: number
}

// (这个 UserInfo 我们已经在 user.ts 定义了，这里可以省略)

// --- 匹配 shortener-api 的 DTO ---
// (我们先定义最基础的，其他的稍后添加)
export interface Link {
  id: number
  shortCode: string
  originalUrl: string
  // visitCount: number (你已经删除了)
  isActive: boolean
  expirationTime?: string
  createdAt: string
}

// --- (新增) 匹配 shortener-api 的 GetDashboardResponse ---
export interface DashboardData {
  totalLinks: number
  totalClicks: number
  topLink: Link | null // Go 的 *Link (指针) 对应 TypeScript 的 Link | null
}
/**
 * 匹配 shortener.api 的 ListLinksRequest
 * (我们将把它作为 API 请求的 'params' 对象)
 */
export interface ListLinksParams {
  page: number
  pageSize: number
  status: string // "active", "expired", "inactive", "all"
}

/**
 * 匹配 shortener.api 的 ListLinksResponse
 */
export interface ListLinksResponse {
  links: Link[] // 后端 (go) 的 []Link
  total: number // 后端 (go) 的 int64
}
/**
 * 匹配 user.api 的 ListUsersRequest
 */
export interface ListUsersParams {
  page: number
  pageSize: number
}
// (新增) 定义我们将从 API 获取的用户信息类型
// 这对应你后端的 UserInfoResponse
export interface UserInfo {
  id: number
  username: string
  email: string
  role: string
  created_at: string
}
/**
 * 匹配 user.api 的 ListUsersResponse
 * (我们复用在 user.ts 中已定义的 UserInfo 类型)
 */
export interface ListUsersResponse {
  users: UserInfo[]
  total: number
}

export interface UpdateLinkRequest {
  originalUrl?: string // ? 表示可选
  isActive?: boolean
  expirationTime?: string | null // string (ISO 8601) 或 null (设为永不过期)
}
/**
 * 匹配 shortener.api 的 CreateLinkRequest
 * (用于 POST /links)
 */
export interface CreateLinkRequest {
  originalUrl: string
  customCode?: string // 选填
  expiresIn?: string // 选填 (e.g., "7d", "1h")
}

/**
 * 匹配 shortener.api 的 CreateLinkResponse
 */
export interface CreateLinkResponse {
  link: Link // 后端返回的是一个完整的 Link 对象
}
