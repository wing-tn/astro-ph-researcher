# 观测设备/数据/分析工作流数据核验报告（instruments.seed.json）

- 核验日期：2026-10-22（Asia/Shanghai）
- 数据文件：`data/instruments.seed.json`（30 个设施，UTF-8，`python3 -m json.tool` 通过）
- 核验环境：WSL2（6.18.33.2-microsoft-standard-WSL2）+ `curl 8.5.0` + `python3 3.12.3`；全部实测在本机 WSL 内完成
- 记录原则：只记录 HTTP 状态、最终 URL 与页面要点，不转载数据政策正文；无法直连的项标 `verified=false` 并写明原因，不编造 URL、数据政策或开放状态。

## 0. 结论速览

| 维度 | 计数 | 明细 |
| --- | --- | --- |
| 设施总数 | 30 | 太空望远镜/卫星 14，地面望远镜 12，中微子 2，引力波 2 |
| 状态 | 运行中 18，已结束 1，调试/升级 2，在建 3，规划 4，提案 2 | 按官方公开进度判定，见 §0.2 |
| 数据政策 | 开放 22，专有期 4，受限 4 | open 不代表无专有期，见 §4 |
| URL 核验 | 84 个唯一 URL：200×76、000×5、503×2、502×1 | verified=true 25 个，false 5 个 |

### 0.1 状态分布

| status | 数量 | 设施 |
| --- | --- | --- |
| running（运行中） | 18 | Chandra X-ray Observatory、Fermi Large Area Telescope、Fermi Gamma-ray Burst Monitor、Neil Gehrels Swift Observatory、XMM-Newton、Nuclear Spectroscopic Telescope Array、James Webb Space Telescope、Hubble Space Telescope、Transiting Exoplanet Survey Satellite、Atacama Large Millimeter/submillimeter Array、Karl G. Jansky Very Large Array、IceCube Neutrino Observatory、High Energy Stereoscopic System、Pierre Auger Observatory、SRG / eROSITA、Five-hundred-meter Aperture Spherical radio Telescope、Large High Altitude Air Shower Observatory、Imaging X-ray Polarimetry Explorer |
| commissioning（调试/升级） | 2 | LIGO-Virgo-KAGRA、Vera C. Rubin Observatory / LSST |
| under_construction（在建） | 3 | Cherenkov Telescope Array Observatory、Square Kilometre Array、Extremely Large Telescope |
| planned（规划） | 4 | Thirty Meter Telescope、next-generation Very Large Array、Advanced Telescope for High-ENergy Astrophysics、Laser Interferometer Space Antenna |
| proposed（提案） | 2 | IceCube-Gen2、enhanced X-ray Timing and Polarimetry mission |
| ended（已结束） | 1 | Gaia |

### 0.2 与任务清单分组不一致之处（按实测/公开进度修正）

| 设施 | 任务清单分组 | 本数据 status | 依据 |
| --- | --- | --- | --- |
| Gaia | 运行中 | ended | ESA 于 2025-03 结束科学任务；DR3 档案仍开放，DR4 在准备 |
| LIGO/Virgo/KAGRA | 运行中 | commissioning | O4 观测于 2025 年初结束，当前为升级/调试与 O5 准备期 |
| Rubin/LSST | 在建 | commissioning | 2025 年首光，设施建成；LSST 巡天正式开始前处于 commissioning |
| TMT | 在建 | planned | 建设因选址争议暂停，尚未开工建成 |
| ngVLA | 在建 | planned | 处于设计/规划阶段，尚未开工 |
| eROSITA/SRG | 运行中 | running | 2022 年起 eROSITA 巡天暂停，但 SRG 任务与 DR1 档案仍在，notes 已注明 |

说明：`under_construction` 只给 CTAO、SKA、ELT 三个确有土建/设备安装的项目；Athena、LISA 已立项未发射记 `planned`，IceCube-Gen2、eXTP 记 `proposed`。

## 1. 方法与状态判读

每个 URL 用下列命令实测（状态码、最终 URL、大小、Content-Type；000/5xx 自动重试一次）：

```bash
curl -4 -sS -L --max-time 30 -A "Mozilla/5.0 ... Chrome/126" \
  -o /dev/null -w "%{http_code}\t%{url_effective}\t%{size_download}\t%{content_type}" "$URL"
```

对 200 的关键页面再用 Python 抽取 `<title>` 与正文，确认不是人机验证、停机公告或空 SPA。状态解读：

- `200` + 正常标题：真实可访问；
- `200` + 公告/空壳：URL 可达但内容不可用（如 H.E.S.S. 站点临时关闭、FAST SPA 首页），在结论列注明；
- `502`：ESO 站点（含 ELT 页）返回 Bad Gateway，站点侧故障；
- `503`：SKAO 返回 109 B 的 WAF/反爬壳页，未取得内容；
- `000`：DNS 失败、TCP 超时或 TLS reset（LHAASO 官网、eROSITA DR1、ctools 文档站、datadc；GitHub Pages 托管站点另有间歇 reset）。

- **verified 判定规则**：以该设施官方数据入口与主分析链是否可取得内容为准；GitHub Pages 等第三方托管文档（GWpy、Lightkurve、SkyLLH）的间歇性 TLS reset 不翻转设施判定，但逐条记录状态与复测结果。

## 2. 逐设施记录

### 2.1 chandra — Chandra X-ray Observatory

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：NASA/CXC (Smithsonian Astrophysical Observatory)；USA；X-ray (0.1-10 keV)
- 一句话：NASA 旗舰 X 射线天文台，ACIS/HRC 成像与光栅谱，亚角秒空间分辨率。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| Chandra Data Archive (CDA)（archive） | https://cxc.harvard.edu/cda/ | 200 | OK |
| Chandra Source Catalog (CSC 2.1)（portal） | https://cxc.harvard.edu/csc/ | 200 | OK |
| HEASARC Chandra 页面（archive） | https://heasarc.gsfc.nasa.gov/docs/chandra/ | 200 | OK |
| CIAO 文档与线程（docs） | https://cxc.harvard.edu/ciao/ | 200 | OK |
| CIAO 下载（software） | https://cxc.harvard.edu/ciao/download/ | 200 | OK |
| Sherpa 拟合文档（docs） | https://cxc.harvard.edu/sherpa/ | 200 | OK |
| 软件：CIAO | https://cxc.harvard.edu/ciao/ | 200 | OK |
| 软件：Sherpa | https://cxc.harvard.edu/sherpa/ | 200 | OK |

- **结论/未验证**：CDA、CSC、HEASARC Chandra 页、CIAO 文档与下载、Sherpa 页均实测 HTTP 200（cxc.harvard.edu 首次 12 s 超时，25 s 重试通过）。
- **申请/分析建议**：档案开放；GO/ToO 新观测存在专有期，需走 CXC 提案系统。无自有数据时先用 CSC 2.1 找同目标堆栈谱，再决定是否申请 XMM/NuSTAR 联合观测。

