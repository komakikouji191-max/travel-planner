// Demo media is deliberately outside the code package, loaded on demand.
// Pin an immutable, already-published revision so future commits cannot change the artwork.
const REVISION='52787f34af1c905dc8381d2e843020f27ef3481d';
const NAMES=['blue-town.jpg','chime.png','cork.jpg','kyoto.jpg','lake.jpg','new-york.jpg','postcard.jpg','santorini.jpg','sunrise.jpg','sunset.jpg'];
const CDN=`https://cdn.jsdelivr.net/gh/komakikouji191-max/travel-planner@${REVISION}/assets/`;
const ORIGIN=`https://raw.githubusercontent.com/komakikouji191-max/travel-planner/${REVISION}/assets/`;
const overrides={};
function url(name){if(!NAMES.includes(name))throw new Error('Unknown demo media: '+name);return overrides[name]||CDN+name;}
function nameFor(value){if(typeof value!=='string')return '';const prefix=value.startsWith('/assets/')?'/assets/':value.startsWith(CDN)?CDN:value.startsWith(ORIGIN)?ORIGIN:'';const name=prefix?value.slice(prefix.length):'';return NAMES.includes(name)?name:'';}
function resolve(value){const name=nameFor(value);return name?url(name):value;}
function resolveStore(store){
 // Only replace known packaged demonstration artwork. Personal saved-file paths and URLs stay intact.
 store.trips.forEach(t=>{t.photos=t.photos.map(resolve);t.stops.forEach(s=>{s.photos=s.photos.map(resolve);});});
 store.souvenirs.forEach(s=>{s.photos=s.photos.map(resolve);});return store;
}
function failover(value){const name=nameFor(value);if(!name||value.startsWith(ORIGIN))return false;overrides[name]=ORIGIN+name;return true;}
function ui(){return{cork:url('cork.jpg')};}
module.exports={REVISION,NAMES,url,resolve,resolveStore,failover,ui};
