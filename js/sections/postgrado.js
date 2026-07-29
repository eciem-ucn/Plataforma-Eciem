// sections/postgrado.js — Fábrica para MBA y MCE
// Cambio 2 (ambos): "Evolución por Año" -> participación por estado curricular según año de ingreso.
// Cambio 3 (solo MBA): el gráfico de artículos pasa a "Número de publicaciones" (publicados por año, últimos 5).
function makePostgrado(id, dataset, title, opt={}){
  const esMBA = !!opt.publicacionesPorAnio;
  const tituloArt = esMBA ? "Número de Publicaciones" : "Estado del Artículo";
  return {
    id, title, sub:"Estado curricular, artículos y participación del programa",
    f:{anio:"",director:""}, rows:[],
    tableRows(){ try{ return this.filtered(); }catch(e){ return this.rows||[]; } },
    allRows(){ return this.rows||[]; },
    async render(root){
      this.rows = await DataStore.load(dataset);
      root.innerHTML = UI.title(title,this.sub) +
        `<div id="${id}-filtros"></div><div id="${id}-vb"></div>
         <div class="grid-2">
           ${UI.plotBox("Estado Curricular","plot_"+id+"_curr",300)}
           ${UI.plotBox(tituloArt,"plot_"+id+"_art",300)}
         </div>
         <div class="grid-2">
           ${UI.plotBox("Participación por Estado Curricular (según año de ingreso)","plot_"+id+"_evo",300)}
           ${UI.plotBox("Por Director","plot_"+id+"_dir",300)}
         </div>`;
      this.filtros(); this.draw();
    },
    filtros(){
      const u=k=>Agg.uniq(this.rows,k).sort();
      document.getElementById(id+"-filtros").innerHTML = UI.filters(
        UI.select(id+"-anio","Año",u("Año").sort((a,b)=>b-a)) +
        UI.select(id+"-dir","Director",u("Director")), id+"-clear");
      const anio=document.getElementById(id+"-anio"), dir=document.getElementById(id+"-dir");
      anio.value=this.f.anio; dir.value=this.f.director;
      anio.onchange=e=>{this.f.anio=e.target.value;this.draw();};
      dir.onchange=e=>{this.f.director=e.target.value;this.draw();};
      document.getElementById(id+"-clear").onclick=()=>{this.f={anio:"",director:""};this.filtros();this.draw();};
    },
    filtered(){return this.rows.filter(r=>
      (!this.f.anio||String(r.Año)===this.f.anio)&&
      (!this.f.director||r.Director===this.f.director));},
    draw(){
      const d=this.filtered(), V=CONFIG.VAL;
      const enCurso=d.filter(r=>r["Estado Curricular"]===V.enCurso).length;
      const grad=d.filter(r=>r["Estado Curricular"]===V.graduado).length;
      const pub=d.filter(r=>r["Estado Artículo"]===V.publicado).length;
      document.getElementById(id+"-vb").innerHTML = UI.vbRow([
        UI.valueBox(d.length,"Total Estudiantes","blue"),
        UI.valueBox(enCurso,"En Curso","yellow"),
        UI.valueBox(grad,"Graduados","green"),
        UI.valueBox(pub,"Artículos Publicados","purple")
      ]);
      const ids=["plot_"+id+"_curr","plot_"+id+"_art","plot_"+id+"_evo","plot_"+id+"_dir"];
      if(!d.length){ids.forEach(emptyPlot);return;}

      // Estado Curricular (pie)
      const curr=Agg.countBy(d,r=>r["Estado Curricular"]); const ck=[...curr.keys()];
      Charts.pieCat(ids[0],ck,ck.map(k=>curr.get(k)));

      // --- Gráfico de artículos: variante MBA vs estándar ---
      if(esMBA){
        // Cambio 3: número de artículos PUBLICADOS por año, últimos 5 años
        const publicados = d.filter(r=>r["Estado Artículo"]===V.publicado);
        const porAnio = Agg.countBy(publicados, r=>r.Año);
        // últimos 5 años presentes en los datos
        const anios = [...new Set(d.map(r=>+r.Año).filter(a=>!isNaN(a)))].sort((a,b)=>a-b);
        const ultimos5 = anios.slice(-5).map(String);
        if(ultimos5.length){
          Charts.bars(ids[1], ultimos5, ultimos5.map(a=>porAnio.get(+a)||porAnio.get(a)||0),
            {yTitle:"Publicaciones", color:CONFIG.COLORS.verde});
        } else emptyPlot(ids[1],"Sin publicaciones");
      } else {
        // Estándar (MCE): estado del artículo en barras horizontales
        const art=Agg.countBy(d,r=>r["Estado Artículo"]); const ak=[...art.keys()].sort((a,b)=>art.get(b)-art.get(a));
        Charts.barsMulti(ids[1],ak,ak.map(k=>art.get(k)),{horizontal:true});
      }

      // Cambio 2: participación por estado curricular según año de ingreso (barras apiladas)
      const estados = [...new Set(d.map(r=>r["Estado Curricular"]).filter(v=>v!=null&&v!==""))];
      const aniosIng = [...new Set(d.map(r=>String(r.Año)).filter(v=>v!==""&&v!=="undefined"))].sort();
      if(estados.length && aniosIng.length){
        const series = estados.map(est => ({
          name: est,
          y: aniosIng.map(a => d.filter(r=>String(r.Año)===a && r["Estado Curricular"]===est).length)
        }));
        Charts.stackedByGroup(ids[2], aniosIng, series, {yTitle:"Estudiantes"});
      } else emptyPlot(ids[2],"Sin datos de estado curricular");

      // Por Director
      const dir=Agg.countBy(d,r=>r.Director); const dk=[...dir.keys()].sort((a,b)=>dir.get(a)-dir.get(b));
      Charts.barsMulti(ids[3],dk,dk.map(k=>dir.get(k)),{horizontal:true,colors:dk.map(()=>CONFIG.COLORS.azul)});
    }
  };
}
const SecMBA = makePostgrado("mba","mba","Docencia de Postgrado · Magíster en Adm. de Negocios",{publicacionesPorAnio:true});
const SecMCE = makePostgrado("mce","mce","Docencia de Postgrado · Magíster en Cs. Empresariales");
window.SecMBA = SecMBA; window.SecMCE = SecMCE;
