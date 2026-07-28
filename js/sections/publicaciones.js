// sections/publicaciones.js — Investigación · Publicaciones
const SecPublicaciones = {
  id:"publicaciones", title:"Investigación · Publicaciones",
  sub:"Publicaciones por año, autor, cuartil e índice",
  f:{anio:"",indice:"",autor:"",cuartil:""}, rows:[],

  tableRows(){ try{ return this.filtered(); }catch(e){ return this.rows||[]; } },
  allRows(){ return this.rows||[]; },
  async render(root){
    this.rows = await DataStore.load("publicaciones");
    root.innerHTML = UI.title(this.title,this.sub) +
      `<div id="pub-filtros"></div><div id="pub-vb"></div>
       <div class="grid-2">
         ${UI.plotBox("Evolución por Año","plot_pub_evo",300)}
         ${UI.plotBox("Publicaciones por Autor","plot_pub_autor",300)}
       </div>
       <div class="grid-2">
         ${UI.plotBox("Distribución por Cuartil","plot_pub_q",300)}
         ${UI.plotBox("Distribución por Índice","plot_pub_idx",300)}
       </div>
       ${UI.plotBox("Publicaciones Q1 por Año","plot_pub_q1",280)}`;
    this.filtros(); this.draw();
  },
  filtros(){
    const u=k=>Agg.uniq(this.rows,k).sort();
    document.getElementById("pub-filtros").innerHTML = UI.filters(
      UI.select("pub-anio","Año",u("Año").sort((a,b)=>b-a)) +
      UI.select("pub-idx","Índice",u("Índice")) +
      UI.select("pub-aut","Autor ECIEM",u("Autor ECIEM")) +
      UI.select("pub-q","Cuartil",u("Cuartil")), "pub-clear");
    const map={"pub-anio":"anio","pub-idx":"indice","pub-aut":"autor","pub-q":"cuartil"};
    Object.keys(map).forEach(id=>{const el=document.getElementById(id);
      el.value=this.f[map[id]]; el.onchange=e=>{this.f[map[id]]=e.target.value;this.draw();};});
    document.getElementById("pub-clear").onclick=()=>{this.f={anio:"",indice:"",autor:"",cuartil:""};this.filtros();this.draw();};
  },
  filtered(){return this.rows.filter(r=>
    (!this.f.anio||String(r.Año)===this.f.anio)&&
    (!this.f.indice||r["Índice"]===this.f.indice)&&
    (!this.f.autor||r["Autor ECIEM"]===this.f.autor)&&
    (!this.f.cuartil||r.Cuartil===this.f.cuartil));},
  draw(){
    const d=this.filtered(), V=CONFIG.VAL;
    document.getElementById("pub-vb").innerHTML = UI.vbRow([
      UI.valueBox(d.length,"Total Publicaciones","blue"),
      UI.valueBox(d.filter(r=>r["Índice"]===V.wos).length,"WoS-JCR","green"),
      UI.valueBox(d.filter(r=>r.Cuartil===V.q1).length,"Q1","yellow"),
      UI.valueBox(Agg.uniq(d,"Autor ECIEM").length,"Autores","purple")
    ]);
    const ids=["plot_pub_evo","plot_pub_autor","plot_pub_q","plot_pub_idx","plot_pub_q1"];
    if(!d.length){ids.forEach(emptyPlot);return;}
    const evo=Agg.countBy(d,r=>r.Año); const ek=[...evo.keys()].sort();
    Charts.bars(ids[0],ek,ek.map(k=>evo.get(k)),{yTitle:"Publicaciones",color:CONFIG.COLORS.azulOscuro});
    const aut=Agg.countBy(d,r=>r["Autor ECIEM"]); const ak=[...aut.keys()].sort((a,b)=>aut.get(a)-aut.get(b));
    Charts.barsMulti(ids[1],ak,ak.map(k=>aut.get(k)),{horizontal:true,colors:ak.map(()=>CONFIG.COLORS.azul)});
    const dq=d.filter(r=>V.cuartiles.includes(r.Cuartil));
    const qk=V.cuartiles.filter(q=>dq.some(r=>r.Cuartil===q));
    Charts.pieCat(ids[2],qk,qk.map(q=>dq.filter(r=>r.Cuartil===q).length));
    const idx=Agg.countBy(d,r=>r["Índice"]); const ik=[...idx.keys()];
    Charts.pieCat(ids[3],ik,ik.map(k=>idx.get(k)));
    const q1=d.filter(r=>r.Cuartil===V.q1); const eq=Agg.countBy(q1,r=>r.Año); const eqk=[...eq.keys()].sort();
    if(eqk.length) Charts.bars(ids[4],eqk,eqk.map(k=>eq.get(k)),{yTitle:"Q1",color:CONFIG.COLORS.verde});
    else emptyPlot(ids[4],"Sin publicaciones Q1");
  }
};
window.SecPublicaciones = SecPublicaciones;
