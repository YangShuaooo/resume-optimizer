const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '参考格式.docx');

console.log('正在读取文件结构...\n');

mammoth.convertToHtml({ path: filePath })
  .then(function(result) {
    const html = result.value;
    const messages = result.messages;

    console.log('========== HTML 结构 ==========\n');
    console.log(html);
    
    // 保存 HTML
    fs.writeFileSync(path.join(__dirname, '参考格式.html'), html, 'utf-8');
    
    console.log('\n\n========== 文本分析 ==========\n');
    
    // 同时也提取带格式的文本
    return mammoth.extractRawText({ path: filePath });
  })
  .then(function(result) {
    const text = result.value;
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log('主要段落标题:');
    lines.forEach((line, i) => {
      if (line.trim().length > 0 && (
        line.includes('概述') || 
        line.includes('一、') || 
        line.includes('二、') || 
        line.includes('三、') || 
        line.includes('四、') || 
        line.includes('五、') || 
        line.includes('六、') ||
        line.includes('S:') ||
        line.includes('T:') ||
        line.includes('A:') ||
        line.includes('R:')
      )) {
        console.log(`[${i}] ${line.trim()}`);
      }
    });
  })
  .catch(err => {
    console.error('错误:', err);
  });
