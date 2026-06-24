/**
 * 脱敏系统 API 服务
 * 用于与 Python 后端通信
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class DesensitizationAPI {
  /**
   * 将 PDF 转换为 Word 文档
   * @param {File} file - PDF 文件
   * @returns {Promise<Blob>} 转换后的 Word 文件
   */
  static async convertPdfToWord(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/pdf-to-word`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'PDF 转换失败')
    }

    return response.blob()
  }

  /**
   * 检测文件中的敏感信息
   * @param {File} file - 要检测的文件
   * @returns {Promise<Object>} 检测结果
   */
  static async detectSensitiveInfo(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/detect`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '检测失败')
    }

    return response.json()
  }

  /**
   * 执行文件脱敏
   * @param {File} file - 要脱敏的文件
   * @param {string} userId - 用户标识
   * @returns {Promise<Object>} 脱敏结果
   */
  static async redactFile(file, userId) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)

    const response = await fetch(`${API_BASE_URL}/api/redact`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '脱敏失败')
    }

    return response.json()
  }

  /**
   * 执行文件脱敏（支持 PDF 自动转换为 Word）
   * @param {File} file - 要脱敏的文件
   * @param {string} userId - 用户标识
   * @returns {Promise<Object>} 脱敏结果
   */
  static async redactFileWithConversion(file, userId) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)

    const response = await fetch(`${API_BASE_URL}/api/redact-with-conversion`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '脱敏失败')
    }

    return response.json()
  }

  /**
   * 还原脱敏文件
   * @param {File} redactedFile - 脱敏后的文件
   * @param {File} mappingFile - 映射表文件
   * @param {string} userId - 用户标识
   * @returns {Promise<Object>} 还原结果
   */
  static async restoreFile(redactedFile, mappingFile, userId) {
    const formData = new FormData()
    formData.append('redacted_file', redactedFile)
    formData.append('mapping_file', mappingFile)
    formData.append('user_id', userId)

    const response = await fetch(`${API_BASE_URL}/api/restore`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '还原失败')
    }

    return response.json()
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 服务状态
   */
  static async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/api/health`)
    return response.json()
  }

  /**
   * 将文本转换为 Word 文档
   * @param {string} text - 文本内容
   * @param {string} filename - 文件名
   * @returns {Promise<Blob>} Word 文件
   */
  static async convertTextToWord(text, filename = 'document.docx') {
    const formData = new FormData()
    formData.append('text', text)
    formData.append('filename', filename)

    const response = await fetch(`${API_BASE_URL}/api/text-to-word`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '转换失败')
    }

    return response.blob()
  }

  /**
   * 将文本转换为 Excel 文件
   * @param {string} text - 文本内容
   * @param {string} filename - 文件名
   * @returns {Promise<Blob>} Excel 文件
   */
  static async convertTextToExcel(text, filename = 'document.xlsx') {
    const formData = new FormData()
    formData.append('text', text)
    formData.append('filename', filename)

    const response = await fetch(`${API_BASE_URL}/api/text-to-excel`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '转换失败')
    }

    return response.blob()
  }

  /**
   * 将文本转换为 Markdown 文件
   * @param {string} text - 文本内容
   * @param {string} filename - 文件名
   * @returns {Promise<Blob>} Markdown 文件
   */
  static async convertTextToMarkdown(text, filename = 'document.md') {
    const formData = new FormData()
    formData.append('text', text)
    formData.append('filename', filename)

    const response = await fetch(`${API_BASE_URL}/api/text-to-markdown`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '转换失败')
    }

    return response.blob()
  }

  /**
   * 将文本转换为 TXT 文件
   * @param {string} text - 文本内容
   * @param {string} filename - 文件名
   * @returns {Promise<Blob>} TXT 文件
   */
  static async convertTextToTxt(text, filename = 'document.txt') {
    const formData = new FormData()
    formData.append('text', text)
    formData.append('filename', filename)

    const response = await fetch(`${API_BASE_URL}/api/text-to-txt`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '转换失败')
    }

    return response.blob()
  }
}

export default DesensitizationAPI