### 2.2 fermi-lat — Fermi Large Area Telescope (Fermi-LAT)

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：NASA/DOE (FSSC)；USA；gamma-ray (20 MeV-300 GeV)
- 一句话：全天扫描伽马射线望远镜，4FGL/4FGL-DR4 星表与银河系弥散模型是标准分析基础。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| FSSC 数据访问入口（archive） | https://fermi.gsfc.nasa.gov/ssc/data/access/ | 200 | OK |
| FSSC 主页（portal） | https://fermi.gsfc.nasa.gov/ssc/ | 200 | OK |
| fermipy 文档（docs） | https://fermipy.readthedocs.io/en/latest/ | 200 | OK |
| FSSC 分析文档/教程（tutorial） | https://fermi.gsfc.nasa.gov/ssc/ | 200 | OK |
| 软件：fermipy | https://fermipy.readthedocs.io/en/latest/ | 200 | OK |
| 软件：fermitools | https://fermi.gsfc.nasa.gov/ssc/ | 200 | OK |

- **结论/未验证**：FSSC 主页、数据访问页、fermipy readthedocs 均 200。LAT 数据服务器具体下载 URL 未逐一验证，按 FSSC 页面入口使用。
- **申请/分析建议**：高银纬源先处理银河系弥散模型与 ROI 边缘源；低能段注意 PSF 与地球反照（Earth limb）筛选；分析结果必须报告 fermitools 与 IRF 版本。

### 2.3 fermi-gbm — Fermi Gamma-ray Burst Monitor (Fermi-GBM)

- 类型/状态/政策：`satellite` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：NASA/MSFC (FSSC)；USA；gamma-ray (8 keV-40 MeV)
- 一句话：Fermi 上的全天伽马暴监测仪，提供持续触发、谱与定位信息。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| GBM 数据访问（archive） | https://fermi.gsfc.nasa.gov/ssc/data/access/gbm/ | 200 | OK |
| GBM 数据分析页（portal） | https://fermi.gsfc.nasa.gov/ssc/data/analysis/gbm/ | 200 | OK |
| GBM 分析文档（docs） | https://fermi.gsfc.nasa.gov/ssc/data/analysis/gbm/ | 200 | OK |
| HEASoft 文档（docs） | https://heasarc.gsfc.nasa.gov/docs/software/heasoft/ | 200 | OK |
| 软件：HEASoft | https://heasarc.gsfc.nasa.gov/docs/software/heasoft/ | 200 | OK |
| 软件：XSPEC | https://heasarc.gsfc.nasa.gov/docs/software/xspec/ | 200 | OK |

- **结论/未验证**：GBM 数据访问、GBM 分析、HEASoft、XSPEC 页均实测 200。HEASARC W3Browse 的 GBM 路径实测 404，未采用。
- **申请/分析建议**：TTE 数据量大，先按时间窗裁剪再分析；不同入射角度的响应差异显著，定位不确定度要计入。

### 2.4 swift — Neil Gehrels Swift Observatory

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：NASA/GSFC + UKSA；USA/UK；gamma-ray/X-ray/UV-optical
- 一句话：快速指向的多波段天文台，BAT 触发、XRT 成像谱与 UVOT 光学/紫外同时观测。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| Swift 数据归档 (NASA)（archive） | https://swift.gsfc.nasa.gov/archive/ | 200 | OK |
| UKSSDC Swift 数据与工具（portal） | https://www.swift.ac.uk/ | 200 | OK |
| UKSSDC Swift Portal（portal） | https://www.swift.ac.uk/swift_portal/ | 200 | OK |
| UKSSDC 数据指南（docs） | https://www.swift.ac.uk/archive/ | 200 | OK |
| HEASoft 文档（docs） | https://heasarc.gsfc.nasa.gov/docs/software/heasoft/ | 200 | OK |
| 软件：HEASoft（Swift 任务包） | https://heasarc.gsfc.nasa.gov/docs/software/heasoft/ | 200 | OK |
| 软件：XSPEC | https://heasarc.gsfc.nasa.gov/docs/software/xspec/ | 200 | OK |

- **结论/未验证**：Swift NASA 主页/归档、UKSSDC 主页/portal/archive、HEASoft、XSPEC 均 200。
- **申请/分析建议**：ToO 响应快但 XRT 数据模式影响谱拟合；WT 模式有 pile-up 与坏列，PC 模式适合暗源。UKSSDC 的自动光变/谱可先做快速科学判断。

### 2.5 xmm-newton — XMM-Newton

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：ESA；Europe；X-ray (0.2-12 keV)
- 一句话：ESA 大型 X 射线天文台，EPIC 高有效面积成像谱、RGS 高分辨谱与 OM 光学监测。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| XMM-Newton Science Archive (XSA)（archive） | https://www.cosmos.esa.int/web/xmm-newton/xsa | 200 | OK |
| XMM-Newton 主页（portal） | https://www.cosmos.esa.int/web/xmm-newton | 200 | OK |
| SAS 文档（docs） | https://www.cosmos.esa.int/web/xmm-newton/sas | 200 | OK |
| XSA 数据检索（docs） | https://www.cosmos.esa.int/web/xmm-newton/xsa | 200 | OK |
| 软件：SAS (Science Analysis System) | https://www.cosmos.esa.int/web/xmm-newton/sas | 200 | OK |
| 软件：XSPEC | https://heasarc.gsfc.nasa.gov/docs/software/xspec/ | 200 | OK |

- **结论/未验证**：cosmos.esa.int 的 XMM 主页、XSA、SAS 页均 200；xmm.esac.esa.int 已 DNS 解析失败，改用 cosmos 入口。
- **申请/分析建议**：EPIC PN 的 pile-up 与背景耀发是主坑：先用光变筛掉高背景段，再做谱。无自有观测时用 XSA 的 3XMM/4XMM 星表快速定位。

### 2.6 nustar — Nuclear Spectroscopic Telescope Array (NuSTAR)

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：NASA/Caltech；USA；X-ray (3-79 keV)
- 一句话：聚焦硬 X 射线望远镜，填补 Chandra/XMM 与 MeV 观测之间的能段。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| HEASARC NuSTAR 数据（archive） | https://heasarc.gsfc.nasa.gov/docs/nustar/ | 200 | OK |
| NuSTAR 任务主页（portal） | https://www.nustar.caltech.edu/ | 200 | OK |
| NuSTAR 分析文档（docs） | https://heasarc.gsfc.nasa.gov/docs/nustar/analysis/ | 200 | OK |
| XSPEC 文档（docs） | https://heasarc.gsfc.nasa.gov/docs/software/xspec/ | 200 | OK |
| 软件：NuSTARDAS (HEASoft) | https://heasarc.gsfc.nasa.gov/docs/nustar/analysis/ | 200 | OK |
| 软件：XSPEC | https://heasarc.gsfc.nasa.gov/docs/software/xspec/ | 200 | OK |

