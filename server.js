const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(__dirname));

// 默认数据
const defaultData = {
  xixian: {
    name: '希贤',
    school: '南京大学软件学院',
    subject: '408 统考',
    totalDays: 0,
    totalHours: 0,
    todayHours: 0,
    lastCheckIn: null,
    progress: { p1: 0, p2: 0, p3: 0, p4: 0 },
    history: []
  },
  liushen: {
    name: '刘神',
    school: '中国矿业大学',
    subject: '安全工程',
    totalDays: 0,
    totalHours: 0,
    todayHours: 0,
    lastCheckIn: null,
    progress: { p1: 0, p2: 0, p3: 0 },
    history: []
  },
  huangsir: {
    name: '黄 sir',
    school: '南京大学',
    subject: '电气工程',
    totalDays: 0,
    totalHours: 0,
    todayHours: 0,
    lastCheckIn: null,
    progress: { p1: 0, p2: 0, p3: 0 },
    history: []
  }
};

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('读取失败:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('保存失败:', e.message);
    return false;
  }
}

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.send('OK');
});

// 获取数据
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// 打卡
app.post('/api/checkin/:id', (req, res) => {
  const { hours, content } = req.body;
  const data = readData();
  const member = data[req.params.id];
  
  if (!member) {
    return res.status(404).json({ error: '成员不存在' });
  }
  
  if (!hours || hours <= 0) {
    return res.status(400).json({ error: '请输入有效的学习时长' });
  }

  const today = new Date().toDateString();
  const now = new Date();
  
  if (member.lastCheckIn === today) {
    member.totalHours = member.totalHours - member.todayHours + hours;
    member.todayHours = hours;
  } else {
    member.todayHours = hours;
    member.totalDays++;
    member.totalHours += hours;
  }
  
  member.lastCheckIn = today;
  member.history.unshift({
    date: now.toLocaleString('zh-CN'),
    hours,
    content: content || '今日学习打卡'
  });
  
  if (member.history.length > 50) {
    member.history = member.history.slice(0, 50);
  }

  writeData(data);
  res.json({ success: true, member });
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
  writeData(data);
  res.json({ success: true, member });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
