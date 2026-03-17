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
    progress: {
      '计算机网络': 0,
      '操作系统': 0,
      '计算机组成原理': 0,
      '数据结构': 0
    },
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
    progress: {
      '专业课一': 0,
      '专业课二': 0,
      '数学': 0
    },
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
    progress: {
      '专业课一': 0,
      '专业课二': 0,
      '数学': 0
    },
    history: []
  }
};

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      // 合并默认数据（防止新字段缺失）
      for (let key in defaultData) {
        if (!data[key]) data[key] = defaultData[key];
        // 确保 progress 对象存在
        if (!data[key].progress) data[key].progress = defaultData[key].progress;
      }
      return data;
    }
  } catch (e) {
    console.error('读取数据失败:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('保存数据失败:', e.message);
    return false;
  }
}

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
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
  
  if (!hours || hours <= 0 || hours > 24) {
    return res.status(400).json({ error: '请输入有效的学习时长(0-24小时)' });
  }

  const today = new Date().toDateString();
  const now = new Date();
  
  if (member.lastCheckIn === today) {
    // 今天已打卡，更新时长
    member.totalHours = member.totalHours - member.todayHours + parseFloat(hours);
    member.todayHours = parseFloat(hours);
    // 删除今天的旧记录
    member.history = member.history.filter(h => {
      const hDate = new Date(h.date).toDateString();
      return hDate !== today;
    });
  } else {
    // 新的一天
    member.todayHours = parseFloat(hours);
    member.totalDays++;
    member.totalHours += parseFloat(hours);
  }
  
  member.lastCheckIn = today;
  member.history.unshift({
    date: now.toISOString(),
    hours: parseFloat(hours),
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
  const { subject, value } = req.body;
  const data = readData();
  const member = data[req.params.id];
  
  if (!member) {
    return res.status(404).json({ error: '成员不存在' });
  }

  if (!member.progress.hasOwnProperty(subject)) {
    return res.status(400).json({ error: '科目不存在' });
  }

  const numValue = parseInt(value);
  if (isNaN(numValue) || numValue < 0 || numValue > 100) {
    return res.status(400).json({ error: '进度值必须是0-100' });
  }

  member.progress[subject] = numValue;
  
  if (writeData(data)) {
    res.json({ success: true, member });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 重置今日数据（每天0点调用）
app.post('/api/reset-daily', (req, res) => {
  const data = readData();
  const today = new Date().toDateString();
  
  for (let id in data) {
    if (data[id].lastCheckIn !== today) {
      data[id].todayHours = 0;
    }
  }
  
  writeData(data);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`考研打卡系统运行在端口 ${PORT}`);
});
