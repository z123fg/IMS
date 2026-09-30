# IMS · 面试管理系统

内部使用的面试信息管理工具：一个页面里完成面试列表的浏览、筛选排序、行内编辑，以及 JD / 备面材料的富文本编辑（可嵌入图片，可导出 PDF / Word）。

- 前端：Vite + React 19 + TypeScript，TanStack Query / Router，MUI 9，Tiptap 3（mui-tiptap）
- 后端：无自建服务，浏览器直连 Supabase（Postgres + Auth + Storage，安全依赖 RLS）
- 费用：Supabase 免费版 + Cloudflare Pages 免费版 + GitHub Actions ≈ **$0/月**

## 本地开发

需要 Node 22+、pnpm、Docker Desktop。

```bash
pnpm install
pnpm supabase start          # 本地 Supabase（首次会拉取镜像），自动执行 supabase/migrations
pnpm supabase status         # 查看本地 API URL 与 anon key
cp .env.example .env.local   # 填入上一步的 URL 与 anon key
pnpm dev
```

本地已关闭公开注册，用户需通过管理接口创建（见下方「创建用户」），e2e 测试会自动创建测试账号。

常用命令：

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 开发服务器 |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm lint` | oxlint |
| `pnpm test` | 单元测试（筛选排序、文档序列化、自动保存、PDF 分页） |
| `pnpm e2e` | 端到端测试（需本地 Supabase 与 `.env.local`） |

## 部署到生产

1. **创建 Supabase 项目**（免费版），在 SQL Editor 中整段执行 `supabase/migrations/0001_init.sql`。
2. **关闭公开注册**：Authentication → Sign In / Providers → 关闭 “Allow new users to sign up”。
   否则任何人都能注册并读写全部数据。
3. **创建用户**：Authentication → Users → Add user（勾选 Auto Confirm）。
4. **部署前端到 Cloudflare Pages**：连接 GitHub 仓库，构建命令 `pnpm build`，输出目录 `dist`，
   环境变量 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（项目 Settings → API）。
   在 Supabase Authentication → URL Configuration 中把 Site URL 设为部署后的域名。
5. **配置 GitHub Actions Secrets**（仓库需为私有）：

   | Secret | 用途 |
   |---|---|
   | `SUPABASE_URL` | 保活、图片备份 |
   | `SUPABASE_ANON_KEY` | 保活 |
   | `SUPABASE_DB_URL` | 数据库备份（Connect → Session pooler 连接串） |
   | `SUPABASE_SERVICE_ROLE_KEY` | 可选：图片备份。该 key 可绕过 RLS，请谨慎保管 |

   然后在 Actions 页面手动运行一次 `Supabase keepalive` 与 `Supabase backup` 确认成功。

## 免费版的限制与应对

- **7 天无请求自动暂停**：`.github/workflows/keepalive.yml` 每 3 天调用一次 `public.ping()`。
- **没有自动备份**：`.github/workflows/backup.yml` 每周导出数据库（及可选的图片），保存为 artifact 30 天。
- 需要更可靠时升级 Supabase Pro（$25/月，永不暂停、含每日备份），代码无需改动，可删除保活 workflow。

## 设计要点

- **一张表** `interviews`，JD 与材料以 Tiptap JSON 存在 `jd` / `materials` 列；图片存私有桶 `ims-images`，
  文档里只记 `storagePath`，打开时换成 24 小时有效的签名链接。
- **团队共享**：所有登录用户可读写全部数据（RLS `to authenticated using (true)`）。
  需要收紧时按 `created_by` 修改策略即可。新增表时务必同步开启 RLS。
- **自动保存**：停止输入 1.5 秒、收起或切换文档时保存；每份文档有独立版本号（`jd_rev` / `materials_rev`），
  他人先保存时会提示冲突（重新加载 / 覆盖保存），不会静默覆盖。
- **导出**：PDF 为按行分页的高清图片式 PDF（中文不乱码，但文字不可选中）；Word 由 HTML 转换，保真度约九成。
- 筛选、排序、展开状态都在 URL 中，可直接分享链接。
