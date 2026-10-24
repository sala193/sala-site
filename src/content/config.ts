import { defineCollection, z } from 'astro:content';

// 社區資料庫 —— 開箱文格式,每個社區一個永久頁面
const communities = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    community_name: z.string(),
    region: z.string(),
    developer: z.string().optional(),
    year_built: z.number().optional(),
    address: z.string().optional(),
    units: z.number().optional(),
    floors: z.number().optional(),
    parking_type: z.string().optional(),
    public_ratio: z.string().optional(),
    management_fee: z.string().optional(),
    nearby_mrt: z.string().optional(),
    author: z.string().default('蔡莎拉'),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    cover_image: z.string().optional(),
  }),
});

// 不動產知識 / 莎拉說房市 —— 問題型文章、地域知識文章
const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    region: z.string().optional(),
    category: z.enum(['買房', '賣房', '稅費', '法律', '土地廠房', '新聞時事']).default('買房'),
    author: z.string().default('蔡莎拉'),
    date: z.date(),
    tags: z.array(z.string()).default([]),
  }),
});

// 鳳鳴預售屋 —— 預售新案資訊（建商與代銷賣的案子，不是莎拉受託銷售的物件）。每一格都來自公開平台，來源與查詢日期寫在 source。
const presales = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    project_name: z.string(),
    region: z.string().default('鳳鳴重劃區'),
    sale_status: z.string(), // 例：預售屋・銷售中、預推案・尚未開賣
    developer: z.string().optional(), // 投資建設
    builder: z.string().optional(), // 營造
    architect: z.string().optional(), // 建築師
    planner: z.string().optional(), // 企劃銷售（代銷）
    address: z.string().optional(),
    price_per_ping: z.string().default('價格待定'),
    total_price: z.string().default('價格待定'),
    area_range: z.string().optional(),
    room_types: z.string().optional(),
    units: z.string().optional(),
    floors: z.string().optional(),
    parking: z.string().optional(),
    public_ratio: z.string().optional(),
    base_area: z.string().optional(),
    delivery: z.string().optional(),
    orientation: z.string().optional(),
    reception: z.string().optional(), // 接待會館
    transit: z.string().optional(), // 卡片上的交通一行
    tags: z.array(z.string()).default([]),
    facilities: z.array(z.string()).default([]),
    source: z.string(),
    date: z.date(),
    order: z.number().default(0),
  }),
});

export const collections = { communities, articles, presales };