- **结论/未验证**：HEASARC NuSTAR、NuSTAR 主页、分析文档、XSPEC 均 200。
- **申请/分析建议**：与 XMM/Chandra 联合时必须处理互定标差异（3-10 keV 重叠段）；亮源注意 dead time 与堆叠。

### 2.7 jwst — James Webb Space Telescope (JWST)

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `proprietary`（专有期）
- 运营/国家/波段：NASA/ESA/CSA (STScI)；USA/Europe/Canada；infrared (0.6-28.5 um)
- 一句话：6.5 米红外空间望远镜，NIRCam/NIRSpec/MIRI/NIRISS 成像、谱与时间序列。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| MAST JWST 数据（archive） | https://mast.stsci.edu/ | 200 | OK |
| JWST 文档 (JDox)（portal） | https://jwst-docs.stsci.edu/ | 200 | OK |
| JDox 数据处理文档（docs） | https://jwst-docs.stsci.edu/ | 200 | OK |
| DrizzlePac 文档（docs） | https://www.stsci.edu/scientific-community/software/drizzlepac | 200 | OK |
| 软件：JWST Science Calibration Pipeline | https://jwst-docs.stsci.edu/ | 200 | OK |
| 软件：DrizzlePac | https://www.stsci.edu/scientific-community/software/drizzlepac | 200 | OK |
| 软件：astroquery | https://astroquery.readthedocs.io/ | 200 | OK |

- **结论/未验证**：MAST、JDox、DrizzlePac、astroquery 均 200。JWST 专用 pipeline 文档 URL 未单独验证，统一指向 JDox；专有期 12 个月为通行政策，未在可访问页面逐条确认，写为约数。
- **申请/分析建议**：GO 数据有约 12 个月专有期（以 STScI 政策为准）；无自有数据时优先用 ERS/早期公开数据与 MAST 高级产品，避免重复处理。

### 2.8 hubble — Hubble Space Telescope (HST)

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `proprietary`（专有期）
- 运营/国家/波段：NASA/ESA (STScI)；USA/Europe；UV/optical/NIR
- 一句话：在轨 30 余年的空间望远镜，ACS/WFC3/COS/STIS 仍是紫外—近红外主力。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| MAST HST 数据（archive） | https://mast.stsci.edu/ | 200 | OK |
| STScI 归档（archive） | https://archive.stsci.edu/ | 200 | OK |
| HubbleSite（portal） | https://hubblesite.org/ | 200 | OK |
| DrizzlePac 文档（docs） | https://www.stsci.edu/scientific-community/software/drizzlepac | 200 | OK |
| MAST 检索（docs） | https://mast.stsci.edu/ | 200 | OK |
| 软件：DrizzlePac | https://www.stsci.edu/scientific-community/software/drizzlepac | 200 | OK |
| 软件：astroquery | https://astroquery.readthedocs.io/ | 200 | OK |

- **结论/未验证**：MAST、STScI archive、HubbleSite、DrizzlePac、astroquery 均 200。
- **申请/分析建议**：GO 数据通常 12 个月专有期；HLA 高级产品可快速做形态与测光交叉，但发表前应核对校准版本。

### 2.9 gaia — Gaia

- 类型/状态/政策：`satellite` / `ended`（已结束） / `open`（开放）
- 运营/国家/波段：ESA/DPAC；Europe；optical (astrometry, photometry, spectroscopy)
- 一句话：ESA 天体测量卫星，2025 年 3 月结束科学任务；DR3 已公开，DR4 在准备中。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| Gaia Archive (TAP/ADQL)（api） | https://gea.esac.esa.int/archive/ | 200 | OK |
| Gaia DR3 文档（portal） | https://www.cosmos.esa.int/web/gaia/dr3 | 200 | OK |
| Gaia 任务页（docs） | https://www.cosmos.esa.int/web/gaia | 200 | OK |
| astroquery 文档（docs） | https://astroquery.readthedocs.io/ | 200 | OK |
| 软件：astroquery | https://astroquery.readthedocs.io/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：Gaia Archive、DR3 页、Gaia 主页、astroquery、astropy 均 200。任务结束时间（2025-03）为 ESA 公告的通行事实，未逐页验证。
- **申请/分析建议**：任务已于 2025 年结束，不会再有新观测；DR3 仍需注意视差零点与 RUWE>1.4 的污染。DR4 发布前不要使用未公开数据。

### 2.10 tess — Transiting Exoplanet Survey Satellite (TESS)

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：NASA/MIT；USA；optical (600-1000 nm)
- 一句话：全天亮星凌星巡天，提供 2 分钟与 FFI 光变，是系外行星与变星主力数据源。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| MAST TESS 数据（archive） | https://mast.stsci.edu/ | 200 | OK |
| TESS 任务页（portal） | https://tess.gsfc.nasa.gov/ | 200 | OK |
| Lightkurve 教程（tutorial） | https://lightkurve.github.io/lightkurve/ | 200 | GitHub Pages 间歇不可达：实测 200 与 TLS reset（000）交替 |
| MAST 检索（docs） | https://mast.stsci.edu/ | 200 | OK |
| 软件：Lightkurve | https://lightkurve.github.io/lightkurve/ | 200 | GitHub Pages 间歇不可达：实测 200 与 TLS reset（000）交替 |
| 软件：astroquery | https://astroquery.readthedocs.io/ | 200 | OK |

- **结论/未验证**：MAST、tess.gsfc.nasa.gov 均 200；Lightkurve 文档（https://lightkurve.github.io/lightkurve/）为 GitHub Pages，实测 200 与 TLS reset（000）交替，属网络抖动，已记录；tess.mit.edu 本机 DNS 解析失败，改用 tess.gsfc.nasa.gov。
- **申请/分析建议**：2 分钟数据与 FFI 的孔径污染不同；先查 TESS Input Catalog 的 crowding，再做去趋势。sector 间隙与动量轮系统误差需要用 CBV 处理。

### 2.11 alma — Atacama Large Millimeter/submillimeter Array (ALMA)

- 类型/状态/政策：`ground_telescope` / `running`（运行中） / `proprietary`（专有期）
- 运营/国家/波段：ESO/NAOJ/NRAO；Chile (international)；radio/mm/submm (0.3-3.6 mm)
- 一句话：66 天线毫米波/亚毫米波干涉阵，谱线与连续谱成像主力设备。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| ALMA Science Archive (NRAO)（archive） | https://almascience.nrao.edu/alma-data/archive | 200 | OK |
| ALMA Science Archive (ESO)（archive） | https://almascience.eso.org/alma-data/archive | 200 | OK |
| ALMA 主页（portal） | https://almascience.nrao.edu/ | 200 | OK |
| CASA 文档与下载（docs） | https://casa.nrao.edu/ | 200 | OK |
| astroquery 文档（docs） | https://astroquery.readthedocs.io/ | 200 | OK |
| 软件：CASA | https://casa.nrao.edu/ | 200 | OK |
| 软件：astroquery | https://astroquery.readthedocs.io/ | 200 | OK |

