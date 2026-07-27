// =============================================================================
// ui.js — Componentes HTML reutilizables (equivalen a valueBox/box/DT del Shiny).
// =============================================================================
const UI = {
  valueBox(val, sub, color="blue"){
    return `<div class="vb ${color}"><div class="val">${val}</div>
      <div class="sub">${sub}</div></div>`;
  },
  vbRow(boxes){ return `<div class="vb-row">${boxes.join("")}</div>`; },

  box(title, innerHtml){
    return `<div class="box"><div class="box-head">${title}</div>
      <div class="box-body">${innerHtml}</div></div>`;
  },
  plotBox(title, plotId, height=340){
    return this.box(title, `<div id="${plotId}" class="plot" style="height:${height}px">
      <div class="loading">Cargando…</div></div>`);
  },

  // Select de filtro. items: array de valores; label; id.
  select(id, label, items, allText="Todos"){
    const opts = [`<option value="">${allText}</option>`]
      .concat(items.map(v=>`<option value="${v}">${v}</option>`)).join("");
    return `<div class="fld"><label>${label}</label>
      <select id="${id}">${opts}</select></div>`;
  },
  filters(html, clearId){
    return `<div class="filters">${html}
      ${clearId?`<button class="btn sec" id="${clearId}">Limpiar</button>`:""}</div>`;
  },

  // Tabla estática (equivalente a DT::datatable).
  table(cols, rows, renderRow){
    if (!rows || rows.length===0) return `<div class="empty">No se encontraron registros</div>`;
    const head = cols.map(c=>`<th>${c}</th>`).join("");
    const body = rows.map(renderRow).join("");
    return `<table class="dt"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  },

  title(t, sub){ return `<h1 class="page-title">${t}</h1><p class="page-sub">${sub||""}</p>`; }
};
window.UI = UI;
