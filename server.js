const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 使用北京时间
process.env.TZ = 'Asia/Shanghai';

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const DATA_FILE = './data.json';

// 初始化数据文件
function initData() {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = {
            xixian: {
                name: '希贤',
                school: '南京大学',
                major: '软件学院',
                subjects: ['数据结构', '计算机组成原理', '操作系统', '计算机网络'],
                totalDays: 0,
                totalHours: 0,
                todayHours: 0,
                lastCheckIn: null,
                checkIns: [],
                thoughts: [],
                progress: { p1: 0, p2: 0, p3: 0, p4: 0 }
            },
            liushen: {
                name: '刘神',
                school: '中国矿业大学',
                major: '安全工程',
                subjects: ['安全系统工程', '防火防爆', '职业卫生'],
                totalDays: 0,
                totalHours: 0,
                todayHours: 0,
                lastCheckIn: null,
                checkIns: [],
                thoughts: [],
                progress: { p1: 0, p2: 0, p3: 0 }
            },
            huangsir: {
                name: '黄sir',
                school: '南京大学',
                major: '电气工程',
                subjects: ['电路原理', '电机学', '电力电子'],
                totalDays: 0,
                totalHours: 0,
                todayHours: 0,
                lastCheckIn: null,
                checkIns: [],
                thoughts: [],
                progress: { p1: 0, p2: 0, p3: 0 }
            }
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
}

// 读取数据
function loadData() {
    initData();
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// 保存数据
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 获取今天日期字符串（北京时间）
function getTodayString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// 获取所有数据
app.get('/api/data', (req, res) => {
    const data = loadData();
    const today = getTodayString();
    
    // 重置今日时长如果不是今天
    Object.keys(data).forEach(key => {
        if (data[key].lastCheckIn !== today) {
            data[key].todayHours = 0;
        }
    });
    
    res.json(data);
});

// 打卡
app.post('/api/checkin/:member', (req, res) => {
    const { member } = req.params;
    const { hours, content } = req.body;
    
    if (!hours || hours <= 0) {
        return res.status(400).json({ error: '请输入学习时长' });
    }
    
    const data = loadData();
    if (!data[member]) {
        return res.status(404).json({ error: '成员不存在' });
    }
    
    const today = getTodayString();
    const memberData = data[member];
    
    if (memberData.lastCheckIn === today) {
        memberData.todayHours = hours;
    } else {
        memberData.todayHours = hours;
        memberData.totalDays++;
    }
    
    memberData.totalHours += hours;
    memberData.lastCheckIn = today;
    
    if (content) {
        memberData.checkIns.unshift({
            date: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
            hours,
            content
        });
    }
    
    saveData(data);
    res.json({ success: true, data: memberData });
});

// 更新进度
app.post('/api/progress/:member', (req, res) => {
    const { member } = req.params;
    const { progress } = req.body;
    
    const data = loadData();
    if (!data[member]) {
        return res.status(404).json({ error: '成员不存在' });
    }
    
    data[member].progress = { ...data[member].progress, ...progress };
    saveData(data);
    res.json({ success: true, data: data[member] });
});

// 添加感悟
app.post('/api/thought/:member', (req, res) => {
    const { member } = req.params;
    const { content } = req.body;
    
    if (!content || !content.trim()) {
        return res.status(400).json({ error: '请输入感悟内容' });
    }
    
    const data = loadData();
    if (!data[member]) {
        return res.status(404).json({ error: '成员不存在' });
    }
    
    data[member].thoughts.unshift({
        date: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        content: content.trim()
    });
    
    saveData(data);
    res.json({ success: true, data: data[member] });
});

// 更新成员信息（院校、专业、科目）
app.post('/api/config/:member', (req, res) => {
    const { member } = req.params;
    const { school, major, subjects } = req.body;
    
    const data = loadData();
    if (!data[member]) {
        return res.status(404).json({ error: '成员不存在' });
    }
    
    if (school) data[member].school = school;
    if (major) data[member].major = major;
    if (subjects && Array.isArray(subjects)) {
        data[member].subjects = subjects;
        // 重新生成进度对象
        const newProgress = {};
        subjects.forEach((_, idx) => {
            newProgress[`p${idx + 1}`] = data[member].progress[`p${idx + 1}`] || 0;
        });
        data[member].progress = newProgress;
    }
    
    saveData(data);
    res.json({ success: true, data: data[member] });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Timezone: ${process.env.TZ || 'system default'}`);
});