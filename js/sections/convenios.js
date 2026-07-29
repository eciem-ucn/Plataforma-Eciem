// sections/convenios.js — Vinculación · Convenios (desde PDFs en Drive)
const SecConvenios = {
  id:"convenios", title:"Vinculación con el Medio · Convenios",
  sub:"Convenios por año, empresa y rubro (PDF: AAAAMMDD_Empresa_Rubro)",
  f:{anio:"",mes:"",empresa:"",rubro:"",vigencia:""}, data:[],
  MESES:{ "01":"Enero","02":"Febrero","03":"Marzo","04":"Abril","05":"Mayo","06":"Junio",
    "07":"Julio","08":"Agosto","09":"Septiembre","10":"Octubre","11":"Noviembre","12":"Diciembre" },

  parse(name){
    const base=name.replace(/\.pdf$/i,""); let p=base.split("_");
    if(p.length<3) return null;
    // Vigencia: "No" si el nombre termina en _NV; "Sí" en caso contrario.
    let vigencia = "Sí";
    if(p[p.length-1].toUpperCase()==="NV"){
      vigencia = "No";
      p = p.slice(0, -1);           // quitar el sufijo NV
      if(p.length<3) return null;   // debe seguir teniendo fecha_empresa_rubro
    }
    const f=p[0], empresa=p[1], rubro=p.slice(2).join("_");
    return { Anio:f.slice(0,4), Mes:f.slice(4,6), Dia:f.slice(6,8),
      Empresa:empresa, Rubro:rubro, Vigencia:vigencia, id:null, Nombre:name };
  },
  async render(root){
    const pdfs = await DataStore.listPdfs(CONFIG.CONVENIOS_FOLDER);
    this.data=pdfs.map(f=>{const o=this.parse(f.name);return o?{...o,id:f.id}:null;}).filter(Boolean);
    root.innerHTML = UI.title(this.title,this.sub) +
      `<div id="cv-filtros"></div><div id="cv-vb"></div>
       <div class="grid-2">
         ${UI.plotBox("Convenios por Año","plot_cv_anio",300)}
         ${UI.plotBox("Convenios por Rubro","plot_cv_rubro",300)}
       </div>
       <div id="cv-tabla"></div>`;
    this.filtros(); this.draw();
  },
  filtros(){
    const u=k=>[...new Set(this.data.map(d=>d[k]))].sort();
    document.getElementById("cv-filtros").innerHTML = UI.filters(
      UI.select("cv-anio","Año",u("Anio").sort((a,b)=>b-a)) +
      UI.select("cv-mes","Mes",u("Mes")) +
      UI.select("cv-emp","Empresa",u("Empresa"),"Todas") +
      UI.select("cv-rub","Rubro",u("Rubro"),"Todos") +
      UI.select("cv-vig","Vigencia",u("Vigencia"),"Todas"), "cv-clear");
    const map={"cv-anio":"anio","cv-mes":"mes","cv-emp":"empresa","cv-rub":"rubro","cv-vig":"vigencia"};
    Object.keys(map).forEach(id=>{const el=document.getElementById(id);
      if(!el) return;
      el.value=this.f[map[id]]; el.onchange=e=>{this.f[map[id]]=e.target.value;this.draw();};});
    document.getElementById("cv-clear").onclick=()=>{this.f={anio:"",mes:"",empresa:"",rubro:"",vigencia:""};this.filtros();this.draw();};
  },
  filtered(){return this.data.filter(r=>
    (!this.f.anio||r.Anio===this.f.anio)&&(!this.f.mes||r.Mes===this.f.mes)&&
    (!this.f.empresa||r.Empresa===this.f.empresa)&&(!this.f.rubro||r.Rubro===this.f.rubro)&&
    (!this.f.vigencia||r.Vigencia===this.f.vigencia));},
  draw(){
    const d=this.filtered();
    document.getElementById("cv-vb").innerHTML = UI.vbRow([
      UI.valueBox(d.length,"Total Convenios","blue"),
      UI.valueBox(new Set(d.map(r=>r.Empresa)).size,"Empresas","green"),
      UI.valueBox(new Set(d.map(r=>r.Rubro)).size,"Rubros","yellow"),
      UI.valueBox(new Set(d.map(r=>r.Anio)).size,"Años","purple")
    ]);
    if(!d.length){emptyPlot("plot_cv_anio");emptyPlot("plot_cv_rubro");}
    else{
      const ca=Agg.countBy(d,r=>r.Anio); const ak=[...ca.keys()].sort();
      Charts.bars("plot_cv_anio",ak,ak.map(k=>ca.get(k)),{yTitle:"Convenios",color:CONFIG.COLORS.azulOscuro});
      const cr=Agg.countBy(d,r=>r.Rubro); const rk=[...cr.keys()].sort((a,b)=>cr.get(a)-cr.get(b));
      Charts.barsMulti("plot_cv_rubro",rk,rk.map(k=>cr.get(k)),{horizontal:true});
    }
    const sorted=[...d].sort((a,b)=>(b.Anio+b.Mes+b.Dia).localeCompare(a.Anio+a.Mes+a.Dia));
    document.getElementById("cv-tabla").innerHTML = UI.box("Listado de Convenios",
      UI.table(["Año","Mes","Fecha","Empresa","Rubro","Vigencia","Convenio"],sorted,r=>
        `<tr><td>${r.Anio}</td><td>${this.MESES[r.Mes]||r.Mes}</td>
         <td>${r.Dia}/${r.Mes}/${r.Anio}</td><td>${r.Empresa}</td><td>${r.Rubro}</td>
         <td>${r.Vigencia}</td>
         <td><a class="btn" target="_blank" href="${API.fileUrl(r.id)}">Abrir</a></td></tr>`));
  }
};
window.SecConvenios = SecConvenios;
