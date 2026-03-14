-- 创建 members 表
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- 插入初始数据
INSERT INTO members (id, data) VALUES
('xixian', '{
  "name": "希贤",
  "school": "南京大学",
  "major": "软件学院",
  "subjects": ["数据结构", "计算机组成原理", "操作系统", "计算机网络"],
  "totalDays": 0,
  "totalHours": 0,
  "todayHours": 0,
  "lastCheckIn": null,
  "checkIns": [],
  "thoughts": [],
  "progress": {"p1": 0, "p2": 0, "p3": 0, "p4": 0}
}'::jsonb),
('liushen', '{
  "name": "刘神",
  "school": "中国矿业大学",
  "major": "安全工程",
  "subjects": ["安全系统工程", "防火防爆", "职业卫生"],
  "totalDays": 0,
  "totalHours": 0,
  "todayHours": 0,
  "lastCheckIn": null,
  "checkIns": [],
  "thoughts": [],
  "progress": {"p1": 0, "p2": 0, "p3": 0}
}'::jsonb),
('huangsir', '{
  "name": "黄sir",
  "school": "南京大学",
  "major": "电气工程",
  "subjects": ["电路原理", "电机学", "电力电子"],
  "totalDays": 0,
  "totalHours": 0,
  "todayHours": 0,
  "lastCheckIn": null,
  "checkIns": [],
  "thoughts": [],
  "progress": {"p1": 0, "p2": 0, "p3": 0}
}'::jsonb);