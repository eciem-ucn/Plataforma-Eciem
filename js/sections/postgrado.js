// sections/postgrado.js — Fábrica para MBA y MCE (misma estructura en el Shiny)
function makePostgrado(id, dataset, title){
  return {
    id, title, sub:"Estado curricular, artículos y evolución del programa",
    f:{anio:"",director:""}, rows:[],
    async render(root){
      this.rows = await DataStore.load(dataset);
      root.innerHTML = UI.title(title,this.sub) +
        `<div id="${id}-filtros"></div><div id="${id}-vb"></div>
         <div class="grid-2">
           ${UI.plotBox("Estado Curricular","plot_"+id+"_curr",300)}
           ${UI.plotBox("Estado del Artículo","plot_"+id+"_art",300)}
         </div>
         <div class="grid-2">
           ${UI.plotBox("Evolución por Año","plot_"+id+"_evo",300)}
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
      const curr=Agg.countBy(d,r=>r["Estado Curricular"]); const ck=[...curr.keys()];
      Charts.pieCat(ids[0],ck,ck.map(k=>curr.get(k)));
      const art=Agg.countBy(d,r=>r["Estado Artículo"]); const ak=[...art.keys()].sort((a,b)=>art.get(b)-art.get(a));
      Charts.barsMulti(ids[1],ak,ak.map(k=>art.get(k)),{horizontal:true});
      const evo=Agg.countBy(d,r=>r.Año); const ek=[...evo.keys()].sort();
      Charts.bars(ids[2],ek,ek.map(k=>evo.get(k)),{yTitle:"Estudiantes",color:CONFIG.COLORS.azulOscuro});
      const dir=Agg.countBy(d,r=>r.Director); const dk=[...dir.keys()].sort((a,b)=>dir.get(a)-dir.get(b));
      Charts.barsMulti(ids[3],dk,dk.map(k=>dir.get(k)),{horizontal:true,colors:dk.map(()=>CONFIG.COLORS.azul)});
    }
  };
}
const SecMBA = makePostgrado("mba","mba","Docencia de Postgrado · Magíster en Adm. de Negocios");
const SecMCE = makePostgrado("mce","mce","Docencia de Postgrado · Magíster en Cs. Empresariales");
window.SecMBA = SecMBA; window.SecMCE = SecMCE;
