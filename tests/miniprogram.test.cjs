const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const pageRequire = createRequire(
  require("node:path").resolve("pages/index/index.js"),
);
const fs = require("node:fs");
const code = fs.readFileSync("pages/index/index.js", "utf8");
function harness(stored) {
  let definition,
    failStorage = false,
    failFiles = false,
    preview;
  const wx = {
    env: { USER_DATA_PATH: "wxfile://usr" },
    getStorageSync: () => structuredClone(stored),
    setStorageSync: (_, v) => {
      if (failStorage) throw Error("full");
      stored = structuredClone(v);
    },
    showToast() {},
    showModal: (o) => o.success({ confirm: true }),
    saveFile: (o) =>
      failFiles
        ? o.fail(Error("full"))
        : o.success({
            savedFilePath: `wxfile://usr/${o.tempFilePath.split("/").pop()}`,
          }),
    removeSavedFile() {},
    previewImage: (o) => {
      preview = o;
    },
  };
  vm.runInNewContext(code, {
    Page: (p) => {
      definition = p;
    },
    wx,
    require: pageRequire,
    console,
  });
  const p = { ...definition, data: structuredClone(definition.data) };
  p.setData = function (patch) {
    for (const [key, val] of Object.entries(patch)) {
      const parts = key.split(".");
      let o = this.data;
      for (const part of parts.slice(0, -1)) o = o[part];
      o[parts.at(-1)] = val;
    }
  };
  p.onLoad();
  return {
    p,
    wx,
    stored: () => stored,
    failStorage: () => {
      failStorage = true;
    },
    failFiles: () => {
      failFiles = true;
    },
    preview: () => preview,
  };
}
const event = (id) => ({ currentTarget: { dataset: { id } } });
async function addTrip(p, city = "杭州") {
  p.addTrip();
  Object.assign(p.data.form, {
    title: `${city}记忆`,
    city,
    country: "中国",
    latitude: "30.2",
    longitude: "120.1",
    date: "2026-05-01",
    end: "2026-05-03",
    photos: ["/tmp/cover.jpg"],
  });
  await p.save();
}
test("demo data, city markers, filters and tilt", () => {
  const { p } = harness();
  assert.equal(
    p.data.sunrises,
    p.store.trips.reduce(
      (n, t) => n + t.stops.filter((s) => s.kind === "日出").length,
      0,
    ),
  );
  assert.equal(
    p.data.sunsets,
    p.store.trips.reduce(
      (n, t) => n + t.stops.filter((s) => s.kind === "日落").length,
      0,
    ),
  );
  assert.equal(p.data.markers.length, p.store.trips.length);
  p.filter({ currentTarget: { dataset: { value: "日出" } } });
  assert.equal(
    p.data.lights.length,
    p.store.trips.reduce(
      (n, t) =>
        n +
        t.stops
          .filter((s) => s.kind === "日出")
          .reduce((m, s) => m + s.photos.length, 0),
      0,
    ),
  );
  p.touchStart({ touches: [{ clientX: 0 }] });
  p.touchMove({ touches: [{ clientX: 400 }] });
  assert.equal(p.data.tilt, 5);
  p.touchEnd();
  assert.equal(p.data.tilt, 0);
});
test("trip, permanent photo save, light record, editing and delete persist", async () => {
  const h = harness({ demo: false, trips: [], souvenirs: [] }),
    p = h.p;
  await addTrip(p);
  assert.equal(p.data.trips.length, 1);
  assert.equal(p.data.photoCount, 1);
  assert.equal(p.data.photos[0].url, "wxfile://usr/cover.jpg");
  p.addStop();
  Object.assign(p.data.form, {
    name: "湖边晚霞",
    date: "2026-05-02",
    kind: "日落",
    photos: ["/tmp/sunset.jpg"],
  });
  await p.save();
  assert.equal(p.data.sunsets, 1);
  assert.equal(p.data.photoCount, 2);
  let stop = p.data.active.stops[0];
  p.editStop(event(stop.id));
  p.data.form.note = "晚风";
  await p.save();
  assert.equal(p.data.active.stops.length, 1);
  assert.equal(p.data.active.stops[0].note, "晚风");
  assert.equal(
    h.stored().trips[0].stops[0].photos[0],
    "wxfile://usr/sunset.jpg",
  );
  p.preview({
    currentTarget: {
      dataset: { url: p.data.photoUrls[0], urls: p.data.photoUrls },
    },
  });
  assert.equal(h.preview().urls.length, 2);
  p.deleteStop(event(stop.id));
  assert.equal(p.data.sunsets, 0);
  assert.equal(p.data.active.stops.length, 0);
});
test("input errors do not create records", async () => {
  const { p } = harness({ demo: false, trips: [], souvenirs: [] });
  p.addTrip();
  await p.save();
  assert.ok(p.data.error);
  assert.equal(p.store.trips.length, 0);
  Object.assign(p.data.form, {
    title: "测试",
    city: "杭州",
    country: "中国",
    latitude: "bad",
    longitude: "120",
    date: "2026-02-28",
    end: "2026-03-02",
  });
  await p.save();
  assert.ok(p.data.error);
  p.data.form.latitude = "30";
  p.data.form.date = "2026-02-31";
  await p.save();
  assert.ok(p.data.error);
  assert.equal(p.store.trips.length, 0);
});
test("souvenir import, delete and reload", async () => {
  const h = harness({ demo: false, trips: [], souvenirs: [] }),
    p = h.p;
  await addTrip(p);
  p.addSouvenir();
  p.data.form.name = "冰箱贴";
  await p.save();
  assert.ok(p.data.error);
  p.data.form.photos = ["/tmp/magnet.jpg"];
  await p.save();
  assert.equal(p.data.souvenirs.length, 1);
  const r = harness(h.stored());
  assert.equal(r.p.data.souvenirs[0].city, "杭州");
  r.p.viewSouvenir(event(r.p.data.souvenirs[0].id));
  r.p.deleteSouvenir();
  assert.equal(r.p.store.souvenirs.length, 0);
});
test("file and storage failures preserve previous records", async () => {
  for (const fault of ["failFiles", "failStorage"]) {
    const h = harness({ demo: false, trips: [], souvenirs: [] });
    h[fault]();
    await addTrip(h.p);
    assert.equal(h.p.store.trips.length, 0);
    assert.ok(h.p.data.error);
    assert.equal(h.p.data.saving, false);
  }
});
test("removing demo preserves user records and deleting trip removes related collection", async () => {
  const h = harness(),
    p = h.p;
  await addTrip(p);
  p.clearDemo();
  assert.equal(p.store.trips.length, 1);
  assert.equal(p.store.demo, false);
  p.addSouvenir();
  p.data.form.name = "明信片";
  p.data.form.photos = ["/tmp/card.jpg"];
  await p.save();
  p.deleteTrip();
  assert.equal(p.store.trips.length, 0);
  assert.equal(p.store.souvenirs.length, 0);
});
test("record date must fit trip and shortening dates cannot orphan records", async () => {
  const { p } = harness({ demo: false, trips: [], souvenirs: [] });
  await addTrip(p);
  p.addStop();
  Object.assign(p.data.form, { name: "湖边", date: "2026-06-01" });
  await p.save();
  assert.ok(p.data.error);
  assert.equal(p.store.trips[0].stops.length, 0);
  p.data.form.date = "2026-05-03";
  await p.save();
  p.editTrip();
  p.data.form.end = "2026-05-02";
  await p.save();
  assert.ok(p.data.error);
  assert.equal(p.store.trips[0].end, "2026-05-03");
});

