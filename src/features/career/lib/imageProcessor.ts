/**
 * 图片预处理流水线
 * 格式校验 → 尺寸校验 → Canvas 压缩 → WebP base64
 * 浏览器原生实现，无需额外依赖
 */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MIN_DIMENSION = 500 // 最小边长 500px
const MAX_LONG_SIDE = 1536 // 压缩后长边最大 1536px
const WEBP_QUALITY = 0.8

export interface ProcessResult {
  success: true
  base64: string
  width: number
  height: number
  originalSize: number
  compressedSize: number
}

export interface ProcessError {
  success: false
  error: string
}

export type ImageProcessResult = ProcessResult | ProcessError

/** 校验文件是否合格 */
function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "仅支持 JPG / PNG / WebP 格式"
  }
  if (file.size > MAX_FILE_SIZE) {
    return `文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），请压缩至 10MB 以内`
  }
  return null
}

/** 将 File 加载为 HTMLImageElement */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("图片加载失败"))
    }
    img.src = url
  })
}

/** 压缩并转码为 WebP base64 */
function compressToWebP(img: HTMLImageElement): Promise<{ base64: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    let { width, height } = img

    // 等比例缩放：长边不超过 MAX_LONG_SIDE
    if (width > MAX_LONG_SIDE || height > MAX_LONG_SIDE) {
      const ratio = Math.min(MAX_LONG_SIDE / width, MAX_LONG_SIDE / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("Canvas 初始化失败"))
      return
    }

    ctx.drawImage(img, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("WebP 编码失败"))
          return
        }
        const reader = new FileReader()
        reader.onload = () => resolve({ base64: reader.result as string, width, height })
        reader.onerror = () => reject(new Error("Base64 编码失败"))
        reader.readAsDataURL(blob)
      },
      "image/webp",
      WEBP_QUALITY
    )
  })
}

/**
 * 主入口：校验 + 加载 + 压缩
 * 返回 base64 data URL（格式：data:image/webp;base64,...）
 */
export async function processImage(file: File): Promise<ImageProcessResult> {
  // 1. 格式/大小校验
  const validationError = validateFile(file)
  if (validationError) return { success: false, error: validationError }

  const originalSize = file.size

  try {
    // 2. 加载图片
    const img = await loadImage(file)

    // 3. 尺寸校验
    if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
      return {
        success: false,
        error: `图片分辨率过低（${img.naturalWidth}×${img.naturalHeight}），至少需要 ${MIN_DIMENSION}×${MIN_DIMENSION} 像素`,
      }
    }

    // 4. 压缩
    const { base64, width, height } = await compressToWebP(img)

    // 5. 估算压缩后大小（base64 长度 × 0.75 ≈ 字节数）
    const compressedSize = Math.round((base64.length - base64.indexOf(",") - 1) * 0.75)

    return {
      success: true,
      base64,
      width,
      height,
      originalSize,
      compressedSize,
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "图片处理失败",
    }
  }
}

/**
 * 批量处理（最多 2 张）
 */
export async function processImages(files: File[]): Promise<ImageProcessResult[]> {
  return Promise.all(files.slice(0, 2).map(processImage))
}