- **结论/未验证**：ALMA NRAO/ESO 档案页、ALMA 主页、CASA 主页、astroquery 均 200；casa.nrao.edu/docs/ 目录页返回 403（目录禁止浏览），不影响软件主页。
- **申请/分析建议**：新观测有约 12 个月专有期（以 ALMA 政策为准）；无自有数据时用 QA2 已发布产品与 ALMA 星表，避免重复校准。注意通量定标的系统不确定度。

### 2.12 vla — Karl G. Jansky Very Large Array (VLA)

- 类型/状态/政策：`ground_telescope` / `running`（运行中） / `proprietary`（专有期）
- 运营/国家/波段：NRAO/NSF；USA；radio (0.3-50 GHz)
- 一句话：27 天线厘米波干涉阵，射电连续谱、谱线与偏振观测的标准设施。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| NRAO 数据档案（archive） | https://data.nrao.edu/portal/ | 200 | OK |
| VLA 设施页（portal） | https://science.nrao.edu/facilities/vla | 200 | OK |
| CASA 文档与下载（docs） | https://casa.nrao.edu/ | 200 | OK |
| NRAO 数据检索（docs） | https://data.nrao.edu/portal/ | 200 | OK |
| 软件：CASA | https://casa.nrao.edu/ | 200 | OK |
| 软件：astroquery | https://astroquery.readthedocs.io/ | 200 | OK |

- **结论/未验证**：NRAO 档案 portal、VLA 设施页、CASA 主页、astroquery 均 200；专有期具体月数未在可访问页面确认，故不写死。
- **申请/分析建议**：数据有专有期（期限以 NRAO 政策为准），期满进入公开档案；低频观测注意 RFI 与宽带谱指数拟合。

### 2.13 icecube — IceCube Neutrino Observatory

- 类型/状态/政策：`neutrino` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：University of Wisconsin-Madison/NSF；Antarctica/USA；neutrino (TeV-PeV)
- 一句话：南极冰下 1 km3 中微子探测器，开展天体物理中微子点源、弥散与多信使分析。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| IceCube 数据发布（archive） | https://icecube.wisc.edu/science/data-releases/ | 200 | OK |
| IceCube 主页（portal） | https://icecube.wisc.edu/ | 200 | OK |
| SkyLLH 文档（docs） | https://icecube.github.io/skyllh/ | 200 | 253 B 的 JS 跳转页（Redirecting to master branch），文档需再跳转 |
| 公开数据发布说明（tutorial） | https://icecube.wisc.edu/science/data-releases/ | 200 | OK |
| 软件：SkyLLH | https://icecube.github.io/skyllh/ | 200 | 253 B 的 JS 跳转页（Redirecting to master branch），文档需再跳转 |

- **结论/未验证**：IceCube 主页/数据发布页、SkyLLH 文档均 200；GitHub 仓库 github.com 本机 DNS 不可达，故不引用仓库地址。
- **申请/分析建议**：公开数据是发布子集，不等于全样本；不同年份 detector 配置与冰层条件不同，必须用对应 IRF。alert 数据要区分 GFU/EHE 与是否含方向重建。

### 2.14 ligo-virgo-kagra — LIGO-Virgo-KAGRA (LVK)

- 类型/状态/政策：`gravitational_wave` / `commissioning`（调试/升级） / `open`（开放）
- 运营/国家/波段：LIGO Lab/Caltech-MIT, EGO/Virgo, KAGRA；USA/Europe/Japan；gravitational waves (10 Hz-10 kHz)
- 一句话：地面引力波干涉网；O4 观测于 2025 年初结束，当前处于升级/调试与 O5 准备阶段。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| GWOSC 开放科学中心（archive） | https://gwosc.org/ | 200 | OK |
| GWOSC 数据下载（archive） | https://gwosc.org/data/ | 200 | OK |
| GWOSC 事件 API（api） | https://gwosc.org/eventapi/html/ | 200 | OK |
| GWpy 文档（docs） | https://gwpy.github.io/ | 000 | GitHub Pages 间歇不可达：实测 200 与 000 交替 |
| PyCBC 文档（docs） | https://pycbc.org/pycbc/latest/html/ | 200 | OK |
| 软件：GWpy | https://gwpy.github.io/ | 000 | GitHub Pages 间歇不可达：实测 200 与 000 交替 |
| 软件：PyCBC | https://pycbc.org/pycbc/latest/html/ | 200 | OK |

- **结论/未验证**：GWOSC 主页/data/eventapi、PyCBC 文档均 200；GWpy 文档（https://gwpy.github.io/）实测 200 与 000 交替（GitHub Pages 网络抖动），已记录；www.ligo.org 本机连接超时（000），未采用其数据政策页。O4 结束与 O5 计划时间为公开信息，未逐页验证。
- **申请/分析建议**：O4 数据已公开；O5 前用 GWTC 目录做方法验证。注意标定不确定度与 glitch veto，不要把 O4 的公开事件当完整样本。

### 2.15 hess — High Energy Stereoscopic System (H.E.S.S.)

- 类型/状态/政策：`ground_telescope` / `running`（运行中） / `restricted`（受限）
- 运营/国家/波段：H.E.S.S. Collaboration；Namibia (international)；VHE gamma (0.03-100 TeV)
- 一句话：纳米比亚地面切伦科夫望远镜阵列，开展 TeV 伽马射线成像、谱与源普查。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| H.E.S.S. 官方站（portal） | https://www.mpi-hd.mpg.de/hfm/HESS/ | 200 | 200 但 302 跳转至 hess-experiment.eu，正文为“Temporary shutdown”公告，未取得数据政策 |
| Gammapy 文档（docs） | https://gammapy.org/ | 200 | OK |
| ctools 文档（docs） | http://cta.irap.omp.eu/ctools-devel/ | 000 | 无响应（超时/TLS reset/DNS） |
| 软件：Gammapy | https://gammapy.org/ | 200 | OK |
| 软件：ctools | http://cta.irap.omp.eu/ctools-devel/ | 000 | 无响应（超时/TLS reset/DNS） |

- **结论/未验证**：https://www.mpi-hd.mpg.de/hfm/HESS/ 实测 200，但 302 跳转到 https://hess-experiment.eu/ 且正文为站点临时关闭公告（Temporary shutdown，安全措施），未能读取数据政策；ctools 文档站 cta.irap.omp.eu 连接超时（000）。
- **申请/分析建议**：H.E.S.S. 无全面公开的原始数据档案，需通过合作组申请或使用已发表 SED/星表；不得写成完全开放数据。官网 2026-10 临时关闭，建议用论文与 TeVCat 交叉。

### 2.16 auger — Pierre Auger Observatory

