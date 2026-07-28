// =============================================================================
// sections/oferta.js — PLANTILLA COMPLETA. Replica "Oferta Académica" del Shiny.
// Usar esta estructura para los demás módulos.
// =============================================================================
const SecOferta = {
  id: "oferta",
  title: "Docencia de Pregrado · Oferta Académica",
  sub: "Cupos, demanda y resultados académicos por asignatura y período",

  // Estado de filtros de la sección
  f: { anio:"", semestre:"", carrera:"", asignatura:"" },

  // ---- render: pinta el layout y engancha eventos ----
  async render(root){
    root.innerHTML = UI.title(this.title, this.sub) +
      `<div id="of-filtros"></div>` +
      `<div id="of-vb"></div>` +
      `<div class="grid-2">
         ${UI.plotBox("Cupos vs Demanda por Asignatura","plot_of_cupos",360)}
         ${UI.plotBox("Composición de Resultados","plot_of_comp",380)}
       </div>
       <div class="grid-2">
         ${UI.plotBox("Distribución de Resultados","plot_of_res",300)}
         ${UI.plotBox("Evolución Histórica","plot_of_evo",300)}
       </div>
       ${UI.plotBox("Comparación por Carrera","plot_of_carrera",320)}`;
    await this.build();
  },

  async build(){
    const oferta = await DataStore.load("oferta");
    const res    = await DataStore.load("resultados");
    const rows   = this.computeRenuncias(res);
    this._rows = rows;   // para la pestaña de tabla de datos

    // Filtros (choices desde datos)
    const anios = Agg.uniq(oferta,"Año").sort((a,b)=>b-a);
    const asigs = Agg.uniq(oferta,"Asignatura").sort();
    const carreras = Agg.uniq(rows,"Carrera").sort();
    const hayCarrera = carreras.length > 0;
    document.getElementById("of-filtros").innerHTML = UI.filters(
      UI.select("of-anio","Año",anios) +
      UI.select("of-sem","Semestre",[1,2]) +
      (hayCarrera ? UI.select("of-car","Carrera",carreras,"Todas") : "") +
      UI.select("of-asig","Asignatura",asigs,"Todas"),
      "of-clear"
    );
    ["of-anio","of-sem","of-car","of-asig"].forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;  // of-car puede no existir si no hay columna Carrera
      el.value =
        id==="of-anio"?this.f.anio : id==="of-sem"?this.f.semestre :
        id==="of-car"?this.f.carrera : this.f.asignatura;
      el.onchange = e => {
        if(id==="of-anio") this.f.anio=e.target.value;
        else if(id==="of-sem") this.f.semestre=e.target.value;
        else if(id==="of-car") this.f.carrera=e.target.value;
        else this.f.asignatura=e.target.value;
        this.draw(rows);
      };
    });
    document.getElementById("of-clear").onclick = () => {
      this.f={anio:"",semestre:"",carrera:"",asignatura:""}; this.build();
    };
    this.draw(rows);
  },

  // Renuncias = Inscritos - Aprobados - Reprobados (>=0), como en el Shiny
  computeRenuncias(res){
    return res.map(r=>{
      const ren = Math.max(0,(Number(r.Inscritos)||0)-(Number(r.Aprobados)||0)-(Number(r.Reprobados)||0));
      return {...r, Renuncias:ren};
    });
  },

  tableRows(){ try{ return this.filtered(this._rows||[]); }catch(e){ return this._rows||[]; } },
  allRows(){ return this._rows||[]; },

  filtered(rows){
    return rows.filter(r=>
      (!this.f.anio || String(r.Año)===this.f.anio) &&
      (!this.f.semestre || String(r.Semestre)===this.f.semestre) &&
      (!this.f.carrera || r.Carrera===this.f.carrera) &&
      (!this.f.asignatura || r.Asignatura===this.f.asignatura)
    );
  },

  draw(allRows){
    const d = this.filtered(allRows);
    this.valueBoxes(d);
    this.plotCuposDemanda(d);
    this.plotComposicion(d);
    this.plotResultados(d);
    this.plotEvolucion(allRows); // evolución usa histórico completo
    this.plotCarrera(d);
  },

  // Comparación por carrera: inscritos, aprobados y renuncias agrupados por carrera
  plotCarrera(d){
    const hayCarrera = d.some(r => r.Carrera!=null && r.Carrera!=="");
    if(!d.length || !hayCarrera) return emptyPlot("plot_of_carrera",
      "Sin columna Carrera en los datos");
    const g = Agg.sumFields(d, r=>r.Carrera||"(sin carrera)", ["Inscritos","Aprobados","Renuncias"]);
    const cats=[...g.keys()].sort();
    const co=CONFIG.COLORS;
    Charts.groupedBars("plot_of_carrera", cats, [
      {name:"Inscritos", y:cats.map(c=>g.get(c).Inscritos)},
      {name:"Aprobados", y:cats.map(c=>g.get(c).Aprobados)},
      {name:"Renuncias", y:cats.map(c=>g.get(c).Renuncias)}
    ], {yTitle:"Estudiantes"});
  },

  valueBoxes(d){
    const cursos = d.length;
    const inscritos = Agg.sum(d,"Inscritos");
    const apr = Agg.sum(d,"Aprobados"), rep = Agg.sum(d,"Reprobados");
    const tasaApr = (apr+rep)>0 ? (100*apr/(apr+rep)).toFixed(1) : 0;
    const ren = Agg.sum(d,"Renuncias");
    const tasaRen = inscritos>0 ? (100*ren/inscritos).toFixed(1) : 0;
    document.getElementById("of-vb").innerHTML = UI.vbRow([
      UI.valueBox(cursos,"Cursos Ofertados","blue"),
      UI.valueBox(inscritos,"Total Inscritos","green"),
      UI.valueBox(tasaApr+"%","Tasa Aprobación","yellow"),
      UI.valueBox(tasaRen+"%","Tasa Renuncias","red")
    ]);
  },

  plotCuposDemanda(d){
    if(!d.length) return emptyPlot("plot_of_cupos");
    const g = Agg.sumFields(d, r=>r.Asignatura, ["Cupos","Inscritos"]);
    const cats=[...g.keys()].sort((a,b)=>g.get(b).Inscritos-g.get(a).Inscritos);
    const cupos=cats.map(c=>g.get(c).Cupos), insc=cats.map(c=>g.get(c).Inscritos);
    const ocup=cats.map(c=>{const o=g.get(c);return o.Cupos>0?+(100*o.Inscritos/o.Cupos).toFixed(1):0;});
    Charts.groupedBarsWithLine("plot_of_cupos",cats,cupos,insc,ocup,
      {nameA:"Cupos",nameB:"Inscritos",nameLine:"% Ocupación",y2Title:"% Ocupación"});
  },

  plotComposicion(d){
    if(!d.length) return emptyPlot("plot_of_comp");
    const key=r=>`${r.Asignatura} (${r.Año}-S${r.Semestre})`;
    const g=Agg.sumFields(d,key,["Cupos","Aprobados","Reprobados","Renuncias"]);
    const cats=[...g.keys()].sort();
    const co=CONFIG.COLORS;
    const series=[
      {name:"Aprobados",color:co.verde,y:cats.map(c=>g.get(c).Aprobados)},
      {name:"Reprobados",color:co.rojo,y:cats.map(c=>g.get(c).Reprobados)},
      {name:"Renuncias",color:co.amarillo,y:cats.map(c=>g.get(c).Renuncias)},
      {name:"Vacantes",color:co.grisClaro,y:cats.map(c=>{const o=g.get(c);
        return Math.max(0,o.Cupos-o.Aprobados-o.Reprobados-o.Renuncias);})}
    ];
    const cupos=cats.map(c=>g.get(c).Cupos);
    Charts.stackedBarsWithLine("plot_of_comp",cats,series,"Cupos",cupos,this.tituloComp());
  },

  tituloComp(){
    const {anio,semestre}=this.f;
    if(!anio&&!semestre) return "Datos Acumulados · Todos los períodos";
    if(!anio&&semestre)  return `Acumulado · Semestre ${semestre}`;
    if(anio&&!semestre)  return `Año ${anio} · Ambos semestres`;
    return `Año ${anio} · Semestre ${semestre}`;
  },

  plotResultados(d){
    if(!d.length) return emptyPlot("plot_of_res");
    const apr=Agg.sum(d,"Aprobados"),rep=Agg.sum(d,"Reprobados"),ren=Agg.sum(d,"Renuncias");
    const co=CONFIG.COLORS;
    Charts.pie("plot_of_res",["Aprobados","Reprobados","Renuncias"],[apr,rep,ren],
      [co.verde,co.rojo,co.amarillo]);
  },

  plotEvolucion(all){
    if(!all.length) return emptyPlot("plot_of_evo");
    const key=r=>`${r.Año}-S${r.Semestre}`;
    const g=Agg.sumFields(all,key,["Inscritos","Aprobados","Reprobados","Renuncias"]);
    const cats=[...g.keys()].sort();
    const insc=cats.map(c=>g.get(c).Inscritos);
    const tApr=cats.map(c=>{const o=g.get(c);const t=o.Aprobados+o.Reprobados;
      return t>0?+(100*o.Aprobados/t).toFixed(1):0;});
    const tRen=cats.map(c=>{const o=g.get(c);
      return o.Inscritos>0?+(100*o.Renuncias/o.Inscritos).toFixed(1):0;});
    Charts.barsWithTwoLines("plot_of_evo",cats,insc,tApr,tRen,
      {barName:"Inscritos",l1Name:"% Aprobación",l2Name:"% Renuncia"});
  }
};
window.SecOferta = SecOferta;
