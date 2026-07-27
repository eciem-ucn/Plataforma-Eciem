// =============================================================================
// charts.js — Gráficos con Plotly, réplica de los base-R del Shiny.
// Cada función recibe (elId, ...datos) y dibuja en el div indicado.
// =============================================================================
const C = () => CONFIG.COLORS;
const baseLayout = (over={}) => Object.assign({
  margin:{t:30,r:50,b:80,l:55}, font:{family:"Arial",size:12},
  paper_bgcolor:"#fff", plot_bgcolor:"#fff", showlegend:true,
  legend:{orientation:"h",y:1.12,x:0}
}, over);
const cfg = { responsive:true, displayModeBar:false };

function empty(elId, msg="Sin datos disponibles"){
  document.getElementById(elId).innerHTML = `<div class="empty">${msg}</div>`;
}

const Charts = {
  // Barras agrupadas + línea en eje secundario (Cupos vs Inscritos + %Ocupación)
  groupedBarsWithLine(elId, cats, seriesA, seriesB, line, opt={}){
    const co = C();
    const data = [
      { type:"bar", name:opt.nameA||"A", x:cats, y:seriesA, marker:{color:co.azul} },
      { type:"bar", name:opt.nameB||"B", x:cats, y:seriesB, marker:{color:co.azulOscuro} },
      { type:"scatter", mode:"lines+markers", name:opt.nameLine||"Línea",
        x:cats, y:line, yaxis:"y2", line:{color:co.tierra,width:2}, marker:{size:7} }
    ];
    Plotly.newPlot(elId, data, baseLayout({
      barmode:"group",
      yaxis:{title:opt.yTitle||"Cantidad"},
      yaxis2:{title:opt.y2Title||"%",overlaying:"y",side:"right",range:[0,120]},
      xaxis:{tickangle:-45}
    }), cfg);
  },

  // Barras apiladas (composición: Aprobados/Reprobados/Renuncias/Vacantes) + línea Cupos
  stackedBarsWithLine(elId, cats, series, lineName, lineVals, title){
    const s = series.map(x => ({ type:"bar", name:x.name, x:cats, y:x.y,
      marker:{color:x.color} }));
    if (lineVals) s.push({ type:"scatter", mode:"lines+markers", name:lineName,
      x:cats, y:lineVals, line:{color:C().azulOscuro,width:2}, marker:{symbol:"x",size:8} });
    Plotly.newPlot(elId, s, baseLayout({
      barmode:"stack", title:{text:title||"",font:{size:14}},
      yaxis:{title:"Estudiantes"}, xaxis:{tickangle:-45}
    }), cfg);
  },

  // Torta / pie
  pie(elId, labels, values, colors){
    Plotly.newPlot(elId, [{
      type:"pie", labels, values, textinfo:"label+percent",
      marker:{colors:colors||[C().verde,C().rojo,C().amarillo,C().azul]}
    }], baseLayout({showlegend:false,margin:{t:20,b:20,l:20,r:20}}), cfg);
  },

  // Barras simples (horizontales u verticales)
  bars(elId, cats, values, opt={}){
    Plotly.newPlot(elId, [{
      type:"bar", x:opt.horizontal?values:cats, y:opt.horizontal?cats:values,
      orientation:opt.horizontal?"h":"v",
      marker:{color:opt.color||C().azulOscuro}
    }], baseLayout({
      showlegend:false,
      xaxis:{title:opt.xTitle||"", tickangle:opt.horizontal?0:-45},
      yaxis:{title:opt.yTitle||""}
    }), cfg);
  },

  // Barras + doble línea (evolución: Inscritos + %Aprob + %Renuncia)
  barsWithTwoLines(elId, cats, bars, l1, l2, opt={}){
    const co=C();
    Plotly.newPlot(elId, [
      { type:"bar", name:opt.barName||"Inscritos", x:cats, y:bars, marker:{color:co.azulOscuro} },
      { type:"scatter", mode:"lines+markers", name:opt.l1Name||"% Aprobación",
        x:cats, y:l1, yaxis:"y2", line:{color:co.verde,width:2} },
      { type:"scatter", mode:"lines+markers", name:opt.l2Name||"% Renuncia",
        x:cats, y:l2, yaxis:"y2", line:{color:co.rojo,width:2}, marker:{symbol:"triangle-up"} }
    ], baseLayout({
      yaxis:{title:opt.yTitle||"Inscritos"},
      yaxis2:{title:"Tasa (%)",overlaying:"y",side:"right",range:[0,100]},
      xaxis:{tickangle:-45}
    }), cfg);
  },

  // Línea de evolución simple (una o varias series)
  lines(elId, cats, series){
    const data = series.map(s => ({ type:"scatter", mode:"lines+markers",
      name:s.name, x:cats, y:s.y, line:{color:s.color,width:2} }));
    Plotly.newPlot(elId, data, baseLayout({ xaxis:{tickangle:-45} }), cfg);
  },

  // Histograma
  histogram(elId, values, opt={}){
    Plotly.newPlot(elId, [{ type:"histogram", x:values,
      marker:{color:opt.color||C().azul}, nbinsx:opt.bins||15 }],
      baseLayout({showlegend:false, xaxis:{title:opt.xTitle||""}, yaxis:{title:"Frecuencia"}}), cfg);
  },

  // Pie con paleta cíclica y etiquetas conteo+porcentaje
  pieCat(elId, labels, values){
    Plotly.newPlot(elId, [{
      type:"pie", labels, values, textinfo:"label+value+percent",
      marker:{colors: labels.map((_,i)=>CONFIG.PALETTE[i%CONFIG.PALETTE.length])}
    }], baseLayout({showlegend:false,margin:{t:20,b:20,l:20,r:20}}), cfg);
  },

  // Barras (una serie) con color por categoría desde la paleta
  barsMulti(elId, cats, values, opt={}){
    Plotly.newPlot(elId, [{
      type:"bar", x:opt.horizontal?values:cats, y:opt.horizontal?cats:values,
      orientation:opt.horizontal?"h":"v",
      marker:{color: opt.colors || cats.map((_,i)=>CONFIG.PALETTE[i%CONFIG.PALETTE.length])}
    }], baseLayout({
      showlegend:false,
      xaxis:{title:opt.xTitle||"",tickangle:opt.horizontal?0:-45},
      yaxis:{title:opt.yTitle||"",automargin:true}
    }), cfg);
  },

  // Barras + una línea en eje secundario (evolución + acumulado, o conteo + días)
  barsWithLine(elId, cats, bars, line, opt={}){
    const co=C();
    Plotly.newPlot(elId, [
      { type:"bar", name:opt.barName||"", x:cats, y:bars, marker:{color:co.azulOscuro} },
      { type:"scatter", mode:"lines+markers", name:opt.lineName||"",
        x:cats, y:line, yaxis:"y2", line:{color:co.tierra,width:2}, marker:{size:7} }
    ], baseLayout({
      yaxis:{title:opt.yTitle||""},
      yaxis2:{title:opt.y2Title||"",overlaying:"y",side:"right"},
      xaxis:{tickangle:-45}
    }), cfg);
  },

  // Barras apiladas por grupo (matriz tipo/persona en permisos)
  stackedByGroup(elId, cats, series, opt={}){
    const data = series.map((s,i)=>({ type:"bar", name:s.name, x:cats, y:s.y,
      marker:{color: CONFIG.PALETTE[i%CONFIG.PALETTE.length]} }));
    Plotly.newPlot(elId, data, baseLayout({
      barmode:"stack", yaxis:{title:opt.yTitle||""}, xaxis:{tickangle:-45,automargin:true}
    }), cfg);
  }
};
window.Charts = Charts;
window.emptyPlot = empty;
