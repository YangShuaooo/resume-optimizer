import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function removeSensitiveInfo(text: string): string {
  let cleaned = text

  // 移除邮箱地址
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')

  // 移除中国手机号码 - 11位数字，1开头
  cleaned = cleaned.replace(/\b1[3-9]\d{9}\b/g, '')

  // 移除固定电话号码
  cleaned = cleaned.replace(/\b0\d{2,3}-\d{7,8}\b/g, '')

  // 移除身份证号 - 18位或15位
  cleaned = cleaned.replace(/\b\d{17}[\dXx]\b|\b\d{15}\b/g, '')

  // 移除银行卡号 - 16-19位数字
  cleaned = cleaned.replace(/\b\d{16,19}\b/g, '')

  // 移除姓名标签及后面的姓名
  cleaned = cleaned.replace(/(姓名|名字|联系人|求职者|应聘者)[：:]\s*[\u4e00-\u9fa5]{2,4}/g, '')
  cleaned = cleaned.replace(/(电话|手机|联系电话|手机号)[：:]\s*[^\n\r]*/g, '')
  cleaned = cleaned.replace(/(邮箱|email|e-mail|电子邮件)[：:]\s*[^\n\r]*/gi, '')
  cleaned = cleaned.replace(/(地址|现居地|住址|家庭住址)[：:]\s*[^\n\r]*/g, '')

  // 清理多余的空格和换行
  cleaned = cleaned.replace(/\n\s*\n/g, '\n')
  cleaned = cleaned.trim()

  return cleaned
}

async function extractPDFText(buffer: Buffer): Promise<string> {
  const PDFParser = require('pdf2json')
  const parser = new PDFParser()

  return new Promise((resolve, reject) => {
    parser.on('pdfParser_dataReady', (pdfData: any) => {
      let text = ''
      const pages = pdfData.Pages || []
      for (const page of pages) {
        const texts = page.Texts || []
        for (const t of texts) {
          if (t.R && t.R.length > 0) {
            const decoded = decodeURIComponent(t.R[0].T)
            text += decoded + ' '
          }
        }
        text += '\n'
      }
      resolve(text)
    })

    parser.on('pdfParser_dataError', (err: any) => {
      reject(err)
    })

    parser.parseBuffer(buffer)
  })
}

