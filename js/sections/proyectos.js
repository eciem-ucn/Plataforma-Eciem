// sections/proyectos.js — Investigación · Proyectos
const SecProyectos = {
  id:"proyectos", title:"Investigación · Proyectos",
  sub:"Proyectos por estado, tipo, fuente, monto y director",
  f:{anio:"",director:"",fuente:"",estado:""}, rows:[],
  MONTO:"Monto Proyecto", FUENTE:"Fuente Financiamiento",

  splitColab(s){ return s ? String(s).split(/;\s*/).map(x=>x.trim()).filter(Boolean) : []; },

  tableRows(){ try{ return this.filtered(); }catch(e){ return this.rows||[]; } },
  async render(root){
    this.rows = await DataStore.load("proyectos");
    root.innerHTML = UI.title(this.title,this.sub) +
      `<div id="pr-filtros"></div><div id="pr-vb"></div>
       ${UI.plotBox("Participación (Director vs Colaborador) · En ejecución","plot_pr_part",360)}
       <div class="grid-2">
         ${UI.plotBox("Por Estado","plot_pr_estado",300)}
         ${UI.plotBox("Por Tipo","plot_pr_tipo",300)}
       </div>
       <div class="grid-2">
         ${UI.plotBox("Proyectos por Año","plot_pr_anio",300)}
         ${UI.plotBox("Monto por Fuente (MM$)","plot_pr_fuente",300)}
       </div>
       ${UI.plotBox("Monto por Director (MM$)","plot_pr_dir",300)}`;
    this.filtros(); this.draw();
  },
  filtros(){
    const u=k=>Agg.uniq(this.rows,k).sort();
    document.getElementById("pr-filtros").innerHTML = UI.filters(
      UI.select("pr-anio","Año",u("Año").sort((a,b)=>b-a)) +
      UI.select("pr-dir","Director",u("Director")) +
      UI.select("pr-fte","Fuente",u(this.FUENTE),"Todas") +
      UI.select("pr-est","Estado",u("Estado")), "pr-clear");
    const map={"pr-anio":"anio","pr-dir":"director","pr-fte":"fuente","pr-est":"estado"};
    Object.keys(map).forEach(id=>{const el=document.getElementById(id);
      el.value=this.f[map[id]]; el.onchange=e=>{this.f[map[id]]=e.target.value;this.draw();};});
    document.getElementById("pr-clear").onclick=()=>{this.f={anio:"",director:"",fuente:"",estado:""};this.filtros();this.draw();};
  },
  filtered(){return this.rows.filter(r=>
    (!this.f.anio||String(r.Año)===this.f.anio)&&
    (!this.f.director||r.Director===this.f.director)&&
    (!this.f.fuente||r[this.FUENTE]===this.f.fuente)&&
    (!this.f.estado||r.Estado===this.f.estado));},
  draw(){
    const d=this.filtered(), V=CONFIG.VAL;
    const monto=Agg.sum(d,this.MONTO);
    const investigadores=new Set();
    d.forEach(r=>{ if(r.Director) investigadores.add(r.Director);
      this.splitColab(r.Colaboradores).forEach(c=>investigadores.add(c)); });
    document.getElementById("pr-vb").innerHTML = UI.vbRow([
      UI.valueBox(d.length,"Total Proyectos","blue"),
      UI.valueBox(d.filter(r=>r.Estado===V.enEjecucion).length,"En Ejecución","yellow"),
      UI.valueBox("$"+(monto/1e6).toFixed(1)+"MM","Monto Total","green"),
      UI.valueBox(investigadores.size,"Investigadores","purple")
    ]);
    const ids=["plot_pr_part","plot_pr_estado","plot_pr_tipo","plot_pr_anio","plot_pr_fuente","plot_pr_dir"];
    if(!d.length){ids.forEach(emptyPlot);return;}
    // Participación (solo en ejecución): director vs colaborador apilado
    const ej=d.filter(r=>r.Estado===V.enEjecucion);
    const dirC={}, colC={};
    ej.forEach(r=>{ if(r.Director) dirC[r.Director]=(dirC[r.Director]||0)+1;
      this.splitColab(r.Colaboradores).forEach(c=>colC[c]=(colC[c]||0)+1); });
    const personas=[...new Set([...Object.keys(dirC),...Object.keys(colC)])]
      .map(p=>[p,(dirC[p]||0)+(colC[p]||0)]).sort((a,b)=>b[1]-a[1]).map(o=>o[0]);
    if(personas.length) Charts.stackedByGroup(ids[0],personas,[
      {name:"Como Director",y:personas.map(p=>dirC[p]||0)},
      {name:"Como Colaborador",y:personas.map(p=>colC[p]||0)}],{yTitle:"Proyectos"});
    else emptyPlot(ids[0],"Sin proyectos en ejecución");
    // Estado / Tipo (pies)
    const est=V.estadosProyecto.filter(s=>d.some(r=>r.Estado===s));
    Charts.pieCat(ids[1],est,est.map(s=>d.filter(r=>r.Estado===s).length));
    const tip=Agg.countBy(d,r=>r.Tipo); const tk=[...tip.keys()];
    Charts.pieCat(ids[2],tk,tk.map(k=>tip.get(k)));
    // Por año
    const ca=Agg.countBy(d,r=>r.Año); const ak=[...ca.keys()].sort();
    Charts.bars(ids[3],ak,ak.map(k=>ca.get(k)),{yTitle:"Proyectos",color:CONFIG.COLORS.azulOscuro});
    // Monto por fuente (MM)
    const mf=Agg.sumBy(d,r=>r[this.FUENTE],this.MONTO);
    const fk=[...mf.keys()].sort((a,b)=>mf.get(a)-mf.get(b));
    Charts.barsMulti(ids[4],fk,fk.map(k=>+(mf.get(k)/1e6).toFixed(2)),{horizontal:true,xTitle:"MM$"});
    // Monto por director (MM)
    const md=Agg.sumBy(d,r=>r.Director,this.MONTO);
    const dk=[...md.keys()].sort((a,b)=>md.get(a)-md.get(b));
    Charts.barsMulti(ids[5],dk,dk.map(k=>+(md.get(k)/1e6).toFixed(2)),{horizontal:true,xTitle:"MM$",colors:dk.map(()=>CONFIG.COLORS.tierra)});
  }
};
window.SecProyectos = SecProyectos;