- 类型/状态/政策：`ground_telescope` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：Pierre Auger Collaboration；Argentina (international)；UHECR (E > 1e17 eV)
- 一句话：阿根廷 3000 km2 混合探测阵列，测量超高能宇宙线的能谱、成分与各向异性。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| Auger 公开数据（数据与表）（portal） | https://www.auger.org/science/public-data/data-and-tables | 200 | OK |
| Auger Open Data（archive） | https://opendata.auger.org/ | 200 | OK |
| Open Data 门户（docs） | https://opendata.auger.org/ | 200 | OK |
| Auger 主页（docs） | https://www.auger.org/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：auger.org 主页、公开数据页、opendata.auger.org 与 display.php 均 200。
- **申请/分析建议**：公开数据是发布子集，不能当完整样本；能量标定有系统不确定度，做跨实验比较时要统一能量尺度。

### 2.17 erosita-srg — SRG / eROSITA

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `open`（开放）
- 运营/国家/波段：MPE/DLR (eROSITA), IKI (SRG)；Germany/Russia；X-ray (0.2-8 keV)
- 一句话：SRG 上的 X 射线巡天望远镜，完成首轮全天巡天并发布 DR1；2022 年起巡天暂停，档案仍开放。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| MPE eROSITA 主页（portal） | https://www.mpe.mpg.de/eROSITA | 200 | OK |
| eROSITA-DE DR1 站点（archive） | https://erosita.mpe.mpg.de/dr1/ | 000 | 无响应（超时/TLS reset/DNS） |
| MPE eROSITA 文档入口（docs） | https://www.mpe.mpg.de/eROSITA | 200 | OK |
| astropy 文档（docs） | https://www.astropy.org/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：https://www.mpe.mpg.de/eROSITA 实测 200；https://erosita.mpe.mpg.de/dr1/ 与 erosita.mpe.mpg.de 均 TCP 连接超时（000，25 s），DR1 数据入口未验证。
- **申请/分析建议**：DR1 站点本机不可达，需从 MPE 主页找镜像/入口；巡天自 2022 年起暂停，不要声称仍在持续产出新数据。

### 2.18 fast — Five-hundred-meter Aperture Spherical radio Telescope (FAST)

- 类型/状态/政策：`ground_telescope` / `running`（运行中） / `restricted`（受限）
- 运营/国家/波段：National Astronomical Observatories, CAS (NAOC)；China；radio (70 MHz-3 GHz)
- 一句话：中国 500 米球面射电望远镜，脉冲星计时、中性氢与快速射电暴的主力设备。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| FAST 官方网站（portal） | https://fast.bao.ac.cn/ | 200 | SPA 首页（约 845 B），无静态数据政策正文 |
| CAS 平台 FAST 数据发布通告（portal） | https://lssf.cas.cn/en/facilities/sa/fast/notice/202507/t20250731_5078715.html | 200 | 标题确认：FAST Data Release 20（2025-02-01），数据按批次公开 |
| CAS FAST 用户规章（docs） | https://lssf.cas.cn/sszs/zyyj/500mkjwyj/yhgz/202503/t20250314_5050242.html | 200 | FAST 用户规章页，含《FAST 数据政策》文件链接 |
| FAST 官网（docs） | https://fast.bao.ac.cn/ | 200 | SPA 首页（约 845 B），无静态数据政策正文 |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：fast.bao.ac.cn 200（SPA 首页），CAS 平台 FAST 英文数据发布通告与用户规章页均 200；具体专有期与批次内容未逐条解读，写为按批次开放。
- **申请/分析建议**：数据不是全开放档案：观测须提案评审，数据按批次公开（见 CAS 平台通告）。不要假设 raw 数据可直接下载；使用前读用户规章，公开批次优先。

### 2.19 lhaaso — Large High Altitude Air Shower Observatory (LHAASO)

- 类型/状态/政策：`ground_telescope` / `running`（运行中） / `restricted`（受限）
- 运营/国家/波段：Institute of High Energy Physics, CAS (IHEP)；China；VHE gamma/cosmic rays (sub-TeV-PeV)
- 一句话：稻城高海拔宇宙线观测站，KM2A/WCDA/水切伦科夫探测器开展超高能伽马与宇宙线观测。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| LHAASO 官方网站（portal） | https://lhaaso.ihep.ac.cn/ | 000 | 无响应（超时/TLS reset/DNS） |
| 国家高能物理数据中心 LHAASO（archive） | https://datadc.ihep.ac.cn/resource/astro/lhaaso | 000 | 无响应（超时/TLS reset/DNS） |
| LHAASO 合作组规章 (CAS)（portal） | http://lssf.cas.cn/sszs/zyyj/ghbyzx/yhgz/202504/t20250410_5062632.html | 200 | 中文标题确认：LHAASO 合作组规章 |
| LHAASO 合作组规章（docs） | http://lssf.cas.cn/sszs/zyyj/ghbyzx/yhgz/202504/t20250410_5062632.html | 200 | 中文标题确认：LHAASO 合作组规章 |
| 国家高能物理数据中心（docs） | https://datadc.ihep.ac.cn/resource/astro/lhaaso | 000 | 无响应（超时/TLS reset/DNS） |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：lhaaso.ihep.ac.cn DNS 解析失败（getent 无结果）；datadc.ihep.ac.cn 可解析但 TCP 连接超时（000）；lssf.cas.cn 合作组规章页实测 200。
- **申请/分析建议**：LHAASO 不是开放档案：数据受合作组规章约束，需申请。官网本机 DNS 解析失败、数据中心 TCP 超时；先用 lssf 规章页与已发表星表（如 1LHAASO）做文献层面工作。

### 2.20 ixpe — Imaging X-ray Polarimetry Explorer (IXPE)

- 类型/状态/政策：`space_telescope` / `running`（运行中） / `restricted`（受限）
- 运营/国家/波段：NASA/MSFC + ASI；USA/Italy；X-ray polarization (2-8 keV)
- 一句话：首个成像 X 射线偏振卫星，测量天体 X 射线偏振度与偏振角。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| HEASARC IXPE 数据（archive） | https://heasarc.gsfc.nasa.gov/docs/ixpe/ | 200 | OK |
| IXPE 任务主页（portal） | https://ixpe.msfc.nasa.gov/ | 200 | OK |
| IXPE 分析文档（docs） | https://heasarc.gsfc.nasa.gov/docs/ixpe/analysis/ | 200 | OK |
| ixpeobssim 文档（docs） | https://ixpeobssim.readthedocs.io/ | 200 | OK |
| 软件：ixpeobssim | https://ixpeobssim.readthedocs.io/ | 200 | OK |
| 软件：HEASoft | https://heasarc.gsfc.nasa.gov/docs/software/heasoft/ | 200 | OK |
| 软件：XSPEC | https://heasarc.gsfc.nasa.gov/docs/software/xspec/ | 200 | OK |

- **结论/未验证**：HEASARC IXPE 主页/数据页/分析页、ixpe.msfc.nasa.gov、ixpeobssim 文档均 200；专有期具体月数未在可访问页面确认，写入 notes 而非断言。
- **申请/分析建议**：IXPE 为 GO 任务，观测须提案评审；数据有专有期（具体期限本报告未确认，下载前查 HEASARC IXPE 数据政策）。先用已公开 GO 数据与 ixpeobssim 教程练手。

