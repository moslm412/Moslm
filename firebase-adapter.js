// محوّل Firebase: يحفظ الطلب في Firestore عند التفعيل، وإلا لا يفعل شيئاً.
// لا يحتاج العميل لأي تسجيل دخول أو بريد أو كلمة سر.
window.FirebaseAdapter = (function () {
  const cfg = window.FIREBASE_CONFIG || {};
  let db = null, loading = null;

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  async function init() {
    if (!cfg.enabled) return null;
    if (db) return db;
    if (!loading) {
      loading = (async () => {
        await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
        await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
        firebase.initializeApp(cfg);
        db = firebase.firestore();
        return db;
      })().catch(e => { console.warn("Firebase غير متاح:", e); return null; });
    }
    return loading;
  }

  async function saveOrder(order) {
    try {
      const d = await init();
      if (!d) return false;
      await d.collection("orders").add({
        ...order,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      console.warn("تعذر حفظ الطلب:", e);
      return false;
    }
  }

  return { init, saveOrder };
})();
