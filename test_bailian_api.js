const { OpenAI } = require('openai');
require('dotenv').config();

async function testBailianApi() {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    
    if (!apiKey) {
        console.log('错误：未找到 DASHSCOPE_API_KEY 环境变量');
        return;
    }
    
    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
    
    try {
        const completion = await client.chat.completions.create({
            model: 'qwen-plus',
            messages: [
                { role: 'user', content: '你好，请介绍一下你自己' }
            ]
        });
        
        console.log('API 调用成功！');
        console.log('='.repeat(50));
        console.log('响应内容：');
        console.log(completion.choices[0].message.content);
        console.log('='.repeat(50));
        
    } catch (error) {
        console.log('API 调用失败：', error.message);
    }
}

testBailianApi();