### 2.21 ctao — Cherenkov Telescope Array Observatory (CTAO)

- 类型/状态/政策：`ground_telescope` / `under_construction`（在建） / `open`（开放）
- 运营/国家/波段：CTAO ERIC；Spain/Chile (international)；VHE gamma (20 GeV-300 TeV)
- 一句话：下一代地面伽马射线天文台，La Palma 与 Paranal 两站点建设中，部分望远镜已进入调试。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| CTAO 主页（portal） | https://www.ctao.org/ | 200 | OK |
| CTAO 科学用户页（portal） | https://www.ctao.org/for-scientists/ | 200 | OK |
| Gammapy 文档（docs） | https://gammapy.org/ | 200 | OK |
| ctools 文档（docs） | http://cta.irap.omp.eu/ctools-devel/ | 000 | 连接超时（000），未验证 |
| 软件：Gammapy | https://gammapy.org/ | 200 | OK |
| 软件：ctools | http://cta.irap.omp.eu/ctools-devel/ | 000 | 连接超时（000），未验证 |

- **结论/未验证**：ctao.org 主页与 for-scientists 页、gammapy.org 均 200；ctools 文档站 cta.irap.omp.eu 连接超时（000），已在软件 notes 标注。
- **申请/分析建议**：当前无开放科学档案；用 CTA 科学验证数据与 Gammapy 教程准备方法。建设期数据政策以 CTAO 官方为准，不要假设与 H.E.S.S. 相同。

### 2.22 ska — Square Kilometre Array (SKA)

- 类型/状态/政策：`ground_telescope` / `under_construction`（在建） / `open`（开放）
- 运营/国家/波段：SKA Observatory (SKAO)；Australia/South Africa/UK (international)；radio (50 MHz-15 GHz)
- 一句话：SKA-Low 与 SKA-Mid 正在建设，首批科学数据尚未开放。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| SKAO 主页（portal） | https://www.skao.int/ | 503 | Service Unavailable（WAF/反爬） |
| SKAO 天文用户页（portal） | https://astronomers.skatelescope.org/ | 503 | Service Unavailable（WAF/反爬） |
| SKAO 主页（docs） | https://www.skao.int/ | 503 | Service Unavailable（WAF/反爬） |
| astropy 文档（docs） | https://www.astropy.org/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：https://www.skao.int/、https://www.skao.int/en、https://astronomers.skatelescope.org/ 均返回 503（WAF/反爬），未取得内容；astropy 页 200。
- **申请/分析建议**：SKA 尚无开放科学数据，网站返回 503（反爬/WAF）；不要编造 SKA 数据产品，也不要引用未发布数据。

### 2.23 rubin — Vera C. Rubin Observatory / LSST

- 类型/状态/政策：`ground_telescope` / `commissioning`（调试/升级） / `open`（开放）
- 运营/国家/波段：NSF/DOE, Rubin Observatory (AURA)；Chile/USA；optical (ugrizy)
- 一句话：8.4 米大视场巡天望远镜，2025 年首光，LSST 巡天正式开始前处于 commissioning。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| Rubin Observatory 主页（portal） | https://rubinobservatory.org/ | 200 | OK |
| 数据产品说明（portal） | https://rubinobservatory.org/for-scientists/data-products | 200 | OK |
| Rubin Science Platform（portal） | https://data.lsst.cloud/ | 200 | Rubin Science Platform 登录门户（需账号） |
| LSST Science Pipelines 文档（docs） | https://pipelines.lsst.io/ | 200 | OK |
| astropy 文档（docs） | https://www.astropy.org/ | 200 | OK |
| 软件：LSST Science Pipelines | https://pipelines.lsst.io/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：rubinobservatory.org 主页、data-products、data.lsst.cloud、pipelines.lsst.io、astropy 均 200。
- **申请/分析建议**：数据经 RSP 发布且需账号；DP0 等早期数据可用于方法准备。LSST 巡天尚未正式开始，不要把 commissioning 数据当巡天样本。

### 2.24 elt — Extremely Large Telescope (ELT)

- 类型/状态/政策：`ground_telescope` / `under_construction`（在建） / `open`（开放）
- 运营/国家/波段：ESO；Chile/Europe；optical/IR
- 一句话：ESO 39 米分段镜望远镜，Cerro Armazones 在建，首光目标 2028 年前后。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| ESO ELT 页面（portal） | https://elt.eso.org/ | 502 | Bad Gateway（站点故障） |
| ESO 主页（portal） | https://www.eso.org/ | 200 | OK |
| ESO 主页（docs） | https://www.eso.org/ | 200 | OK |
| astropy 文档（docs） | https://www.astropy.org/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：https://elt.eso.org/ 与 https://www.eso.org/public/teles-instr/elt/ 均返回 502；https://www.eso.org/ 主页 200（但 ELT 子页仍 502）。
- **申请/分析建议**：ELT 尚未观测，无真实科学数据；elt.eso.org 返回 502，站点恢复前用 ESO 主页与官方设计文档。

### 2.25 tmt — Thirty Meter Telescope (TMT)

- 类型/状态/政策：`ground_telescope` / `planned`（规划） / `open`（开放）
- 运营/国家/波段：TMT International Observatory (TIO)；USA/Japan/Canada/China/India；optical/IR
- 一句话：30 米级望远镜项目，建设因选址争议暂停，尚未进入观测阶段。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| TIO 官方站（portal） | https://www.tmt.org/ | 200 | OK |
| TIO 官方站（docs） | https://www.tmt.org/ | 200 | OK |
| astropy 文档（docs） | https://www.astropy.org/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：https://www.tmt.org/ 实测 200；astropy 200。项目状态按公开信息写为 planned（建设暂停）。
- **申请/分析建议**：项目未进入观测阶段，没有真实数据；以设计报告与仪器概念为依据，勿把规划指标当观测结果。

### 2.26 ngvla — next-generation Very Large Array (ngVLA)

- 类型/状态/政策：`ground_telescope` / `planned`（规划） / `open`（开放）
- 运营/国家/波段：NRAO/NSF；USA；radio (1.2-116 GHz)
- 一句话：下一代厘米—毫米波干涉阵，处于设计/规划阶段，尚未开工。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| ngVLA 项目主页（portal） | https://ngvla.nrao.edu/ | 200 | OK |
| NRAO 数据档案（archive） | https://data.nrao.edu/portal/ | 200 | OK |
| ngVLA 项目主页（docs） | https://ngvla.nrao.edu/ | 200 | OK |
| CASA 文档（docs） | https://casa.nrao.edu/ | 200 | OK |
| 软件：CASA | https://casa.nrao.edu/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：ngvla.nrao.edu、data.nrao.edu/portal、casa.nrao.edu、astropy 均 200。
- **申请/分析建议**：ngVLA 尚未开工，没有观测数据；用 VLA 数据与公开模拟准备，勿把设计指标当实测结果。

