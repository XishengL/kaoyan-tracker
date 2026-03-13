const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

console.log('🚀 正在启动服务器...');
console.log('📁 数据文件:', DATA_FILE);
console.log('🔧 环境 PORT:', process.env.PORT);

// 设置时区为北京时间
process.env.TZ = 'Asia/Shanghai';

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查必须在静态文件之前
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Railway 默认健康检查可能是根路径
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

// 获取北京时间日期字符串
function getBeijingDateString() {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString().split('T')[0];
}

// 获取北京时间日期时间字符串
function getBeijingDateTimeString() {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString().replace('T', ' ').substring(0, 19);
}

// 检查是否是新的一天，重置今日时长
function checkNewDay(data) {
  const today = getBeijingDateString();
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

  const today = getBeijingDateString();
  
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
      date: getBeijingDateTimeString(),
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
    date: getBeijingDateTimeString(),
    content: content.trim()
  });

  if (writeData(data)) {
    res.json({ success: true, member });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 更新成员信息（目标院校、科目等）
app.post('/api/member/:id/update', (req, res) => {
  const { target, subjects } = req.body;
  const data = readData();
  const member = data[req.params.id];
  
  if (!member) {
    return res.status(404).json({ error: '成员不存在' });
  }

  if (target !== undefined) member.target = target;
  if (subjects !== undefined) {
    member.subjects = subjects;
    // 同步更新 progress 的键
    const newProgress = {};
    subjects.forEach((sub, idx) => {
      const key = `p${idx + 1}`;
      newProgress[key] = member.progress?.[key] || 0;
    });
    member.progress = newProgress;
  }

  if (writeData(data)) {
    res.json({ success: true, member });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 重置今日时长（每天 0 点调用）
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
  console.log(`✅ 服务器已启动，监听 http://0.0.0.0:${PORT}`);
});
