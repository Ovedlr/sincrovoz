/* SincroVoz · interacciones del sitio. Sin dependencias. */
(function () {
  "use strict";

  var calma = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Fin del cupón LANZAMIENTO (15 de diciembre de 2026, hora de Colombia).
  var FIN_CUPON = new Date("2026-12-15T23:59:59-05:00").getTime();
  var PRECIO_NORMAL = 9.99, PRECIO_CUPON = 4.99;

  /* ---------- utilidades ---------- */
  function aviso(texto) {
    var a = $(".aviso");
    a.textContent = texto;
    a.classList.add("ver");
    clearTimeout(aviso.t);
    aviso.t = setTimeout(function () { a.classList.remove("ver"); }, 2200);
  }
  function animar(desde, hasta, ms, paso, fin) {
    if (calma) { paso(hasta); if (fin) fin(); return; }
    var t0 = performance.now();
    (function cuadro(t) {
      var p = Math.min(1, (t - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      paso(desde + (hasta - desde) * e);
      if (p < 1) requestAnimationFrame(cuadro); else if (fin) fin();
    })(t0);
  }
  function alVer(el, fn, umbral) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: umbral || 0.3 });
    io.observe(el);
  }
  var coma = function (n) { return n.toFixed(2).replace(".", ","); };

  /* ---------- audio compartido ---------- */
  var ctx = null;
  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // Sílaba sintética: "voz" breve con tono y filtro de formante.
  function silaba(cuando, tono, destino, volumen) {
    var c = ctx, o1 = c.createOscillator(), o2 = c.createOscillator();
    var f = c.createBiquadFilter(), g = c.createGain();
    o1.type = "sawtooth"; o2.type = "triangle";
    o1.frequency.setValueAtTime(tono, cuando);
    o1.frequency.linearRampToValueAtTime(tono * 0.85, cuando + 0.16);
    o2.frequency.setValueAtTime(tono * 2, cuando);
    f.type = "bandpass"; f.frequency.value = 900 + Math.random() * 500; f.Q.value = 1.4;
    g.gain.setValueAtTime(0.0001, cuando);
    g.gain.exponentialRampToValueAtTime(volumen, cuando + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.17);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(destino);
    o1.start(cuando); o2.start(cuando); o1.stop(cuando + 0.2); o2.stop(cuando + 0.2);
  }

  // Patrón de sílabas compartido por la demo y el laboratorio (segundos dentro de un ciclo).
  var CICLO = 2.4;
  var SILABAS = [0.18, 0.52, 0.84, 1.32, 1.62, 1.96];
  var TONOS = [170, 190, 160, 200, 175, 150];

  /* ---------- barra superior, progreso y menú ---------- */
  (function () {
    var barra = $(".barra"), prog = $(".progreso");
    var enlaces = $$(".menu a");
    var secciones = enlaces.map(function (a) { return $(a.getAttribute("href")); });
    function alDesplazar() {
      var h = document.documentElement;
      var p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      prog.style.transform = "scaleX(" + p + ")";
      barra.classList.toggle("compacta", h.scrollTop > 20);
      var actual = -1;
      secciones.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 140) actual = i; });
      enlaces.forEach(function (a, i) { a.classList.toggle("actual", i === actual); });
    }
    window.addEventListener("scroll", alDesplazar, { passive: true });
    alDesplazar();

    var ham = $(".hamburguesa"), menu = $("#menu");
    ham.addEventListener("click", function () {
      var abierto = menu.classList.toggle("abierto");
      ham.setAttribute("aria-expanded", abierto);
    });
    enlaces.forEach(function (a) {
      a.addEventListener("click", function () { menu.classList.remove("abierto"); ham.setAttribute("aria-expanded", "false"); });
    });
  })();

  /* ---------- aparición al desplazarse ---------- */
  (function () {
    var els = $$(".revelar");
    if (calma || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("visto"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var hermanos = $$(".revelar", e.target.parentNode);
        var i = Math.max(0, hermanos.indexOf(e.target));
        e.target.style.transitionDelay = Math.min(i, 6) * 70 + "ms";
        e.target.classList.add("visto");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- portada con inclinación ---------- */
  (function () {
    var escena = $(".escena"), cap = $(".inclinable");
    if (!escena || calma || !window.matchMedia("(hover: hover)").matches) return;
    escena.addEventListener("mousemove", function (e) {
      var r = escena.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      cap.style.transform = "rotateY(" + ((x - 0.5) * 8) + "deg) rotateX(" + ((0.5 - y) * 6) + "deg)";
      cap.style.setProperty("--bx", x * 100 + "%");
      cap.style.setProperty("--by", y * 100 + "%");
    });
    escena.addEventListener("mouseleave", function () { cap.style.transform = ""; });
  })();

  /* ---------- cifras que cuentan ---------- */
  $$("[data-contar]").forEach(function (b) {
    var meta = parseFloat(b.getAttribute("data-contar")), suf = b.getAttribute("data-sufijo") || "";
    var fmt = function (v) { var n = Math.round(v); return (n < 0 ? "−" + Math.abs(n) : n) + suf; };
    b.textContent = fmt(0);
    alVer(b, function () { animar(0, meta, 1400, function (v) { b.textContent = fmt(v); }); }, 0.6);
  });

  /* ---------- tarjetas con foco ---------- */
  $$(".tarjeta.foco").forEach(function (t) {
    t.addEventListener("mousemove", function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty("--x", e.clientX - r.left + "px");
      t.style.setProperty("--y", e.clientY - r.top + "px");
    });
  });

  /* ---------- demo de sincronía ---------- */
  var demoSonido = { activo: false };
  (function () {
    var raiz = $("#demoSync");
    if (!raiz) return;
    var boca = $(".boca", raiz), onda = $(".onda-voz", raiz), sello = $("[data-sello]", raiz);
    var lectura = $("[data-lectura]", raiz), explica = $("[data-explica]", raiz);
    var rango = $("[data-desfase]", raiz), cabezal = $(".cabezal", raiz);
    var carrilImg = $('[data-carril="imagen"]', raiz), carrilVoz = $('[data-carril="voz"]', raiz);
    var bSonido = $("[data-sonido]", raiz), bCorregir = $("[data-corregir]", raiz);
    var panelAn = $("[data-analisis]", raiz), barraAn = $(".barra-avance i", panelAn), fase = $("[data-fase]", raiz);

    var desfase = 240; // ms; positivo = la voz llega tarde
    var t0 = performance.now() / 1000;
    var programadas = {};
    var salida = null;

    SILABAS.forEach(function (s) {
      var i = document.createElement("i"); i.style.left = (s / CICLO * 100) + "%"; carrilImg.appendChild(i);
    });
    var marcasVoz = SILABAS.map(function (s, k) {
      var i = document.createElement("i"); i.style.height = (45 + (k * 37 % 40)) + "%"; carrilVoz.appendChild(i); return i;
    });

    function pintar() {
      var v = Math.round(desfase);
      lectura.textContent = (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + " ms";
      var ok = Math.abs(v) < 15;
      lectura.classList.toggle("ok", ok);
      sello.classList.toggle("ok", ok);
      sello.textContent = ok ? "Sincronizado" : "Desfasado";
      explica.textContent = ok ? "Voz e imagen coinciden" : v > 0 ? "La voz llega después que la boca" : "La voz se adelanta a la boca";
      marcasVoz.forEach(function (m, k) {
        var x = ((SILABAS[k] + v / 1000) % CICLO + CICLO) % CICLO;
        m.style.left = (x / CICLO * 100) + "%";
      });
      rango.value = v;
    }
    pintar();

    rango.addEventListener("input", function () { desfase = parseFloat(rango.value); pintar(); });

    function envolvente(d) { // d en segundos desde la sílaba
      if (d < 0 || d > 0.2) return 0;
      return d < 0.04 ? d / 0.04 : 1 - (d - 0.04) / 0.16;
    }
    var antes = 0;
    function cuadro() {
      var ahora = performance.now() / 1000;
      var t = ((ahora - t0) % CICLO + CICLO) % CICLO;
      var abre = 0;
      SILABAS.forEach(function (s) {
        abre = Math.max(abre, envolvente(t - s), envolvente(t - s + CICLO));
        var sv = ((s + desfase / 1000) % CICLO + CICLO) % CICLO;
        var cruzo = antes <= t ? (sv > antes && sv <= t) : (sv > antes || sv <= t);
        if (cruzo) { onda.classList.remove("pulso"); void onda.offsetWidth; onda.classList.add("pulso"); }
      });
      antes = t;
      boca.setAttribute("height", 6 + abre * 26);
      boca.setAttribute("y", 112 - abre * 6);
      var ancho = carrilImg.clientWidth;
      cabezal.style.left = (carrilImg.offsetLeft + t / CICLO * ancho) + "px";

      if (demoSonido.activo && ctx) {
        var k0 = Math.floor((ahora - t0) / CICLO);
        for (var k = k0 - 1; k <= k0 + 1; k++) {
          SILABAS.forEach(function (s, i) {
            var e = t0 + k * CICLO + s + desfase / 1000, clave = k + ":" + i;
            if (e > ahora && e < ahora + 0.12 && !programadas[clave]) {
              programadas[clave] = 1;
              silaba(ctx.currentTime + (e - ahora), TONOS[i], salida, 0.5);
            }
          });
        }
        if (Object.keys(programadas).length > 60) programadas = {};
      }
      requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);

    demoSonido.apagar = function () {
      demoSonido.activo = false;
      bSonido.setAttribute("aria-pressed", "false");
      $("span", bSonido).textContent = "Activar sonido";
    };
    bSonido.addEventListener("click", function () {
      if (demoSonido.activo) { demoSonido.apagar(); return; }
      if (!audio()) { aviso("Tu navegador no permite reproducir el sonido de la demo."); return; }
      if (!salida) { salida = ctx.createGain(); salida.gain.value = 0.6; salida.connect(ctx.destination); }
      if (labSonido.apagar) labSonido.apagar();
      demoSonido.activo = true; programadas = {};
      bSonido.setAttribute("aria-pressed", "true");
      $("span", bSonido).textContent = "Silenciar";
    });

    bCorregir.addEventListener("click", function () {
      if (Math.abs(desfase) < 15) { desfase = (Math.random() < 0.5 ? -1 : 1) * (150 + Math.round(Math.random() * 20) * 10); pintar(); return; }
      bCorregir.disabled = true; rango.disabled = true;
      panelAn.hidden = false;
      var fases = ["Analizando la imagen…", "Escuchando la voz…", "Calculando el desfase…"];
      var dur = calma ? 10 : 1800;
      animar(0, 100, dur, function (p) {
        barraAn.style.width = p + "%";
        fase.textContent = fases[Math.min(2, Math.floor(p / 34))];
      }, function () {
        fase.textContent = "Desfase encontrado: " + lectura.textContent + ". Corrigiendo…";
        animar(desfase, 0, 700, function (v) { desfase = v; pintar(); }, function () {
          desfase = 0; pintar();
          fase.textContent = "Listo. Voz e imagen en su sitio.";
          $("span", bCorregir).textContent = "Desfasar otra vez";
          bCorregir.disabled = false; rango.disabled = false;
          setTimeout(function () { panelAn.hidden = true; barraAn.style.width = "0"; }, 2200);
        });
      });
    });
    rango.addEventListener("input", function () { $("span", bCorregir).textContent = "Corregir con SincroVoz"; });
  })();

  /* ---------- laboratorio de audio ---------- */
  var labSonido = {};
  (function () {
    var lab = $("#lab");
    if (!lab) return;
    var pestanas = $$("[data-tab]", lab), paneles = $$("[data-panel]", lab);
    pestanas.forEach(function (p) {
      p.addEventListener("click", function () {
        pestanas.forEach(function (q) { q.setAttribute("aria-selected", q === p); });
        paneles.forEach(function (x) { x.hidden = x.getAttribute("data-panel") !== p.getAttribute("data-tab"); });
        if (p.getAttribute("data-tab") !== "ruido" && labSonido.apagar) labSonido.apagar();
      });
    });

    // Ruido
    var lienzo = $("[data-lienzo-ruido]", lab), c2 = lienzo.getContext("2d");
    var nota = $("[data-nota-ruido]", lab), bEsc = $("[data-escuchar-ruido]", lab);
    var NIVELES = [1, 0.42, 0.18, 0.06];
    var NOTAS = ["El ventilador y el zumbido tapan la voz.", "Suave: baja el ruido y conserva todo el ambiente.",
      "Media: la voz queda clara y natural.", "Fuerte: casi sin ruido, ideal para grabaciones muy ruidosas."];
    var intensidad = 0, ruidoActual = 1, fase = 0;
    $$("[data-intensidad]", lab).forEach(function (b) {
      b.addEventListener("click", function () {
        intensidad = +b.getAttribute("data-intensidad");
        $$("[data-intensidad]", lab).forEach(function (x) { x.setAttribute("aria-checked", x === b); });
        nota.textContent = NOTAS[intensidad];
        if (gRuido) gRuido.gain.setTargetAtTime(0.22 * NIVELES[intensidad], ctx.currentTime, 0.08);
      });
    });
    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(lienzo);
    }
    function dibujar() {
      requestAnimationFrame(dibujar);
      if (!visible || lienzo.offsetParent === null) return;
      ruidoActual += (NIVELES[intensidad] - ruidoActual) * 0.08;
      fase += calma ? 0 : 0.012;
      var W = lienzo.width, H = lienzo.height, mid = H / 2, barras = 150, paso = W / barras;
      c2.clearRect(0, 0, W, H);
      var grad = c2.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "#ffb23e"); grad.addColorStop(0.45, "#ff6a3d"); grad.addColorStop(1, "#e0366f");
      for (var i = 0; i < barras; i++) {
        var t = (i / barras * CICLO + fase) % CICLO, v = 0;
        SILABAS.forEach(function (s) { var d = t - s; if (d > -0.03 && d < 0.22) v = Math.max(v, Math.sin(Math.PI * (d + 0.03) / 0.25)); });
        var hash = Math.sin(i * 12.9898 + Math.floor(fase * 40) * 78.233) * 43758.5453;
        var ruido = (0.35 + 0.65 * (hash - Math.floor(hash))) * 0.42 * ruidoActual;
        var hv = v * (0.55 + 0.4 * Math.abs(Math.sin(i * 1.7))) * mid * 0.9;
        var hr = ruido * mid;
        c2.fillStyle = "rgba(154,162,182,.35)";
        c2.fillRect(i * paso + 1, mid - hr, paso - 2, hr * 2);
        if (hv > 1) { c2.fillStyle = grad; c2.fillRect(i * paso + 1, mid - hv, paso - 2, hv * 2); }
      }
    }
    requestAnimationFrame(dibujar);

    var gRuido = null, fuenteRuido = null, salidaVoz = null, temporizador = null;
    labSonido.apagar = function () {
      if (fuenteRuido) { try { fuenteRuido.stop(); } catch (e) {} fuenteRuido = null; }
      clearInterval(temporizador);
      bEsc.setAttribute("aria-pressed", "false"); bEsc.textContent = "Escuchar";
    };
    bEsc.addEventListener("click", function () {
      if (fuenteRuido) { labSonido.apagar(); return; }
      if (!audio()) { aviso("Tu navegador no permite reproducir el sonido de la demo."); return; }
      if (demoSonido.apagar) demoSonido.apagar();
      var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), ult = 0;
      for (var i = 0; i < len; i++) { // ruido marrón + zumbido de 60 Hz
        ult = (ult + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = ult * 3.2 + 0.08 * Math.sin(2 * Math.PI * 60 * i / ctx.sampleRate);
      }
      fuenteRuido = ctx.createBufferSource(); fuenteRuido.buffer = buf; fuenteRuido.loop = true;
      gRuido = ctx.createGain(); gRuido.gain.value = 0.22 * NIVELES[intensidad];
      fuenteRuido.connect(gRuido); gRuido.connect(ctx.destination); fuenteRuido.start();
      if (!salidaVoz) { salidaVoz = ctx.createGain(); salidaVoz.gain.value = 0.5; salidaVoz.connect(ctx.destination); }
      var inicio = ctx.currentTime + 0.1, ciclo = 0;
      function programar() {
        while (inicio + ciclo * CICLO < ctx.currentTime + 0.6) {
          SILABAS.forEach(function (s, i) { silaba(inicio + ciclo * CICLO + s, TONOS[i], salidaVoz, 0.5); });
          ciclo++;
        }
      }
      programar(); temporizador = setInterval(programar, 300);
      bEsc.setAttribute("aria-pressed", "true"); bEsc.textContent = "Detener";
    });

    // Volumen
    var nivel = $("[data-nivel]", lab), lufs = $("[data-lufs]", lab), estado = $("[data-estado-vol]", lab), redes = $(".redes", lab);
    var valor = -23;
    function ponerVol(v) {
      valor = v;
      nivel.style.width = ((v + 30) / 24 * 100) + "%";
      lufs.textContent = "−" + Math.abs(v).toFixed(0);
      var ok = Math.abs(v + 14) < 0.5;
      estado.textContent = ok ? "Listo para redes" : "Muy bajo para redes";
      estado.classList.toggle("ok", ok); redes.classList.toggle("ok", ok);
    }
    ponerVol(-23);
    $("[data-normalizar]", lab).addEventListener("click", function () {
      animar(valor, -14, 1400, function (v) { lufs.textContent = "−" + Math.abs(v).toFixed(0); });
      ponerVol(-14);
    });
    $("[data-reiniciar-vol]", lab).addEventListener("click", function () { ponerVol(-23); });

    // Extraer
    var nombre = $("[data-nombre-archivo]", lab);
    var NOMBRES = { wav: "mi_video_audio.wav", mp3: "mi_video_audio.mp3", copia: "mi_video_audio.m4a · pista original" };
    $$("[data-formato]", lab).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("[data-formato]", lab).forEach(function (x) { x.classList.toggle("activo", x === b); });
        nombre.textContent = NOMBRES[b.getAttribute("data-formato")];
      });
    });
  })();

  /* ---------- recorrido de pasos ---------- */
  (function () {
    var raiz = $("#recorrido");
    if (!raiz) return;
    var botones = $$("[data-paso]", raiz), vistas = $$("[data-vista]", raiz);
    var DUR = 4800, actual = 0, auto = true, inicio = 0, porcAnim = null;
    var porc = $("[data-porc]", raiz), barraP = $("[data-barra-porc]", raiz), faseP = $("[data-fase-paso]", raiz);

    function mostrar(n) {
      actual = n; inicio = performance.now();
      botones.forEach(function (b, i) { b.setAttribute("aria-selected", i === n); $(".avance", b).style.width = "0"; });
      vistas.forEach(function (v, i) { v.classList.toggle("activa", i === n); });
      if (n === 1) {
        var fases = ["Leyendo la imagen…", "Analizando la voz…", "Aplicando la corrección…"];
        porcAnim = {};
        var yo = porcAnim;
        animar(0, 100, calma ? 10 : 3400, function (p) {
          if (yo !== porcAnim) return;
          porc.textContent = Math.round(p); barraP.style.width = p + "%";
          faseP.textContent = p >= 100 ? "Sincronización completa" : fases[Math.min(2, Math.floor(p / 34))];
        });
      }
    }
    botones.forEach(function (b, i) { b.addEventListener("click", function () { auto = false; mostrar(i); }); });
    var activo = false;
    function cuadro(t) {
      if (auto && activo) {
        var p = Math.min(1, (t - inicio) / DUR);
        $(".avance", botones[actual]).style.width = p * 100 + "%";
        if (p >= 1) mostrar((actual + 1) % botones.length);
      }
      requestAnimationFrame(cuadro);
    }
    alVer(raiz, function () { activo = !calma; mostrar(0); requestAnimationFrame(cuadro); }, 0.35);
  })();

  /* ---------- precio, cupón y cuenta regresiva ---------- */
  (function () {
    var vigente = Date.now() < FIN_CUPON;
    var precio = $("[data-precio]");
    $$("[data-cupon-vigente]").forEach(function (e) { e.hidden = !vigente; });
    if (!vigente) { precio.textContent = coma(PRECIO_NORMAL); return; }
    precio.textContent = coma(PRECIO_NORMAL);
    alVer(precio, function () {
      setTimeout(function () { animar(PRECIO_NORMAL, PRECIO_CUPON, 1100, function (v) { precio.textContent = coma(v); }); }, 300);
    }, 0.6);

    var celdas = { d: $('[data-r="d"]'), h: $('[data-r="h"]'), m: $('[data-r="m"]'), s: $('[data-r="s"]') };
    var dos = function (n) { return (n < 10 ? "0" : "") + n; };
    function tic() {
      var r = Math.max(0, FIN_CUPON - Date.now()) / 1000;
      celdas.d.textContent = dos(Math.floor(r / 86400));
      celdas.h.textContent = dos(Math.floor(r % 86400 / 3600));
      celdas.m.textContent = dos(Math.floor(r % 3600 / 60));
      celdas.s.textContent = dos(Math.floor(r % 60));
      if (r <= 0) location.reload();
    }
    tic(); setInterval(tic, 1000);

    $$("[data-copiar]").forEach(function (b) {
      b.addEventListener("click", function () {
        var txt = b.getAttribute("data-copiar");
        var listo = function () { aviso("Cupón " + txt + " copiado. Pégalo al pagar en Payhip."); };
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(listo, listo); else listo();
      });
    });
  })();

  /* ---------- preguntas: una abierta a la vez ---------- */
  $$("#preguntas details").forEach(function (d, _, todas) {
    d.addEventListener("toggle", function () {
      if (d.open) todas.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------- visor de imágenes ---------- */
  (function () {
    var visor = $(".visor"), img = $("img", visor);
    function cerrar() { visor.hidden = true; }
    $$(".ampliable").forEach(function (i) {
      i.addEventListener("click", function () { img.src = i.src; img.alt = i.alt; visor.hidden = false; });
    });
    visor.addEventListener("click", cerrar);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
  })();
})();
