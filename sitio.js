// Enlaces de la tienda: cámbialos aquí y se actualizan en toda la página.
var SINCROVOZ = {
  // Enlace de compra del producto en Payhip.
  comprar: "https://payhip.com/b/fencS",
  // Instalador publicado en GitHub (Releases > Latest).
  descargar: "https://github.com/Ovedlr/sincrovoz/releases/latest"
};
document.querySelectorAll("[data-comprar]").forEach(function (a) { a.href = SINCROVOZ.comprar; });
document.querySelectorAll("[data-descargar]").forEach(function (a) { a.href = SINCROVOZ.descargar; });
