const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// 使用内存存储（Railway 的磁盘是临时的）
let membersData = {
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

// 中间件
app.use(express.json());
app.use(express.static(__dirname));

// 路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

app.get('/api/data', (req, res) => {
  res.json(membersData);
});

app.post('/api/checkin/:id', (req, res) => {
  try {
    const { hours, content } = req.body;
    const member = membersData[req.params.id];
    
    if (!member) {
      return res.status(404).json({ error: '成员不存在' });
    }
    
    const numHours = parseFloat(hours);
    if (!numHours || numHours <= 0 || numHours > 24) {
      return res.status(400).json({ error: '请输入有效的学习时长(0-24小时)' });
    }

    const today = new Date().toDateString();
    const now = new Date();
    
    if (member.lastCheckIn === today) {
      member.totalHours = member.totalHours - member.todayHours + numHours;
      member.todayHours = numHours;
      member.history = member.history.filter(h => {
        try {
          const hDate = new Date(h.date).toDateString();
          return hDate !== today;
        } catch {
          return true;
        }
      });
    } else {
      member.todayHours = numHours;
      member.totalDays++;
      member.totalHours += numHours;
    }
    
    member.lastCheckIn = today;
    member.history.unshift({
      date: now.toISOString(),
      hours: numHours,
      content: content || '今日学习打卡'
    });
    
    if (member.history.length > 50) {
      member.history = member.history.slice(0, 50);
    }

    res.json({ success: true, member });
  } catch (e) {
    console.error('打卡错误:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/progress/:id', (req, res) => {
  try {
    const { subject, value } = req.body;
    const member = membersData[req.params.id];
    
    if (!member) {
      return res.status(404).json({ error: '成员不存在' });
    }

    if (!member.progress || !(subject in member.progress)) {
      return res.status(400).json({ error: '科目不存在' });
    }

    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      return res.status(400).json({ error: '进度值必须是0-100' });
    }

    member.progress[subject] = numValue;
    res.json({ success: true, member });
  } catch (e) {
    console.error('更新进度错误:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 启动
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`考研打卡系统运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  server.close(() => {
    process.exit(0);
  });
});
