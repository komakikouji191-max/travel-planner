# 地图几何数据

本项目使用本地 Canvas 绘制离线地图，不请求外部瓦片。

- 世界：Apache ECharts repository, `test/data/map/json/world.json`，https://github.com/apache/echarts/blob/master/test/data/map/json/world.json 。项目采用 Apache-2.0 许可证。
- 中国省级区域：GeoJSON map China，https://github.com/longwosion/geojson-map-china/blob/master/china.json 。数据仓库未提供独立许可证声明；其发布来源与可用于正式商用发布的授权需进一步核实。
- `utils/atlas-data.js` 保存保留区域与岛屿的简化外环坐标；`utils/atlas.js` 负责投影、命中、着色与动态足迹。

这些数据用于开发预览，尚未核验为具有审图号的标准地图。正式发布前需替换/核验为获准使用的完整地图数据（包括国界、南海诸岛及相关标注），并确认数据授权。不能将此开发预览宣称为已通过地图审核。
