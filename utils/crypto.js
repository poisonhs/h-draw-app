/**
 * H-DRAW API Key 加解密（纯算法，无平台依赖）
 * 
 * 加密使用 HEX 编码（而非 Base64），避免补位/填充问题
 * 解密兼容新旧两种格式：
 *   - 新格式：HEX 编码（由当前 encryptApiKey 生成）
 *   - 旧格式：Base64 编码（旧版 XOR+Base64 生成）
 * 100% 可逆，所有平台行为一致
 */
const CRYPTO_KEY = 'H_DRAW_2024_SECURE_KEY!@#'

/**
 * HEX 格式 XOR 加密（当前使用）
 */
export function encryptApiKey(apiKey) {
  if (!apiKey) return ''
  try {
    const hex = []
    for (let i = 0; i < apiKey.length; i++) {
      const b = apiKey.charCodeAt(i) ^ CRYPTO_KEY.charCodeAt(i % CRYPTO_KEY.length)
      hex.push((b >> 4).toString(16))
      hex.push((b & 15).toString(16))
    }
    return hex.join('')
  } catch (e) {
    console.error('加密失败', e)
    return ''
  }
}

/**
 * HEX 解码 + XOR 解密
 */
function hexDecrypt(hexStr) {
  let result = ''
  for (let i = 0; i < hexStr.length; i += 2) {
    const byte = parseInt(hexStr.substr(i, 2), 16)
    result += String.fromCharCode(byte ^ CRYPTO_KEY.charCodeAt((i / 2) % CRYPTO_KEY.length))
  }
  return result
}

/**
 * Base64 解码 + XOR 解密（兼容旧版）
 * 使用二进制方式解码，避免 UTF-8 文本编码导致的损坏
 */
function base64Decrypt(b64Str) {
  let binary = ''
  
  if (typeof uni !== 'undefined' && uni.base64ToArrayBuffer) {
    const buffer = uni.base64ToArrayBuffer(b64Str)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
  } else if (typeof wx !== 'undefined' && wx.base64ToArrayBuffer) {
    const buffer = wx.base64ToArrayBuffer(b64Str)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
  } else {
    // 浏览器/通用环境兜底
    try {
      binary = atob(b64Str)
    } catch (e) {
      throw new Error('Base64 解码失败')
    }
  }

  // XOR 解密
  let result = ''
  for (let i = 0; i < binary.length; i++) {
    const byte = binary.charCodeAt(i) ^ CRYPTO_KEY.charCodeAt(i % CRYPTO_KEY.length)
    result += String.fromCharCode(byte)
  }
  return result
}

/**
 * 判断一个字符串是否看起来像有效的 API Key
 * 严格检查：只允许标准 ASCII 可打印字符（不含空格和控制字符），
 * 且符合常见 API Key 格式
 */
function looksLikeValidKey(key) {
  if (!key) return false

  // 必须全为可打印 ASCII（不含空格）：字母数字 + 常见标点
  // 禁止：控制字符 (0-31), 非ASCII (>127), 空格 (32)
  if (/[\x00-\x20\x7F-\xFF]/.test(key)) return false

  // 标准 OpenAI 密钥格式
  if (key.startsWith('sk-')) return true
  // 其他密钥格式：至少 6 个字符，只含字母数字和常见分隔符
  if (key.length >= 6 && /^[a-zA-Z0-9_\-.:~]+$/.test(key)) return true
  return false
}

/**
 * 解密 API Key
 * 自动检测 HEX 还是 Base64 格式，选取能产生有效密钥的解码方式
 */
export function decryptApiKey(encryptedStr) {
  if (!encryptedStr || typeof encryptedStr !== 'string') return ''

  try {
    let hexResult = null
    let b64Result = null
    let hexParsable = false

    // 1. 判断是否可能是 HEX 格式（全小写 hex + 偶数长度）
    if (/^[0-9a-f]+$/.test(encryptedStr) && encryptedStr.length % 2 === 0) {
      hexParsable = true
      hexResult = hexDecrypt(encryptedStr)
    }

    // 2. 始终尝试 Base64 解码（兼容旧版）
    try {
      b64Result = base64Decrypt(encryptedStr)
    } catch (e) {
      // Base64 解码失败
    }

    // 3. 选择最佳结果：优先选看起来像有效 API Key 的
    if (b64Result && looksLikeValidKey(b64Result)) {
      return b64Result
    }
    if (hexResult && looksLikeValidKey(hexResult)) {
      return hexResult
    }
    
    // 4. 都没有有效格式时，返回非空的最佳猜测
    if (b64Result) return b64Result
    if (hexResult) return hexResult
    
    return ''
  } catch (e) {
    console.error('解密失败', e)
    return ''
  }
}
