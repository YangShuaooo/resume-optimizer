const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '参考格式.docx');

console.log('正在读取文件...');
console.log('文件路径:', filePath);
console.log('文件是否存在:', fs.existsSync(filePath));

if (fs.existsSync(filePath)) {
  mammoth.extractRawText({ path: filePath })
    .then(function(result) {
      const text = result.value; // 原始文本
      const messages = result.messages; // 警告信息（如果有）

      console.log('\n========== 文件内容 ==========\n');
      console.log(text);
      console.log('\n========== 警告信息 ==========\n');
      console.log(messages);
      
      // 同时保存到一个文本文件以便查看
      fs.writeFileSync(path.join(__dirname, '参考格式-提取文本.txt'), text, 'utf-8');
      console.log('\n文本已保存到: 参考格式-提取文本.txt');
    })
    .done();
} else {
  console.log('文件不存在！');
}
