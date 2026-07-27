// sections/permisos.js — Gestión · Permisos de Ausencia
const SecPermisos = {
  id:"permisos", title:"Gestión · Permisos de Ausencia",
  sub:"Permisos por tipo, año, mes y persona",
  f:{anio:"",mes:"",nombre:"",tipo:""}, rows:[],
  FI:"Fecha Inicio", FF:"Fecha Fin",
  MESES:["01","02","03","04","05","06","07","08","09","10","11","12"],

  // Excel puede entregar fechas como serial numérico o string; normalizamos a Date.
  toDate(v){
    if(v==null||v==="") return null;
    if(typeof v==="number"){ const d=XLSX.SSF.parse_date_code(v);
      return d? new Date(d.y,d.m-1,d.d): null; }
    const d=new Date(v); return isNaN(d)?null:d;
  },
  prep(){
    return this.rows.map(r=>{
      const fi=this.toDate(r[this.FI]), ff=this.toDate(r[this.FF]);
      const dias=(fi&&ff)? Math.round((ff-fi)/86400000)+1 : (+r.Dias||0);
      const mes=fi? String(fi.getMonth()+1).padStart(2,"0") : "";
      return {...r, _fi:fi, Dias:dias, _mes:mes};
    });
  },
  async render(root){
    this.rows = await DataStore.load("permisos");
    root.innerHTML = UI.title(this.title,this.sub) +
      `<div id="pm-filtros"></div><div id="pm-vb"></div>
       ${UI.plotBox("Días por Persona y Tipo","plot_pm_hist",350)}
       <div class="grid-2">
         ${UI.plotBox("Distribución por Tipo","plot_pm_tipo",300)}
         ${UI.plotBox("Permisos y Días por Año","plot_pm_anio",300)}
       </div>
       ${UI.plotBox("Top Personas por Días","plot_pm_top",280)}`;
    this.filtros(); this.draw();
  },
  filtros(){
    const p=this.prep();
    const u=k=>[...new Set(p.map(r=>r[k]).filter(v=>v!=null&&v!==""))].sort();
    document.getElementById("pm-filtros").innerHTML = UI.filters(
      UI.select("pm-anio","Año",u("Año").sort((a,b)=>b-a)) +
      UI.select("pm-mes","Mes",this.MESES.filter(m=>p.some(r=>r._mes===m))) +
      UI.select("pm-nom","Nombre",u("Nombre")) +
      UI.select("pm-tipo","Tipo",u("Tipo")), "pm-clear");
    const map={"pm-anio":"anio","pm-mes":"mes","pm-nom":"nombre","pm-tipo":"tipo"};
    Object.keys(map).forEach(id=>{const el=document.getElementById(id);
      el.value=this.f[map[id]]; el.onchange=e=>{this.f[map[id]]=e.target.value;this.draw();};});
    document.getElementById("pm-clear").onclick=()=>{this.f={anio:"",mes:"",nombre:"",tipo:""};this.filtros();this.draw();};
  },
  filtered(){return this.prep().filter(r=>
    (!this.f.anio||String(r.Año)===this.f.anio)&&
    (!this.f.mes||r._mes===this.f.mes)&&
    (!this.f.nombre||r.Nombre===this.f.nombre)&&
    (!this.f.tipo||r.Tipo===this.f.tipo));},
  draw(){
    const d=this.filtered();
    const diasTot=Agg.sum(d,"Dias");
    const prom=d.length?(diasTot/d.length).toFixed(1):0;
    document.getElementById("pm-vb").innerHTML = UI.vbRow([
      UI.valueBox(d.length,"Total Permisos","blue"),
      UI.valueBox(diasTot,"Días Totales","green"),
      UI.valueBox(prom,"Promedio Días","yellow"),
      UI.valueBox(new Set(d.map(r=>r.Nombre)).size,"Personas","purple")
    ]);
    const ids=["plot_pm_hist","plot_pm_tipo","plot_pm_anio","plot_pm_top"];
    if(!d.length){ids.forEach(emptyPlot);return;}
    // Días por persona y tipo (apilado)
    const tipos=[...new Set(d.map(r=>r.Tipo))];
    const totPorPersona={}; d.forEach(r=>totPorPersona[r.Nombre]=(totPorPersona[r.Nombre]||0)+r.Dias);
    const personas=Object.keys(totPorPersona).sort((a,b)=>totPorPersona[b]-totPorPersona[a]);
    const series=tipos.map(t=>({name:t,y:personas.map(p=>
      d.filter(r=>r.Nombre===p&&r.Tipo===t).reduce((s,r)=>s+r.Dias,0))}));
    Charts.stackedByGroup(ids[0],personas,series,{yTitle:"Días"});
    // Por tipo (pie)
    const tp=Agg.countBy(d,r=>r.Tipo); const tk=[...tp.keys()];
    Charts.pieCat(ids[1],tk,tk.map(k=>tp.get(k)));
    // Permisos (barras) + días (línea) por año
    const cA=Agg.countBy(d,r=>r.Año), dA=Agg.sumBy(d,r=>r.Año,"Dias");
    const ak=[...cA.keys()].sort();
    Charts.barsWithLine(ids[2],ak,ak.map(k=>cA.get(k)),ak.map(k=>dA.get(k)),
      {barName:"Permisos",lineName:"Días",yTitle:"Permisos",y2Title:"Días"});
    // Top personas por días
    const tk2=personas.slice().reverse();
    Charts.barsMulti(ids[3],tk2,tk2.map(p=>totPorPersona[p]),{horizontal:true,xTitle:"Días",colors:tk2.map(()=>CONFIG.COLORS.azulOscuro)});
  }
};
window.SecPermisos = SecPermisos;
