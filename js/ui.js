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

// ---- Pestañas Resumen / Datos + tabla descargable (añadido) ----
Object.assign(UI, {
  // Barra de dos pestañas. Devuelve el HTML; el enganche lo hace tabsInit.
  tabs(){
    return `<div class="tabs-bar">
      <button class="tab-btn active" data-tab="resumen">Resumen</button>
      <button class="tab-btn" data-tab="datos">Tabla de datos</button>
    </div>
    <div id="tab-resumen" class="tab-pane active"></div>
    <div id="tab-datos" class="tab-pane"></div>`;
  },
  tabsInit(onDatos){
    const btns = document.querySelectorAll(".tab-btn");
    btns.forEach(b => b.onclick = () => {
      btns.forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      const t = b.dataset.tab;
      document.getElementById("tab-resumen").classList.toggle("active", t==="resumen");
      document.getElementById("tab-datos").classList.toggle("active", t==="datos");
      if (t==="datos" && onDatos) onDatos();
    });
  },

  // Tabla completa de un dataset (todas las columnas) con botón de descarga.
  // Tabla de datos con SUS PROPIOS filtros arriba (autónoma respecto a Resumen).
  // Detecta columnas categóricas (pocos valores distintos) y crea un selector por cada una.
  // Monta todo dentro del contenedor `containerId`.
  dataTableFilterable(containerId, allRows, filename){
    const cont = document.getElementById(containerId);
    if (!cont) return;
    if (!allRows || !allRows.length){
      cont.innerHTML = `<div class="empty">No hay datos para mostrar</div>`;
      return;
    }
    const cols = Object.keys(allRows[0]).filter(c => !c.startsWith("_"));

    // Columnas aptas para filtro: categóricas (2-40 valores distintos) y NO numéricas
    // continuas (montos, cantidades). Se excluye una columna si casi todos sus
    // valores no vacíos son números distintos entre sí.
    const filterCols = cols.filter(c => {
      const vals = allRows.map(r => r[c]).filter(v => v!=null && v!=="");
      const distinct = new Set(vals);
      if (distinct.size < 2 || distinct.size > 40) return false;
      // Excluir columnas casi únicas (títulos, nombres libres): poco útiles como filtro.
      if (distinct.size > vals.length * 0.7 && vals.length > 5) return false;
      // ¿es numérica continua? proporción alta de números y muchos valores únicos
      const nums = vals.filter(v => typeof v === "number" || (!isNaN(v) && String(v).trim()!==""));
      const mostlyNumeric = nums.length >= vals.length * 0.8;
      const highCardinality = distinct.size > Math.max(8, vals.length * 0.5);
      if (mostlyNumeric && highCardinality) return false;
      return true;
    });

    const state = {};  // col -> valor seleccionado ("" = todos)
    filterCols.forEach(c => state[c] = "");

    function apply(){
      return allRows.filter(r => filterCols.every(c => !state[c] || String(r[c])===state[c]));
    }

    function renderTable(){
      const rows = apply();
      window.__lastTableRows = rows;
      const head = cols.map(c=>`<th>${c}</th>`).join("");
      const body = rows.length
        ? rows.map(r => `<tr>${cols.map(c=>`<td>${r[c]==null?"":r[c]}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="${cols.length}" style="text-align:center;color:#999;padding:20px">Sin registros con estos filtros</td></tr>`;
      cont.querySelector(".datatable-count").textContent = `${rows.length} registros`;
      cont.querySelector(".datatable-scroll").innerHTML =
        `<table class="dt"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    }

    // Selectores de filtro
    const filtersHtml = filterCols.map(c => {
      const vals = [...new Set(allRows.map(r => r[c]).filter(v => v!=null && v!==""))]
        .sort((a,b)=> (typeof a==="number"&&typeof b==="number") ? a-b : String(a).localeCompare(String(b)));
      const opts = [`<option value="">${c}: todos</option>`]
        .concat(vals.map(v=>`<option value="${v}">${v}</option>`)).join("");
      return `<select class="dt-filter" data-col="${c}">${opts}</select>`;
    }).join("");

    cont.innerHTML = `<div class="datatable-wrap">
      <div class="datatable-filters">${filtersHtml}
        <button class="btn sec dt-clear">Limpiar</button>
      </div>
      <div class="datatable-toolbar">
        <span class="datatable-count">${allRows.length} registros</span>
        <button class="btn dt-download">Descargar (Excel)</button>
      </div>
      <div class="datatable-scroll"></div>
    </div>`;

    cont.querySelectorAll(".dt-filter").forEach(sel => {
      sel.onchange = e => { state[e.target.dataset.col] = e.target.value; renderTable(); };
    });
    cont.querySelector(".dt-clear").onclick = () => {
      filterCols.forEach(c => state[c]="");
      cont.querySelectorAll(".dt-filter").forEach(s => s.value="");
      renderTable();
    };
    cont.querySelector(".dt-download").onclick = () => UI.downloadRows(apply(), filename);

    renderTable();
  },

  // (Se mantiene por compatibilidad; ya no la usa el router.)
  dataTable(rows, filename){
    if (!rows || !rows.length) return `<div class="empty">No hay datos para mostrar</div>`;
    const cols = Object.keys(rows[0]).filter(c => !c.startsWith("_"));
    const head = cols.map(c=>`<th>${c}</th>`).join("");
    const body = rows.map(r =>
      `<tr>${cols.map(c=>`<td>${r[c]==null?"":r[c]}</td>`).join("")}</tr>`).join("");
    return `<div class="datatable-wrap">
      <div class="datatable-toolbar">
        <span class="datatable-count">${rows.length} registros</span>
        <button class="btn" onclick="UI.downloadRows(window.__lastTableRows,'${filename}')">
          Descargar (Excel)
        </button>
      </div>
      <div class="datatable-scroll">
        <table class="dt"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      </div>
    </div>`;
  },

  // Descarga las filas como archivo .xls (HTML-table, abre en Excel) sin librerías.
  downloadRows(rows, filename){
    if (!rows || !rows.length) return;
    const cols = Object.keys(rows[0]).filter(c => !c.startsWith("_"));
    const esc = v => String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><tr>'
      + cols.map(c=>`<th>${esc(c)}</th>`).join("") + '</tr>';
    for (const r of rows) html += '<tr>' + cols.map(c=>`<td>${esc(r[c])}</td>`).join("") + '</tr>';
    html += '</table></body></html>';
    const blob = new Blob([html], { type:"application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = (filename||"datos") + ".xls";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
