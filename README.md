# 考研打卡系统 v2.0

三人考研打卡系统 - 希贤、刘神、黄sir

## 在线访问
https://kaoyan-tracker-production.up.railway.app

## 本地运行

```bash
npm install
npm start
```

访问 http://localhost:8080

## 功能

- ✅ 三人打卡（希贤、刘神、黄sir）
- ✅ 考研倒计时
- ✅ 学习时长统计（总时长、今日时长、打卡天数）
- ✅ 专业课进度追踪（带滑动条）
- ✅ 打卡历史记录
- ✅ 数据实时同步

## API 接口

- `GET /api/data` - 获取所有数据
- `POST /api/checkin/:id` - 打卡（参数: hours, content）
- `POST /api/progress/:id` - 更新进度（参数: subject, value）
- `GET /health` - 健康检查

## 部署到 Railway

1. 代码已推送到 GitHub
2. Railway 会自动部署 main 分支的更新
3. 数据保存在服务器文件系统中

## v2.0 更新

- 修复了 cors 依赖问题
- 优化了前端界面
- 改进了数据结构
- 添加了更好的错误处理