test("city map groups repeated trips and WXML handlers exist", async () => {
  const { p } = harness({ demo: false, trips: [], souvenirs: [] });
  await addTrip(p);
  await addTrip(p);
  assert.equal(p.data.markers.length, 1);
  p.markerTap({ detail: { markerId: 0 } });
  assert.equal(p.data.citySheet.trips.length, 2);
  const markup = fs.readFileSync("pages/index/index.wxml", "utf8");
  for (const match of markup.matchAll(
    /bind(?:tap|change|input|touchstart|touchmove|touchend|touchcancel|markertap)="([A-Za-z]+)"/g,
  )) {
    assert.equal(typeof p[match[1]], "function", match[1]);
  }
});

test("reference navigation keeps atlas city IDs and opens dedicated Trips timeline", () => {
  const { p } = harness();
  p.data.atlasPoints = [{ id: "demo" }];
  p.atlasCityTap({ currentTarget: { dataset: { index: 0 } } });
  assert.equal(p.data.active.id, "demo");
  assert.equal(p.data.detailTab, "Overview");
  assert.equal(p.data.timelineOnly, false);
  p.openItinerary(event("demo"));
  assert.equal(p.data.timelineOnly, true);
  assert.equal(p.data.day, p.data.active.stops[0].date);
  assert.equal(p.data.itineraryDays.length, 7);
  assert.ok(p.data.stops.every((s) => s.date === p.data.day));
  p.openViewer({ currentTarget: { dataset: { index: 1 } } });
  assert.equal(p.data.viewerIndex, 1);
  p.fullPhoto();
  assert.equal(p.data.fullPhoto, true);
  p.closeViewer();
  assert.equal(p.data.viewer, false);
});
test("province lookup, full-world projection and region hit-testing use geometry", () => {
  const A = pageRequire("../../utils/atlas");
  const china = pageRequire("../../utils/atlas-data").china;
  const t = {
    id: "a",
    city: "大理",
    country: "中国",
    latitude: 25.6065,
    longitude: 100.2676,
    date: "2026-01-01",
    end: "2026-01-02",
    photos: [],
    stops: [],
  };
  assert.equal(A.regionFor(t, "中国"), "云南省");
  assert.equal(A.regionFor(t, "世界"), "China");
  assert.equal(china.length, 34);
  const m = A.model({ trips: [t] }, "中国", "provinces");
  assert.equal(m.counts["云南省"].size, 1);
  const projection = A.projection(m, 375, 330),
    point = projection([t.longitude, t.latitude]);
  assert.ok(point.every(Number.isFinite));
  assert.ok(point[0] > 0 && point[0] < 375 && point[1] > 0 && point[1] < 330);
  const shapes = china.map((f) => ({
    name: f.name,
    rings: f.rings.map((r) => r.map(projection)),
  }));
  assert.equal(A.hit(shapes, ...point), "云南省");
  const world = A.model({ trips: [t] }, "世界", "cities");
  assert.ok(world.features.length > 200);
  assert.equal(world.days, 2);
});
test("country fill deepens by distinct cities, independent of repeated trips", () => {
  const A = pageRequire("../../utils/atlas");
  const t = {
    id: "a",
    city: "大理",
    country: "中国",
    latitude: 25.6,
    longitude: 100.2,
    date: "2026-01-01",
    end: "2026-01-01",
    photos: [],
    stops: [],
  };
  const store = {
    trips: [
      t,
      { ...t, id: "b" },
      { ...t, id: "c", city: "杭州", latitude: 30.27, longitude: 120.15 },
    ],
  };
  const m = A.model(store, "世界", "cities");
  assert.equal(m.counts.China.size, 2);
  assert.equal(m.cities.length, 2);
});
test("light city and souvenir continent filters affect visible records only", () => {
  const { p } = harness();
  p.setSouvenirFilter({ currentTarget: { dataset: { value: "Europe" } } });
  assert.equal(p.data.visibleSouvenirs.length, 0);
  assert.ok(p.data.souvenirs.length > 0);
  p.setSouvenirFilter({ currentTarget: { dataset: { value: "China" } } });
  assert.equal(p.data.visibleSouvenirs.length, p.data.souvenirs.length);
  p.setLightCity({ detail: { value: 1 } });
  assert.ok(p.data.lights.every((x) => x.city === p.data.lightCities[1]));
});

