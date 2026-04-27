import os
from dotenv import load_dotenv
from openai import OpenAI

def test_bailian_api():
    load_dotenv()
    
    api_key = os.getenv("DASHSCOPE_API_KEY")
    
    if not api_key:
        print("错误：未找到 DASHSCOPE_API_KEY 环境变量")
        return
    
    client = OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
    )
    
    try:
        completion = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "user", "content": "你好，请介绍一下你自己"}
            ]
        )
        
        print("API 调用成功！")
        print("=" * 50)
        print("响应内容：")
        print(completion.choices[0].message.content)
        print("=" * 50)
        
    except Exception as e:
        print(f"API 调用失败：{e}")

if __name__ == "__main__":
    test_bailian_api()
