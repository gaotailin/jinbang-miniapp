// 2026 全国各省录取日程 (静态数据，后续后端接口动态更新)
// full=官方OCR核实; partial=聚合参考(填报时间为主,录取以考试院为准)
module.exports = {
  "year": 2026,
  "source": "阳光高考信息平台(教育部)+各省教育考试院(11省full) · 高考100聚合(新增省partial)",
  "updated": "2026-07-02",
  "disclaimer": "录取日程以各省教育考试院官方公告为准，本数据仅供参考。",
  "provinces": [
    {
      "province": "内蒙古",
      "complete": "full",
      "note": "动态实时填报制",
      "batches": [
        {
          "name": "本科提前批A段",
          "admit": "7月5日投档·7月10日录取结束"
        },
        {
          "name": "本科批",
          "apply": "7月15日填报投档",
          "supplement": "7月20日征集",
          "admit": "7月25日左右结束"
        },
        {
          "name": "专科提前批",
          "apply": "8月2日起填报"
        }
      ]
    },
    {
      "province": "吉林",
      "complete": "full",
      "batches": [
        {
          "name": "提前批A段(普通/艺术)",
          "admit": "7月8-10日投档录取",
          "supplement": "7月11-12日征集"
        },
        {
          "name": "提前批B段(高水平运动队)",
          "admit": "7月13日投档录取"
        },
        {
          "name": "本科批",
          "admit": "7月15-19日投档录取",
          "supplement": "7月20-24日征集"
        },
        {
          "name": "专科批",
          "admit": "7月29-30日投档录取",
          "supplement": "7月31日-8月2日征集"
        }
      ]
    },
    {
      "province": "上海",
      "complete": "full",
      "score_release": "6月23日(含各类控制分数线)",
      "batches": [
        {
          "name": "本科提前批/艺体类批",
          "apply": "7月1-2日",
          "admit": "7月9-16日"
        },
        {
          "name": "本科普通批",
          "apply": "7月1-2日",
          "admit": "7月19-29日",
          "supplement": "征求志愿7月24日、7月27日"
        },
        {
          "name": "专科艺体/提前批",
          "apply": "7月30日",
          "admit": "7月31日-8月1日"
        },
        {
          "name": "专科普通批",
          "apply": "7月30日",
          "admit": "8月1-5日",
          "supplement": "征求志愿8月4日"
        }
      ]
    },
    {
      "province": "浙江",
      "complete": "full",
      "note": "分段录取制(一段/二段/三段)",
      "score_release": "6月26日左右(含一分一段表)",
      "batches": [
        {
          "name": "第一段平行志愿",
          "apply": "6月29-30日填报"
        },
        {
          "name": "提前录取(强基/三位一体等)",
          "admit": "7月5-9日陆续录取"
        }
      ]
    },
    {
      "province": "安徽",
      "complete": "full",
      "batches": [
        {
          "name": "本科提前批",
          "admit": "7月12-16日(含征集)"
        },
        {
          "name": "国家/地方专项",
          "admit": "7月17-19日"
        },
        {
          "name": "普通本科批",
          "admit": "7月25-30日",
          "supplement": "8月1-2日征集"
        },
        {
          "name": "高职(专科)提前批",
          "admit": "7月20日",
          "supplement": "7月22-23日征集"
        },
        {
          "name": "高职(专科)批",
          "admit": "8月7-10日",
          "supplement": "8月12-14日征集"
        }
      ]
    },
    {
      "province": "江西",
      "complete": "full",
      "note": "集中录取7月8日-8月11日",
      "batches": [
        {
          "name": "提前本科批次",
          "admit": "7月8-15日"
        },
        {
          "name": "本科批次",
          "admit": "7月16-27日"
        },
        {
          "name": "提前高职(专科)批次",
          "admit": "7月29日-8月1日"
        },
        {
          "name": "高职(专科)批次",
          "admit": "8月2-11日"
        }
      ]
    },
    {
      "province": "山东",
      "complete": "full",
      "note": "夏季/春季高考并行",
      "score_release": "6月25日",
      "batches": [
        {
          "name": "常规批本科第1次志愿",
          "apply": "7月5-7日填报"
        },
        {
          "name": "常规批专科",
          "apply": "7月24-26日填报",
          "admit": "8月2日录取结束"
        }
      ]
    },
    {
      "province": "河南",
      "complete": "full",
      "batches": [
        {
          "name": "普通本科提前批",
          "apply": "6月26-28日",
          "admit": "7月11日",
          "supplement": "7月13日"
        },
        {
          "name": "普通本科批",
          "apply": "6月30日-7月3日",
          "admit": "7月21-25日",
          "supplement": "7月26日"
        },
        {
          "name": "普通高职(专科)提前批",
          "apply": "7月5日起",
          "admit": "8月1-2日",
          "supplement": "8月3日"
        },
        {
          "name": "普通高职(专科)批",
          "apply": "7月7日起",
          "admit": "8月5-7日"
        }
      ]
    },
    {
      "province": "湖北",
      "complete": "full",
      "score_release": "6月25日",
      "note": "征集志愿共6次，7月16日-8月20日分批，每次仅开放一天(8:00-17:00)",
      "batches": [
        {
          "name": "第1次集中填报(本科提前批等)",
          "apply": "6月29日8:00-7月2日17:00(本科提前批截止6月30日17:00)"
        },
        {
          "name": "第2次集中填报",
          "apply": "8月6日8:00-8月9日17:00"
        },
        {
          "name": "本科提前批",
          "admit": "7月14日起可查投档录取状态"
        }
      ]
    },
    {
      "province": "广西",
      "complete": "full",
      "note": "预计投档时间",
      "batches": [
        {
          "name": "空军招飞",
          "admit": "7月4日投档"
        },
        {
          "name": "本科提前批艺术类",
          "admit": "7月5日投档"
        },
        {
          "name": "本科提前批体育类",
          "admit": "7月8日投档"
        },
        {
          "name": "本科提前批其他各类",
          "admit": "7月9-11日投档"
        }
      ]
    },
    {
      "province": "贵州",
      "complete": "full",
      "note": "为拟完成录取时间",
      "batches": [
        {
          "name": "志愿填报",
          "apply": "6月28日00:00-7月2日18:00"
        },
        {
          "name": "本科提前批(A/B/C段)",
          "admit": "7月21日完成录取"
        },
        {
          "name": "本科批",
          "admit": "7月28日完成录取"
        },
        {
          "name": "高职(专科)提前批",
          "admit": "8月7日完成录取"
        },
        {
          "name": "高职(专科)批",
          "admit": "8月15日完成录取"
        }
      ]
    },
    {
      "province": "四川",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月28日/7月1日填报"
        },
        {
          "name": "专科批",
          "apply": "7月5日填报"
        }
      ]
    },
    {
      "province": "北京",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月27日-7月1日填报"
        },
        {
          "name": "专科批",
          "apply": "7月24-25日填报"
        }
      ]
    },
    {
      "province": "宁夏",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月25日-7月1日填报"
        },
        {
          "name": "专科批",
          "apply": "8月1-5日填报"
        }
      ]
    },
    {
      "province": "海南",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月27日/7月2-5日填报"
        },
        {
          "name": "专科批",
          "apply": "7月30日-8月1日填报"
        }
      ]
    },
    {
      "province": "湖南",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月26-27日/6月29日-7月1日填报"
        },
        {
          "name": "专科批",
          "apply": "8月4-6日填报"
        }
      ]
    },
    {
      "province": "重庆",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月27-30日填报"
        }
      ]
    },
    {
      "province": "陕西",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月25-30日填报"
        }
      ]
    },
    {
      "province": "江苏",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月28日-7月2日填报"
        },
        {
          "name": "专科批",
          "apply": "7月27-28日填报"
        }
      ]
    },
    {
      "province": "天津",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月25-29日填报"
        },
        {
          "name": "专科批",
          "apply": "7月26-28日填报"
        }
      ]
    },
    {
      "province": "新疆",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月25日-7月1日填报"
        }
      ]
    },
    {
      "province": "辽宁",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月30日16:00截止填报"
        }
      ]
    },
    {
      "province": "广东",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月28日-7月4日填报"
        }
      ]
    },
    {
      "province": "云南",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月28日-7月2日填报"
        }
      ]
    },
    {
      "province": "甘肃",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月26日-7月1日填报"
        },
        {
          "name": "专科批",
          "apply": "8月1-4日填报"
        }
      ]
    },
    {
      "province": "山西",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月27日起填报"
        }
      ]
    },
    {
      "province": "黑龙江",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月27日-7月5日填报"
        }
      ]
    },
    {
      "province": "青海",
      "complete": "partial",
      "note": "填报时间参考·高考100聚合，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月26-30日填报"
        }
      ]
    },
    {
      "province": "河北",
      "complete": "partial",
      "note": "填报时间参考·聚合/本地宝，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科批",
          "apply": "6月27日-7月1日填报"
        },
        {
          "name": "专科批",
          "apply": "7月24-25日填报"
        }
      ]
    },
    {
      "province": "福建",
      "complete": "partial",
      "note": "填报时间参考·聚合/本地宝，录取时间以省考试院官方公告为准",
      "batches": [
        {
          "name": "本科提前批",
          "apply": "6月30日-7月2日填报"
        },
        {
          "name": "本科批",
          "apply": "7月3-6日填报"
        },
        {
          "name": "专科批",
          "apply": "7月27-29日填报"
        }
      ]
    }
  ]
}
