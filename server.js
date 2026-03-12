const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 读取数据
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('读取数据失败:', err);
    return {};
  }
}

// 保存数据
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('保存数据失败:', err);
    return false;
  }
}

// 检查是否是新的一天，重置今日时长
function checkNewDay(data) {
  const today = new Date().toDateString();
  for (const member in data) {
    if (data[member].lastCheckIn !== today) {
      data[member].todayHours = 0;
    }
  }
  return data;
}

// 获取所有数据
app.get('/api/data', (req, res) => {
  let data = readData();
  data = checkNewDay(data);
  res.json(data);
});

// 获取单个成员数据
app.get('/api/member/:id', (req, res) => {
  const data = readData();
  const member = data[req.params.id];
  if (member) {
    res.json(member);
  } else {
    res.status(404).json({ error: '成员不存在' });
  }
});

// 打卡
app.post('/api/checkin/:id', (req, res) => {
  const { hours, content } = req.body;
  if (!hours || hours <= 0) {
    return res.status(400).json({ error: '请输入有效的学习时长' });
  }

  const data = readData();
  const member = data[req.params.id];
  
  if (!member) {
    return res.status(404).json({ error: '成员不存在' });
  }

  const today = new Date().toDateString();
  
  // 检查今天是否已打卡
  if (member.lastCheckIn === today) {
    // 更新今日时长（覆盖）
    member.totalHours = member.totalHours - member.todayHours + hours;
    member.todayHours = hours;
  } else {
    // 新的一天
    member.todayHours = hours;
    member.totalDays++;
    member.totalHours += hours;
  }
  
  member.lastCheckIn = today;
  
  if (content) {
    member.checkIns.unshift({
      date: new Date().toLocaleString('zh-CN'),
      hours,
      content
    });
  }

  if (writeData(data)) {
    res.json({ success: true, member });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 更新进度
app.post('/api/progress/:id', (req, res) => {
  const { progress } = req.body;
  const data = readData();
  const member = data[req.params.id];
  
  if (!member) {
    return res.status(404).json({ error: '成员不存在' });
  }

  member.progress = { ...member.progress, ...progress };

  if (writeData(data)) {
    res.json({ success: true, member });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 添加感悟
app.post('/api/thought/:id', (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '请输入感悟内容' });
  }

  const data = readData();
  const member = data[req.params.id];
  
  if (!member) {
    return res.status(404).json({ error: '成员不存在' });
  }

  member.thoughts.unshift({
    date: new Date().toLocaleString('zh-CN'),
    content: content.trim()
  });

  if (writeData(data)) {
    res.json({ success: true, member });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 重置今日时长（每天0点调用）
app.post('/api/reset-today', (req, res) => {
  const data = readData();
  for (const member in data) {
    data[member].todayHours = 0;
  }
  if (writeData(data)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 考研打卡服务器运行在 http://localhost:${PORT}`);
  console.log(`📱 用手机访问请替换 localhost 为你的电脑IP`);
});