test("WXML bindings never contain split string literals", () => {
  const markup = fs.readFileSync("pages/index/index.wxml", "utf8");
  let count = 0;
  for (const match of markup.matchAll(/{{([\s\S]*?)}}/g)) {
    const expr = match[1].replaceAll("&amp;", "&");
    assert.ok(!/[\r\n]/.test(expr), "Multiline WXML binding: " + expr);
    assert.doesNotThrow(() => new vm.Script("(" + expr + ")"));
    count++;
  }
  assert.ok(count > 100);
});

test("zoom keeps the anchor fixed, clamps extremes and inverts hit coordinates", () => {
  const G = pageRequire("../../utils/gestures");
  let v = G.identity(),
    anchor = [185, 140];
  const before = G.invert(anchor, v);
  v = G.zoomAt(v, 2, anchor);
  assert.equal(v.zoom, 2);
  assert.deepEqual(G.invert(anchor, v), before);
  const q = [50, 80];
  assert.deepEqual(G.invert(G.apply(q, v), v), q);
  assert.equal(G.zoomAt(v, 100, anchor).zoom, 4);
  assert.equal(G.zoomAt(v, 0.001, anchor).zoom, 0.7);
  const { p } = harness({ demo: false, trips: [], souvenirs: [] });
  p.atlasRect = { width: 375, height: 330, left: 0, top: 0 };
  p.atlasWheel({ detail: { deltaY: -120 } });
  assert.ok(p.data.atlasZoom > 100);
  p.atlasWheel({ detail: { deltaY: 240 } });
  assert.ok(p.data.atlasZoom < 125);
  p.resetZoom();
  assert.equal(p.data.atlasZoom, 100);
  p._wheelTop = 15000;
  p.atlasWheelScroll({ detail: { scrollTop: 14900 } });
  assert.ok(p.data.atlasZoom > 100);
  p.resetZoom();
  p.atlasGestureStart({
    touches: [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ],
  });
  p.atlasGestureMove({
    touches: [
      { x: 50, y: 100 },
      { x: 250, y: 100 },
    ],
  });
  assert.equal(p.data.atlasZoom, 200);
  p.atlasGestureEnd({ changedTouches: [] });
  assert.equal(p.data.atlasDragging, false);
});
test("every photographed light session gets its own point and uses a pin or city fallback", () => {
  const A = pageRequire("../../utils/atlas");
  const t = {
    id: "trip",
    city: "Dali",
    country: "中国",
    latitude: 25.6,
    longitude: 100.2,
    date: "2026-01-01",
    end: "2026-02-01",
    photos: [],
    stops: [
      {
        id: "a",
        kind: "日落",
        date: "2026-01-02",
        time: "18:30",
        photos: ["a.jpg"],
        latitude: 25.7,
        longitude: 100.3,
      },
      {
        id: "b",
        kind: "日出",
        date: "2026-01-03",
        time: "06:20",
        photos: ["b.jpg"],
      },
      {
        id: "c",
        kind: "日落",
        date: "2026-02-01",
        time: "18:40",
        photos: ["c.jpg"],
      },
      {
        id: "empty",
        kind: "日出",
        date: "2026-01-01",
        time: "06:20",
        photos: [],
      },
    ],
  };
  const points = A.lightFootprints({ trips: [t] }, 1);
  assert.equal(points.length, 2);
  assert.equal(points[0].latitude, 25.7);
  assert.equal(points[1].latitude, 25.6);
  assert.equal(A.lightModel({ trips: [t] }, 12).cities.length, 3);
  assert.deepEqual(
    points.map((p) => p.stopId),
    ["a", "b"],
  );
});
test("photo-location pin persists and is validated before saving", async () => {
  const { p } = harness({ demo: false, trips: [], souvenirs: [] });
  await addTrip(p);
  p.addStop();
  Object.assign(p.data.form, {
    name: "Dawn by the lake",
    kind: "日出",
    photos: ["/tmp/dawn.jpg"],
    latitude: "25.7",
    longitude: "100.3",
  });
  await p.save();
  const stop = p.data.active.stops[0];
  assert.equal(stop.latitude, 25.7);
  assert.equal(stop.longitude, 100.3);
  p.addStop();
  Object.assign(p.data.form, {
    name: "Bad location",
    latitude: "95",
    longitude: "100",
  });
  await p.save();
  assert.ok(p.data.error);
  assert.equal(p.data.active.stops.length, 1);
});
test("demo enrichment is additive, idempotent and disabled for personal journals", () => {
  const D = pageRequire("../../utils/demo");
  const personal = { demo: false, trips: [], souvenirs: [] };
  D.enrich(personal);
  assert.equal(personal.trips.length, 0);
  const t = { id: "personal-trip", city: "My city", photos: [], stops: [] };
  const mixed = { demo: true, trips: [t], souvenirs: [{ id: "kept" }] };
  D.enrich(mixed);
  assert.ok(mixed.trips.length > 8);
  assert.equal(mixed.trips[0], t);
  assert.equal(mixed.souvenirs[0].id, "kept");
  const count = mixed.trips.length;
  D.enrich(mixed);
  assert.equal(mixed.trips.length, count);
});
test("mouse motion changes film tilt without changing navigation or personal records", () => {
  const { p } = harness();
  p.openTrip(event("demo"));
  const snapshot = JSON.stringify(p.store);
  p.filmMouseMove({ detail: { clientX: 375 } });
  assert.equal(p.data.tilt, 5);
  p.filmMouseMove({ detail: { clientX: 0 } });
  assert.equal(p.data.tilt, -5);
  p.filmMouseLeave();
  assert.equal(p.data.tilt, 0);
  assert.equal(JSON.stringify(p.store), snapshot);
  assert.equal(p.data.detail, true);
});

test("expanded preview contains at least ten countries and all bundled demo images exist", () => {
  const { p } = harness();
  assert.ok(p.data.countryCount >= 10);
  assert.ok(p.data.cityCount >= 15);
  const A = pageRequire("../../utils/atlas");
  assert.ok(A.lightFootprints(p.store).length >= 20);
  for (const trip of p.store.trips) {
    for (const url of [
      ...trip.photos,
      ...trip.stops.flatMap((s) => s.photos),
    ]) {
      if (url.startsWith("/assets/"))
        assert.ok(fs.existsSync(url.slice(1)), url);
    }
  }
});
