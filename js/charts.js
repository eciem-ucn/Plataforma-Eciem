// =============================================================================
// charts.js — Gráficos con Plotly, réplica de los base-R del Shiny.
// Cada función recibe (elId, ...datos) y dibuja en el div indicado.
// =============================================================================
const C = () => CONFIG.COLORS;
const baseLayout = (over={}) => Object.assign({
  margin:{t:40,r:55,b:110,l:60}, font:{family:"Arial",size:11},
  paper_bgcolor:"#fff", plot_bgcolor:"#fff", showlegend:true,
  legend:{orientation:"h",y:1.18,x:0,font:{size:11}}
}, over);
const cfg = { responsive:true, displayModeBar:false };

// Eje X categórico estándar: trata los valores como etiquetas (no números),
// evita decimales en años/conteos y reserva espacio para etiquetas giradas.
// tickformat:"d" refuerza que, si algún valor se interpretara como número,
// se muestre como entero sin decimales.
const catAxis = (over={}) => Object.assign({
  type:"category", tickangle:-45, automargin:true, tickfont:{size:10}, tickformat:"d"
}, over);
// Eje numérico de conteos: solo enteros.
const intAxis = (over={}) => Object.assign({
  tickformat:"d", automargin:true
}, over);

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
      yaxis:intAxis({title:opt.yTitle||"Cantidad"}),
      yaxis2:{title:opt.y2Title||"%",overlaying:"y",side:"right",range:[0,120]},
      xaxis:catAxis()
    }), cfg);
  },

  // Barras apiladas (composición: Aprobados/Reprobados/Renuncias/Vacantes) + línea Cupos
  stackedBarsWithLine(elId, cats, series, lineName, lineVals, title){
    const s = series.map(x => ({ type:"bar", name:x.name, x:cats, y:x.y,
      marker:{color:x.color} }));
    if (lineVals) s.push({ type:"scatter", mode:"lines+markers", name:lineName,
      x:cats, y:lineVals, line:{color:C().azulOscuro,width:2}, marker:{symbol:"x",size:8} });
    Plotly.newPlot(elId, s, baseLayout({
      barmode:"stack",
      title:{text:title||"",font:{size:13},x:0.5,xanchor:"center",y:0.98,yanchor:"top"},
      margin:{t:70,r:55,b:130,l:60},
      legend:{orientation:"h",y:1.08,x:0,font:{size:10}},
      yaxis:intAxis({title:"Estudiantes"}), xaxis:catAxis()
    }), cfg);
  },

  // Torta / pie
  pie(elId, labels, values, colors){
    Plotly.newPlot(elId, [{
      type:"pie", labels, values, textinfo:"label+percent",
      textposition:"auto", automargin:true, insidetextorientation:"horizontal",
      marker:{colors:colors||[C().verde,C().rojo,C().amarillo,C().azul]}
    }], baseLayout({showlegend:false,margin:{t:30,b:30,l:40,r:40}}), cfg);
  },

  // Barras simples (horizontales u verticales)
  bars(elId, cats, values, opt={}){
    Plotly.newPlot(elId, [{
      type:"bar", x:opt.horizontal?values:cats, y:opt.horizontal?cats:values,
      orientation:opt.horizontal?"h":"v",
      marker:{color:opt.color||C().azulOscuro}
    }], baseLayout({
      showlegend:false,
      xaxis: opt.horizontal ? intAxis({title:opt.xTitle||""}) : catAxis({title:opt.xTitle||""}),
      yaxis: opt.horizontal ? catAxis({title:opt.yTitle||"",tickangle:0}) : intAxis({title:opt.yTitle||""})
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
      yaxis:intAxis({title:opt.yTitle||"Inscritos"}),
      yaxis2:{title:"Tasa (%)",overlaying:"y",side:"right",range:[0,100]},
      xaxis:catAxis()
    }), cfg);
  },

  // Línea de evolución simple (una o varias series)
  lines(elId, cats, series){
    const data = series.map(s => ({ type:"scatter", mode:"lines+markers",
      name:s.name, x:cats, y:s.y, line:{color:s.color,width:2} }));
    Plotly.newPlot(elId, data, baseLayout({ xaxis:catAxis() }), cfg);
  },

  // Histograma
  histogram(elId, values, opt={}){
    Plotly.newPlot(elId, [{ type:"histogram", x:values,
      marker:{color:opt.color||C().azul}, nbinsx:opt.bins||15 }],
      baseLayout({showlegend:false, xaxis:{title:opt.xTitle||""}, yaxis:intAxis({title:"Frecuencia"})}), cfg);
  },

  // Pie con paleta cíclica y etiquetas conteo+porcentaje
  pieCat(elId, labels, values){
    Plotly.newPlot(elId, [{
      type:"pie", labels, values, textinfo:"label+value+percent",
      textposition:"auto", automargin:true, insidetextorientation:"horizontal",
      marker:{colors: labels.map((_,i)=>CONFIG.PALETTE[i%CONFIG.PALETTE.length])}
    }], baseLayout({showlegend:false,margin:{t:30,b:30,l:40,r:40}}), cfg);
  },

  // Barras (una serie) con color por categoría desde la paleta
  barsMulti(elId, cats, values, opt={}){
    Plotly.newPlot(elId, [{
      type:"bar", x:opt.horizontal?values:cats, y:opt.horizontal?cats:values,
      orientation:opt.horizontal?"h":"v",
      marker:{color: opt.colors || cats.map((_,i)=>CONFIG.PALETTE[i%CONFIG.PALETTE.length])}
    }], baseLayout({
      showlegend:false,
      xaxis: opt.horizontal ? intAxis({title:opt.xTitle||""}) : catAxis({title:opt.xTitle||""}),
      yaxis: opt.horizontal ? catAxis({title:opt.yTitle||"",tickangle:0}) : intAxis({title:opt.yTitle||""})
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
      yaxis:intAxis({title:opt.yTitle||""}),
      yaxis2:{title:opt.y2Title||"",overlaying:"y",side:"right"},
      xaxis:catAxis()
    }), cfg);
  },

  // Barras apiladas por grupo (matriz tipo/persona en permisos)
  stackedByGroup(elId, cats, series, opt={}){
    const data = series.map((s,i)=>({ type:"bar", name:s.name, x:cats, y:s.y,
      marker:{color: CONFIG.PALETTE[i%CONFIG.PALETTE.length]} }));
    Plotly.newPlot(elId, data, baseLayout({
      barmode:"stack", yaxis:intAxis({title:opt.yTitle||""}), xaxis:catAxis()
    }), cfg);
  },

  // Barras agrupadas (una al lado de otra por categoría) para comparar métricas.
  groupedBars(elId, cats, series, opt={}){
    const data = series.map((s,i)=>({ type:"bar", name:s.name, x:cats, y:s.y,
      marker:{color: CONFIG.PALETTE[i%CONFIG.PALETTE.length]} }));
    Plotly.newPlot(elId, data, baseLayout({
      barmode:"group", yaxis:intAxis({title:opt.yTitle||""}), xaxis:catAxis()
    }), cfg);
  }
};
window.Charts = Charts;
window.emptyPlot = empty;
