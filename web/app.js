// Al Toque Corrientes — prototipo navegable (sin servidor, sin librerías).
// Las publicaciones nuevas se guardan solo en este navegador (localStorage).
(function () {
  "use strict";

  var D = window.DATA;
  var app = document.getElementById("app");
  var toastEl = document.getElementById("toast");
  var toastTimer;
  var KEY = "altoque.publicaciones.v1";
  var MAX_FOTOS = 4;

  // ---------- utilidades ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ars(n) { return "$ " + Number(n).toLocaleString("es-AR"); }
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }
  function $(id) { return document.getElementById(id); }

  // ---------- publicaciones guardadas ----------
  var pubs = [];
  try { pubs = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { pubs = []; }
  function savePubs() {
    try { localStorage.setItem(KEY, JSON.stringify(pubs)); return true; }
    catch (e) { return false; }
  }
  function findPub(id) { return pubs.filter(function (p) { return p.id === id; })[0]; }
  function activas(tipo) { return pubs.filter(function (p) { return p.tipo === tipo && p.estadoPub === "activa"; }); }
  function allProductos() { return activas("producto").concat(D.productos); }
  function allServicios() { return activas("servicio").concat(D.servicios); }

  // ---------- íconos ----------
  var I = {
    search: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    back: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A6577" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    img: function (s) { return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/></svg>'; },
    bag: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
    wrench: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3.5 17.2a1.5 1.5 0 0 0 2.1 2.1l5.8-5.8a4 4 0 0 0 5.1-5.4l-2.5 2.5-2.1-.6-.6-2.1 2.4-2.6z"/></svg>',
    plus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    mail: '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 8l8 6 8-6"/></svg>',
    tick: '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  var BADGE = '<span class="badge"><svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><polygon points="6,0 0,7 4,7 3,12 10,4.5 6,4.5" fill="#FF5A1F"/></svg>Fundador</span>';

  // ---------- búsqueda y filtros ----------
  var state = { q: "", cat: "", zona: "", rubro: "" };

  function matchProducto(p) {
    return (!state.q || norm(p.titulo + " " + p.categoria + " " + p.zona).indexOf(norm(state.q)) > -1) &&
      (!state.cat || p.categoria === state.cat) &&
      (!state.zona || p.zona === state.zona);
  }
  function matchServicio(s) {
    return (!state.q || norm(s.rubro + " " + s.nombre + " " + s.zonas.join(" ")).indexOf(norm(state.q)) > -1) &&
      (!state.rubro || s.rubro === state.rubro) &&
      (!state.zona || s.zonas.indexOf(state.zona) > -1);
  }

  // ---------- piezas comunes ----------
  function top(title, back) {
    return '<div class="top"><a class="back" href="' + (back || "#/") + '" aria-label="Volver">' + I.back + "</a>" +
      "<h1>" + title + '</h1><img src="assets/icono.svg" alt="Al Toque Corrientes" width="42" height="40"></div>';
  }
  function select(id, label, options, value, cls) {
    var o = '<option value="">' + label + "</option>";
    options.forEach(function (x) {
      o += '<option value="' + esc(x) + '"' + (x === value ? " selected" : "") + ">" + esc(x) + "</option>";
    });
    return '<select id="' + id + '" class="' + (cls || "") + '" aria-label="' + label + '">' + o + "</select>";
  }
  function photoInner(p, size) {
    return p.fotos && p.fotos[0] ? '<img src="' + esc(p.fotos[0]) + '" alt="">' : I.img(size);
  }

  // ---------- cuenta ----------
  var pendingRoute = "#/";
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var TIPOS = [["vecino", "Vecino/a"], ["emprendimiento", "Emprendimiento o comercio"], ["prestador", "Prestador de servicios"]];

  function accountLinks() {
    if (!Auth.current()) return '<a class="link-small" href="#/ingresar">Ingresar</a>';
    return '<div class="links-row"><a class="link-small" href="#/mis-publicaciones">Mis publicaciones</a><a class="link-small" href="#/perfil">Mi perfil</a></div>';
  }
  // Devuelve true si puede seguir. Si no, manda a ingresar o a completar el perfil.
  function gate(target) {
    var u = Auth.current();
    if (!u) { pendingRoute = target; location.hash = "#/ingresar"; return false; }
    if (!u.perfil) { pendingRoute = target; location.hash = "#/perfil-nuevo"; return false; }
    return true;
  }
  function afterLogin() {
    var u = Auth.current();
    location.hash = u && u.perfil ? pendingRoute : "#/perfil-nuevo";
  }
  function misPubs() {
    var u = Auth.current(), changed = false;
    var l = pubs.filter(function (p) { return !p.uid || p.uid === u.id; });
    l.forEach(function (p) { if (!p.uid) { p.uid = u.id; changed = true; } });
    if (changed) savePubs();
    return l;
  }

  // ---------- inicio ----------
  function viewHome() {
    return '<main class="screen home">' +
      '<header class="brand"><img src="assets/icono.svg" alt="" width="46" height="44">' +
      '<div class="brand-name"><span>Al Toque</span><small>CORRIENTES</small></div></header>' +
      "<h1>¿Qué necesitás hoy?</h1>" +
      '<form class="search" id="home-search" role="search">' + I.search +
      '<input id="home-q" type="search" aria-label="Buscar" placeholder="Buscar en Corrientes" autocomplete="off"></form>' +
      '<nav class="choices" aria-label="Secciones">' +
      '<a class="choice choice-prod" href="#/productos">' + I.bag + "<div><strong>Productos</strong><span>Nuevos y usados, de emprendedores y vecinos</span></div></a>" +
      '<a class="choice choice-serv" href="#/servicios">' + I.wrench + "<div><strong>Servicios</strong><span>Oficios y trabajos cerca tuyo</span></div></a>" +
      "</nav>" +
      '<a class="btn-outline" href="#/publicar">Publicar gratis</a>' +
      accountLinks() +
      "</main>";
  }

  // ---------- listas ----------
  function viewProductos() {
    return '<main class="screen list">' + top("Productos") +
      '<div class="search">' + I.search + '<input id="q" type="search" aria-label="Buscar productos" placeholder="Buscar productos" value="' + esc(state.q) + '" autocomplete="off"></div>' +
      '<div class="filters">' + select("f-cat", "Categoría", D.categorias, state.cat) + select("f-zona", "Zona", D.zonas, state.zona) + "</div>" +
      '<div class="grid" id="results"></div>' +
      '<p class="note">Los productos de ejemplo son de prueba. Lo que publiques vos aparece primero.</p></main>';
  }
  function renderProductos() {
    var list = allProductos().filter(matchProducto);
    $("results").innerHTML = list.length ? list.map(function (p) {
      return '<article class="card"><div class="photo">' + photoInner(p, 40) + (p.fundador ? BADGE : "") + "</div>" +
        '<div class="price">' + ars(p.precio) + '</div><div class="title">' + esc(p.titulo) + "</div>" +
        '<div class="meta">' + I.pin + "<span>" + esc(p.zona) + " · " + esc(p.estado) + "</span></div>" +
        '<button class="btn" type="button" data-consultar="' + esc(p.id) + '">Consultar</button></article>';
    }).join("") : '<p class="empty">No encontramos productos con esa búsqueda.</p>';
  }

  function viewServicios() {
    return '<main class="screen list">' + top("Servicios") +
      '<div class="search">' + I.search + '<input id="q" type="search" aria-label="Buscar servicios" placeholder="Buscar servicios" value="' + esc(state.q) + '" autocomplete="off"></div>' +
      '<div class="filters">' + select("f-rubro", "Rubro", D.rubros, state.rubro) + select("f-zona", "Zona", D.zonas, state.zona) + "</div>" +
      '<div class="stack" id="results"></div>' +
      '<p class="note">Los prestadores de ejemplo son de prueba. Lo que publiques vos aparece primero.</p></main>';
  }
  function renderServicios() {
    var list = allServicios().filter(matchServicio);
    $("results").innerHTML = list.length ? list.map(function (s) {
      return '<article class="svc"><div class="svc-head"><div class="svc-photo">' + photoInner(s, 30) + "</div>" +
        '<div class="svc-info"><h2>' + esc(s.rubro) + "</h2><p>" + esc(s.nombre) + "</p>" +
        '<div class="meta">' + I.pin + "<span>" + esc(s.zonas.join(", ")) + "</span></div>" + (s.fundador ? BADGE : "") + "</div></div>" +
        '<div class="svc-foot"><span class="avail' + (s.hoy ? "" : " later") + '"><i></i>' + esc(s.disponible) + '</span><span class="rate">' + esc(s.tarifa) + "</span></div>" +
        '<button class="btn-navy" type="button" data-presupuesto="' + esc(s.id) + '">Pedir presupuesto</button></article>';
    }).join("") : '<p class="empty">No encontramos servicios con esa búsqueda.</p>';
  }

  // ---------- publicar: paso 1, elegir ----------
  function viewPublicar() {
    return '<main class="screen list">' + top("Publicar") +
      '<p class="lead">Publicar es gratis. ¿Qué querés publicar?</p>' +
      '<nav class="type-pick" aria-label="Tipo de publicación">' +
      '<a class="choice choice-prod" href="#/publicar/producto">' + I.bag + "<div><strong>Un producto</strong><span>Algo para vender, nuevo o usado</span></div></a>" +
      '<a class="choice choice-serv" href="#/publicar/servicio">' + I.wrench + "<div><strong>Un servicio</strong><span>Tu oficio o trabajo</span></div></a>" +
      "</nav>" +
      accountLinks() +
      "</main>";
  }

  // ---------- publicar: paso 2, formulario ----------
  var draft = { fotos: [] };

  function chipsRadio(name, items, checked) {
    return '<div class="chips" role="radiogroup">' + items.map(function (it) {
      return '<label class="chip"><input type="radio" name="' + name + '" value="' + esc(it[0]) + '"' + (it[0] === checked ? " checked" : "") + "><span>" + esc(it[1]) + "</span></label>";
    }).join("") + "</div>";
  }
  function chipsCheck(name, items, checkedList) {
    return '<div class="chips">' + items.map(function (it) {
      var v = Array.isArray(it) ? it[0] : it, t = Array.isArray(it) ? it[1] : it;
      return '<label class="chip"><input type="checkbox" name="' + name + '" value="' + esc(v) + '"' + (checkedList.indexOf(v) > -1 ? " checked" : "") + "><span>" + esc(t) + "</span></label>";
    }).join("") + "</div>";
  }
  function field(id, label, control, hint) {
    return '<div class="field"><label class="lbl" for="' + id + '">' + label + "</label>" + control +
      (hint ? '<p class="hint">' + hint + "</p>" : "") + '<p class="err" id="e-' + id + '" role="alert" hidden></p></div>';
  }
  function fieldGroup(id, label, control) {
    return '<fieldset class="field" aria-describedby="e-' + id + '"><legend class="lbl">' + label + "</legend>" + control +
      '<p class="err" id="e-' + id + '" role="alert" hidden></p></fieldset>';
  }

  function photosField(required) {
    return '<div class="field"><span class="lbl" id="l-fotos">Fotos ' + (required ? "" : "<em>(opcional)</em>") + "</span>" +
      '<div class="photos" id="photos" aria-labelledby="l-fotos"></div>' +
      '<input class="visually-hidden" id="file" type="file" accept="image/*" multiple tabindex="-1">' +
      '<p class="hint">Hasta ' + MAX_FOTOS + ' fotos. Se achican solas para que carguen rápido.</p>' +
      '<p class="err" id="e-fotos" role="alert" hidden></p></div>';
  }
  function renderPhotos() {
    var h = draft.fotos.map(function (src, i) {
      return '<div class="thumb"><img src="' + esc(src) + '" alt="Foto ' + (i + 1) + '"><button type="button" data-quitar="' + i + '" aria-label="Quitar foto ' + (i + 1) + '">×</button></div>';
    }).join("");
    h += '<button type="button" class="add-photo" id="add-photo"' + (draft.fotos.length >= MAX_FOTOS ? " hidden" : "") + ">" + I.plus + "<span>Agregar</span></button>";
    $("photos").innerHTML = h;
  }

  function viewForm(tipo) {
    var esProd = tipo === "producto";
    var perfil = Auth.current().perfil;
    var f = '<main class="screen list">' + top(esProd ? "Publicar producto" : "Publicar servicio", "#/publicar") +
      '<p class="hint" style="font-size:14px">Publicás como <strong>' + esc(perfil.nombre) + '</strong>. <a href="#/perfil" style="text-decoration:underline">Cambiar</a></p>' +
      '<form class="form" id="form" novalidate>' + photosField(esProd);

    if (esProd) {
      f += field("titulo", "¿Qué vendés?", '<input class="input" id="titulo" maxlength="60" autocomplete="off" placeholder="Ej: Bicicleta rodado 26">') +
        field("precio", "Precio en pesos", '<input class="input" id="precio" inputmode="numeric" autocomplete="off" placeholder="$ 0">') +
        fieldGroup("estado", "Estado", chipsRadio("estado", [["Nuevo", "Nuevo"], ["Usado", "Usado"]], "")) +
        field("categoria", "Categoría", select("categoria", "Elegí una categoría", D.categorias, "", "input")) +
        field("zona", "Barrio o zona", select("zona", "Elegí tu zona", D.zonas, perfil.zona, "input")) +
        '<details class="more"><summary>Más detalles (opcional)</summary><div class="form">' +
        fieldGroup("entrega", "Retiro o entrega", chipsCheck("entrega", ["Retiro en mi zona", "Entrega local"], ["Retiro en mi zona"])) +
        field("descripcion", "Descripción", '<textarea class="input" id="descripcion" maxlength="400" placeholder="Medidas, marca, detalles…"></textarea>') +
        "</div></details>";
    } else {
      f += field("rubro", "Rubro", select("rubro", "Elegí tu rubro", D.rubros, "", "input")) +
        fieldGroup("zonas", "¿En qué zonas trabajás?", chipsCheck("zonas", D.zonas, [])) +
        fieldGroup("disp", "Disponibilidad", chipsRadio("disp", [["hoy", "Hoy"], ["manana", "Mañana"], ["consultar", "A consultar"]], "hoy")) +
        field("tarifa", "Tarifa orientativa <em>(opcional)</em>", '<input class="input" id="tarifa" inputmode="numeric" autocomplete="off" placeholder="Desde $ 0">', "Si lo dejás vacío, figura “A convenir”.") +
        '<details class="more"><summary>Más detalles (opcional)</summary><div class="form">' +
        field("descripcion", "Descripción", '<textarea class="input" id="descripcion" maxlength="400" placeholder="Qué trabajos hacés, urgencias, herramientas…"></textarea>') +
        "</div></details>";
    }
    f += '<button class="btn-pub" type="submit">Publicar</button></form></main>';
    return f;
  }

  function showErr(id, msg) {
    var e = $("e-" + id);
    if (!e) return;
    e.textContent = msg; e.hidden = false;
    var el = $(id);
    if (el) el.setAttribute("aria-invalid", "true");
  }
  function clearErr(id) {
    var e = $("e-" + id);
    if (e) { e.hidden = true; e.textContent = ""; }
    var el = $(id);
    if (el) el.removeAttribute("aria-invalid");
  }

  function readImage(file) {
    return new Promise(function (resolve) {
      var fr = new FileReader();
      fr.onerror = function () { resolve(null); };
      fr.onload = function () {
        var im = new Image();
        im.onerror = function () { resolve(null); };
        im.onload = function () {
          var max = 900, s = Math.min(1, max / Math.max(im.width, im.height));
          var c = document.createElement("canvas");
          c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.72));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  function bindForm(tipo) {
    var esProd = tipo === "producto";
    draft = { fotos: [] };
    renderPhotos();

    $("photos").addEventListener("click", function (e) {
      var q = e.target.closest("[data-quitar]");
      if (q) { draft.fotos.splice(Number(q.getAttribute("data-quitar")), 1); renderPhotos(); return; }
      if (e.target.closest("#add-photo")) $("file").click();
    });
    $("file").addEventListener("change", function () {
      var files = Array.prototype.slice.call($("file").files, 0, MAX_FOTOS - draft.fotos.length);
      $("file").value = "";
      Promise.all(files.map(readImage)).then(function (res) {
        var ok = res.filter(Boolean);
        if (ok.length < files.length) toast("Una de las fotos no se pudo leer.");
        draft.fotos = draft.fotos.concat(ok).slice(0, MAX_FOTOS);
        if (ok.length) clearErr("fotos");
        renderPhotos();
      });
    });

    ["precio", "tarifa"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("input", function () {
        var d = el.value.replace(/\D/g, "").slice(0, 9);
        el.value = d ? Number(d).toLocaleString("es-AR") : "";
        clearErr(id);
      });
    });
    ["titulo", "nombre", "categoria", "zona", "rubro"].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("input", function () { clearErr(id); });
    });
    $("form").addEventListener("change", function (e) {
      if (e.target.name) clearErr(e.target.name);
    });

    $("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = [];
      function bad(id, msg) { errors.push(id); showErr(id, msg); }
      function ok(id) { clearErr(id); }
      function val(id) { return $(id).value.trim(); }
      function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; }
      function checks(name) { return Array.prototype.map.call(document.querySelectorAll('input[name="' + name + '"]:checked'), function (c) { return c.value; }); }

      var pub = { id: "u" + Date.now(), tipo: tipo, estadoPub: "activa", fotos: draft.fotos.slice(), descripcion: val("descripcion"), creada: Date.now(), fundador: false, uid: Auth.current().id };

      if (esProd) {
        if (!draft.fotos.length) bad("fotos", "Agregá al menos una foto."); else ok("fotos");
        if (val("titulo").length < 3) bad("titulo", "Escribí qué vendés."); else { ok("titulo"); pub.titulo = val("titulo"); }
        var precio = Number(val("precio").replace(/\D/g, ""));
        if (!precio) bad("precio", "Poné el precio en pesos."); else { ok("precio"); pub.precio = precio; }
        if (!radio("estado")) bad("estado", "Elegí si es nuevo o usado."); else { ok("estado"); pub.estado = radio("estado"); }
        if (!val("categoria")) bad("categoria", "Elegí una categoría."); else { ok("categoria"); pub.categoria = val("categoria"); }
        if (!val("zona")) bad("zona", "Elegí tu barrio o zona."); else { ok("zona"); pub.zona = val("zona"); }
        pub.entrega = checks("entrega");
      } else {
        pub.nombre = Auth.current().perfil.nombre;
        if (!val("rubro")) bad("rubro", "Elegí tu rubro."); else { ok("rubro"); pub.rubro = val("rubro"); }
        var zs = checks("zonas");
        if (!zs.length) bad("zonas", "Elegí al menos una zona."); else { ok("zonas"); pub.zonas = zs; }
        var disp = radio("disp");
        pub.disponible = disp === "hoy" ? "Disponible hoy" : disp === "manana" ? "Disponible mañana" : "A consultar";
        pub.hoy = disp === "hoy";
        var t = Number(val("tarifa").replace(/\D/g, ""));
        pub.tarifa = t ? "Desde " + ars(t) : "A convenir";
      }

      if (errors.length) {
        var first = errors[0];
        var target = $(first) || document.querySelector('[name="' + first + '"]') || $("photos");
        if (target && target.scrollIntoView) target.scrollIntoView({ block: "center" });
        if (target && target.focus && first !== "fotos") target.focus();
        return;
      }

      pubs.unshift(pub);
      if (!savePubs()) toast("No se pudo guardar en este navegador. La publicación queda hasta que cierres la página.");
      draft = { fotos: [] };
      location.hash = "#/publicado/" + pub.id;
    });
  }

  // ---------- publicado ----------
  function viewPublicado(id) {
    var p = findPub(id);
    if (!p) return viewPublicar();
    var donde = p.tipo === "producto" ? "#/productos" : "#/servicios";
    var nombre = p.tipo === "producto" ? "Productos" : "Servicios";
    return '<main class="screen done">' +
      '<div class="tick">' + I.tick + "</div>" +
      "<h1>¡Listo! Tu publicación ya está en Al Toque</h1>" +
      '<p class="lead">' + esc(p.tipo === "producto" ? p.titulo : p.rubro) + "</p>" +
      '<a class="btn-pub" style="display:flex;align-items:center;justify-content:center" href="' + donde + '">Verla en ' + nombre + "</a>" +
      '<a class="btn-outline" href="#/publicar">Publicar otra</a>' +
      '<a class="link-small" href="#/mis-publicaciones">Mis publicaciones</a>' +
      '<p class="note">Prueba: por ahora se guarda solo en este navegador.</p></main>';
  }

  // ---------- mis publicaciones ----------
  function viewMias() {
    var h = '<main class="screen list">' + top("Mis publicaciones", "#/");
    var lista = misPubs();
    if (!lista.length) {
      h += '<p class="empty">Todavía no publicaste nada.</p><a class="btn-pub" style="display:flex;align-items:center;justify-content:center" href="#/publicar">Publicar gratis</a>';
    } else {
      h += '<div class="stack">' + lista.map(function (p) {
        var esProd = p.tipo === "producto";
        var titulo = esProd ? p.titulo : p.rubro;
        var sub = esProd ? ars(p.precio) + " · " + p.zona : p.zonas.join(", ");
        var pill = p.estadoPub === "activa" ? '<span class="pill on">Activa</span>' :
          p.estadoPub === "pausada" ? '<span class="pill">Pausada</span>' :
          '<span class="pill">' + (esProd ? "Vendido" : "No disponible") + "</span>";
        var cerrada = p.estadoPub === "vendida";
        return '<article class="mine"><div class="mine-head"><div class="svc-photo">' + photoInner(p, 28) + "</div>" +
          '<div class="mine-info"><strong>' + esc(titulo) + "</strong><span>" + esc(sub) + "</span>" + pill + "</div></div>" +
          '<div class="mine-actions">' +
          (cerrada ? '<button type="button" data-act="activar" data-id="' + esc(p.id) + '">Volver a publicar</button>' :
            '<button type="button" data-act="' + (p.estadoPub === "activa" ? "pausar" : "activar") + '" data-id="' + esc(p.id) + '">' + (p.estadoPub === "activa" ? "Pausar" : "Reactivar") + "</button>" +
            '<button type="button" data-act="cerrar" data-id="' + esc(p.id) + '">' + (esProd ? "Marcar vendido" : "No disponible") + "</button>") +
          '<button type="button" class="danger" data-act="borrar" data-id="' + esc(p.id) + '">Borrar</button></div></article>';
      }).join("") + "</div>";
    }
    return h + "</main>";
  }
  function bindMias() {
    var armed = null;
    app.querySelector("main").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]");
      if (!b) return;
      var id = b.getAttribute("data-id"), act = b.getAttribute("data-act"), p = findPub(id);
      if (!p) return;
      if (act === "borrar") {
        if (armed !== id) {
          armed = id; b.textContent = "Tocá otra vez para borrar"; b.classList.add("armed");
          return;
        }
        pubs = pubs.filter(function (x) { return x.id !== id; });
      } else {
        armed = null;
        p.estadoPub = act === "pausar" ? "pausada" : act === "cerrar" ? "vendida" : "activa";
      }
      savePubs();
      route();
    });
  }

  // ---------- ingresar ----------
  function viewIngresar() {
    return '<main class="screen list">' + top("Ingresar", "#/") +
      '<p class="lead">Para publicar y chatear necesitás una cuenta. Es gratis y toma un minuto.</p>' +
      '<button class="btn-google" id="btn-google" type="button"><span class="g" aria-hidden="true">G</span>Continuar con Google</button>' +
      '<p class="sep">o con tu email</p>' +
      '<form class="form" id="email-form" novalidate>' +
      field("email", "Tu email", '<input class="input" id="email" type="email" inputmode="email" autocomplete="email" placeholder="nombre@email.com">') +
      '<button class="btn-pub" type="submit">Enviarme un enlace</button></form>' +
      '<p class="hint">Te mandamos un enlace al email. Lo tocás y entrás, sin contraseña.</p>' +
      (Auth.mode === "prueba" ? '<p class="note">Modo prueba: no se conecta con Google ni envía emails de verdad. Para el ingreso real, abrí la página desde http://localhost (ver guía).</p>' : "") +
      "</main>";
  }
  function bindIngresar() {
    var g = $("btn-google");
    g.addEventListener("click", function () {
      g.disabled = true;
      Auth.signInGoogle().then(afterLogin).catch(function (e) {
        var m = Auth.errorMessage(e);
        if (m) toast(m);
      }).then(function () { g.disabled = false; });
    });
    $("email").addEventListener("input", function () { clearErr("email"); });
    $("email-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = $("email").value.trim();
      if (!EMAIL_RE.test(v)) { showErr("email", "Revisá el email: parece que falta algo."); $("email").focus(); return; }
      var btn = document.querySelector("#email-form .btn-pub");
      btn.disabled = true; btn.textContent = "Enviando…";
      Auth.sendEmailLink(v).then(function () {
        location.hash = "#/revisa-tu-email";
      }).catch(function (err) {
        var m = Auth.errorMessage(err);
        if (m) showErr("email", m);
        btn.disabled = false; btn.textContent = "Enviarme un enlace";
      });
    });
  }

  function viewRevisa() {
    var mail = Auth.pendingEmail();
    if (!mail) return viewIngresar();
    return '<main class="screen done">' +
      '<div class="tick">' + I.mail + "</div>" +
      "<h1>Revisá tu email</h1>" +
      '<p class="lead">Te mandamos un enlace a <strong>' + esc(mail) + "</strong>. Tocalo desde este mismo dispositivo para entrar.</p>" +
      (Auth.mode === "prueba" ? '<button class="btn-pub" id="sim-link" type="button">Probar: ya toqué el enlace</button>' : "") +
      '<a class="link-small" href="#/ingresar">Usar otro email</a>' +
      (Auth.mode === "prueba"
        ? '<p class="note">Este botón es solo de prueba. En la versión real, entrás tocando el enlace que llega al email.</p>'
        : '<p class="note">Si no lo ves, mirá en spam. Si abrís el enlace en otro dispositivo, te pedimos de nuevo el email.</p>') +
      "</main>";
  }
  function bindRevisa() {
    var b = $("sim-link");
    if (b) b.addEventListener("click", function () { Auth.completeEmailLink().then(function (ok) { if (ok) afterLogin(); }); });
  }

  // ---------- confirmar email (enlace abierto en otro dispositivo) ----------
  function viewConfirmar() {
    return '<main class="screen list">' + top("Confirmá tu email", "#/") +
      '<p class="lead">Abriste el enlace en un dispositivo distinto. Escribí el email al que te lo mandamos para entrar.</p>' +
      '<form class="form" id="confirm-form" novalidate>' +
      field("email", "Tu email", '<input class="input" id="email" type="email" inputmode="email" autocomplete="email" placeholder="nombre@email.com">') +
      '<button class="btn-pub" type="submit">Entrar</button></form></main>';
  }
  function bindConfirmar() {
    $("email").addEventListener("input", function () { clearErr("email"); });
    $("confirm-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = $("email").value.trim();
      if (!EMAIL_RE.test(v)) { showErr("email", "Revisá el email: parece que falta algo."); $("email").focus(); return; }
      Auth.finishEmailLink(v).then(afterLogin).catch(function (err) {
        var m = Auth.errorMessage(err);
        showErr("email", m || "No pudimos completar el ingreso. Pedí un enlace nuevo.");
      });
    });
  }

  // ---------- perfil ----------
  function viewPerfil(esNuevo) {
    var u = Auth.current(), p = u.perfil || { nombre: "", zona: "", tipo: "vecino" };
    return '<main class="screen list">' + top(esNuevo ? "Un último paso" : "Mi perfil", esNuevo ? "#/" : "#/") +
      (esNuevo ? '<p class="lead">Contanos quién sos. Lo ven las personas que te consulten.</p>' : '<p class="who">Ingresaste con ' + esc(u.email) + "</p>") +
      '<form class="form" id="perfil-form" novalidate>' +
      field("p-nombre", "Tu nombre", '<input class="input" id="p-nombre" maxlength="40" autocomplete="name" placeholder="Ej: Marcelo R." value="' + esc(p.nombre) + '">') +
      field("p-zona", "Tu barrio o zona", select("p-zona", "Elegí tu zona", D.zonas, p.zona, "input")) +
      fieldGroup("tipo", "Soy", chipsRadio("tipo", TIPOS, p.tipo || "vecino")) +
      '<button class="btn-pub" type="submit">' + (esNuevo ? "Guardar y seguir" : "Guardar") + "</button></form>" +
      (esNuevo ? "" : '<button class="btn-text" id="salir" type="button">Cerrar sesión</button>') +
      "</main>";
  }
  function bindPerfil(esNuevo) {
    ["p-nombre", "p-zona"].forEach(function (id) { $(id).addEventListener("input", function () { clearErr(id); }); });
    $("perfil-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = $("p-nombre").value.trim(), zona = $("p-zona").value;
      var r = document.querySelector('input[name="tipo"]:checked');
      var bad = false;
      if (nombre.length < 2) { showErr("p-nombre", "Escribí tu nombre."); bad = true; } else clearErr("p-nombre");
      if (!zona) { showErr("p-zona", "Elegí tu barrio o zona."); bad = true; } else clearErr("p-zona");
      if (bad) { (nombre.length < 2 ? $("p-nombre") : $("p-zona")).focus(); return; }
      Auth.saveProfile({ nombre: nombre, zona: zona, tipo: r ? r.value : "vecino" });
      if (esNuevo) location.hash = pendingRoute; else toast("Perfil guardado.");
    });
    var salir = $("salir");
    if (salir) salir.addEventListener("click", function () {
      Auth.signOut().then(function () { pendingRoute = "#/"; location.hash = "#/"; toast("Cerraste sesión."); });
    });
  }

  // ---------- navegación ----------
  function bindList(render) {
    var q = $("q");
    q.addEventListener("input", function () { state.q = q.value; render(); });
    ["f-cat", "f-rubro", "f-zona"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("change", function () {
        if (id === "f-cat") state.cat = el.value;
        if (id === "f-rubro") state.rubro = el.value;
        if (id === "f-zona") state.zona = el.value;
        render();
      });
    });
    $("results").addEventListener("click", function (e) {
      if (e.target.closest("button")) toast("El chat llega en el próximo paso.");
    });
  }

  function bindHome() {
    $("home-search").addEventListener("submit", function (e) {
      e.preventDefault();
      var text = $("home-q").value.trim();
      if (!text) { $("home-q").focus(); return; }
      state.q = text;
      var hayProd = allProductos().some(matchProducto);
      var hayServ = allServicios().some(matchServicio);
      location.hash = (!hayProd && hayServ) ? "#/servicios" : "#/productos";
    });
  }

  function route() {
    var parts = (location.hash || "#/").replace(/^#\/?/, "").split("?")[0].split("/");
    var r = parts[0], sub = parts[1];
    if (r === "productos") {
      app.innerHTML = viewProductos(); renderProductos(); bindList(renderProductos);
    } else if (r === "servicios") {
      app.innerHTML = viewServicios(); renderServicios(); bindList(renderServicios);
    } else if (r === "ingresar") {
      app.innerHTML = viewIngresar(); bindIngresar();
    } else if (r === "revisa-tu-email") {
      app.innerHTML = viewRevisa(); if (Auth.pendingEmail()) bindRevisa(); else bindIngresar();
    } else if (r === "confirmar-email") {
      if (!Auth.needsEmail()) { location.hash = "#/ingresar"; return; }
      app.innerHTML = viewConfirmar(); bindConfirmar();
    } else if (r === "perfil-nuevo") {
      if (!Auth.current()) { pendingRoute = "#/"; location.hash = "#/ingresar"; return; }
      app.innerHTML = viewPerfil(true); bindPerfil(true);
    } else if (r === "perfil") {
      if (!gate("#/perfil")) return;
      app.innerHTML = viewPerfil(false); bindPerfil(false);
    } else if (r === "publicar" && (sub === "producto" || sub === "servicio")) {
      if (!gate("#/publicar/" + sub)) return;
      app.innerHTML = viewForm(sub); bindForm(sub);
    } else if (r === "publicar") {
      if (!gate("#/publicar")) return;
      app.innerHTML = viewPublicar();
    } else if (r === "publicado") {
      app.innerHTML = viewPublicado(sub);
    } else if (r === "mis-publicaciones") {
      if (!gate("#/mis-publicaciones")) return;
      app.innerHTML = viewMias(); bindMias();
    } else {
      pendingRoute = "#/";
      state = { q: "", cat: "", zona: "", rubro: "" };
      app.innerHTML = viewHome(); bindHome();
    }
    window.scrollTo(0, 0);
    document.title = "Al Toque Corrientes";
  }

  window.addEventListener("hashchange", route);
  Auth.ready.then(function () {
    var u = Auth.current(), h = location.hash;
    function go(dest) { if (location.hash === dest) route(); else location.hash = dest; }
    if (Auth.needsEmail()) { go("#/confirmar-email"); return; }
    if (Auth.linkError) toast(Auth.errorMessage(Auth.linkError) || "No pudimos completar el ingreso con el enlace.");
    if (u && !u.perfil && (!h || h === "#/")) { pendingRoute = "#/"; go("#/perfil-nuevo"); return; }
    route();
  });
})();
