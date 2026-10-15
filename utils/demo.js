// Additive, clearly labelled preview content. Never run for a personal (demo:false) journal.
const VERSION = 3;
const destinations = [
  ["Hangzhou", "杭州", "中国", 30.2741, 120.1551, "2026-05-01", "blue-town"],
  ["Chengdu", "成都", "中国", 30.5728, 104.0668, "2026-05-12", "blue-town"],
  ["Beijing", "北京", "中国", 39.9042, 116.4074, "2026-06-03", "kyoto"],
  ["Kyoto", "京都", "日本", 35.0116, 135.7681, "2026-03-04", "kyoto"],
  ["Paris", "巴黎", "法国", 48.8566, 2.3522, "2025-09-10", "santorini"],
  ["Rome", "罗马", "意大利", 41.9028, 12.4964, "2025-09-18", "santorini"],
  [
    "Istanbul",
    "伊斯坦布尔",
    "土耳其",
    41.0082,
    28.9784,
    "2025-08-03",
    "sunset",
  ],
  ["Sydney", "悉尼", "澳大利亚", -33.8688, 151.2093, "2025-12-04", "sunrise"],
  ["Auckland", "奥克兰", "新西兰", -36.8485, 174.7633, "2025-12-14", "sunset"],
  [
    "San Francisco",
    "旧金山",
    "美国",
    37.7749,
    -122.4194,
    "2025-05-18",
    "new-york",
  ],
];
function lightStops(t, photo) {
  return [
    {
      id: t.id + "-dawn",
      name: "First light · " + t.city,
      date: t.date,
      time: "06:20",
      kind: "日出",
      note: "DEMO · A quiet morning, kept forever.",
      photos: ["/assets/sunrise.jpg", "/assets/" + photo + ".jpg"],
      latitude: t.latitude + 0.015,
      longitude: t.longitude - 0.015,
    },
    {
      id: t.id + "-dusk",
      name: "Last light · " + t.city,
      date: t.date,
      time: "18:40",
      kind: "日落",
      note: "DEMO · The sky was worth the wait.",
      photos: ["/assets/sunset.jpg", "/assets/" + photo + ".jpg"],
      latitude: t.latitude - 0.015,
      longitude: t.longitude + 0.015,
    },
  ];
}
function enrich(store) {
  if (!store.demo || store.demoVersion >= VERSION) return store;
  destinations.forEach((a) => {
    const id = "demo-preview-" + a[0].toLowerCase().replace(/ /g, "-");
    if (store.trips.some((t) => t.id === id)) return;
    const t = {
      id,
      city: a[1],
      country: a[2],
      latitude: a[3],
      longitude: a[4],
      date: a[5],
      end: a[5],
      title: a[0] + " · A chapter of light",
      note: "DEMO JOURNAL\nSome places stay with you.",
      photos: ["/assets/" + a[6] + ".jpg"],
      stops: [],
    };
    t.stops = lightStops(t, a[6]);
    store.trips.push(t);
  });
  store.trips
    .filter((t) => /^demo-[0-9]+$/.test(t.id) && t.stops.length === 0)
    .forEach((t) => {
      const photo =
        t.city === "东京"
          ? "kyoto"
          : t.city === "圣托里尼"
            ? "santorini"
            : t.city === "纽约"
              ? "new-york"
              : "blue-town";
      t.stops = lightStops(t, photo);
    });
  const coverUpdates = {
    "demo-0": ["/assets/blue-town.jpg", "/assets/kyoto.jpg"],
    "demo-2": ["/assets/sunset.jpg", "/assets/santorini.jpg"],
    "demo-3": ["/assets/blue-town.jpg", "/assets/new-york.jpg"],
  };
  store.trips.forEach((t) => {
    const pair = coverUpdates[t.id];
    if (pair && t.photos.length === 1 && t.photos[0] === pair[0])
      t.photos = [pair[1]];
  });
  store.demoVersion = VERSION;
  return store;
}
module.exports = { enrich, VERSION };
