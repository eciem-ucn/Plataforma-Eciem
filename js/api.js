// =============================================================================
// api.js — Cliente del backend (Cloudflare Worker). Reemplaza el acceso directo
// a Drive. El navegador ya no conoce API key ni ID de carpeta: solo la URL del
// Worker. La sesión viaja en una cookie httpOnly emitida por el backend.
// =============================================================================
const API = {
  base(){ return (window.SETTINGS && SETTINGS.API_BASE) || ""; },

  async _get(path){
    const r = await fetch(this.base()+path, { credentials:"include" });
    if (r.status === 401){ location.href = "login.html"; throw new Error("Sesión expirada"); }
    if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
    return r.json();
  },
  async _post(path, body){
    const r = await fetch(this.base()+path, {
      method:"POST", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body||{})
    });
    return r;
  },

  // --- auth ---
  async login(user, pass){
    const r = await this._post("/api/login", { user, pass });
    return r.ok;
  },
  async me(){ try{ return (await this._get("/api/me")).user; }catch{ return null; } },
  async logout(){ await this._post("/api/logout"); },

  // --- datos ---
  async dataset(key){ return (await this._get(`/api/dataset?key=${encodeURIComponent(key)}`)).rows || []; },
  async pdfs(folder){ return (await this._get(`/api/pdfs?folder=${encodeURIComponent(folder)}`)).pdfs || []; },
  fileUrl(id){ return `${this.base()}/api/file?id=${encodeURIComponent(id)}`; },
  async signature(){ return (await this._get("/api/signature")).signature || ""; }
};
window.API = API;

// ---- DataStore: misma interfaz que antes, ahora respaldada por el Worker ----
const DataStore = {
  cache:{}, lastSignature:"",
  async load(key){
    if (this.cache[key]) return this.cache[key];
    const rows = await API.dataset(key);
    this.cache[key] = rows;
    return rows;
  },
  async listPdfs(folder){ return API.pdfs(folder); },
  invalidate(){ this.cache = {}; },
  async refreshSignature(){ return API.signature(); }
};
window.DataStore = DataStore;

// ---- Agg: helpers de agregación usados por las secciones ----
// (reintroducidos en el frontend; el parseo de xlsx es del Worker, pero estos
//  cálculos siguen ocurriendo en el navegador sobre las filas ya recibidas)
const Agg = {
  sumBy(rows, keyFn, field){
    const m = new Map();
    for (const r of rows){
      const k = keyFn(r), v = Number(r[field]) || 0;
      m.set(k, (m.get(k)||0) + v);
    }
    return m;
  },
  countBy(rows, keyFn){
    const m = new Map();
    for (const r of rows){ const k = keyFn(r); m.set(k,(m.get(k)||0)+1); }
    return m;
  },
  sumFields(rows, keyFn, fields){
    const m = new Map();
    for (const r of rows){
      const k = keyFn(r);
      if (!m.has(k)) m.set(k, Object.fromEntries(fields.map(f=>[f,0])));
      const o = m.get(k);
      for (const f of fields) o[f] += Number(r[f])||0;
    }
    return m;
  },
  sum(rows, field){ let s=0; for(const r of rows) s+=Number(r[field])||0; return s; },
  uniq(rows, field){ return [...new Set(rows.map(r=>r[field]).filter(v=>v!=null&&v!==""))]; }
};
window.Agg = Agg;
