# 考研打卡系统

三人考研打卡系统 - 希贤、刘神、黄sir

## 在线访问
https://kaoyan-tracker-production.up.railway.app

## 本地运行

```bash
npm install
npm start
```

访问 http://localhost:3000

## 功能

- ✅ 三人打卡（希贤、刘神、黄sir）
- ✅ 考研倒计时
- ✅ 学习时长统计
- ✅ 专业课进度追踪
- ✅ 打卡历史记录

## API

- `GET /api/data` - 获取数据
- `POST /api/checkin/:id` - 打卡
- `POST /api/progress/:id` - 更新进度

## 部署

已部署到 Railway，推送代码后自动更新。
