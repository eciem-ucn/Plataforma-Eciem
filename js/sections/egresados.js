// sections/egresados.js — Docencia de Pregrado · Egresados
const SecEgresados = {
  id:"egresados", title:"Docencia de Pregrado · Egresados",
  sub:"Egresados por año, carrera, director y área de especialización",
  f:{anio:"",carrera:"",director:"",area:""}, rows:[],

  async render(root){
    this.rows = await DataStore.load("egresados");
    root.innerHTML = UI.title(this.title,this.sub) +
      `<div id="eg-filtros"></div><div id="eg-vb"></div>
       <div class="grid-2">
         ${UI.plotBox("Evolución de Egresados por Año","plot_eg_evo",300)}
         ${UI.plotBox("Egresados por Área","plot_eg_area",300)}
       </div>
       <div class="grid-2">
         ${UI.plotBox("Egresados por Director","plot_eg_dir",300)}
         ${UI.plotBox("Distribución por Área","plot_eg_pie",300)}
       </div>`;
    this.filtros(); this.draw();
  },
  filtros(){
    const u=k=>Agg.uniq(this.rows,k).sort();
    document.getElementById("eg-filtros").innerHTML = UI.filters(
      UI.select("eg-anio","Año",u("Año").sort((a,b)=>b-a)) +
      UI.select("eg-car","Carrera",u("Carrera"),"Todas") +
      UI.select("eg-dir","Director",u("Director")) +
      UI.select("eg-area","Área",u("Área"),"Todas"), "eg-clear");
    const map={"eg-anio":"anio","eg-car":"carrera","eg-dir":"director","eg-area":"area"};
    Object.keys(map).forEach(id=>{const el=document.getElementById(id);
      el.value=this.f[map[id]]; el.onchange=e=>{this.f[map[id]]=e.target.value;this.draw();};});
    document.getElementById("eg-clear").onclick=()=>{this.f={anio:"",carrera:"",director:"",area:""};this.filtros();this.draw();};
  },
  filtered(){return this.rows.filter(r=>
    (!this.f.anio||String(r.Año)===this.f.anio)&&
    (!this.f.carrera||r.Carrera===this.f.carrera)&&
    (!this.f.director||r.Director===this.f.director)&&
    (!this.f.area||r["Área"]===this.f.area));},
  draw(){
    const d=this.filtered();
    const anioActual=Math.max(...this.rows.map(r=>+r.Año||0)); const anioAnt=anioActual-1;
    document.getElementById("eg-vb").innerHTML = UI.vbRow([
      UI.valueBox(d.length,"Total Egresados","blue"),
      UI.valueBox(d.filter(r=>+r.Año===anioAnt).length,`Egresados ${anioAnt}`,"green"),
      UI.valueBox(Agg.uniq(d,"Director").length,"Directores Activos","yellow"),
      UI.valueBox(Agg.uniq(d,"Área").length,"Áreas de Especialización","purple")
    ]);
    if(!d.length){["plot_eg_evo","plot_eg_area","plot_eg_dir","plot_eg_pie"].forEach(emptyPlot);return;}
    const evo=Agg.countBy(d,r=>r.Año); const ea=[...evo.keys()].sort();
    Charts.bars("plot_eg_evo",ea,ea.map(k=>evo.get(k)),{yTitle:"Egresados",color:CONFIG.COLORS.azulOscuro});
    const area=Agg.countBy(d,r=>r["Área"]); const ak=[...area.keys()].sort((a,b)=>area.get(a)-area.get(b));
    Charts.barsMulti("plot_eg_area",ak,ak.map(k=>area.get(k)),{horizontal:true,colors:ak.map(()=>CONFIG.COLORS.azul)});
    const dir=Agg.countBy(d,r=>r.Director); const dk=[...dir.keys()].sort((a,b)=>dir.get(a)-dir.get(b));
    Charts.barsMulti("plot_eg_dir",dk,dk.map(k=>dir.get(k)),{horizontal:true,colors:dk.map(()=>CONFIG.COLORS.tierra)});
    const pk=[...area.keys()]; Charts.pieCat("plot_eg_pie",pk,pk.map(k=>area.get(k)));
  }
};
window.SecEgresados = SecEgresados;
