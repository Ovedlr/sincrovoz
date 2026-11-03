// Enlaces de la tienda: cámbialos aquí y se actualizan en toda la página.
var SINCROVOZ = {
  // Enlace del checkout de Lemon Squeezy (Producto > Share). Mientras tanto, la tienda.
  comprar: "https://sincrovoz.lemonsqueezy.com",
  // Instalador publicado en GitHub (Releases > Latest).
  descargar: "https://github.com/Ovedlr/sincrovoz/releases/latest"
};
document.querySelectorAll("[data-comprar]").forEach(function (a) { a.href = SINCROVOZ.comprar; });
document.querySelectorAll("[data-descargar]").forEach(function (a) { a.href = SINCROVOZ.descargar; });
