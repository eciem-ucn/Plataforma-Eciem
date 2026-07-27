// =============================================================================
// config.js — Configuración de presentación del frontend (no sensible).
// Los datos, IDs y credenciales viven en el backend (Worker). Aquí solo colores,
// paleta, valores canónicos usados en cálculos, y parámetros de UI.
// =============================================================================
window.CONFIG = {
  POLL_MINUTES: 5,

  COLORS: {
    azul: "#7E9BC0", azulOscuro: "#003366", tierra: "#AC6D33",
    tierraClaro: "#C9A87C", gris: "#5A5A5A",
    verde: "#217346", rojo: "#c0392b", amarillo: "#f39c12", grisClaro: "#bdc3c7"
  },
  PALETTE: ["#003366","#7E9BC0","#AC6D33","#217346","#c0392b","#f39c12",
            "#605ca8","#00a65a","#C9A87C","#5A5A5A"],

  // Alias de carpeta que entiende el backend (/api/pdfs?folder=...)
  CONVENIOS_FOLDER: "convenios",
  ACTAS_FOLDER: "actas",

  // Valores canónicos usados en los cálculos (del Shiny original)
  VAL: {
    enCurso: "En curso", graduado: "Graduado", publicado: "Publicado",
    wos: "WoS-JCR", q1: "Q1", continuidadSi: "Sí", enEjecucion: "En ejecución",
    estadosProyecto: ["Postulado","En ejecución","Cerrado"],
    cuartiles: ["Q1","Q2","Q3","Q4"]
  }
};
