/**
 * H-DRAW OpenAI 兼容 API 服务
 * 支持 Chat Completions 和 Images Generations 两种格式
 */
import { decryptApiKey } from './crypto'

// 画面比例 → 标准尺寸映射
const SIZE_MAP = {
  '1:1': '1024x1024',
  '4:3': '1024x768',
  '3:4': '768x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792'
}

function getConfig() {
  try {
    const raw = uni.getStorageSync('hdraw_api_config')
    if (!raw) return null
    const config = JSON.parse(raw)
    if (config.apiKey) {
      config.apiKey = decryptApiKey(config.apiKey)
    }
    return config
  } catch (e) {
    console.error('读取配置失败', e)
    return null
  }
}

/**
 * 判断端点类型：images 还是 chat
 */
function isImagesEndpoint(url) {
  return url.includes('/images/generations') || url.includes('/v1/images')
}

/**
 * 生成图片（自动适配两种端点格式）
 */
export function generateImage(prompt, aspectRatio = '1:1') {
  return new Promise((resolve, reject) => {
    const config = getConfig()
    if (!config) {
      reject(new Error('请先在设置中配置 API 信息'))
      return
    }
    const { apiEndpoint, apiKey, model } = config
    if (!apiEndpoint || !apiKey) {
      reject(new Error('API 配置不完整'))
      return
    }

    const size = SIZE_MAP[aspectRatio] || '1024x1024'
    let requestBody, isImages

    if (isImagesEndpoint(apiEndpoint)) {
      // /images/generations 格式（标准 OpenAI 画图 API）
      isImages = true
      requestBody = {
        model: model || 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size
      }
    } else {
      // /chat/completions 格式（Chat 接口生图）
      isImages = false
      requestBody = {
        model: model || 'gpt-4o',
        messages: [
          { role: 'system', content: `你是一个图片生成助手。根据用户的描述生成图片。请以 Markdown 图片格式返回：[![生成的图片](图片URL)]。图片比例为 ${aspectRatio}。` },
          { role: 'user', content: `请生成图片：${prompt}。图片比例：${aspectRatio}。` }
        ],
        max_tokens: 2000,
        temperature: 0.8
      }
    }

    uni.request({
      url: apiEndpoint,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: requestBody,
      timeout: 120000,
      success(res) {
        if (res.statusCode !== 200) {
          const errMsg = res.data?.error?.message || `HTTP ${res.statusCode}`
          reject(new Error(errMsg))
          return
        }
        try {
          const result = parseResponse(res.data, prompt, aspectRatio, isImages)
          resolve(result)
        } catch (e) {
          reject(e)
        }
      },
      fail(err) {
        const errDetail = typeof err === 'object' ? (err.errMsg || JSON.stringify(err)) : String(err)
        console.error('[API请求失败]', errDetail)
        reject(new Error('网络请求失败: ' + errDetail))
      }
    })
  })
}

/**
 * 解析响应（支持两种格式）
 */
function parseResponse(data, originalPrompt, aspectRatio, isImages) {
  if (isImages) {
    // /images/generations 响应格式
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const first = data.data[0]
      if (first.url) {
        return { imageUrl: first.url, revisedPrompt: first.revised_prompt || originalPrompt }
      }
      if (first.b64_json) {
        return { imageUrl: `data:image/png;base64,${first.b64_json}`, revisedPrompt: first.revised_prompt || originalPrompt }
      }
    }
    throw new Error('API 返回格式异常，未找到图片数据')
  }

  // /chat/completions 响应格式（原有逻辑）
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    const first = data.data[0]
    const imageUrl = first.url || first.b64_json || first.data || null
    if (imageUrl) {
      return {
        imageUrl: first.b64_json ? `data:image/png;base64,${first.b64_json}` : imageUrl,
        revisedPrompt: first.revised_prompt || originalPrompt
      }
    }
  }

  if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
    const content = data.choices[0]?.message?.content || ''
    if (content) {
      const imageUrl = extractImageUrl(content)
      if (imageUrl) return { imageUrl, revisedPrompt: originalPrompt }
      if (isValidUrl(content.trim())) return { imageUrl: content.trim(), revisedPrompt: originalPrompt }
      return { imageUrl: null, rawContent: content, revisedPrompt: originalPrompt }
    }
  }

  if (data.image_url || data.imageUrl || data.url) {
    return {
      imageUrl: data.image_url || data.imageUrl || data.url,
      revisedPrompt: data.prompt || data.revised_prompt || originalPrompt
    }
  }

  throw new Error('无法从 API 响应中解析图片')
}

