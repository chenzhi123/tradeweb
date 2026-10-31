import { sectorColor } from "@/lib/palette";

export type Leader = {
  ticker: string;
  name: string;
  nameEn: string;
  industry: string;
  why: string;
};

export type SectorLeaders = {
  id: string;
  sector: string;
  label: string;
  color: string;
  summary: string;
  leaders: Leader[];
};

/**
 * 研究框架还没定。用户之后会给出具体结构，再按同一套问题写到每家公司下面。
 * 现在只保留板块位置，不提前编一套框架。
 */
export const researchFramework = {
  ready: false as const,
  title: "研究框架还空着",
};

export const SECTOR_LEADERS: SectorLeaders[] = [
  {
    id: "energy",
    sector: "Energy",
    label: "能源",
    color: sectorColor("Energy"),
    summary: "油、气和它们的炼化。利润跟着能源价格和资本开支走。",
    leaders: [
      { ticker: "XOM", name: "埃克森美孚", nameEn: "Exxon Mobil", industry: "综合油气", why: "从上游开采做到炼化和销售，是能源板块里体量最大的公司之一。" },
      { ticker: "CVX", name: "雪佛龙", nameEn: "Chevron", industry: "综合油气", why: "另一家综合油气公司，勘探、生产和下游都有。" },
      { ticker: "COP", name: "康菲石油", nameEn: "ConocoPhillips", industry: "油气勘探与生产", why: "偏上游。油价一动，利润比炼化公司更直接。" },
    ],
  },
  {
    id: "materials",
    sector: "Materials",
    label: "原材料",
    color: sectorColor("Materials"),
    summary: "化工、气体、金属和建材。需求端常常是工厂和基建。",
    leaders: [
      { ticker: "LIN", name: "林德", nameEn: "Linde", industry: "工业气体", why: "给工厂和医院供氧、氮、氢。管道接上之后，客户不容易换。" },
      { ticker: "SHW", name: "宣伟", nameEn: "Sherwin-Williams", industry: "特种化学品", why: "涂料龙头。新建和翻修都要经过它。" },
      { ticker: "FCX", name: "自由港", nameEn: "Freeport-McMoRan", industry: "铜", why: "大型铜矿商。电网和电气化会把铜的需求端亮出来。" },
    ],
  },
  {
    id: "industrials",
    sector: "Industrials",
    label: "工业",
    color: sectorColor("Industrials"),
    summary: "机械、运输和航空制造。订单周期比日常消费更长。",
    leaders: [
      { ticker: "GE", name: "通用电气航空航天", nameEn: "GE Aerospace", industry: "航空航天与国防", why: "航空发动机，商用和军用飞机都在用。" },
      { ticker: "CAT", name: "卡特彼勒", nameEn: "Caterpillar", industry: "工程机械", why: "矿山和基建的典型机械公司，景气好的时候设备先动。" },
      { ticker: "UNP", name: "联合太平洋", nameEn: "Union Pacific", industry: "铁路运输", why: "美国西部铁路，运煤、农产品和工业品。" },
    ],
  },
  {
    id: "discretionary",
    sector: "Consumer Discretionary",
    label: "可选消费",
    color: sectorColor("Consumer Discretionary"),
    summary: "可买可不买的消费：零售、汽车、家居。景气差时通常先收缩。",
    leaders: [
      { ticker: "AMZN", name: "亚马逊", nameEn: "Amazon", industry: "综合零售", why: "电商是主业之一。行业分类在可选消费，不在信息技术，尽管它还有云。" },
      { ticker: "TSLA", name: "特斯拉", nameEn: "Tesla", industry: "汽车制造", why: "汽车制造商。电动车把它送进了这个板块的权重前排。" },
      { ticker: "HD", name: "家得宝", nameEn: "Home Depot", industry: "家居装修零售", why: "房子卖得动、修得勤，装修零售就有生意。" },
    ],
  },
  {
    id: "staples",
    sector: "Consumer Staples",
    label: "日常消费",
    color: sectorColor("Consumer Staples"),
    summary: "吃的、用的、天天要买的。波动通常比可选消费小。",
    leaders: [
      { ticker: "WMT", name: "沃尔玛", nameEn: "Walmart", industry: "必需消费品零售", why: "食品和日用品的零售标尺，覆盖面最广的那一类。" },
      { ticker: "COST", name: "开市客", nameEn: "Costco", industry: "必需消费品零售", why: "会员制仓储超市，客单价高，周转快。" },
      { ticker: "PG", name: "宝洁", nameEn: "Procter & Gamble", industry: "个人护理", why: "洗护和家庭用品的品牌组合，需求比汽车稳。" },
    ],
  },
  {
    id: "health",
    sector: "Health Care",
    label: "医疗保健",
    color: sectorColor("Health Care"),
    summary: "药、器械、保险式医疗服务。审批和定价政策会改写利润。",
    leaders: [
      { ticker: "LLY", name: "礼来", nameEn: "Eli Lilly", industry: "制药", why: "减重和代谢药物把这家公司推到了医疗板块市值的前面。" },
      { ticker: "UNH", name: "联合健康", nameEn: "UnitedHealth", industry: "管理式医疗", why: "一边做医疗保险，一边做医疗服务网络。" },
      { ticker: "JNJ", name: "强生", nameEn: "Johnson & Johnson", industry: "制药与器械", why: "药品和医疗器械都有，是这个板块里年头很长的蓝筹。" },
    ],
  },
  {
    id: "financials",
    sector: "Financials",
    label: "金融",
    color: sectorColor("Financials"),
    summary: "银行、保险、支付和资管。利率和信用成本是共同的背景。",
    leaders: [
      { ticker: "JPM", name: "摩根大通", nameEn: "JPMorgan Chase", industry: "多元化银行", why: "存贷、投行和交易都做，是美国综合银行的代表。" },
      { ticker: "BRK-B", name: "伯克希尔", nameEn: "Berkshire Hathaway", industry: "多元持股", why: "保险浮存金加上一大篮子公司，B 股是常见的交易代码。" },
      { ticker: "V", name: "维萨", nameEn: "Visa", industry: "支付网络", why: "自己不放贷，靠刷卡的笔数和金额抽成。" },
    ],
  },
  {
    id: "tech",
    sector: "Information Technology",
    label: "信息技术",
    color: sectorColor("Information Technology"),
    summary: "软件、半导体和硬件。现在美股大盘的权重，很大一块在这里。",
    leaders: [
      { ticker: "NVDA", name: "英伟达", nameEn: "NVIDIA", industry: "半导体", why: "数据中心 GPU 是信息技术板块里最大的权重之一。" },
      { ticker: "AAPL", name: "苹果", nameEn: "Apple", industry: "科技硬件", why: "手机、电脑和上面的软件服务绑在同一套设备里。" },
      { ticker: "MSFT", name: "微软", nameEn: "Microsoft", industry: "系统软件", why: "办公软件、云和企业系统，公司开支里很难绕开。" },
    ],
  },
  {
    id: "communication",
    sector: "Communication Services",
    label: "通信服务",
    color: sectorColor("Communication Services"),
    summary: "搜索、社交、流媒体和电信。广告和订阅是两条主要的收钱方式。",
    leaders: [
      { ticker: "GOOGL", name: "谷歌", nameEn: "Alphabet", industry: "互动媒体", why: "搜索和视频广告。行业分类在通信服务，不在信息技术。" },
      { ticker: "META", name: "Meta", nameEn: "Meta Platforms", industry: "互动媒体", why: "社交平台，广告是主要收入。" },
      { ticker: "NFLX", name: "奈飞", nameEn: "Netflix", industry: "影视娱乐", why: "订阅制影视，通信服务里的娱乐公司。" },
    ],
  },
  {
    id: "utilities",
    sector: "Utilities",
    label: "公用事业",
    color: sectorColor("Utilities"),
    summary: "电、气、水。需求稳，但电价、利率和监管决定回报。",
    leaders: [
      { ticker: "NEE", name: "新纪元能源", nameEn: "NextEra Energy", industry: "综合公用事业", why: "大型电力公司，发电里可再生能源占比高。" },
      { ticker: "SO", name: "南方公司", nameEn: "Southern Company", industry: "电力", why: "美国东南部的受监管电力公司。" },
      { ticker: "DUK", name: "杜克能源", nameEn: "Duke Energy", industry: "电力", why: "另一家覆盖多个州的大型电力公用事业。" },
    ],
  },
  {
    id: "realestate",
    sector: "Real Estate",
    label: "房地产",
    color: sectorColor("Real Estate"),
    summary: "上市的主要是 REITs：收租，再把大部分应税收入分配出去。",
    leaders: [
      { ticker: "PLD", name: "安博", nameEn: "Prologis", industry: "工业地产", why: "物流仓库，租给电商和制造商。" },
      { ticker: "AMT", name: "美国电塔", nameEn: "American Tower", industry: "通信铁塔", why: "把铁塔租给运营商，合同通常是多年的。" },
      { ticker: "EQIX", name: "Equinix", nameEn: "Equinix", industry: "数据中心", why: "把机柜和网络互联租给云厂商和金融机构。" },
    ],
  },
];
