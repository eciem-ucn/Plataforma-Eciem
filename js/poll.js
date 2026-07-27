// =============================================================================
// poll.js — Detección de cambios por polling contra el backend.
// Pide la firma del árbol al Worker; si cambió, invalida cache y re-renderiza.
// =============================================================================
const Poll = {
  timer:null,
  async checkOnce(){
    try{
      const sig = await DataStore.refreshSignature();
      if (DataStore.lastSignature && sig !== DataStore.lastSignature){
        DataStore.invalidate();
        this.notify();
        Router.navigate();
      }
      DataStore.lastSignature = sig;
    }catch(e){ console.warn("Poll error:", e.message); }
  },
  notify(){
    const el=document.getElementById("poll-note");
    if(!el) return;
    el.style.opacity="1";
    setTimeout(()=>el.style.opacity="0", 3000);
  },
  start(){
    this.checkOnce();
    const ms=(CONFIG.POLL_MINUTES||5)*60*1000;
    this.timer=setInterval(()=>this.checkOnce(), ms);
  }
};
window.Poll = Poll;
