// sections/aprendizaje.js — Vinculación · Aprendizaje + Servicios
const SecAprendizaje = {
  id:"aprendizaje", title:"Vinculación con el Medio · Aprendizaje + Servicios",
  sub:"Proyectos A+S por año, rubro, asignatura, satisfacción y continuidad",
  f:{anio:"",semestre:"",carrera:"",asignatura:"",rubro:""}, rows:[],

  tableRows(){ try{ return this.filtered(); }catch(e){ return this.rows||[]; } },
  allRows(){ return this.rows||[]; },
  async render(root){
    this.rows = await DataStore.load("aprendizaje");
    root.innerHTML = UI.title(this.title,this.sub) +
      `<div id="as-filtros"></div><div id="as-vb"></div>
       <div class="grid-2">
         ${UI.plotBox("Proyectos por Año","plot_as_anio",300)}
         ${UI.plotBox("Proyectos por Rubro","plot_as_rubro",300)}
       </div>
       <div class="grid-2">
         ${UI.plotBox("Proyectos por Asignatura","plot_as_asig",300)}
         ${UI.plotBox("Satisfacción Promedio por Año","plot_as_sat",300)}
       </div>
       ${UI.plotBox("Continuidad por Rubro (%)","plot_as_cont",280)}
       ${UI.plotBox("Comparación por Carrera","plot_as_carrera",300)}`;
    this.filtros(); this.draw();
  },
  filtros(){
    const u=k=>Agg.uniq(this.rows,k).sort();
    const carreras = u("Carrera");
    const hayCarrera = carreras.length > 0;
    document.getElementById("as-filtros").innerHTML = UI.filters(
      UI.select("as-anio","Año",u("Año").sort((a,b)=>b-a)) +
      UI.select("as-sem","Semestre",u("Semestre")) +
      (hayCarrera ? UI.select("as-car","Carrera",carreras,"Todas") : "") +
      UI.select("as-asig","Asignatura",u("Asignatura"),"Todas") +
      UI.select("as-rub","Rubro",u("Rubro"),"Todos"), "as-clear");
    const map={"as-anio":"anio","as-sem":"semestre","as-car":"carrera","as-asig":"asignatura","as-rub":"rubro"};
    Object.keys(map).forEach(id=>{const el=document.getElementById(id);
      if(!el) return;
      el.value=this.f[map[id]]; el.onchange=e=>{this.f[map[id]]=e.target.value;this.draw();};});
    document.getElementById("as-clear").onclick=()=>{this.f={anio:"",semestre:"",carrera:"",asignatura:"",rubro:""};this.filtros();this.draw();};
  },
  filtered(){return this.rows.filter(r=>
    (!this.f.anio||String(r.Año)===this.f.anio)&&
    (!this.f.semestre||String(r.Semestre)===this.f.semestre)&&
    (!this.f.carrera||r.Carrera===this.f.carrera)&&
    (!this.f.asignatura||r.Asignatura===this.f.asignatura)&&
    (!this.f.rubro||r.Rubro===this.f.rubro));},
  draw(){
    const d=this.filtered(), V=CONFIG.VAL;
    const sat=d.length?(d.reduce((s,r)=>s+(+r["Satisfacción"]||0),0)/d.length).toFixed(2):0;
    const cont=d.length?(100*d.filter(r=>r.Continuidad===V.continuidadSi).length/d.length).toFixed(1):0;
    document.getElementById("as-vb").innerHTML = UI.vbRow([
      UI.valueBox(d.length,"Total Proyectos","blue"),
      UI.valueBox(new Set(d.map(r=>r.Empresa)).size,"Empresas","green"),
      UI.valueBox(sat,"Satisfacción Prom.","yellow"),
      UI.valueBox(cont+"%","Continuidad","purple")
    ]);
    const ids=["plot_as_anio","plot_as_rubro","plot_as_asig","plot_as_sat","plot_as_cont","plot_as_carrera"];
    if(!d.length){ids.forEach(emptyPlot);return;}
    const ca=Agg.countBy(d,r=>r.Año); const ak=[...ca.keys()].sort();
    Charts.bars(ids[0],ak,ak.map(k=>ca.get(k)),{yTitle:"Proyectos",color:CONFIG.COLORS.azulOscuro});
    const cr=Agg.countBy(d,r=>r.Rubro); const rk=[...cr.keys()].sort((a,b)=>cr.get(a)-cr.get(b));
    Charts.barsMulti(ids[1],rk,rk.map(k=>cr.get(k)),{horizontal:true});
    const cs=Agg.countBy(d,r=>r.Asignatura); const sk=[...cs.keys()].sort((a,b)=>cs.get(a)-cs.get(b));
    Charts.barsMulti(ids[2],sk,sk.map(k=>cs.get(k)),{horizontal:true,colors:sk.map(()=>CONFIG.COLORS.azul)});
    // Satisfacción media por año
    const byY={}; d.forEach(r=>{(byY[r.Año]=byY[r.Año]||[]).push(+r["Satisfacción"]||0);});
    const yk=Object.keys(byY).sort();
    Charts.lines(ids[3],yk,[{name:"Satisfacción",color:CONFIG.COLORS.tierra,
      y:yk.map(y=>+(byY[y].reduce((a,b)=>a+b,0)/byY[y].length).toFixed(2))}]);
    // Continuidad % por rubro con color por umbral
    const byR={}; d.forEach(r=>{(byR[r.Rubro]=byR[r.Rubro]||[]).push(r.Continuidad===V.continuidadSi?1:0);});
    const rk2=Object.keys(byR); const pct=rk2.map(r=>+(100*byR[r].reduce((a,b)=>a+b,0)/byR[r].length).toFixed(1));
    const ord=rk2.map((r,i)=>[r,pct[i]]).sort((a,b)=>b[1]-a[1]);
    Charts.barsMulti(ids[4],ord.map(o=>o[0]),ord.map(o=>o[1]),
      {yTitle:"% Continuidad",colors:ord.map(o=>o[1]>=70?CONFIG.COLORS.verde:o[1]>=50?CONFIG.COLORS.tierra:CONFIG.COLORS.rojo)});
    // Comparación por carrera: número de proyectos por carrera
    const hayCarrera = d.some(r => r.Carrera!=null && r.Carrera!=="");
    if(hayCarrera){
      const cc=Agg.countBy(d,r=>r.Carrera||"(sin carrera)"); const cck=[...cc.keys()].sort();
      Charts.barsMulti("plot_as_carrera",cck,cck.map(k=>cc.get(k)),
        {yTitle:"Proyectos",colors:cck.map((_,i)=>CONFIG.PALETTE[i%CONFIG.PALETTE.length])});
    } else {
      emptyPlot("plot_as_carrera","Sin columna Carrera en los datos");
    }
  }
};
window.SecAprendizaje = SecAprendizaje;
