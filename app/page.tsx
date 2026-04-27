'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="text-7xl sm:text-8xl mb-6">🚀</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            简历优化助手
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-2">
            使用小助手智能优化您的简历
          </p>
          <p className="text-base sm:text-lg text-gray-500">
            让您的简历脱颖而出，获得更多面试机会
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="font-semibold text-gray-800 mb-2">上传简历</h3>
            <p className="text-sm text-gray-500">支持 PDF、DOCX 格式</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-800 mb-2">小助手分析</h3>
            <p className="text-sm text-gray-500">智能优化内容</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-semibold text-gray-800 mb-2">获得结果</h3>
            <p className="text-sm text-gray-500">一键复制使用</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/upload')}
          className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:shadow-lg cursor-pointer"
        >
          开始使用 →
        </button>

        <div className="mt-8 text-sm text-gray-400">
          <p>💡 您的隐私安全有保障，敏感信息会被自动移除</p>
        </div>
      </div>
    </div>
  )
}
