// Capa de ingreso de Al Toque Corrientes.
// Modo "firebase": ingreso real (Google y enlace por email). Solo funciona si la página se abre desde http(s), por ejemplo http://localhost.
// Modo "prueba": simulado y local. Se usa al abrir index.html con doble clic o si Firebase no carga.
// El resto de la app usa siempre estos mismos métodos.
window.Auth = (function () {
  "use strict";
  var FB_VER = "10.14.1";
  var UK = "altoque.sesion.v1", PK = "altoque.perfiles.v1", EK = "altoque.emailpendiente.v1";

  function read(k, def) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; }
    catch (e) { return def; }
  }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function drop(k) { try { localStorage.removeItem(k); } catch (e) {} }

  var perfiles = read(PK, {});
  var simSesion = read(UK, null);
  var fb = null;
  var linkNeedsEmail = false;

  var api = {
    mode: window.FIREBASE_CONFIG && /^https?:$/.test(location.protocol) ? "firebase" : "prueba",
    linkError: null
  };

  function idDeEmail(e) { return "e-" + e.toLowerCase().replace(/[^a-z0-9]/g, "_"); }
  function cleanUrl() { try { history.replaceState(null, "", location.pathname + "#/"); } catch (e) {} }

  // Traduce los errores de Firebase a mensajes claros.
  api.errorMessage = function (e) {
    var c = e && e.code ? e.code : "";
    if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request") return "";
    var m = {
      "auth/popup-blocked": "Tu navegador bloqueó la ventana de Google. Permitila e intentá de nuevo.",
      "auth/unauthorized-domain": "Esta dirección no está autorizada en Firebase. Agregala en Authentication > Configuración > Dominios autorizados.",
      "auth/operation-not-allowed": "Falta activar este método de ingreso en Firebase (Authentication > Método de acceso).",
      "auth/network-request-failed": "No hay conexión. Revisá tu internet e intentá de nuevo.",
      "auth/invalid-email": "Revisá el email: parece que falta algo.",
      "auth/too-many-requests": "Hiciste muchos intentos. Esperá unos minutos e intentá de nuevo.",
      "auth/invalid-action-code": "El enlace ya se usó o venció. Pedí uno nuevo.",
      "auth/expired-action-code": "El enlace venció. Pedí uno nuevo.",
      "auth/user-disabled": "Esta cuenta está deshabilitada."
    };
    return m[c] || "No pudimos completar el ingreso. Intentá de nuevo.";
  };

  function loadFirebase() {
    var base = "https://www.gstatic.com/firebasejs/" + FB_VER + "/";
    var carga = Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js")]).then(function (m) {
      var A = m[1];
      var app = m[0].initializeApp(window.FIREBASE_CONFIG);
      var auth = A.getAuth(app);
      auth.languageCode = "es";
      fb = { A: A, auth: auth };
      // Esperar a que Firebase informe si hay sesión guardada.
      return new Promise(function (resolve) {
        var off = A.onAuthStateChanged(auth, function () { off(); resolve(); });
      });
    }).then(function () {
      // ¿Llegó desde el enlace del email?
      if (!fb.A.isSignInWithEmailLink(fb.auth, location.href)) return;
      var email = read(EK, null);
      if (!email) { linkNeedsEmail = true; return; }
      return api.finishEmailLink(email).catch(function (e) { api.linkError = e; });
    });
    var limite = new Promise(function (_, reject) { setTimeout(function () { reject(new Error("timeout")); }, 10000); });
    return Promise.race([carga, limite]).catch(function () {
      // Si Firebase no carga, seguimos en modo prueba para no dejar la app trabada.
      api.mode = "prueba";
      fb = null;
    });
  }

  api.ready = api.mode === "firebase" ? loadFirebase() : Promise.resolve();

  // Devuelve { id, email, via, perfil } o null si no hay sesión.
  api.current = function () {
    var s = null;
    if (api.mode === "firebase" && fb) {
      var u = fb.auth.currentUser;
      if (u) {
        var g = u.providerData.some(function (p) { return p.providerId === "google.com"; });
        s = { id: u.uid, email: u.email || "", via: g ? "google" : "email" };
      }
    } else {
      s = simSesion;
    }
    if (!s) return null;
    return { id: s.id, email: s.email, via: s.via, perfil: perfiles[s.id] || null };
  };

  api.signInGoogle = function () {
    if (api.mode === "firebase" && fb) {
      var A = fb.A;
      return A.signInWithPopup(fb.auth, new A.GoogleAuthProvider()).then(function () {});
    }
    simSesion = { id: "g-prueba", email: "tu-cuenta@gmail.com", via: "google" };
    write(UK, simSesion);
    return Promise.resolve();
  };

  api.sendEmailLink = function (email) {
    if (api.mode === "firebase" && fb) {
      var settings = { url: location.origin + location.pathname, handleCodeInApp: true };
      return fb.A.sendSignInLinkToEmail(fb.auth, email, settings).then(function () { write(EK, email); });
    }
    write(EK, email);
    return Promise.resolve();
  };

  api.pendingEmail = function () { return read(EK, null); };

  // Modo prueba: simula tocar el enlace del email.
  api.completeEmailLink = function () {
    var email = read(EK, null);
    if (api.mode === "firebase" || !email) return Promise.resolve(false);
    simSesion = { id: idDeEmail(email), email: email, via: "email" };
    write(UK, simSesion);
    drop(EK);
    return Promise.resolve(true);
  };

  // Modo firebase: llegó por el enlace pero en otro dispositivo, falta confirmar el email.
  api.needsEmail = function () { return linkNeedsEmail; };
  api.finishEmailLink = function (email) {
    return fb.A.signInWithEmailLink(fb.auth, email, location.href).then(function () {
      drop(EK); linkNeedsEmail = false; cleanUrl();
    }).catch(function (e) { cleanUrl(); throw e; });
  };

  // perfil: { nombre, zona, tipo }
  api.saveProfile = function (p) {
    var u = api.current();
    if (!u) return;
    perfiles[u.id] = p;
    write(PK, perfiles);
  };

  api.signOut = function () {
    if (api.mode === "firebase" && fb) return fb.A.signOut(fb.auth);
    simSesion = null; drop(UK);
    return Promise.resolve();
  };

  return api;
})();
