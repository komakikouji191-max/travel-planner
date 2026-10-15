const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
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
  assert.equal(p.data.sunrises, 1);
  assert.equal(p.data.sunsets, 1);
  assert.equal(p.data.markers.length, 1);
  p.filter({ currentTarget: { dataset: { value: "日出" } } });
  assert.equal(p.data.lights.length, 1);
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