### 2.27 athena — Advanced Telescope for High-ENergy Astrophysics (Athena)

- 类型/状态/政策：`space_telescope` / `planned`（规划） / `open`（开放）
- 运营/国家/波段：ESA；Europe；X-ray (0.2-12 keV)
- 一句话：ESA X 射线旗舰（L 类），宽视场成像与 X-IFU 量能器，目标 2030 年代发射。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| ESA Athena 页面（portal） | https://www.cosmos.esa.int/web/athena | 200 | OK |
| ESA Athena 页面（docs） | https://www.cosmos.esa.int/web/athena | 200 | OK |
| astropy 文档（docs） | https://www.astropy.org/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：https://www.cosmos.esa.int/web/athena 与 astropy 均 200；SIXTE 站点 www.sternwarte.uni-erlangen.de 连接超时（000），未作为链接。
- **申请/分析建议**：Athena 未发射，无真实数据；用 XMM/Chandra 数据与模拟准备。SIXTE 站点本机超时，需换网络或在其他环境访问。

### 2.28 lisa — Laser Interferometer Space Antenna (LISA)

- 类型/状态/政策：`gravitational_wave` / `planned`（规划） / `open`（开放）
- 运营/国家/波段：ESA/NASA；Europe/USA；mHz gravitational waves
- 一句话：ESA L3 空间引力波天文台，目标 2035 年发射，探测 mHz 频段引力波。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| NASA LISA 页面（portal） | https://lisa.nasa.gov/ | 200 | OK |
| LISA 任务联盟站（portal） | https://www.lisamission.org/ | 200 | OK |
| LISA 任务联盟站（docs） | https://www.lisamission.org/ | 200 | OK |
| astropy 文档（docs） | https://www.astropy.org/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：lisa.nasa.gov、lisamission.org、astropy 均 200；lisa-ldc.lal.in2p3.fr 连接超时（000），未作为链接。
- **申请/分析建议**：LISA 尚未发射，无真实数据；LDC 站点本机不可达，先读官方文档并用已发表模拟结果。

### 2.29 icecube-gen2 — IceCube-Gen2

- 类型/状态/政策：`neutrino` / `proposed`（提案） / `open`（开放）
- 运营/国家/波段：University of Wisconsin-Madison/NSF；Antarctica/USA；neutrino (TeV-PeV)
- 一句话：IceCube 的下一代扩展（光学+射电阵列），处于规划/提案阶段。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| IceCube-Gen2 主页（portal） | https://icecube-gen2.wisc.edu/ | 200 | OK |
| IceCube-Gen2 主页（docs） | https://icecube-gen2.wisc.edu/ | 200 | OK |
| SkyLLH 文档（docs） | https://icecube.github.io/skyllh/ | 200 | OK |
| 软件：SkyLLH | https://icecube.github.io/skyllh/ | 200 | OK |

- **结论/未验证**：icecube-gen2.wisc.edu 与 SkyLLH 文档均 200。
- **申请/分析建议**：Gen2 未建成，无观测数据；用 IceCube 公开数据 + SkyLLH 验证方法，用白皮书做灵敏度论证。

### 2.30 extp — enhanced X-ray Timing and Polarimetry mission (eXTP)

- 类型/状态/政策：`space_telescope` / `proposed`（提案） / `open`（开放）
- 运营/国家/波段：Institute of High Energy Physics, CAS (IHEP)；China；X-ray timing/polarimetry (0.5-30 keV)
- 一句话：中国主导的 X 射线时变与偏振天文台，处于背景型号/提案阶段。

| 链接 | URL | HTTP | 核验结论 |
| --- | --- | --- | --- |
| eXTP 官方站（portal） | https://extp.ihep.ac.cn/ | 200 | OK |
| eXTP 官方站（docs） | https://extp.ihep.ac.cn/ | 200 | OK |
| astropy 文档（docs） | https://www.astropy.org/ | 200 | OK |
| 软件：astropy | https://www.astropy.org/ | 200 | OK |

- **结论/未验证**：https://extp.ihep.ac.cn/ 实测 200；astropy 200。
- **申请/分析建议**：eXTP 尚未立项发射，无真实数据；官网可访问但内容有限，用 IXPE/NICER 数据做方法准备。

## 3. 未验证与受限项汇总

### 3.1 verified=false（5 个）

| id | 设施 | 失败链接与原因 | 可用替代 |
| --- | --- | --- | --- |
| hess | H.E.S.S. | `mpi-hd.mpg.de/hfm/HESS/` 200 但 302→hess-experiment.eu，正文为临时关闭公告；ctools 文档站 000 | 用已发表 SED/星表、TeVCat、Gammapy 教程；联系合作组 |
| erosita-srg | SRG/eROSITA | `erosita.mpe.mpg.de/dr1/` 000（TCP 超时），DR1 入口未验证 | `www.mpe.mpg.de/eROSITA`（200）；换网络访问 DR1 |
| lhaaso | LHAASO | `lhaaso.ihep.ac.cn` DNS 失败；`datadc.ihep.ac.cn` TCP 超时 | `lssf.cas.cn` 合作组规章（200）；已发表星表 |
| ska | SKA | `skao.int`、`astronomers.skatelescope.org` 均 503（WAF） | 换网络/浏览器访问；建设期无开放数据 |
| elt | ELT | `elt.eso.org`、ESO ELT 子页均 502 | `www.eso.org` 主页 200；等站点恢复 |

### 3.2 附带的未验证/间歇不可达辅助链接（不影响设施主体判定）

| URL | HTTP | 说明 |
| --- | --- | --- |
| http://cta.irap.omp.eu/ctools-devel/ | 000 | CTAO/H.E.S.S. 的 ctools 文档站，本机连接超时 |
| https://datadc.ihep.ac.cn/resource/astro/lhaaso | 000 | 国家高能物理数据中心 LHAASO 页，TCP 超时 |
| https://erosita.mpe.mpg.de/dr1/ | 000 | eROSITA-DE DR1 站，TCP 超时 |
| https://elt.eso.org/ | 502 | ESO ELT 官方站，Bad Gateway |
| https://www.skao.int/ | 503 | SKAO 主页，WAF 壳页 |
| https://www.sternwarte.uni-erlangen.de/~sixte/ | 000 | SIXTE 模拟软件站，TCP 超时（Athena） |
| https://lisa-ldc.lal.in2p3.fr/ | 000 | LISA Data Challenge 站，TCP 超时 |
| https://lightkurve.github.io/lightkurve/ | 200/000 交替 | TESS 官方 Lightkurve 文档，GitHub Pages 网络抖动 |
| https://gwpy.github.io/ | 200/000 交替 | LVK 官方 GWpy 文档，GitHub Pages 网络抖动 |
| https://github.com/icecube/skyllh | DNS 失败 | GitHub 本机不可达；SkyLLH 文档用 icecube.github.io（200） |

