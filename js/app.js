// =============================================================================
// app.js — Arranque de la SPA. Verifica sesión contra el backend antes de todo.
// =============================================================================
(async function(){
  const user = await Auth.requireOrRedirect();
  if (!user) return;

  document.getElementById("toggle").onclick = () =>
    document.getElementById("sidebar").classList.toggle("collapsed");
  document.getElementById("logout").onclick = () => Auth.logout();
  const who = document.getElementById("who");
  if (who) who.textContent = user;

  // Registro de las 10 secciones
  Router.register(SecOferta);
  Router.register(SecEgresados);
  Router.register(SecMBA);
  Router.register(SecMCE);
  Router.register(SecConvenios);
  Router.register(SecAprendizaje);
  Router.register(SecPublicaciones);
  Router.register(SecProyectos);
  Router.register(SecPermisos);
  Router.register(SecActas);

  Router.start();
  Poll.start();
})();
