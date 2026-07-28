// =============================================================================
// sections/actas.js — Gestión · Actas de Consejo. Lista PDFs de Drive y parsea
// el nombre AAAA_MM_DD_TIPO_Nombre_Apellido.pdf (réplica del parsing R).
// =============================================================================
const SecActas = {
  id:"actas", title:"Gestión · Actas de Consejo",
  sub:"Actas en PDF nombradas AAAA_MM_DD_TIPO_Nombre_Apellido",
  f:{anio:"",mes:"",tipo:"",secretario:""},
  data:[],

  parseName(name){
    const base = name.replace(/\.pdf$/i,"");
    const p = base.split("_");
    const tipos = { INGECO:"Consejo de Carrera de INGECO", IICG:"Consejo de Carrera de IICG",
      Escuela:"Consejo de Escuela" };

    let anio, mes, dia, tipo, resto;
    // Formato real: AAAAMMDD_TIPO_Nombre_Apellido...  (fecha pegada, 8 dígitos)
    if (p.length >= 3 && /^\d{8}$/.test(p[0])){
      anio = p[0].slice(0,4); mes = p[0].slice(4,6); dia = p[0].slice(6,8);
      tipo = p[1]; resto = p.slice(2);
    }
    // Formato alterno: AAAA_MM_DD_TIPO_Nombre_Apellido...  (fecha separada)
    else if (p.length >= 5 && /^\d{4}$/.test(p[0])){
      anio = p[0]; mes = p[1]; dia = p[2]; tipo = p[3]; resto = p.slice(4);
    }
    else return null;

    const secretario = resto.join(" ").trim();
    const MESES = {"01":"Enero","02":"Febrero","03":"Marzo","04":"Abril","05":"Mayo",
      "06":"Junio","07":"Julio","08":"Agosto","09":"Septiembre","10":"Octubre",
      "11":"Noviembre","12":"Diciembre"};
    return { Anio:anio, Mes:mes, MesNombre:(MESES[mes]||mes), Dia:dia, Tipo:(tipos[tipo]||tipo),
      Secretario: secretario || "(sin nombre)", Nombre:name };
  },

  async render(root){
    const pdfs = await DataStore.listPdfs(CONFIG.ACTAS_FOLDER);
    this.data = pdfs.map(f=>{const p=this.parseName(f.name); return p?{...p,id:f.id}:null;})
      .filter(Boolean);
    root.innerHTML = UI.title(this.title,this.sub) +
      `<div id="ac-filtros"></div><div id="ac-tabla"></div>`;
    this.filtros(); this.tabla();
  },

  filtros(){
    const u=(k)=>[...new Set(this.data.map(d=>d[k]))].sort();
    document.getElementById("ac-filtros").innerHTML = UI.filters(
      UI.select("ac-anio","Año",u("Anio")) +
      UI.select("ac-mes","Mes",u("Mes")) +
      UI.select("ac-tipo","Tipo de Consejo",u("Tipo"),"Todos") +
      UI.select("ac-sec","Secretario",u("Secretario"),"Todos"),
      "ac-clear");
    const map={"ac-anio":"anio","ac-mes":"mes","ac-tipo":"tipo","ac-sec":"secretario"};
    Object.keys(map).forEach(id=>{
      const el=document.getElementById(id);
      el.value=this.f[map[id]];
      el.onchange=e=>{this.f[map[id]]=e.target.value;this.tabla();};
    });
    document.getElementById("ac-clear").onclick=()=>{
      this.f={anio:"",mes:"",tipo:"",secretario:""};this.filtros();this.tabla();};
  },

  tabla(){
    let d=this.data.filter(r=>
      (!this.f.anio||r.Anio===this.f.anio)&&
      (!this.f.mes||r.Mes===this.f.mes)&&
      (!this.f.tipo||r.Tipo===this.f.tipo)&&
      (!this.f.secretario||r.Secretario===this.f.secretario));
    document.getElementById("ac-tabla").innerHTML = UI.box("Actas",
      UI.table(["Año","Mes","Día","Tipo de Consejo","Secretario","Acta"], d, r=>
        `<tr><td>${r.Anio}</td><td>${r.MesNombre||r.Mes}</td><td>${r.Dia}</td>
         <td>${r.Tipo}</td><td>${r.Secretario}</td>
         <td><a class="btn" target="_blank" href="${API.fileUrl(r.id)}">Abrir</a></td></tr>`));
  }
};
window.SecActas = SecActas;
