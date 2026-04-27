'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [targetPosition, setTargetPosition] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeMode, setActiveMode] = useState<'text' | 'file'>('file')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOptimize = async () => {
    if (activeMode === 'text') {
      if (!content.trim()) {
        alert('请先输入你的简历内容')
        return
      }
    } else {
      if (!selectedFile) {
        alert('请先选择文件')
        return
      }
    }

    setLoading(true)
    let success = false

    try {
      let response
      if (activeMode === 'text') {
        response = await fetch('/api/optimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        })
      } else {
        const formData = new FormData()
        formData.append('file', selectedFile!)
        if (targetPosition.trim()) {
          formData.append('targetPosition', targetPosition.trim())
        }
        if (jobDescription.trim()) {
          formData.append('jobDescription', jobDescription.trim())
        }
        response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
      }

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('optimizationResult', JSON.stringify(data))
        success = true
        router.push('/result')
      } else {
        const errorMsg = data.details 
          ? `${data.error}\n\n详情: ${data.details}`
          : data.error || '处理失败，请重试'
        alert(errorMsg)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('请求失败，请检查网络连接')
    } finally {
      if (!success) {
        setLoading(false)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
        alert('仅支持 PDF 和 DOCX 格式')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('文件大小不能超过 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-blue-200 text-blue-900 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-950 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-300 cursor-pointer group"
          >
            <span className="text-2xl group-hover:-translate-x-1 transition-transform duration-300">←</span>
            <span className="text-sm sm:text-base font-semibold">返回</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            信息上传
          </h1>
          <div className="w-16"></div>
        </div>

        <div className="mb-5 sm:mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎯 目标岗位
            </label>
            <input
              type="text"
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
              placeholder="例如：前端开发工程师、产品经理..."
              value={targetPosition}
              onChange={(e) => setTargetPosition(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📋 岗位JD（选填）
            </label>
            <textarea
              className="w-full h-40 sm:h-52 p-3 sm:p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
              placeholder="粘贴岗位描述、职责要求等内容..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-5 sm:mb-6">
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="inline-flex bg-white rounded-2xl p-2 shadow-sm w-full max-w-sm border border-gray-200">
              <button
                className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer text-sm sm:text-base ${
                  activeMode === 'text'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
                onClick={() => setActiveMode('text')}
              >
                文本输入
              </button>
              <button
                className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer text-sm sm:text-base ${
                  activeMode === 'file'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
                onClick={() => setActiveMode('file')}
              >
                上传文件
              </button>
            </div>
          </div>

          <div className="h-48 sm:h-64">
            {activeMode === 'text' ? (
              <textarea
                className="w-full h-full p-3 sm:p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                placeholder="粘贴你的简历内容（包括工作经历、项目经历、技能、自我评价等）..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <div
                className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-white flex flex-col justify-center overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="overflow-hidden">
                    <div className="text-green-600 font-medium mb-2 text-sm sm:text-base">✓ 已选择文件</div>
                    <div className="text-gray-700 text-sm sm:text-base break-all truncate">{selectedFile.name}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <button
                      className="mt-4 px-4 py-2 text-xs sm:text-sm text-blue-600 bg-blue-50 rounded-xl font-semibold hover:bg-blue-100 hover:text-blue-800 transition-all duration-300 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                      }}
                    >
                      重新选择
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📄</div>
                    <div className="text-gray-700 font-medium mb-2 text-sm sm:text-base">点击或拖拽文件到此处</div>
                    <div className="text-xs sm:text-sm text-gray-500">支持 PDF、DOCX 格式，最大 10MB</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center">
            💡 系统会自动移除敏感信息（如姓名、手机号、邮箱、地址等），保护您的隐私安全
          </p>
        </div>

        <div className="flex justify-center">
          <button
            className={`px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 text-sm sm:text-base flex items-center gap-2 cursor-pointer ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm'
            }`}
            onClick={handleOptimize}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="dot-1 w-2 h-2 bg-white rounded-full"></span>
                  <span className="dot-2 w-2 h-2 bg-white rounded-full"></span>
                  <span className="dot-3 w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span>小助手正在分析中...</span>
              </>
            ) : (
              <span>分析简历</span>
            )}
          </button>
        </div>

        {loading && (
          <div className="mt-6 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <div className="text-blue-500 text-xl">⚡</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800 mb-1">正在优化您的简历</p>
                  <p className="text-xs text-blue-600">小助手正在分析内容，这可能需要几分钟...</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
