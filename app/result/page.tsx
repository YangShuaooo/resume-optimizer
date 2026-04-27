'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Section {
  title: string
  content: string
}

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<Section[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState('')

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('optimizationResult')
      if (storedData) {
        const data = JSON.parse(storedData)
        let contentToUse = data.content || ''
        if (!data.userEdited) {
          contentToUse = formatContentSimple(contentToUse)
        }
        setResult(contentToUse)
        setEditedContent(contentToUse)
        setSections(parseMarkdownSectionsSimple(contentToUse))
      }
    } catch (error) {
      console.error('Failed to load result:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const formatContentSimple = (content: string): string => {
    const lines = content.split('\n')
    let result: string[] = []
    let inTable = false
    let tableBuffer: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isTableRow = line.trim().includes('|')
      const isSeparatorLine = line.includes('|') && line.includes('-')

      if (isTableRow) {
        inTable = true
        let cleanedLine = line
        cleanedLine = cleanedLine.replace(/<br\s*\/?>/gi, ' ')
        cleanedLine = cleanedLine.replace(/<[^>]+>/g, '')
        cleanedLine = cleanedLine.replace(/\\n/g, ' ')
        tableBuffer.push(cleanedLine)
      } else {
        if (inTable && tableBuffer.length > 0) {
          result.push(...tableBuffer)
          tableBuffer = []
          inTable = false
        }

        let formatted = line
        formatted = formatted.replace(/▶/g, '')
        formatted = formatted.replace(/<[^>]+>/g, '')
        result.push(formatted)
      }
    }

    if (inTable && tableBuffer.length > 0) {
      result.push(...tableBuffer)
    }

    return result.join('\n')
  }

  const parseMarkdownSectionsSimple = (markdown: string): Section[] => {
    const lines = markdown.split('\n')
    const sections: Section[] = []
    let currentTitle = '概述'
    let currentContent = ''
    let inTable = false
    let tableBuffer: string[] = []
    let seenTitles = new Set<string>()
    let shouldStopParsing = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
      const isTableRow = line.trim().includes('|')

      if (shouldStopParsing) {
        continue // 已经停止解析，直接跳过后续内容
      }

      if (isTableRow) {
        inTable = true
        tableBuffer.push(line)
        continue
      } else if (inTable) {
        if (tableBuffer.length > 0) {
          currentContent += (currentContent ? '\n' : '') + tableBuffer.join('\n')
          tableBuffer = []
        }
        inTable = false
      }

      if (headingMatch) {
        const title = headingMatch[2]
        
        // 如果检测到完整简历相关的标题，直接停止解析
        if (/完整优化后简历|完整简历|优化后简历|姓名|电话|邮箱|联系电话|联系邮箱/i.test(title)) {
          // 先把当前内容保存
          if (currentContent.trim()) {
            sections.push({ title: currentTitle, content: currentContent.trim() })
          }
          shouldStopParsing = true
          break
        }

        // 如果这个标题已经出现过了（重复），停止解析
        if (seenTitles.has(title)) {
          // 先把当前内容保存
          if (currentContent.trim()) {
            sections.push({ title: currentTitle, content: currentContent.trim() })
          }
          shouldStopParsing = true
          break
        }

        // 正常处理当前标题
        if (currentContent.trim()) {
          sections.push({ title: currentTitle, content: currentContent.trim() })
          seenTitles.add(currentTitle)
        }
        currentTitle = title
        currentContent = ''
      } else {
        currentContent += (currentContent ? '\n' : '') + line
      }
    }

    if (tableBuffer.length > 0) {
      currentContent += (currentContent ? '\n' : '') + tableBuffer.join('\n')
    }

    if (!shouldStopParsing && (currentContent.trim() || sections.length === 0)) {
      sections.push({ title: currentTitle, content: currentContent.trim() })
    }

    return sections
  }

  const handleSaveEdit = () => {
    setResult(editedContent)
    setSections(parseMarkdownSectionsSimple(editedContent))
    setEditMode(false)

    const storedData = localStorage.getItem('optimizationResult')
    if (storedData) {
      const data = JSON.parse(storedData)
      data.content = editedContent
      data.userEdited = true
      localStorage.setItem('optimizationResult', JSON.stringify(data))
    }
  }

  const handleCopy = async () => {
    try {
      const copyContent = editedContent.replace(/\\n/g, '\n')
      await navigator.clipboard.writeText(copyContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      alert('复制失败，请手动复制')
    }
  }

  const handleCopySection = async (title: string, content: string) => {
    try {
      const copyContent = content.replace(/\\n/g, '\n')
      await navigator.clipboard.writeText(`${title}\n${copyContent}`)
      alert('已复制到剪贴板！')
    } catch (error) {
      alert('复制失败，请手动复制')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center mb-4">
            <span className="dot-1 w-3 h-3 bg-blue-600 rounded-full"></span>
            <span className="dot-2 w-3 h-3 bg-blue-600 rounded-full"></span>
            <span className="dot-3 w-3 h-3 bg-blue-600 rounded-full"></span>
          </div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/upload')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-blue-200 text-blue-900 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-950 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-300 cursor-pointer group"
          >
            <span className="text-2xl group-hover:-translate-x-1 transition-transform duration-300">←</span>
            <span className="text-sm sm:text-base font-semibold">返回</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">处理结果</h1>
          <div className="w-16"></div>
        </div>

        {result ? (
          <>
            <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">✨</span>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">优化完成</h2>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (editMode) {
                        handleSaveEdit()
                      } else {
                        setEditMode(true)
                      }
                    }}
                    className={`flex-1 sm:flex-none px-4 py-3 rounded-2xl font-semibold transition-all duration-300 cursor-pointer text-sm sm:text-base ${
                      editMode
                        ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md hover:-translate-y-0.5'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {editMode ? '✓ 保存' : '✏️ 编辑'}
                  </button>
                  <button
                    className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-semibold transition-all duration-300 cursor-pointer text-sm sm:text-base ${
                      copied
                        ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md hover:-translate-y-0.5'
                        : 'bg-white border border-green-200 text-green-900 hover:bg-green-50 hover:border-green-300 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                    onClick={handleCopy}
                  >
                    {copied ? '已复制!' : '一键复制'}
                  </button>
                  <button
                    className="flex-1 sm:flex-none px-5 py-3 rounded-2xl font-semibold bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-300 cursor-pointer text-sm sm:text-base"
                    onClick={() => router.push('/upload')}
                  >
                    再来一份
                  </button>
                </div>
              </div>
            </div>

            {editMode ? (
              <div className="bg-white rounded-2xl shadow-md p-5 sm:p-7 border border-gray-200">
                <div className="mb-4 pb-3 border-b border-gray-100">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800">编辑内容</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    调整好格式后，点击"保存"按钮保存您的修改
                  </p>
                </div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[600px] p-4 border border-gray-300 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base font-mono"
                  placeholder="在此编辑您的内容..."
                />
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-md p-5 sm:p-7 border border-gray-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100 gap-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex-1 break-words">
                        {section.title}
                      </h3>
                      <button
                        onClick={() => handleCopySection(section.title, section.content)}
                        className="flex-shrink-0 px-4 py-2 text-xs sm:text-sm text-blue-600 bg-blue-50 rounded-xl font-semibold hover:bg-blue-100 hover:text-blue-800 transition-all duration-300 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <span>📋</span>
                        复制此块
                      </button>
                    </div>
                    <div className="markdown-content text-gray-700 leading-relaxed text-sm sm:text-base">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children, ...props }) => (
                            <div className="my-4 overflow-x-auto">
                              <table {...props} className="w-full border-collapse border border-gray-300">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children, ...props }) => (
                            <thead {...props} className="bg-gray-100">
                              {children}
                            </thead>
                          ),
                          tbody: ({ children, ...props }) => (
                            <tbody {...props}>{children}</tbody>
                          ),
                          tr: ({ children, ...props }) => (
                            <tr {...props} className="border-b border-gray-200">
                              {children}
                            </tr>
                          ),
                          th: ({ children, ...props }) => (
                            <th {...props} className="px-3 py-2 text-left font-semibold text-gray-700 border border-gray-300 align-top">
                              {children}
                            </th>
                          ),
                          td: ({ children, ...props }) => (
                            <td {...props} className="px-3 py-2 text-gray-700 border border-gray-300 align-top">
                              {children}
                            </td>
                          ),
                          p: ({ children, ...props }) => (
                            <p {...props} className="mb-2 last:mb-0">
                              {children}
                            </p>
                          ),
                          ul: ({ children, ...props }) => (
                            <ul {...props} className="mb-2 pl-6 list-disc last:mb-0">
                              {children}
                            </ul>
                          ),
                          ol: ({ children, ...props }) => (
                            <ol {...props} className="mb-2 pl-6 list-decimal last:mb-0">
                              {children}
                            </ol>
                          ),
                          li: ({ children, ...props }) => (
                            <li {...props} className="mb-1 last:mb-0">
                              {children}
                            </li>
                          ),
                          strong: ({ children, ...props }) => (
                            <strong {...props} className="font-bold">
                              {children}
                            </strong>
                          ),
                          em: ({ children, ...props }) => <em {...props}>{children}</em>,
                          h1: ({ children, ...props }) => (
                            <p {...props} className="mb-2 last:mb-0">
                              <span className="font-bold text-lg">{children}</span>
                            </p>
                          ),
                          h2: ({ children, ...props }) => (
                            <p {...props} className="mb-2 last:mb-0">
                              <span className="font-bold">{children}</span>
                            </p>
                          ),
                          h3: ({ children, ...props }) => (
                            <p {...props} className="mb-2 last:mb-0">
                              <span className="font-bold">{children}</span>
                            </p>
                          ),
                          h4: ({ children, ...props }) => (
                            <p {...props} className="mb-2 last:mb-0">
                              <span className="font-bold">{children}</span>
                            </p>
                          ),
                          h5: ({ children, ...props }) => (
                            <p {...props} className="mb-2 last:mb-0">
                              <span className="font-bold">{children}</span>
                            </p>
                          ),
                          h6: ({ children, ...props }) => (
                            <p {...props} className="mb-2 last:mb-0">
                              <span className="font-bold">{children}</span>
                            </p>
                          ),
                        }}
                      >
                        {section.content.replace(/(^|\n)#{1,6}\s+/g, '$1')}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-8 sm:p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">暂无结果</h2>
            <p className="text-gray-600 mb-6">请先上传简历进行优化</p>
            <button
              className="px-8 py-4 rounded-2xl font-semibold bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-300 cursor-pointer"
              onClick={() => router.push('/upload')}
            >
              去上传简历
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
