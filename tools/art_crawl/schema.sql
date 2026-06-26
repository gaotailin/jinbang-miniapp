-- 艺术类数据表结构（对标掌上艺考所需的数据底座）
-- 用途：二蛋后端按此建表，爬虫产出按此入库；小程序经 /api/sql 查询。
-- 2026-06-21 由小可(Claude)设计。来源只用官方公开源（省考试院/阳光高考），不碰竞品库。

-- 1) 综合分折算规则（已由前端 utils/artRules.js 完成 31 省美术，可迁来）
CREATE TABLE IF NOT EXISTS art_comp_rule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  province VARCHAR(20), year INT, category VARCHAR(30),   -- 美术与设计/音乐/舞蹈/表演/书法/播音
  formula_name VARCHAR(40),                                -- 如"文化60%+专业40%"；河南/云南多条
  a DECIMAL(8,5), b DECIMAL(8,5),                          -- 综合分 = a×文化 + b×专业
  scale_note VARCHAR(60),                                  -- 满分口径(750/100/500/435…)
  source VARCHAR(120), verified TINYINT DEFAULT 0
);

-- 2) 控制线（关键：区分"合格线"与"录取控制线"，二者不同！）
CREATE TABLE IF NOT EXISTS art_score_line (
  id INT PRIMARY KEY AUTO_INCREMENT,
  province VARCHAR(20), year INT, category VARCHAR(30), level VARCHAR(10), -- 本科/专科
  line_type VARCHAR(20),         -- 'qualify'统考合格线 / 'admit_culture'文化控制线 / 'admit_major'统考控制线
  score DECIMAL(6,1),
  source VARCHAR(120)
);

-- 3) 综合分一分一段（投档分分段，6月录取季发布）→ 做录取概率/位次
CREATE TABLE IF NOT EXISTS art_section (
  id INT PRIMARY KEY AUTO_INCREMENT,
  province VARCHAR(20), year INT, category VARCHAR(30),
  comp_score DECIMAL(6,1), seg_count INT, cumulative INT,
  source VARCHAR(120)
);

-- 4) 招生计划（院校×专业×计划数）→ 做查校/查专业。national 体量最大。
CREATE TABLE IF NOT EXISTS art_enroll_plan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  province VARCHAR(20), year INT, batch VARCHAR(30),
  school VARCHAR(80), major VARCHAR(120), category VARCHAR(30),
  plan_count INT, tuition INT, duration VARCHAR(10), remarks VARCHAR(200),
  source VARCHAR(120)
);

-- 5) 历年投档/录取线（院校×专业 最低综合分/位次）→ 做录取概率
CREATE TABLE IF NOT EXISTS art_admission (
  id INT PRIMARY KEY AUTO_INCREMENT,
  province VARCHAR(20), year INT, school VARCHAR(80), major VARCHAR(120),
  category VARCHAR(30), min_comp_score DECIMAL(6,1), min_rank INT,
  source VARCHAR(120)
);

-- 6) 艺术院校库（基础信息）→ 查校
CREATE TABLE IF NOT EXISTS art_school (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school VARCHAR(80), province VARCHAR(20), city VARCHAR(40),
  level VARCHAR(40), type VARCHAR(40), is_art_college TINYINT,
  intro TEXT, website VARCHAR(120)
);

-- 校考(art_school_exam) 暂缓：几百院校官网分散，远期。