function extractImageUrl(text) {
  if (!text) return null
  const mdMatch = text.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)
  if (mdMatch) return mdMatch[1]
  const htmlMatch = text.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*\/?>/i)
  if (htmlMatch) return htmlMatch[1]
  const urlMatch = text.match(/(https?:\/\/[^\s<>"']+\.(?:png|jpg|jpeg|gif|webp|bmp|svg)(?:\?[^\s<>"']*)?)/i)
  if (urlMatch) return urlMatch[1]
  const anyUrlMatch = text.match(/(https?:\/\/[^\s<>"']+)/)
  if (anyUrlMatch) return anyUrlMatch[1]
  return null
}

function isValidUrl(str) {
  try { new URL(str); return str.startsWith('http://') || str.startsWith('https://') }
  catch { return false }
}

export function fetchModels() {
  return new Promise((resolve, reject) => {
    const config = getConfig()
    if (!config || !config.apiEndpoint) {
      reject(new Error('请先配置 API 端点'))
      return
    }
    let modelsUrl = config.apiEndpoint
    // 从各种端点路径推导 /v1/models
    if (modelsUrl.includes('/chat/completions')) {
      modelsUrl = modelsUrl.replace('/chat/completions', '/models')
    } else if (modelsUrl.includes('/images/generations')) {
      modelsUrl = modelsUrl.replace('/images/generations', '/models')
    } else if (modelsUrl.includes('/v1')) {
      const idx = modelsUrl.indexOf('/v1')
      modelsUrl = modelsUrl.substring(0, idx + 3) + '/models'
    } else {
      modelsUrl = modelsUrl.replace(/\/[^/]*$/, '') + '/models'
    }

    uni.request({
      url: modelsUrl,
      method: 'GET',
      header: { 'Authorization': `Bearer ${config.apiKey}` },
      timeout: 10000,
      success(res) {
        if (res.statusCode === 200 && res.data?.data) {
          resolve(res.data.data.map(m => m.id || m).sort())
        } else if (res.statusCode === 404) {
          resolve([])
        } else {
          reject(new Error(res.data?.error?.message || `HTTP ${res.statusCode}`))
        }
      },
      fail() { reject(new Error('无法获取模型列表')) }
    })
  })
}

export function testConnection() {
  return new Promise((resolve) => {
    const config = getConfig()
    if (!config) {
      resolve({ success: false, message: '请先配置 API 信息' })
      return
    }
    const { apiEndpoint, apiKey, model } = config

    // 根据端点类型构造测试请求
    let testBody
    if (isImagesEndpoint(apiEndpoint)) {
      testBody = {
        model: model || 'dall-e-3',
        prompt: 'test',
        n: 1,
        size: '1024x1024'
      }
    } else {
      testBody = {
        model: model || 'gpt-4o',
        messages: [
          { role: 'system', content: '你是一个连接测试助手。请回复"连接成功"四个字。' },
          { role: 'user', content: '测试连接' }
        ],
        max_tokens: 10
      }
    }

    uni.request({
      url: apiEndpoint,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: testBody,
      timeout: 30000,
      success(res) {
        if (res.statusCode === 200) {
          const content = res.data?.choices?.[0]?.message?.content || ''
          const modelName = res.data?.model || model
          resolve({ success: true, message: `✅ 连接成功！${content ? '响应: ' + content : ''}`, model: modelName })
        } else {
          resolve({ success: false, message: `❌ 连接失败: ${res.data?.error?.message || `HTTP ${res.statusCode}`}` })
        }
      },
      fail(err) {
        resolve({ success: false, message: `❌ 网络错误: ${err.errMsg || '请求超时'}` })
      }
    })
  })
}
