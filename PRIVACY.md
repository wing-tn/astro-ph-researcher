# 隐私说明 / Privacy

## 默认本地

`astro-ph-researcher` 默认把以下数据保存在**本机**：

```text
%USERPROFILE%\.dsh\astro-ph-researcher\
  terms.json / config.json / references.json / projects.json / formats/
```

这些数据不上传到本项目服务器（本项目没有服务器），也不含遥测/统计 SDK。

## 外部网络请求

只有你主动检索/下载/查询时，插件才会访问：

- 国家天文台 NADC（术语/词表）；
- OpenAlex / Crossref / NASA ADS / arXiv 等文献元数据；
- 你选择抓取的学校/期刊/设施官方页面；
- 公开目录/工具官方页面（仅在你点击链接时由浏览器打开）。

请求可能携带你的查询词、IP、User-Agent；这是任何网络请求都无法避免的。  
HTTPS 由目标站点与运行环境提供；插件不绕过证书校验。

## 不会做的事

- 不自动上传你的术语本、文献库、手稿、本机文件；
- 不运行网页/下载文件中的脚本；
- 不在后台扫描本机磁盘；
- 不内置遥测或广告；
- 不把 API key/token 写进日志或返回给 UI。

## 你可以做的

- 不填真实邮箱也能用大部分功能（邮箱只用于 OpenAlex/Crossref 礼貌池）；
- 用系统磁盘加密保护本地数据；
- 定期备份 `astro-ph-researcher` 目录；
- 不把 `provenance/raw/` 或含个人路径的日志公开。

## 联系

隐私问题：1253932197@qq.com
