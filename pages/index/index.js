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
const sample = () => ({
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
  souvenirs: [{id:"demo-postcard",name:"洱海风景明信片",kind:"明信片",date:"2026-04-14",note:"示例插画：从一段旅行里带回来的小小纪念。你可以从自己的相册添加真正的收藏。",photos:["/assets/postcard.jpg"],tripId:"demo",city:"大理"}],
});
Page({
  data: {
    tab: "map",
    detail: false,
    mode: "film",
    scope: "中国",
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
      { id: "map", icon: "◎", label: "足迹" },
      { id: "trips", icon: "▤", label: "旅行" },
      { id: "add", icon: "＋", label: "记录" },
      { id: "light", icon: "☼", label: "追光" },
      { id: "mine", icon: "○", label: "我的" },
    ],
  },
  onLoad() {
    try {
      const v = wx.getStorageSync(KEY);
      this.store =
        v && Array.isArray(v.trips) && Array.isArray(v.souvenirs)
          ? v
          : sample();
    } catch (e) {
      this.store = sample();
    }
    this.persistedFiles = filePaths(this.store);
    this.refresh();
  },
  refresh() {
    const trips = this.store.trips;
    const active = trips.find((t) => t.id === this.activeId) || trips[0];
    this.activeId = active && active.id;
    const all = trips.flatMap((t) =>
      t.stops.flatMap((s) =>
        s.photos.map((url) => ({ ...s, url, city: t.city, tripId: t.id })),
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
          ...active.photos.map((url) => ({
            url,
            date: active.date,
            time: "",
            name: active.title,
            kind: "普通",
          })),
          ...active.stops.flatMap((s) =>
            s.photos.map((url) => ({ ...s, url })),
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
        .map((t) => ({
          ...t,
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
      photos,
      photoUrls: photos.map((p) => p.url),
      dates: ["全部", ...dates],
      stops: active
        ? active.stops
            .filter((s) => this.data.day === "全部" || s.date === this.data.day)
            .slice()
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        : [],
      lights,
      souvenirs: this.store.souvenirs,
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
    this.setData({ tab, detail: false });
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
      success: (p) =>
        this.setData({
          "form.city": this.data.form.city || p.name,
          "form.latitude": String(p.latitude),
          "form.longitude": String(p.longitude),
        }),
      fail: () =>
        wx.showToast({ title: "可手动填写城市和经纬度", icon: "none" }),
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
    this.setData({ detail: true, mode: "film", day: "全部", tilt: 0 });
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
      this.setData({ detail: true, mode: "film", day: "全部" });
      this.refresh();
    }
  },
  closeCity() {
    this.setData({ citySheet: null });
  },
  back() {
    this.setData({ detail: false });
  },
  scope(e) {
    this.setData({ scope: e.currentTarget.dataset.value });
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
        this.setData({ detail: false });
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
            trips: before.trips.filter((t) => t.id !== "demo"),
            souvenirs: before.souvenirs.filter((s) => s.tripId !== "demo"),
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
  openDesign(){wx.navigateTo({url:"/pages/preview/preview"});},
  onShareAppMessage() {
    return { title: "旅迹 · 收藏走过的世界", path: "/pages/index/index" };
  },
});
