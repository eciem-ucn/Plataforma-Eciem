// =============================================================================
// auth.js (frontend) — Autenticación vía backend. La verificación de contraseña
// ocurre en el Worker; aquí solo se orquesta el login/logout y el guard de páginas.
// La sesión vive en una cookie httpOnly (no accesible por JS).
// =============================================================================
const Auth = {
  async login(user, pass){ return API.login(user, pass); },
  async logout(){ await API.logout(); location.href = "login.html"; },
  async currentUser(){ return API.me(); },
  // Guard: si no hay sesión válida en el backend, redirige al login.
  async requireOrRedirect(){
    const u = await API.me();
    if (!u){ location.href = "login.html"; return null; }
    return u;
  }
};
window.Auth = Auth;
