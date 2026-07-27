// =============================================================================
// router.js — Registro de secciones, menú lateral y navegación por hash.
// =============================================================================
const Router = {
  sections:{},        // id -> objeto sección {id,title,sub,render(root)}
  menu:[],            // estructura del sidebar

  register(sec){ this.sections[sec.id]=sec; },

  // Inicio: tarjetas de acceso
  inicio(){
    return { id:"inicio", title:"Sistema Interno ECIEM",
      sub:"Universidad Católica del Norte · Escuela de Ciencias Empresariales",
      async render(root){
        const cards = Router.menu.flatMap(m=>m.children||[m])
          .filter(x=>x.id!=="inicio");
        root.innerHTML = UI.title(this.title,this.sub) +
          `<div class="vb-row" style="grid-template-columns:repeat(3,1fr)">` +
          cards.map(c=>`<a class="vb blue" href="#${c.id}" style="text-decoration:none">
            <div class="sub" style="font-size:15px;margin-top:0">${c.label}</div></a>`).join("") +
          `</div>`;
      }};
  },

  buildMenu(){
    this.menu = [
      { id:"inicio", label:"Inicio" },
      { label:"Docencia de Pregrado", children:[
        {id:"oferta",label:"Oferta Académica"},{id:"egresados",label:"Egresados"}]},
      { label:"Docencia de Postgrado", children:[
        {id:"mba",label:"Magíster en Adm. de Negocios"},{id:"mce",label:"Magíster en Cs. Empresariales"}]},
      { label:"Vinculación con el Medio", children:[
        {id:"convenios",label:"Convenios"},{id:"aprendizaje",label:"Aprendizaje + Servicios"}]},
      { label:"Investigación", children:[
        {id:"publicaciones",label:"Publicaciones"},{id:"proyectos",label:"Proyectos"}]},
      { label:"Gestión", children:[
        {id:"permisos",label:"Permisos de Ausencia"},{id:"actas",label:"Actas de Consejo"}]}
    ];
  },

  renderSidebar(){
    const el=document.getElementById("menu");
    el.innerHTML = this.menu.map(m=>{
      if(!m.children) return `<li><a href="#${m.id}" data-id="${m.id}">${m.label}</a></li>`;
      const subs=m.children.map(c=>`<li class="sub"><a href="#${c.id}" data-id="${c.id}">${c.label}</a></li>`).join("");
      return `<li class="group"><a>${m.label}<span class="caret">▾</span></a></li>${subs}`;
    }).join("");
  },

  async navigate(){
    const id=(location.hash||"#inicio").slice(1);
    const sec = id==="inicio" ? this.inicio() : this.sections[id];
    const root=document.getElementById("content");
    document.querySelectorAll("#menu a[data-id]").forEach(a=>
      a.classList.toggle("active", a.dataset.id===id));
    if(!sec){ root.innerHTML=`<div class="empty">Sección no encontrada</div>`; return; }
    root.innerHTML=`<div class="loading">Cargando sección…</div>`;
    try{ await sec.render(root); }
    catch(e){ root.innerHTML=`<div class="empty">Error: ${e.message}</div>`; }
  },

  start(){
    this.buildMenu(); this.renderSidebar();
    window.addEventListener("hashchange",()=>this.navigate());
    this.navigate();
  }
};
window.Router = Router;
