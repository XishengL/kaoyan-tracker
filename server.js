const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 初始化数据
const defaultData = {
  xixian: {
    name: '希贤',
    school: '南京大学软件学院',
    subject: '408统考',
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
    name: '黄sir',
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

// 读取数据
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('读取数据失败:', err);
  }
  return JSON.parse(JSON.stringify(defaultData));
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

// 检查新的一天
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

  // 只保留最近50条记录
  if (member.history.length > 50) {
    member.history = member.history.slice(0, 50);
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 考研打卡服务器运行在端口 ${PORT}`);
  console.log(`📱 本地访问: http://localhost:${PORT}`);
});