export async function POST(request: Request) {
  console.log('[Upload] 收到请求')

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const targetPosition = formData.get('targetPosition') as string
    const jobDescription = formData.get('jobDescription') as string

    if (!file) {
      console.log('[Upload] 没有文件')
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    console.log('[Upload] 文件:', file.name, file.type, file.size)

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let textContent = ''
    const lowerName = file.name.toLowerCase()

    try {
      if (lowerName.endsWith('.pdf')) {
        console.log('[Upload] 解析 PDF (pdf2json)...')
        textContent = await extractPDFText(buffer)
        console.log('[Upload] PDF 完成，文本长度:', textContent.length)
      } else if (lowerName.endsWith('.docx')) {
        console.log('[Upload] 解析 DOCX...')
        const mammoth = require('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        textContent = result.value
        console.log('[Upload] DOCX 完成，文本长度:', textContent.length)
      } else {
        return NextResponse.json({ error: '仅支持 PDF 和 DOCX 格式' }, { status: 400 })
      }
    } catch (err) {
      console.error('[Upload] 解析错误:', err)
      return NextResponse.json(
        { error: '文件解析失败', details: String(err) },
        { status: 400 }
      )
    }

    if (!textContent.trim()) {
      return NextResponse.json({ error: '未能从文件中提取文本' }, { status: 400 })
    }

    console.log('[Upload] 开始移除敏感信息...')
    const cleanedText = removeSensitiveInfo(textContent)
    console.log('[Upload] 敏感信息移除完成')

    const apiKey = process.env.DASHSCOPE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 })
    }

    console.log('[Upload] 调用千问...')
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    })

    // 默认配置
    const systemContent = `你是一个专业的全方位简历优化专家。请严格按照以下格式输出优化结果：

【输出格式规范】
### 概述  
以下是对您提供的简历进行的全方位、专业化、求职导向型优化分析与重构，严格遵循高级前端开发工程师（React方向）岗位JD要求，聚焦**架构能力、性能深度、工程化沉淀、技术领导力与业务影响力**五大核心维度，全面强化技术叙事逻辑、成果可验证性与高阶岗位匹配度。  
> ⚠️ **关键前提说明**：原始简历中缺失「教育背景」「开源/技术博客/专利等附加价值项」，本优化基于岗位JD隐含要求（如“指导初级工程师”“参与技术选型”“架构设计”）进行**合理推演补全**，所有补全部分均标注为「推演」并确保可面试验证；项目数据（如FPS、LCP、效率提升率）已按行业基准校准，符合SMART原则。  
---  
### ✨ 一、简历组成部分提取与初步分析  
| 模块 | 内容概要 | 优势 | 待优化点 |  
|------|---------|------|---------|  
| **专业技能** | [内容概要] | [描述] | ❌ [待优化点1]\n❌ [待优化点2] |  
| **工作经历** | [内容概要] | [描述] | ❌ [待优化点1]\n❌ [待优化点2] |  
| **项目经验** | [内容概要] | [描述] | ❌ [待优化点1]\n❌ [待优化点2] |  
| **自我评价** | [内容概要] | [描述] | ❌ [待优化点1]\n❌ [待优化点2] |  

### 📌 核心诊断结论  
✅ **潜力扎实**：[描述]  
⚠️ **表达降维**：[描述]  

### 🚀 优化焦点：  
- 将"做了什么" → 升级为"**为什么做、如何权衡、带来什么系统性收益**"；  
- 所有R必须满足：**可测量 + 有参照系 + 明确归属**（你主导/你设计/你推动）；  
- 补全高级岗隐性能力信号：**技术决策依据、质量保障机制、知识沉淀路径**（如Code Review Checklist、组件准入规范、性能监控SLA）。  
---  
### 📝 二、工作经历&项目经验——STAR 法则重写与深度优化  
#### **STAR原则严格执行：每个经历均包含**  
- **S (情境)**：业务/技术背景与痛点（含规模、时效、风险）  
- **T (任务)**：你的核心职责与目标（需对齐岗位JD关键词）  
- **A (行动)**：关键技术动作、设计决策、协作方式（突出架构思维与技术判断）  
- **R (Result)**：可验证、可比较、有归属感的量化结果（附基线值、提升幅度、影响范围）  
> 🔍 *注：以下“技术决策依据”“质量保障机制”等细节为基于JD要求与行业实践的合理推演补全，确保可面试深挖验证（如被问及“Zustand选型依据”，可展开对比Redux Toolkit的Bundle Size/学习成本/DevTools支持度）*  

### [公司名称]（[公司描述]） / [职位] / [时间范围]  

#### **[项目名称]（[角色]）**  
- **S**：[背景描述]  
- **T**：[任务描述]  
- **A**：  
  - [具体行动1]  
  - [具体行动2]  
- **R**：  
  - [成果1]  
  - [成果2]  
  （一定要有几个空格） 

#### **[项目名称]（[角色]）**  
- **S**：[背景描述]  
- **T**：[任务描述]  
- **A**：  
  - [具体行动1]  
- **R**：  
  - [成果1]  

---  
### 💡 三、专业技能——结构化、专业化、关键词强化优化  
#### **优化逻辑**：  
- 分层分级（精通/熟练/了解），杜绝模糊表述；  
- 技能栈归类，突出高阶能力标签；  
- 补充高级岗必备关键词（微前端、可观测性、BFF、SSR）；  
- 删除无效描述，转为价值型陈述（如“熟悉Git” → “主导Git Flow标准化，落地PR模板+自动化Changelog”）。  

### 🎯 前端核心能力  
- **精通**：[技能1]  
- **熟练**：[技能2]  

### 🎯 工程化与架构  
- **精通**：[技能1]  
- **熟练**：[技能2]  

### 🎯 质量与协作  
- **精通**：[技能1]  
- **熟练**：[技能2]  

---  
### 🎤 四、自我评价——重写为"价值主张型"陈述  
#### - **原则**：不谈特质，谈价值；不用形容词，用动词；不谈喜好，谈产出  
### 自我评价  
- [第一句话]  
- [第二句话]  
- [第三句话]  

---  
### 📋 五、针对性改进建议  
| 类别 | 具体建议 | 执行优先级 | 说明 |  
|------|---------|-----------|------|  
| **立即行动** | [建议内容] | ⭐⭐⭐ | [说明] |  

---  
⚠️ **重要提示**：  
- 本优化严格保护用户隐私，未使用任何真实公司名、项目名、数据细节；  
- 所有推演补全部分（如“qiankun微前端”“Turborepo”“安全白皮书”）均标注来源，确保可面试验证；  
- 所有成果数据均满足SMART原则（Specific, Measurable, Achievable, Relevant, Time-bound），拒绝模糊表述；  

---

【格式要求说明】
1. 严格遵循上面的输出格式规范，不要改变任何结构、符号、emoji
2. 保留所有的Markdown符号（##、###、**、|、---等）
3. 表格中的换行用\n表示，保留所有emoji符号
4. 在项目/经历名称前面有空格，确保左边顶格
5. 只对S、T、A、R这几个字母加粗，后面的内容正常字体
6. 不要使用▶符号
7. 严格按照上面的模板输出，不要删减或添加任何内容`

    let userPrompt = `请严格按照上面的格式模板，全方位优化这份简历：

【简历内容】
${cleanedText}

请确保：
1. 严格遵循提供的格式模板
2. 每个工作经历和项目都用 STAR 法则清晰标注 S、T、A、R
3. 使用表格展示分析结果和建议
4. 成果尽量量化，数据化表达
5. 最后提供完整的优化后简历版本`

    // 如果有目标岗位或JD，添加到提示中
    if (targetPosition || jobDescription) {
      let extraPrompt = '\n\n'
      if (targetPosition) {
        extraPrompt += `【目标岗位】\n${targetPosition}\n\n`
      }
      if (jobDescription) {
        extraPrompt += `【岗位JD】\n${jobDescription}\n\n`
      }
      extraPrompt += '请结合以上目标岗位和JD进行优化！'
      userPrompt += extraPrompt
    }

    const completion = await client.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: systemContent
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    const result = completion.choices[0]?.message?.content || '处理失败'
    console.log('[Upload] 完成')

    return NextResponse.json({ content: result })
  } catch (error) {
    console.error('[Upload] 错误:', error)
    return NextResponse.json(
      { error: '服务器错误', details: String(error) },
      { status: 500 }
    )
  }
}
