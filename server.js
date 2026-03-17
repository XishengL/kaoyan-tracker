const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'data.json');

// 中间件
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

// 初始化数据文件
function initDataFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
      console.log('创建初始数据文件');
    }
  } catch (e) {
    console.error('初始化数据文件失败:', e.message);
  }
}

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const data = content ? JSON.parse(content) : {};
      // 合并默认数据
      for (let key in defaultData) {
        if (!data[key]) {
          data[key] = JSON.parse(JSON.stringify(defaultData[key]));
        } else {
          // 确保 progress 存在且包含所有科目
          if (!data[key].progress) {
            data[key].progress = JSON.parse(JSON.stringify(defaultData[key].progress));
          } else {
            // 合并缺失的科目
            for (let subject in defaultData[key].progress) {
              if (!(subject in data[key].progress)) {
                data[key].progress[subject] = 0;
              }
            }
          }
          // 确保其他字段存在
          data[key].totalDays = data[key].totalDays || 0;
          data[key].totalHours = data[key].totalHours || 0;
          data[key].todayHours = data[key].todayHours || 0;
          data[key].history = data[key].history || [];
        }
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

// 路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

app.get('/api/data', (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: '读取数据失败' });
  }
});

app.post('/api/checkin/:id', (req, res) => {
  try {
    const { hours, content } = req.body;
    const data = readData();
    const member = data[req.params.id];
    
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

    if (writeData(data)) {
      res.json({ success: true, member });
    } else {
      res.status(500).json({ error: '保存失败' });
    }
  } catch (e) {
    console.error('打卡错误:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/progress/:id', (req, res) => {
  try {
    const { subject, value } = req.body;
    const data = readData();
    const member = data[req.params.id];
    
    if (!member) {
      return res.status(404).json({ error: '成员不存在' });
    }

    if (!member.progress || !member.progress.hasOwnProperty(subject)) {
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
  } catch (e) {
    console.error('更新进度错误:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 初始化并启动
initDataFile();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`考研打卡系统运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
