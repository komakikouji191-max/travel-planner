const Atlas = require("../../utils/atlas");
const Gestures = require("../../utils/gestures");
const Demo = require("../../utils/demo");
const KEY = "roam-memory-v1";
const filePaths = (store) =>
  new Set([
    ...store.trips.flatMap((t) => [
      ...t.photos,
      ...t.stops.flatMap((s) => s.photos),
    ]),
    ...store.souvenirs.flatMap((s) => s.photos),
  ]);
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const places = [
  { name: "大理", country: "中国", latitude: 25.6065, longitude: 100.2676 },
  { name: "杭州", country: "中国", latitude: 30.2741, longitude: 120.1551 },
  { name: "东京", country: "日本", latitude: 35.6762, longitude: 139.6503 },
  { name: "巴黎", country: "法国", latitude: 48.8566, longitude: 2.3522 },
  { name: "纽约", country: "美国", latitude: 40.7128, longitude: -74.006 },
];
const baseSample = () => ({
  demo: true,
  trips: [
    {
      id: "demo",
      city: "大理",
      country: "中国",
      latitude: 25.6065,
      longitude: 100.2676,
      title: "风吹过的地方",
      date: "2026-04-12",
      end: "2026-04-14",
      note: "把日子过慢一点，把晚霞记久一点。",
      photos: [],
      stops: [
        {
          id: "s1",
          name: "洱海边的日落",
          date: "2026-04-12",
          time: "18:40",
          note: "坐在岸边，等天空慢慢变成橘色。",
          kind: "日落",
          photos: ["/assets/sunset.jpg"],
        },
        {
          id: "s2",
          name: "山间的清晨",
          date: "2026-04-13",
          time: "06:20",
          note: "天光亮起的时候，山也醒了。",
          kind: "日出",
          photos: ["/assets/sunrise.jpg"],
        },
        {
          id: "s3",
          name: "沿途的风景",
          date: "2026-04-14",
          time: "10:30",
          note: "没有赶路，只是走走停停。",
          kind: "普通",
          photos: ["/assets/lake.jpg"],
        },
      ],
    },
  ],
  souvenirs: [
    {
      id: "demo-postcard",
      name: "洱海风景明信片",
      kind: "明信片",
      date: "2026-04-14",
      note: "示例插画：从一段旅行里带回来的小小纪念。你可以从自己的相册添加真正的收藏。",
      photos: ["/assets/postcard.jpg"],
      tripId: "demo",
      city: "大理",
    },
  ],
});
const cityEnglish = {
  大理: "Dali",
  杭州: "Hangzhou",
  东京: "Tokyo",
  巴黎: "Paris",
  纽约: "New York",
  成都: "Chengdu",
  曼谷: "Bangkok",
  圣托里尼: "Santorini",
  北京: "Beijing",
  京都: "Kyoto",
  罗马: "Rome",
  伊斯坦布尔: "Istanbul",
  悉尼: "Sydney",
  奥克兰: "Auckland",
  旧金山: "San Francisco",
};
const countryEnglish = {
  中国: "China",
  日本: "Japan",
  美国: "USA",
  法国: "France",
  泰国: "Thailand",
  希腊: "Greece",
  意大利: "Italy",
  土耳其: "Turkey",
  澳大利亚: "Australia",
  新西兰: "New Zealand",
};
const sample = () => {
  const store = baseSample();
  const t = store.trips[0];
  t.end = "2026-04-18";
  t.note = "在这里，\n风和日落都很温柔，\n也很像我喜欢的生活。";
  t.stops.forEach((s) => {
    s.date = "2026-04-13";
    s.photos.push("/assets/lake.jpg", "/assets/blue-town.jpg");
  });
  t.stops[0].name = "洱海边的早餐";
  t.stops[0].time = "08:30";
  t.stops[1].name = "喜洲古镇";
  t.stops[1].time = "11:20";
  t.stops[2].name = "双廊";
  t.stops[2].time = "16:30";
  t.stops.forEach((stop) => (stop.kind = "普通"));
  t.stops.push(
    {
      id: "demo-sunrise",
      name: "洱海的第一缕光",
      date: "2026-04-14",
      time: "06:20",
      kind: "日出",
      note: "天光亮起的时候，山也醒了。",
      photos: ["/assets/sunrise.jpg"],
    },
    {
      id: "demo-sunset",
      name: "洱海边的日落",
      date: "2026-04-14",
      time: "18:40",
      kind: "日落",
      note: "把这一刻的金色留在这里。",
      photos: ["/assets/sunset.jpg"],
    },
  );
  const extras = [
    ["东京", "日本", 35.6762, 139.6503, "2026-03-01", "2026-03-08", "kyoto"],
    ["曼谷", "泰国", 13.7563, 100.5018, "2026-01-20", "2026-01-26", "lake"],
    [
      "圣托里尼",
      "希腊",
      36.3932,
      25.4615,
      "2025-10-01",
      "2025-10-08",
      "santorini",
    ],
    ["纽约", "美国", 40.7128, -74.006, "2025-05-10", "2025-05-20", "new-york"],
  ];
  extras.forEach((a, i) =>
    store.trips.push({
      id: "demo-" + i,
      city: a[0],
      country: a[1],
      latitude: a[2],
      longitude: a[3],
      date: a[4],
      end: a[5],
      title: cityEnglish[a[0]] + " · 旅行示例",
      note: "示例旅行：替换成属于自己的回忆。",
      photos: ["/assets/" + a[6] + ".jpg"],
      stops: [],
    }),
  );
  store.souvenirs = [
    {
      id: "demo-chime",
      name: "大理手绘风铃",
      kind: "手工艺品",
      date: "2026-04-15",
      note: "在古城的小店里找到的蓝白风铃。示例素材，换成你旅途中带回来的收藏。",
      tripId: "demo",
      city: "大理",
      cutout: true,
      photos: ["/assets/chime.png"],
    },
    ...store.souvenirs,
    {
      id: "demo-blue",
      name: "苍山与洱海",
      kind: "明信片",
      date: "2026-04-16",
      note: "把远方寄给未来的自己。",
      tripId: "demo",
      city: "大理",
      photos: ["/assets/blue-town.jpg"],
    },
    {
      id: "demo-sunset",
      name: "一张日落纪念卡",
      kind: "明信片",
      date: "2026-04-17",
      note: "收藏一场金色的日落。",
      tripId: "demo",
      city: "大理",
      photos: ["/assets/sunset.jpg"],
    },
  ];
  return store;
};
Page({
  data: {
    tab: "map",
    detail: false,
    mode: "film",
    scope: "世界",
    atlasLayer: "cities",
    atlasZoom: 100,
    atlasDragging: false,
    atlasWheelTop: 15000,
    detailTab: "Overview",
    timelineOnly: false,
    lightView: "map",
    lightMonth: 12,
    lightCity: "全部",
    souvenirFilter: "All",
    souvenirFilters: ["All", "China", "Asia", "Europe", "America"],
    lightFilters: [
      { id: "全部", label: "All" },
      { id: "日出", label: "Sunrise" },
      { id: "日落", label: "Sunset" },
    ],
    viewer: false,
    viewerIndex: 0,
    fullPhoto: false,
    atlasLayers: [
      { id: "cities", label: "Cities" },
      { id: "provinces", label: "Provinces" },
      { id: "route", label: "My Route" },
    ],
    detailTabs: ["Overview", "Photos", "Itinerary", "Notes"],
    filter: "全部",
    year: "全部",
    day: "全部",
    editor: "",
    form: {},
    error: "",
    saving: false,
    tilt: 0,
    categories: ["普通", "日出", "日落"],
    kinds: ["冰箱贴", "明信片", "票根", "手工艺品", "其他"],
    cityOptions: places.map((p) => p.name),
    filters: ["全部", "日出", "日落"],
    tabs: [
      { id: "map", asset: "/assets/nav-map.png", icon: "◎", label: "Map" },
      {
        id: "trips",
        asset: "/assets/nav-trips.png",
        icon: "▤",
        label: "Trips",
      },
      { id: "add", icon: "＋", label: "" },
      {
        id: "light",
        asset: "/assets/nav-light.png",
        icon: "☼",
        label: "Moments",
      },
      {
        id: "mine",
        asset: "/assets/nav-mine.png",
        icon: "○",
        label: "Profile",
      },
    ],
  },
  onLoad() {
    this.setData({
      safeTop: wx.getWindowInfo
        ? (wx.getWindowInfo().statusBarHeight || 24) + 36
        : 64,
    });
    try {
      const v = wx.getStorageSync(KEY);
      this.store =
        v && Array.isArray(v.trips) && Array.isArray(v.souvenirs)
          ? v
          : sample();
    } catch (e) {
      this.store = sample();
    }
    if (
      this.store.demo &&
      this.store.trips.length === 1 &&
      this.store.trips[0].id === "demo"
    )
      this.store = sample();
    Demo.enrich(this.store);
    this.viewport = Gestures.identity();
    this._wheelTop = 15000;
    this.persistedFiles = filePaths(this.store);
    this.refresh();
  },
  onReady() {
    this.pageReady = true;
    this.drawAtlas();
    this.mouseListener = (e) => this.filmMouseMove(e);
    if (wx.onMouseMove) wx.onMouseMove(this.mouseListener);
  },
  onUnload() {
    this.pageReady = false;
    if (this.atlasTimer) clearTimeout(this.atlasTimer);
    if (this.filmTimer) clearTimeout(this.filmTimer);
    if (wx.offMouseMove && this.mouseListener)
      wx.offMouseMove(this.mouseListener);
  },
  refresh() {
    const trips = this.store.trips;
    const active = trips.find((t) => t.id === this.activeId) || trips[0];
    this.activeId = active && active.id;
    const all = trips.flatMap((t) =>
      t.stops.flatMap((s) =>
        s.photos.map((url, index) => ({
          ...s,
          url,
          photoKey: s.id + "-" + index,
          city: t.city,
          tripId: t.id,
        })),
      ),
    );
    const lights = all.filter(
      (p) =>
        p.kind !== "普通" &&
        (this.data.filter === "全部" || p.kind === this.data.filter),
    );
    const cityMap = new Map();
    trips.forEach((t) => {
      const k = `${t.country}/${t.city}`;
      if (!cityMap.has(k)) cityMap.set(k, { ...t, count: 0 });
      cityMap.get(k).count += t.stops.length || 1;
    });
    this.cities = [...cityMap.values()];
    const markers = this.cities.map((c, i) => ({
      id: i,
      latitude: c.latitude,
      longitude: c.longitude,
      title: c.city,
      iconPath: "/assets/pin.png",
      label: {
        content: `${c.city} · ${c.count}`,
        color: "#ffffff",
        bgColor: "#385365",
        padding: 7,
        borderRadius: 5,
      },
      width: 40,
      height: 50,
    }));
    const circles = this.cities.map((c) => ({
      latitude: c.latitude,
      longitude: c.longitude,
      radius: Math.min(25000 + c.count * 12000, 100000),
      color: "#d5a25c99",
      fillColor: c.count > 4 ? "#294d71aa" : "#698ca977",
      strokeWidth: 2,
    }));
    const photos = active
      ? [
          ...active.photos.map((url, index) => ({
            url,
            photoKey: "cover-" + active.id + "-" + index,
            date: active.date,
            time: "",
            name: active.title,
            kind: "普通",
          })),
          ...active.stops.flatMap((s) =>
            s.photos.map((url, index) => ({
              ...s,
              url,
              photoKey: s.id + "-" + index,
            })),
          ),
        ]
      : [];
    const dates = active
      ? [...new Set(active.stops.map((s) => s.date))].sort()
      : [];
    this.setData({
      demo: this.store.demo,
      trips: trips.map((t) => ({
        ...t,
        displayCity: cityEnglish[t.city] || t.city,
        displayCountry: countryEnglish[t.country] || t.country,
        days: Math.max(
          1,
          Math.round((Date.parse(t.end) - Date.parse(t.date)) / 86400000) + 1,
        ),
        cover:
          t.photos[0] ||
          (t.stops.find((s) => s.photos.length) || { photos: [] }).photos[0] ||
          "",
        count: t.stops.reduce((n, s) => n + s.photos.length, 0),
      })),
      visibleTrips: trips
        .filter(
          (t) =>
            this.data.year === "全部" || t.date.slice(0, 4) === this.data.year,
        )
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((t) => ({
          ...t,
          displayCity: cityEnglish[t.city] || t.city,
          displayCountry: countryEnglish[t.country] || t.country,
          days: Math.max(
            1,
            Math.round((Date.parse(t.end) - Date.parse(t.date)) / 86400000) + 1,
          ),
          count:
            t.photos.length + t.stops.reduce((n, s) => n + s.photos.length, 0),
          cover:
            t.photos[0] ||
            (t.stops.find((s) => s.photos.length) || { photos: [] })
              .photos[0] ||
            "",
        })),
      years: [
        "全部",
        ...[...new Set(trips.map((t) => t.date.slice(0, 4)))].sort().reverse(),
      ],
      active: active || null,
      activeEnglish:active?(cityEnglish[active.city]||active.city).toUpperCase():'',
      activeProvince: active
        ? (
            Atlas.regionSummary(
              Atlas.model(this.store, "中国", "cities"),
              Atlas.regionFor(active, "中国"),
            ).english || countryEnglish[active.country] || active.country
          ).toUpperCase()
        : "",
      activeCover: active
        ? active.photos[0] ||
          (active.stops.find((s) => s.photos.length) || { photos: [] })
            .photos[0] ||
          "/assets/sunset.jpg"
        : "",
      activeDays: active
        ? Math.max(
            1,
            Math.round(
              (Date.parse(active.end) - Date.parse(active.date)) / 86400000,
            ) + 1,
          )
        : 0,
      activeSunrises: active
        ? active.stops.filter((s) => s.kind === "日出").length
        : 0,
      activeSunsets: active
        ? active.stops.filter((s) => s.kind === "日落").length
        : 0,
      dayCount: Atlas.model(this.store, this.data.scope, this.data.atlasLayer)
        .days,
      itineraryDays: active
        ? Array.from(
            {
              length: Math.min(
                366,
                Math.max(
                  1,
                  Math.round(
                    (Date.parse(active.end) - Date.parse(active.date)) /
                      86400000,
                  ) + 1,
                ),
              ),
            },
            (_, i) => {
              const date = new Date(Date.parse(active.date) + i * 86400000)
                .toISOString()
                .slice(0, 10);
              return {
                date,
                label: "Day " + String(i + 1).padStart(2, "0"),
                short: date.slice(5).replace("-", "."),
              };
            },
          )
        : [],
      photos,
      photoUrls: photos.map((p) => p.url),
      dates: ["全部", ...dates],
      stops: active
        ? active.stops
            .filter((s) => this.data.day === "全部" || s.date === this.data.day)
            .slice()
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
            .map((s) => ({
              ...s,
              previewPhotos: s.photos.slice(1, 3),
              overflow: Math.max(0, s.photos.length - 3),
            }))
        : [],
      lights: lights
        .filter(
          (p) =>
            this.data.lightCity === "全部" || p.city === this.data.lightCity,
        )
        .map((p) => ({ ...p, displayCity: cityEnglish[p.city] || p.city })),
      allLightPhotos: all.filter((p) => p.kind !== "普通"),
      lightCities: [
        "全部",
        ...new Set(all.filter((p) => p.kind !== "普通").map((p) => p.city)),
      ],
      lightCountryCount: new Set(
        all
          .filter((p) => p.kind !== "普通")
          .map((p) => (trips.find((t) => t.id === p.tripId) || {}).country),
      ).size,
      souvenirs: this.store.souvenirs,
      visibleSouvenirs: this.store.souvenirs.filter((s) => {
        const trip = trips.find((t) => t.id === s.tripId) || {};
        const country = trip.country || "中国";
        const continents = {
          中国: "China",
          日本: "Asia",
          泰国: "Asia",
          法国: "Europe",
          希腊: "Europe",
          美国: "America",
          加拿大: "America",
        };
        return (
          this.data.souvenirFilter === "All" ||
          (continents[country] || "Other") === this.data.souvenirFilter
        );
      }),
      markers,
      circles,
      cityCount: this.cities.length,
      countryCount: new Set(trips.map((t) => t.country)).size,
      photoCount: all.length + trips.reduce((n, t) => n + t.photos.length, 0),
      sunrises: trips.reduce(
        (n, t) => n + t.stops.filter((s) => s.kind === "日出").length,
        0,
      ),
      sunsets: trips.reduce(
        (n, t) => n + t.stops.filter((s) => s.kind === "日落").length,
        0,
      ),
      tripNames: trips.map((t) => `${t.city} · ${t.date}`),
    });
    if (
      this.pageReady &&
      (this.data.tab === "map" || this.data.tab === "light") &&
      !this.data.detail
    )
      this.queueAtlas();
  },
  persist() {
    try {
      wx.setStorageSync(KEY, this.store);
      const nextFiles = filePaths(this.store);
      for (const path of this.persistedFiles || []) {
        if (
          !nextFiles.has(path) &&
          !path.startsWith("/assets/") &&
          !path.startsWith("https://")
        )
          wx.removeSavedFile({ filePath: path, fail: () => {} });
      }
      this.persistedFiles = nextFiles;
      this.refresh();
      return true;
    } catch (e) {
      wx.showToast({ title: "存储失败，请清理空间后重试", icon: "none" });
      return false;
    }
  },
  nav(e) {
    const tab = e.currentTarget.dataset.id;
    if (tab === "add") {
      this.openAdd();
      return;
    }
    this.setData({ tab, detail: false, viewer: false });
    if (tab === "map" || tab === "light") this.queueAtlas();
  },
  openAdd() {
    wx.showActionSheet({
      itemList: ["记录一次旅行", "添加地点 / 追光照片", "收藏纪念品"],
      success: (r) => this.openEditor(["trip", "stop", "souvenir"][r.tapIndex]),
    });
  },
  openEditor(type) {
    this.editId = null;
    if (type !== "trip" && !this.store.trips.length) {
      wx.showToast({ title: "先创建一次旅行", icon: "none" });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    this.setData({
      editor: type,
      error: "",
      form: {
        name: "",
        title: "",
        city: "",
        country: "中国",
        date: today,
        end: today,
        time: "18:00",
        note: "",
        kind: type === "souvenir" ? "其他" : "普通",
        photos: [],
        tripIndex: Math.max(
          0,
          this.store.trips.findIndex((t) => t.id === this.activeId),
        ),
        latitude: "",
        longitude: "",
      },
    });
    if (type === "stop") {
      const t = this.store.trips[this.data.form.tripIndex];
      this.setData({ "form.date": t.date });
    }
  },
  addTrip() {
    this.openEditor("trip");
  },
  addStop() {
    this.openEditor("stop");
  },
  addSouvenir() {
    this.openEditor("souvenir");
  },
  closeEditor() {
    if (!this.data.saving) this.setData({ editor: "" });
  },
  field(e) {
    this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value });
  },
  pickKind(e) {
    this.setData({
      "form.kind": (this.data.editor === "souvenir"
        ? this.data.kinds
        : this.data.categories)[Number(e.detail.value)],
    });
  },
  pickTrip(e) {
    const i = Number(e.detail.value);
    this.setData({ "form.tripIndex": i });
    if (this.data.editor === "stop")
      this.setData({ "form.date": this.store.trips[i].date });
  },
  chooseCity(e) {
    const p = places[Number(e.detail.value)];
    this.setData({
      "form.city": p.name,
      "form.country": p.country,
      "form.latitude": String(p.latitude),
      "form.longitude": String(p.longitude),
    });
  },
  chooseLocation() {
    wx.chooseLocation({
      success: (p) => {
        const patch = {
          "form.latitude": String(p.latitude),
          "form.longitude": String(p.longitude),
        };
        if (this.data.editor === "stop") {
          if (!this.data.form.name) patch["form.name"] = p.name;
        } else patch["form.city"] = this.data.form.city || p.name;
        this.setData(patch);
      },
      fail: () =>
        wx.showToast({
          title:
            this.data.editor === "stop"
              ? "Using the trip city instead"
              : "You can enter coordinates manually",
          icon: "none",
        }),
    });
  },
  choosePhotos() {
    wx.chooseMedia({
      count: Math.max(1, 9 - this.data.form.photos.length),
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (r) =>
        this.setData({
          "form.photos": this.data.form.photos
            .concat(r.tempFiles.map((f) => f.tempFilePath))
            .slice(0, 9),
        }),
    });
  },
  removePhoto(e) {
    this.setData({
      "form.photos": this.data.form.photos.filter(
        (_, i) => i !== Number(e.currentTarget.dataset.index),
      ),
    });
  },
  async save() {
    if (this.data.saving) return;
    const f = { ...this.data.form };
    for (const k of ["title", "name", "city", "country", "note"])
      f[k] = String(f[k] || "").trim();
    const type = this.data.editor;
    const fail = (error) => this.setData({ error });
    if (type === "trip" && (!f.city || !f.country || !f.title))
      return fail("请填写旅行名称、城市和国家。");
    if (type !== "trip" && !f.name) return fail("请填写名称。");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(f.date) ||
      !Number.isFinite(Date.parse(f.date)) ||
      new Date(f.date).toISOString().slice(0, 10) !== f.date
    )
      return fail("请选择有效日期。");
    if (
      type === "trip" &&
      (f.end < f.date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(f.end) ||
        !Number.isFinite(Date.parse(f.end)) ||
        new Date(f.end).toISOString().slice(0, 10) !== f.end)
    )
      return fail("结束日期不能早于开始日期。");
    if (
      type === "trip" &&
      (f.latitude === "" ||
        f.longitude === "" ||
        !Number.isFinite(Number(f.latitude)) ||
        !Number.isFinite(Number(f.longitude)) ||
        Math.abs(Number(f.latitude)) > 90 ||
        Math.abs(Number(f.longitude)) > 180)
    )
      return fail("请选择常用城市，或填写有效经纬度。");
    if (type !== "trip" && !this.store.trips[f.tripIndex])
      return fail("请选择所属旅行。");
    if (type === "stop" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time))
      return fail("请选择有效时间。");
    if (type === "stop") {
      const trip = this.store.trips[f.tripIndex];
      if (f.date < trip.date || f.date > trip.end)
        return fail("记录日期需在所属旅行的起止日期内。");
    }
    if (type === "trip" && this.editId) {
      const trip = this.store.trips.find((t) => t.id === this.editId);
      if (trip.stops.some((s) => s.date < f.date || s.date > f.end))
        return fail("已有地点超出新日期范围，请先修改地点日期。");
    }
    const hasPin =
      (f.latitude !== undefined && f.latitude !== "") ||
      (f.longitude !== undefined && f.longitude !== "");
    if (
      type === "stop" &&
      hasPin &&
      (!Number.isFinite(Number(f.latitude)) ||
        !Number.isFinite(Number(f.longitude)) ||
        f.latitude === "" ||
        f.longitude === "" ||
        f.latitude === undefined ||
        f.longitude === undefined ||
        Math.abs(Number(f.latitude)) > 90 ||
        Math.abs(Number(f.longitude)) > 180)
    )
      return fail("Please choose a valid photo location.");
    if (type === "souvenir" && !f.photos.length)
      return fail("请先添加纪念品照片。");
    if (type === "stop" && f.kind !== "普通" && !f.photos.length)
      return fail("请添加这场日出或日落的照片。");
    this.setData({ saving: true, error: "" });
    const existingPaths = new Set(
      this.store.trips
        .flatMap((t) => [...t.photos, ...t.stops.flatMap((s) => s.photos)])
        .concat(this.store.souvenirs.flatMap((s) => s.photos)),
    );
    let saved = [];
    try {
      for (const path of f.photos) {
        if (
          existingPaths.has(path) ||
          path.startsWith("/assets/") ||
          path.startsWith(wx.env.USER_DATA_PATH) ||
          path.startsWith("https://")
        ) {
          saved.push(path);
          continue;
        }
        const r = await new Promise((resolve, reject) =>
          wx.saveFile({ tempFilePath: path, success: resolve, fail: reject }),
        );
        saved.push(r.savedFilePath);
      }
      const before = JSON.parse(JSON.stringify(this.store));
      const id = this.editId || uid();
      if (type === "trip") {
        const existing = this.store.trips.find((t) => t.id === id);
        const record = {
          id,
          title: f.title,
          city: f.city,
          country: f.country,
          date: f.date,
          end: f.end,
          note: f.note,
          latitude: Number(f.latitude),
          longitude: Number(f.longitude),
          photos: saved,
          stops: existing ? existing.stops : [],
        };
        if (existing) Object.assign(existing, record);
        else this.store.trips.push(record);
        this.activeId = id;
      } else if (type === "stop") {
        const record = {
          id,
          name: f.name,
          date: f.date,
          time: f.time,
          note: f.note,
          kind: f.kind,
          photos: saved,
          ...(hasPin
            ? { latitude: Number(f.latitude), longitude: Number(f.longitude) }
            : {}),
        };
        const trip = this.store.trips[f.tripIndex];
        this.store.trips.forEach((t) => {
          t.stops = t.stops.filter((s) => s.id !== id);
        });
        trip.stops.push(record);
        this.activeId = trip.id;
      } else {
        this.store.souvenirs.push({
          id,
          name: f.name,
          kind: f.kind,
          date: f.date,
          note: f.note,
          photos: saved,
          tripId: this.store.trips[f.tripIndex].id,
          city: this.store.trips[f.tripIndex].city,
        });
      }
      if (!this.persist()) {
        this.store = before;
        throw Error("保存失败");
      }
      this.setData({
        editor: "",
        detail: type !== "souvenir",
        tab: type === "souvenir" ? "souvenirs" : "trips",
        day: "全部",
      });
      this.refresh();
      wx.showToast({ title: "回忆已收藏" });
    } catch (e) {
      for (const filePath of saved.filter(
        (p) => !this.data.form.photos.includes(p),
      ))
        wx.removeSavedFile({ filePath });
      this.setData({ error: "照片未能保存，请检查设备空间后重试。" });
    } finally {
      this.setData({ saving: false });
    }
  },
  openTrip(e) {
    this.setData({ citySheet: null });
    this.activeId = e.currentTarget.dataset.id;
    this.setData({
      detail: true,
      mode: "film",
      day: "全部",
      detailTab: "Overview",
      viewer: false,
      timelineOnly: false,
      tilt: 0,
    });
    this.refresh();
  },
  markerTap(e) {
    const c = this.cities.find((_, i) => i === e.detail.markerId);
    if (c) {
      const trips = this.data.trips.filter(
        (t) => t.city === c.city && t.country === c.country,
      );
      if (trips.length > 1) {
        this.setData({ citySheet: { name: c.city, trips } });
        return;
      }
      this.activeId = c.id;
      this.setData({
        detail: true,
        mode: "film",
        day: "全部",
        detailTab: "Overview",
        viewer: false,
        timelineOnly: false,
      });
      this.refresh();
    }
  },
  closeCity() {
    this.setData({ citySheet: null });
  },
  back() {
    this.setData({ detail: false, viewer: false });
    this.queueAtlas();
  },
  scope(e) {
    this.setData({ scope: e.currentTarget.dataset.value });
    this.selectedRegion = null;
    this.viewport = Gestures.identity();
    this._wheelTop = 15000;
    this.setData({ atlasZoom: 100 });
    this.queueAtlas();
  },
  mode(e) {
    this.setData({ mode: e.currentTarget.dataset.value });
  },
  filter(e) {
    this.setData({ filter: e.currentTarget.dataset.value });
    this.refresh();
  },
  year(e) {
    this.setData({ year: e.currentTarget.dataset.value });
    this.refresh();
  },
  day(e) {
    this.setData({ day: e.currentTarget.dataset.value });
    this.refresh();
  },
  preview(e) {
    const url = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls || [url];
    wx.previewImage({ current: url, urls });
  },
  touchStart(e) {
    this.touchX = e.touches[0].clientX;
  },
  touchMove(e) {
    if (this.touchX === undefined) return;
    const delta = e.touches[0].clientX - this.touchX;
    this.setData({ tilt: Math.max(-5, Math.min(5, delta / 35)) });
  },
  touchEnd() {
    this.touchX = undefined;
    this.setData({ tilt: 0 });
  },
  souvenirs() {
    this.setData({ tab: "souvenirs", detail: false });
  },
  viewSouvenir(e) {
    this.setData({
      souvenir: this.store.souvenirs.find(
        (s) => s.id === e.currentTarget.dataset.id,
      ),
    });
  },
  closeSouvenir() {
    this.setData({ souvenir: null });
  },
  deleteTrip() {
    const t = this.data.active;
    wx.showModal({
      title: "删除这次旅行？",
      content: "同时删除关联的地点和纪念品记录，此操作无法撤销。",
      success: (r) => {
        if (!r.confirm) return;
        const before = JSON.parse(JSON.stringify(this.store));
        this.store.trips = this.store.trips.filter((x) => x.id !== t.id);
        this.store.souvenirs = this.store.souvenirs.filter(
          (x) => x.tripId !== t.id,
        );
        if (!this.persist()) {
          this.store = before;
          return;
        }
        this.setData({ detail: false, viewer: false });
        this.queueAtlas();
      },
    });
  },
  clearDemo() {
    wx.showModal({
      title: "开始我的足迹",
      content: "仅移除内置示例旅行；你自己添加的旅行和纪念品会保留。",
      success: (r) => {
        if (r.confirm) {
          const before = this.store;
          this.store = {
            demo: false,
            trips: before.trips.filter(
              (t) => t.id !== "demo" && !t.id.startsWith("demo-"),
            ),
            souvenirs: before.souvenirs.filter(
              (s) => s.tripId !== "demo" && !s.tripId.startsWith("demo-"),
            ),
          };
          if (!this.persist()) this.store = before;
        }
      },
    });
  },
  exportData() {
    const filePath = `${wx.env.USER_DATA_PATH}/roam-backup.json`;
    wx.getFileSystemManager().writeFile({
      filePath,
      data: JSON.stringify(this.store, null, 2),
      encoding: "utf8",
      success: () =>
        wx.shareFileMessage({ filePath, fileName: "旅迹记录备份.json" }),
      fail: () => wx.showToast({ title: "导出失败", icon: "none" }),
    });
  },
  editTrip() {
    const t = this.data.active;
    this.editId = t.id;
    this.setData({
      editor: "trip",
      error: "",
      form: {
        ...t,
        latitude: String(t.latitude),
        longitude: String(t.longitude),
        photos: t.photos.slice(),
      },
    });
  },
  editStop(e) {
    const t = this.data.active,
      s = t.stops.find((s) => s.id === e.currentTarget.dataset.id);
    this.editId = s.id;
    this.setData({
      editor: "stop",
      error: "",
      form: {
        ...s,
        tripIndex: this.store.trips.findIndex((x) => x.id === t.id),
        photos: s.photos.slice(),
      },
    });
  },
  deleteStop(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "删除这个片刻？",
      content: "关联的追光照片也将从手账中移除。",
      success: (r) => {
        if (!r.confirm) return;
        const before = JSON.parse(JSON.stringify(this.store));
        this.store.trips.find((t) => t.id === this.activeId).stops =
          this.data.active.stops.filter((s) => s.id !== id);
        if (!this.persist()) this.store = before;
      },
    });
  },
  deleteSouvenir() {
    const id = this.data.souvenir.id;
    wx.showModal({
      title: "删除这件纪念品？",
      content: "此操作无法撤销。",
      success: (r) => {
        if (!r.confirm) return;
        const before = JSON.parse(JSON.stringify(this.store));
        this.store.souvenirs = this.store.souvenirs.filter((s) => s.id !== id);
        if (this.persist()) this.setData({ souvenir: null });
        else this.store = before;
      },
    });
  },

  scheduleAtlas() {
    if (!this.pageReady || this.atlasTimer) return;
    this.atlasTimer = setTimeout(() => {
      this.atlasTimer = null;
      this.queueAtlas();
    }, 40);
  },
  zoomAtlas(factor, anchor) {
    const r = this.atlasRect;
    if (!r) return;
    this.viewport = Gestures.zoomAt(
      this.viewport || Gestures.identity(),
      factor,
      anchor || [r.width / 2, r.height / 2],
    );
    this.setData({ atlasZoom: Math.round(this.viewport.zoom * 100) });
    this.scheduleAtlas();
  },
  atlasWheel(e) {
    const d = e.detail || e;
    const delta = Number(
      d.deltaY !== undefined
        ? d.deltaY
        : d.wheelDelta !== undefined
          ? -d.wheelDelta
          : 0,
    );
    if (delta)
      this.zoomAtlas(Math.exp(-Math.max(-240, Math.min(240, delta)) * 0.002));
  },
  atlasWheelScroll(e) {
    const top = Number(e.detail.scrollTop);
    if (!Number.isFinite(top)) return;
    const prev = this._wheelTop;
    this._wheelTop = top;
    if (
      prev === undefined ||
      this.data.atlasDragging ||
      Math.abs(top - prev) > 1000
    )
      return;
    this.zoomAtlas(Math.exp(-(top - prev) * 0.002));
    if (top < 1000 || top > 28000) {
      this._wheelTop = undefined;
      this.setData({ atlasWheelTop: 15000 });
    }
  },
  zoomIn() {
    this.zoomAtlas(1.2);
  },
  zoomOut() {
    this.zoomAtlas(1 / 1.2);
  },
  resetZoom() {
    this.viewport = Gestures.identity();
    this.setData({ atlasZoom: 100 });
    this.queueAtlas();
  },
  atlasTouchPoint(t) {
    return [
      t.x !== undefined
        ? t.x
        : t.clientX - (this.atlasRect ? this.atlasRect.left : 0),
      t.y !== undefined
        ? t.y
        : t.clientY - (this.atlasRect ? this.atlasRect.top : 0),
    ];
  },
  atlasGestureStart(e) {
    const touches = e.touches || [];
    if (!touches.length) return;
    const pts = touches.map((t) => this.atlasTouchPoint(t));
    this.atlasGesture = {
      start: pts[0],
      last: pts[0],
      moved: false,
      distance: pts.length > 1 ? Gestures.distance(pts[0], pts[1]) : null,
    };
    this.setData({ atlasDragging: true });
  },
  atlasGestureMove(e) {
    const pts = (e.touches || []).map((t) => this.atlasTouchPoint(t));
    const g = this.atlasGesture;
    if (!g || !pts.length) return;
    if (pts.length > 1) {
      const d = Gestures.distance(pts[0], pts[1]);
      if (g.distance && d)
        this.zoomAtlas(d / g.distance, Gestures.midpoint(pts[0], pts[1]));
      g.distance = d;
      g.moved = true;
    } else {
      const dx = pts[0][0] - g.last[0],
        dy = pts[0][1] - g.last[1];
      this.viewport = Gestures.pan(
        this.viewport || Gestures.identity(),
        dx,
        dy,
      );
      if (Gestures.distance(pts[0], g.start) > 5) g.moved = true;
      this.scheduleAtlas();
    }
    g.last = pts[0];
  },
  atlasGestureEnd(e) {
    const tap = this.atlasGesture && !this.atlasGesture.moved;
    this.atlasGesture = null;
    this.setData({ atlasDragging: false });
    if (tap) this.atlasTap(e);
  },
  filmMouseMove(e) {
    if (this.data.editor || !(this.data.detail || this.data.viewer)) return;
    const t = e.detail || e;
    const x = Number(t.clientX !== undefined ? t.clientX : t.x);
    if (!Number.isFinite(x)) return;
    const width = wx.getWindowInfo
      ? wx.getWindowInfo().windowWidth || 375
      : 375;
    this.setData({ tilt: Gestures.tilt(x - width / 2, width) });
  },
  filmMouseLeave() {
    this.setData({ tilt: 0 });
  },
  filmScroll(e) {
    const left = Number(e.detail.scrollLeft) || 0;
    const delta =
      left - (this.filmScrollLeft === undefined ? left : this.filmScrollLeft);
    this.filmScrollLeft = left;
    if (delta) {
      this.setData({ tilt: Math.max(-5, Math.min(5, -delta / 5)) });
      if (this.filmTimer) clearTimeout(this.filmTimer);
      this.filmTimer = setTimeout(() => {
        this.filmTimer = null;
        this.setData({ tilt: 0 });
      }, 180);
    }
  },
  openLightPoint(e) {
    const point = (this.data.lightPoints || [])[
      Number(e.currentTarget.dataset.index)
    ];
    if (!point) return;
    this.openTrip({ currentTarget: { dataset: { id: point.tripId } } });
    const index = this.data.photos.findIndex((p) => p.id === point.stopId);
    this.openViewer({
      currentTarget: { dataset: { index: Math.max(0, index) } },
    });
  },

  queueAtlas() {
    if (!this.pageReady) return;
    wx.nextTick(() => this.drawAtlas());
  },
  drawAtlas() {
    if (this.data.tab === "light") {
      this.drawLightMap();
      return;
    }
    if (this.data.tab !== "map" || this.data.detail || !wx.createSelectorQuery)
      return;
    wx.createSelectorQuery()
      .in(this)
      .select(".atlas-canvas")
      .fields({ node: true, size: true, rect: true })
      .exec((result) => {
        const r = result && result[0];
        if (!r || !r.node || !r.width || !r.height) return;
        const canvas = r.node,
          dpr =
            (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync())
              .pixelRatio || 1;
        canvas.width = r.width * dpr;
        canvas.height = r.height * dpr;
        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);
        this.atlasModel = Atlas.model(
          this.store,
          this.data.scope,
          this.data.atlasLayer,
        );
        const viewport = this.viewport || Gestures.identity();
        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.zoom, viewport.zoom);
        const rendered = Atlas.render(ctx, r.width, r.height, this.atlasModel);
        ctx.restore();
        rendered.shapes = rendered.shapes.map((f) => ({
          ...f,
          rings: f.rings.map((r) => r.map((p) => Gestures.apply(p, viewport))),
        }));
        rendered.points = rendered.points.map((p) => {
          const q = Gestures.apply(
            [(p.x / 100) * r.width, (p.y / 100) * r.height],
            viewport,
          );
          return {
            ...p,
            x: (q[0] / r.width) * 100,
            y: (q[1] / r.height) * 100,
          };
        });

        this.atlasShapes = rendered.shapes;
        this.atlasRect = r;
        const points = rendered.points;
        const first = points[0];
        const region =
          this.selectedRegion ||
          (first
            ? this.data.scope === "中国"
              ? first.regionChina
              : first.regionWorld
            : "云南省");
        const summary = Atlas.regionSummary(this.atlasModel, region);
        const unique = new Set();
        const stickers = points
          .filter((p) => {
            const key = this.data.scope === "中国" ? p.name : p.regionWorld;
            if (!p.photos.length || unique.has(key)) return false;
            unique.add(key);
            return true;
          })
          .slice(0, 5)
          .map((p, i) => ({
            ...p,
            x:
              viewport.zoom === 1
                ? Math.max(9, Math.min(89, p.x + (i % 2 ? 5 : -5)))
                : p.x,
            y:
              viewport.zoom === 1
                ? Math.max(15, Math.min(88, p.y + 10))
                : p.y + 5,
            angle: i % 2 ? 5 : -5,
          }));
        this.setData({
          atlasPoints: points,
          atlasStickers: stickers,
          atlasRegion: summary,
        });
      });
  },
  atlasLayer(e) {
    this.setData({ atlasLayer: e.currentTarget.dataset.value });
    this.queueAtlas();
  },
  atlasCityTap(e) {
    const point = (this.data.atlasPoints || [])[
      Number(e.currentTarget.dataset.index)
    ];
    if (!point) return;
    const index = this.cities.findIndex((c) => c.id === point.id);
    if (index >= 0) this.markerTap({ detail: { markerId: index } });
  },
  atlasStickerTap(e) {
    this.openTrip({
      currentTarget: { dataset: { id: e.currentTarget.dataset.id } },
    });
  },
  atlasTap(e) {
    if (!this.atlasRect) return;
    let x = e.detail.x,
      y = e.detail.y;
    if (e.changedTouches && e.changedTouches[0]) {
      const t = e.changedTouches[0];
      x = t.x !== undefined ? t.x : t.clientX - this.atlasRect.left;
      y = t.y !== undefined ? t.y : t.clientY - this.atlasRect.top;
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const region = Atlas.hit(this.atlasShapes, x, y);
    if (region) {
      this.selectedRegion = region;
      this.setData({
        atlasRegion: Atlas.regionSummary(this.atlasModel, region),
      });
    }
  },
  atlasRegionOpen() {
    const r = this.data.atlasRegion;
    if (r && r.cityList.length) {
      const ids = new Set(r.cityList.flatMap((c) => c.trips.map((t) => t.id)));
      this.setData({
        citySheet: {
          name: r.short,
          trips: this.data.trips.filter((t) => ids.has(t.id)),
        },
      });
    } else {
      this.addTrip();
      if (this.data.scope === "世界" && r)
        this.setData({ "form.country": r.name });
    }
  },
  detailTab(e) {
    const tab = e.currentTarget.dataset.value;
    this.setData({ detailTab: tab });
    if (tab === "Photos" && this.data.photos.length)
      this.openViewer({ currentTarget: { dataset: { index: 0 } } });
  },
  openViewer(e) {
    const index = Number(e.currentTarget.dataset.index) || 0;
    if (!this.data.photos.length) {
      this.addStop();
      return;
    }
    this.setData({ viewer: true, viewerIndex: index, fullPhoto: false });
  },
  closeViewer() {
    this.setData({ viewer: false, fullPhoto: false, tilt: 0 });
  },
  viewerChange(e) {
    this.setData({ viewerIndex: e.detail.current, tilt: 0 });
  },
  viewerThumb(e) {
    this.setData({
      viewerIndex: Number(e.currentTarget.dataset.index),
      tilt: 0,
    });
  },
  fullPhoto() {
    this.setData({ fullPhoto: !this.data.fullPhoto, tilt: 0 });
  },
  toggleFavorite() {
    const t = this.store.trips.find((t) => t.id === this.activeId);
    if (!t) return;
    const before = t.favorite;
    t.favorite = !t.favorite;
    if (!this.persist()) t.favorite = before;
  },
  cityMenu() {
    wx.showActionSheet({
      itemList: ["编辑旅行", "添加照片 / 地点", "删除旅行"],
      success: (r) => {
        if (r.tapIndex === 0) this.editTrip();
        else if (r.tapIndex === 1) this.addStop();
        else this.deleteTrip();
      },
    });
  },
  shareMemory() {
    wx.showActionSheet({
      itemList: ["复制旅行文字", "预览原图（可长按保存）"],
      success: (r) => {
        if (r.tapIndex === 0) this.exportText();
        else if (this.data.photos.length) {
          const p = this.data.photos[this.data.viewerIndex || 0];
          wx.previewImage({ current: p.url, urls: this.data.photoUrls });
        }
      },
    });
  },
  exportText() {
    const t = this.data.active;
    if (!t) return;
    const text = [
      t.city + " · " + t.country,
      t.date + " — " + t.end,
      t.note,
      ...t.stops.map(
        (s) => s.date + " " + s.time + " " + s.name + "\n" + s.note,
      ),
    ].join("\n\n");
    wx.setClipboardData({ data: text });
  },

  openItinerary(e) {
    this.openTrip(e);
    this.setData({
      timelineOnly: true,
      day: this.data.active.stops[0]
        ? this.data.active.stops[0].date
        : this.data.active.date,
    });
    this.refresh();
  },
  setLightView(e) {
    this.setData({ lightView: e.currentTarget.dataset.value });
    this.queueAtlas();
  },
  setLightCity(e) {
    this.setData({ lightCity: this.data.lightCities[Number(e.detail.value)] });
    this.refresh();
  },
  setSouvenirFilter(e) {
    this.setData({ souvenirFilter: e.currentTarget.dataset.value });
    this.refresh();
  },
  month(e) {
    this.setData({ lightMonth: Number(e.detail.value) });
    this.queueAtlas();
  },
  drawLightMap() {
    if (this.data.lightView !== "map" || !wx.createSelectorQuery) return;
    wx.createSelectorQuery()
      .in(this)
      .select(".light-canvas")
      .fields({ node: true, size: true })
      .exec((results) => {
        const r = results && results[0];
        if (!r || !r.node || !r.width) return;
        const dpr =
          (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync())
            .pixelRatio || 1;
        r.node.width = r.width * dpr;
        r.node.height = r.height * dpr;
        const ctx = r.node.getContext("2d");
        ctx.scale(dpr, dpr);
        const footprints = Atlas.lightFootprints(
          this.store,
          this.data.lightMonth,
        );
        const rendered = Atlas.render(
          ctx,
          r.width,
          r.height,
          Atlas.lightModel(this.store, this.data.lightMonth),
          { dark: true },
        );
        this.setData({
          lightPoints: rendered.points.map((p) => ({
            ...p,
            tripId: p.trips[0].sourceTripId,
            stopId: p.trips[0].sourceStopId,
          })),
          monthLightPhotos: footprints.flatMap((p) =>
            p.photos.map((url, i) => ({
              url,
              key: p.id + "-" + i,
              date: p.date,
              kind: p.kind,
              city: p.city,
            })),
          ),
        });
      });
  },
  lightMapTap() {
    this.setData({ lightView: "gallery" });
  },
  onShareAppMessage() {
    return { title: "旅迹 · 收藏走过的世界", path: "/pages/index/index" };
  },
});
