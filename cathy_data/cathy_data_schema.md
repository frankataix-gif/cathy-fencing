# Cathy 击剑数据结构 / Fencing Data Schema

本文件定义 `fencing_tournament_helper.html` 中「击剑数据」tab 的分类和输入字段。

## 数据来源

- `cathy_data/cathy_training_data.json` — 用户从网页导出的结构化数据（不上传 GitHub）
- 网页本地 `localStorage['cathy_training_data']` — 运行时数据

## 分类与字段

### 1. 比赛成绩 / competition
记录 Cathy 参加的每一场比赛。

| 字段 | 类型 | 说明 |
|---|---|---|
| date | date | 比赛日期 |
| name | text | 赛事名称 |
| circuit | select | SYC / RYC / RJCC / ROC / NAC / Local |
| weapon | select | Foil / Epee / Saber |
| age_group | select | Y10 / Y12 / Y14 / CDT / JNR |
| rank | number | 名次 |
| total | number | 总参赛人数 |
| notes | text | 备注 |

### 2. 体能训练 / physical
力量、敏捷、耐力等训练记录。

| 字段 | 类型 | 说明 |
|---|---|---|
| date | date | 训练日期 |
| type | select | 力量 / 敏捷 / 耐力 / 速度 / 爆发 / 核心 |
| duration | number | 训练时长（分钟） |
| intensity | number | 强度 1-10 |
| exercises | text | 具体训练项目 |
| rest_hr | number | 静息心率 |
| fatigue | number | 疲劳感 1-10 |
| notes | text | 备注 |

### 3. 拉伸恢复 / stretching
训练前后的拉伸、睡前拉伸、受伤后恢复。

| 字段 | 类型 | 说明 |
|---|---|---|
| date | date | 日期 |
| type | select | 训练前 / 训练后 / 睡前 / 晨起 / 受伤后 |
| duration | number | 时长（分钟） |
| areas | text | 拉伸部位 |
| flexibility | number | 柔韧评分 1-10 |
| notes | text | 备注 |

### 4. 检查报告 / medical
体检、物理治疗、血检、X光、疫苗、牙科等。

| 字段 | 类型 | 说明 |
|---|---|---|
| date | date | 检查日期 |
| type | select | 体检 / 物理治疗 / 血检 / X光 / 疫苗 / 牙科 |
| result | text | 结果摘要 |
| action | text | 后续行动 |
| notes | text | 备注 |

### 5. 技术训练 / technical
剑馆技术训练：步伐、进攻、防守、反击等。

| 字段 | 类型 | 说明 |
|---|---|---|
| date | date | 训练日期 |
| drill | text | 训练项目 |
| focus | select | 步伐 / 进攻 / 防守 / 反击 / 距离 / 节奏 / 心理 |
| coach | text | 教练 |
| rating | number | 完成度 1-10 |
| notes | text | 备注 |

### 6. 心理状态 / mental
情绪、压力、专注度、睡眠。

| 字段 | 类型 | 说明 |
|---|---|---|
| date | date | 日期 |
| mood | number | 情绪 1-10 |
| stress | number | 压力 1-10 |
| focus | number | 专注度 1-10 |
| sleep | number | 睡眠小时 |
| notes | text | 备注 |

### 7. 饮食睡眠 / nutrition
饮食、水分、补剂、睡眠。

| 字段 | 类型 | 说明 |
|---|---|---|
| date | date | 日期 |
| meals | number | 正餐数 |
| protein | number | 蛋白质（g） |
| water | number | 饮水（L） |
| supplements | text | 补剂 |
| sleep | number | 睡眠小时 |
| notes | text | 备注 |

### 8. 装备维护 / equipment
花剑、手套、面罩、击剑服、鞋、线等维护记录。

| 字段 | 类型 | 说明 |
|---|---|---|
| date | date | 日期 |
| item | select | 花剑 / 手套 / 面罩 / 击剑服 / 鞋 / 线 / 身体线 |
| action | select | 检查 / 清洁 / 更换 / 维修 / 购买 |
| condition | number | 状态 1-10 |
| notes | text | 备注 |

## AI 使用建议

基于这些数据，CathyAI 可以：
- 发现训练负荷过高，提醒休息
- 根据比赛成绩波动，调整技术训练重点
- 根据拉伸和体能记录，给出当周训练计划
- 根据心理状态和睡眠，提醒减压或增加睡眠
- 根据装备状态，提醒维护或更换
