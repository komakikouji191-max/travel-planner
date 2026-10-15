const data = require("./atlas-data");
const countryNames = {
  中国: "China",
  日本: "Japan",
  美国: "United States",
  法国: "France",
  英国: "United Kingdom",
  澳大利亚: "Australia",
  泰国: "Thailand",
  意大利: "Italy",
  希腊: "Greece",
  土耳其: "Turkey",
  新西兰: "New Zealand",
  加拿大: "Canada",
  俄罗斯: "Russia",
  西班牙: "Spain",
  德国: "Germany",
  韩国: "Korea",
  新加坡: "Singapore",
  马来西亚: "Malaysia",
  印度尼西亚: "Indonesia",
  瑞士: "Switzerland",
  葡萄牙: "Portugal",
  越南: "Vietnam",
  阿联酋: "United Arab Emirates",
  南非: "South Africa",
  埃及: "Egypt",
  巴西: "Brazil",
};
const provinceNames = {
  云南省: "Yunnan",
  浙江省: "Zhejiang",
  四川省: "Sichuan",
  北京市: "Beijing",
  上海市: "Shanghai",
  广东省: "Guangdong",
  江苏省: "Jiangsu",
  福建省: "Fujian",
  山东省: "Shandong",
  西藏自治区: "Tibet",
  新疆维吾尔自治区: "Xinjiang",
  青海省: "Qinghai",
  海南省: "Hainan",
  广西壮族自治区: "Guangxi",
  贵州省: "Guizhou",
  湖南省: "Hunan",
  湖北省: "Hubei",
  陕西省: "Shaanxi",
  山西省: "Shanxi",
  河南省: "Henan",
  河北省: "Hebei",
  江西省: "Jiangxi",
  安徽省: "Anhui",
  内蒙古自治区: "Inner Mongolia",
  甘肃省: "Gansu",
  宁夏回族自治区: "Ningxia",
  辽宁省: "Liaoning",
  吉林省: "Jilin",
  黑龙江省: "Heilongjiang",
  天津市: "Tianjin",
  重庆市: "Chongqing",
  台湾省: "Taiwan",
  香港特别行政区: "Hong Kong",
  澳门特别行政区: "Macao",
};
function inside(point, ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      hit = !hit;
  }
  return hit;
}
function contains(feature, point) {
  return feature.rings.some((r) => inside(point, r));
}
function regionFor(trip, scope) {
  const features = scope === "中国" ? data.china : data.world;
  if (scope !== "中国") {
    const name = countryNames[trip.country] || trip.country;
    const named = features.find(
      (f) => f.name.toLowerCase() === name.toLowerCase(),
    );
    if (named) return named.name;
  }
  return (
    (
      features.find((f) =>
        contains(f, [Number(trip.longitude), Number(trip.latitude)]),
      ) || {}
    ).name || ""
  );
}
function cityRecords(store) {
  const cities = new Map();
  store.trips.forEach((t) => {
    const k = t.country + "/" + t.city;
    let c = cities.get(k);
    if (!c) {
      c = {
        id: t.id,
        name: t.city,
        country: t.country,
        longitude: Number(t.longitude),
        latitude: Number(t.latitude),
        count: 0,
        photos: [],
        trips: [],
        regionChina: regionFor(t, "中国"),
        regionWorld: regionFor(t, "世界"),
      };
      cities.set(k, c);
    }
    c.count += t.stops.length || 1;
    c.trips.push(t);
    c.photos.push(...t.photos, ...t.stops.flatMap((s) => s.photos));
  });
  return [...cities.values()];
}
function model(store, scope, layer) {
  const features = scope === "中国" ? data.china : data.world;
  const all = cityRecords(store);
  const cities = all.filter((c) => scope !== "中国" || c.regionChina);
  const counts = {};
  cities.forEach((c) => {
    const key = scope === "中国" ? c.regionChina : c.regionWorld;
    if (!counts[key]) counts[key] = new Set();
    counts[key].add(c.country + "/" + c.name);
  });
  return {
    scope,
    layer,
    features,
    cities,
    counts,
    days: store.trips.reduce(
      (n, t) =>
        n +
        Math.max(
          1,
          Math.round((Date.parse(t.end) - Date.parse(t.date)) / 86400000) + 1,
        ),
      0,
    ),
  };
}
function albers(lon, lat) {
  const rad = Math.PI / 180,
    n = (Math.sin(25 * rad) + Math.sin(47 * rad)) / 2,
    c = Math.cos(25 * rad) ** 2 + 2 * n * Math.sin(25 * rad),
    r = Math.sqrt(c - 2 * n * Math.sin(lat * rad)) / n,
    r0 = Math.sqrt(c - 2 * n * Math.sin(35 * rad)) / n,
    a = n * (lon - 105) * rad;
  return [r * Math.sin(a), r0 - r * Math.cos(a)];
}
function projection(m, w, h) {
  if (m.scope === "世界")
    return (p) => [
      12 + ((p[0] + 180) / 360) * (w - 24),
      66 + ((84 - Math.max(-58, Math.min(84, p[1]))) / 142) * (h - 126),
    ];
  const pts = m.features.flatMap((f) =>
    f.rings.flatMap((r) => r.map((p) => albers(...p))),
  );
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]),
    bounds = [
      Math.min(...xs),
      Math.min(...ys),
      Math.max(...xs),
      Math.max(...ys),
    ];
  const scale = Math.min(
    (w - 28) / (bounds[2] - bounds[0]),
    (h - 55) / (bounds[3] - bounds[1]),
  );
  return (p) => {
    const q = albers(...p);
    return [
      (w - (bounds[2] - bounds[0]) * scale) / 2 + (q[0] - bounds[0]) * scale,
      24 + (bounds[3] - q[1]) * scale,
    ];
  };
}
function path(ctx, rings, project) {
  ctx.beginPath();
  rings.forEach((r) => {
    r.forEach((p, i) => {
      const q = project(p);
      if (i) ctx.lineTo(q[0], q[1]);
      else ctx.moveTo(q[0], q[1]);
    });
    ctx.closePath();
  });
}
function noise(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function drawPlane(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  ctx.beginPath();
  [
    [0, -11],
    [2, -4],
    [10, 3],
    [10, 5],
    [2, 1],
    [2, 8],
    [5, 11],
    [5, 12],
    [0, 10],
    [-5, 12],
    [-5, 11],
    [-2, 8],
    [-2, 1],
    [-10, 5],
    [-10, 3],
    [-2, -4],
  ].forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  ctx.fillStyle = "#36382f";
  ctx.fill();
  ctx.restore();
}
function flight(ctx, a, b, bend) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...a);
  const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + bend];
  ctx.quadraticCurveTo(...c, ...b);
  ctx.strokeStyle = "#69695199";
  ctx.lineWidth = 1.1;
  ctx.setLineDash([5, 6]);
  ctx.stroke();
  ctx.restore();
  const t = 0.62,
    x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1];
  drawPlane(
    ctx,
    x,
    y,
    Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2,
    0.65,
  );
}
function render(ctx, w, h, m, options = {}) {
  const project = projection(m, w, h),
    rand = noise(1837);
  ctx.clearRect(0, 0, w, h);
  // Faded atlas parallels and tiny ink flecks are drawn, not remote raster tiles.
  ctx.save();
  ctx.strokeStyle = "#817f6420";
  ctx.lineWidth = 0.45;
  ctx.setLineDash([1, 5]);
  if (m.scope === "世界") {
    for (let lat = -40; lat <= 70; lat += 25) {
      ctx.beginPath();
      const a = project([-180, lat]),
        b = project([180, lat]);
      ctx.moveTo(...a);
      ctx.lineTo(...b);
      ctx.stroke();
    }
  }
  ctx.restore();
  const shapes = [];
  m.features.forEach((f, i) => {
    const count = (m.counts[f.name] || new Set()).size;
    const palette = options.dark
      ? ["#35404a", "#4a5d70", "#627a90", "#7c91a6", "#98a5ae"]
      : ["#a6aaa0", "#80909a", "#3d556b", "#31485e", "#2d465b"];
    const fill = count
      ? palette[Math.min(4, 1 + count)]
      : options.dark
        ? "#3c4853"
        : m.scope === "中国"
          ? "#aab1af"
          : "#b6b6a8";
    path(ctx, f.rings, project);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = options.dark ? "#66717c66" : "#eee7d6";
    ctx.lineWidth = m.scope === "中国" ? 0.85 : 0.55;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    const gradient = ctx.createLinearGradient(0, 0, w * 0.8, h);
    gradient.addColorStop(0, "#ede7d52b");
    gradient.addColorStop(0.4, "#ede7d508");
    gradient.addColorStop(1, "#1c293428");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    for (let n = 0; n < (m.scope === "中国" ? 300 : 65); n++) {
      const x = rand() * w,
        y = rand() * h;
      ctx.fillStyle = rand() > 0.5 ? "#fff8df24" : "#20323d20";
      ctx.fillRect(x, y, 0.4 + rand() * 2, 0.4 + rand() * 1.4);
    }
    ctx.restore();
    shapes.push({ name: f.name, rings: f.rings.map((r) => r.map(project)) });
  });
  // Curves describe a decorative journey; actual route mode follows dated records.
  if (m.scope === "世界" && m.layer !== "route") {
    flight(ctx, [w * 0.09, h * 0.37], [w * 0.77, h * 0.16], -h * 0.28);
    flight(ctx, [w * 0.22, h * 0.86], [w * 0.9, h * 0.75], h * 0.18);
  }
  if (m.layer === "route") {
    const sorted = m.cities
      .slice()
      .sort((a, b) => a.trips[0].date.localeCompare(b.trips[0].date));
    for (let i = 1; i < sorted.length; i++)
      flight(
        ctx,
        project([sorted[i - 1].longitude, sorted[i - 1].latitude]),
        project([sorted[i].longitude, sorted[i].latitude]),
        -35,
      );
  }
  const points = m.cities.map((c, index) => {
    const p = project([c.longitude, c.latitude]);
    const glow = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 13);
    glow.addColorStop(0, "#fff4c5");
    glow.addColorStop(0.12, "#ffd78d");
    glow.addColorStop(0.35, "#d1914377");
    glow.addColorStop(1, "#d1914300");
    ctx.fillStyle = glow;
    ctx.fillRect(p[0] - 13, p[1] - 13, 26, 26);
    return { ...c, index, x: (p[0] / w) * 100, y: (p[1] / h) * 100 };
  });
  // Hand-inked compass.
  ctx.save();
  ctx.translate(w - 26, 22);
  ctx.strokeStyle = "#5b5b4888";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, -4);
    ctx.stroke();
  }
  ctx.fillStyle = "#5b5b48";
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
  return { points, shapes, project };
}
function hit(shapes, x, y) {
  return (
    (shapes.find((s) => s.rings.some((r) => inside([x, y], r))) || {}).name ||
    ""
  );
}
function regionSummary(m, name) {
  const cities = m.cities.filter(
    (c) => (m.scope === "中国" ? c.regionChina : c.regionWorld) === name,
  );
  return {
    name,
    english:
      provinceNames[name] || name.replace(/省|市|自治区|特别行政区/g, ""),
    short: name.replace(
      /省|市|维吾尔自治区|壮族自治区|回族自治区|自治区|特别行政区/g,
      "",
    ),
    cities: cities.length,
    photos: [...new Set(cities.flatMap((c) => c.photos))].slice(0, 8),
    photoCount: cities.reduce((n, c) => n + c.photos.length, 0),
    trips: cities.reduce((n, c) => n + c.trips.length, 0),
    cityList: cities,
  };
}
module.exports = {
  model,
  render,
  projection,
  regionFor,
  regionSummary,
  hit,
  inside,
  cityRecords,
};