## 4. 数据政策与状态的关键坑

1. **“开放”≠“无专有期”**：JWST/HST 约 12 个月、ALMA/VLA 有专有期，故标 `proprietary`；论文里不能写“数据完全开放”。具体期限以各设施政策为准（未逐条确认时已写“约/以官方为准”）。
2. **受限设施不要假设有公开档案**：FAST 观测需提案评审、数据按批次公开（本次确认公开到 FAST Data Release 20，2025-02-01）；LHAASO 受合作组规章约束；IXPE 为 GO 任务且有专有期（期限未确认）。三者均需申请/合作，不能写成“下载即用”。
3. **站点可达性会变**：H.E.S.S. 官网因安全措施临时下线（200 但公告页）；SKAO 503、ESO ELT 502、eROSITA DR1 超时、LHAASO 官网 DNS 失败——引用前必须重测 URL，`verified` 只代表 2026-10-22 当次结果。
4. **Fermi 两个仪器别混**：LAT 用 fermipy + FSSC 数据服务器/文档；GBM 用 HEASoft/GBM Data Tools 与 GBM 数据页，二者响应、时间体系和分析链不同。
5. **X 射线联合拟合的互定标**：Chandra(CIAO/Sherpa)、XMM(SAS/XSA)、NuSTAR(NuSTARDAS/XSPEC) 能段重叠，联合拟合须加 cross-cal 常数，并检查 pile-up、背景耀发与 stray light。
6. **多信使数据版本**：IceCube 用 SkyLLH + 官方 data releases（IRF 随年份变）；LVK 用 GWOSC + GWpy/PyCBC，注意 O4 已结束、标定与 veto；不要把公开子集当完整样本。
7. **在建/规划设施没有数据**：CTAO/SKA/ELT 在建，TMT/ngVLA 规划，Athena/LISA/Gen2/eXTP 未发射；只能引用设计文档、模拟或前代设施数据，禁止编造数据产品。
8. **软件版本即复现性**：CIAO/CALDB、SAS/CCF、fermitools/IRF、CASA、LSST pipelines、SkyLLH、GWOSC 数据版本都应写入方法节；跨年重跑常因版本差异不可复现。
9. **GitHub Pages 间歇 reset**：gwpy/lightkurve/skyllh 实测会出现 200 与 000 交替，重试或换网络；仍不可达时用 PyPI 包与本地文档，不要把 000 当作链接不存在。

## 5. 设施—软件—工作流映射（可执行链）

| 设施 | 获取 | 分析软件 | 关键步骤 |
| --- | --- | --- | --- |
| Chandra | CDA/CSC | CIAO、Sherpa | chandra_repro → wavdetect/srcflux → specextract → Sherpa/XSPEC |
| Fermi-LAT | FSSC 数据服务器 | fermipy + fermitools | 选 evclass/IRF → ROI 建模 → 最大似然 → SED/光变 |
| Fermi-GBM | GBM 数据页 | HEASoft、GBM Data Tools、XSPEC | 触发筛窗 → 响应匹配 → 谱拟合 → 联合谱 |
| Swift | NASA 归档、UKSSDC | HEASoft（xrtpipeline/batgrbproduct）、XSPEC | 检索 obsid → XRT/UVOT/BAT 处理 → 联合拟合 |
| XMM-Newton | XSA | SAS、XSPEC | odfIngest → emchain/epchain → evselect/backscale → 拟合 |
| NuSTAR | HEASARC | NuSTARDAS、XSPEC | nupipeline → nuproducts → 与低能仪器联合 |
| JWST/HST | MAST | JWST pipeline、DrizzlePac、astroquery | 下载 cal/flc → 对齐/drizzle → 测光/谱 |
| Gaia | Gaia Archive (TAP) | astroquery、astropy | ADQL 筛选 → 质量 cuts → 交叉证认 |
| TESS | MAST | Lightkurve、astroquery | 取光变 → 去趋势 → BLS/TLS |
| ALMA/VLA | ALMA Archive / NRAO | CASA、astroquery | 取 MS → tclean/自校准 → 谱线/通量 |
| IceCube | data releases | SkyLLH | 数据集+IRF → LLH 拟合 → scramble 显著性 |
| LVK | GWOSC | GWpy、PyCBC | 取 strain → q-transform → 匹配滤波/参数估计 |
| H.E.S.S. | 合作组/DL3 | Gammapy、ctools | 读 DL3 → 3D 似然 → 系统误差 |
| Auger | 公开数据/Open Data | astropy | 事件筛选 → 暴露/各向异性 → 能谱 |
| eROSITA | MPE/DR1 | astropy | FITS → 点源检测/测光 → 交叉 |
| FAST | 提案 + CAS 平台 | astropy（脉冲星：PRESTO/PSRCHIVE） | 申请 → 批次数据 → 折叠/计时或谱线 |
| LHAASO | 合作组 + 数据中心 | astropy | 规章 → 数据申请 → 能谱/天区 |
| IXPE | HEASARC | ixpeobssim、XSPEC | 取 L2 → IRF → 偏振拟合 → 联合谱 |
| CTAO/SKA/ELT/TMT/ngVLA/Athena/LISA/Gen2/eXTP | 尚无开放数据 | Gammapy/CASA/astropy 等前代工具 | 用验证数据/模拟准备方法，引用设计文档 |

## 6. 复现与校验

```bash
# JSON 语法与计数
python3 -m json.tool data/instruments.seed.json > /dev/null && echo PASS
python3 - <<'PY'
import json, collections
d = json.load(open("data/instruments.seed.json", encoding="utf-8"))
print(len(d["instruments"]))
print(collections.Counter(x["status"] for x in d["instruments"]))
print(collections.Counter(x["openPolicy"] for x in d["instruments"]))
print([x["id"] for x in d["instruments"] if not x["verified"]])
PY
```

状态码来自 2026-10-22 的一次批量 curl（84 个唯一 URL，16 并发、每 URL 最多重试 1 次、单次 30 s）；对 H.E.S.S.、FAST、SKAO、Lightkurve、GWpy 等关键/异常页另做了串行复测与标题抽取（data.lsst.cloud 标题确认为 “Rubin Science Platform”，FAST 英文页确认为 “FAST Data Release 20”）。

## 7. 已知局限与后续

- 未验证项：H.E.S.S. 的实际数据政策（站点关闭）、eROSITA DR1 数据入口、LHAASO 官网与数据中心、SKAO 科学用户页、ELT 官网；网络恢复后应重测并更新 `verified` 与 `notes`。
- 专有期具体月数（JWST/HST/ALMA/VLA/IXPE）未在可达页面逐条确认，JSON 中使用“约/以官方为准”，避免写死。
- 本次未覆盖：Spitzer/Herschel 等已结束红外档案、Euclid、KM3NeT/Baikal-GVD、CSST 等；后续可按同一 schema 增补。

