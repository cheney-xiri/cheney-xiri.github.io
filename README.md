# Cheney · 个人网页

东方写意水墨风格的个人网站，包含关于我、技艺、志趣、作品、文存、行旅、足迹与互动等章节，适配电脑和手机屏幕。

## 在线预览

**https://cheney-xiri.github.io/**

GitHub Pages 免费托管页面，GitHub API 负责内容权限与保存。留言提交、私信仍暂未开放，不会把输入伪装成已成功提交。

## 在线内容管理

入口：**https://cheney-xiri.github.io/admin/**。

可管理文存、句笺、作品、书架、歌单、个性小档、行旅和观影手记，支持封面上传、历史版本和备份。手机和电脑均可使用。

首次连接，在 GitHub 创建 Fine-grained personal access token，Resource owner 选择 `cheney-xiri`，只选择 `cheney-xiri.github.io` 仓库，Repository permissions → Contents 设为 **Read and write**。直接在后台填写一次性连接凭据，并由站主本人设置至少 12 个字符的解锁密码。不要发到聊天、写进代码或提交到仓库。

以后在这台设备上只输入解锁密码。密码在本机通过 Web Crypto PBKDF2（SHA-256，600,000 次）派生密钥，再以 AES-GCM 加密连接凭据。密码、密钥和明文凭据不保存到浏览器存储、不上传到仓库；本机只保存加密记录。解锁后的凭据仅在页面内存中使用，通过 GitHub 官方 API 校验站主身份与发布权限。

在“密码与设备”下载加密登录备份，再在手机或新设备导入并输入原密码即可使用。清除浏览器数据会删除本机连接；修改密码只改变本机记录，不会自动更改其他设备或旧备份。遗失密码时需要用 GitHub 重新连接，网站不提供密码找回。

草稿仅存当前设备；点击“发布到网站”才把内容写入 `data/online-content.json`，随后 GitHub Actions 自动构建网站。发布记录公开，不能上传私信、密码或未公开小说正文。GitHub Pages 不运行本地 Node.js/SQLite 服务。

## 项目目录

| 目录 | 内容 |
| --- | --- |
| `index.html` | 个人主页 |
| `about/`、`craft/`、`pastimes/` | 个性小档、技艺和志趣 |
| `works/`、`writing/` | 作品介绍、文存与句笺 |
| `journey/`、`travels/`、`figures/` | 行旅、足迹和人物 |
| `assets/` | 图片、字体、样式、脚本和电子棋谱 |
| `data/` | 页面内容与构建数据 |
| `admin/`、`server/`、`server.js` | 在线后台与本地服务源码 |
| `scripts/` | 页面生成和发布脚本 |
| `.github/workflows/pages.yml` | 免费预览站的自动构建和发布配置 |

## 本地运行

安装 Node.js 24 或更新版本后，在项目目录运行：

```sh
npm start
```

打开终端提示的网址。管理入口为 `/admin/`，首次使用在本机设置站主密码。运行数据保存在 `.site-data/`，不会提交到 GitHub。

## 生成静态预览

```sh
npm run build
```

输出到 `dist/`。上传源代码到 `main` 分支后，GitHub Actions 自动构建并更新预览页。

## 内容与隐私

仓库不包含管理员密码、登录会话、私信、运行数据库、小说全文、聊天记录或本机配置。小说页面仅提供作品简介和已公开的人物信息。

个人作品及原创图片的权利由作者保留；第三方图片、诗文及棋谱依各自来源和授权条件使用。本仓库没有对第三方素材授予额外授权。
