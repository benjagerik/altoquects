// DATOS DE EJEMPLO (inventados) para probar las pantallas.
// Más adelante esto se reemplaza por una base de datos en la nube.
window.DATA = {
  zonas: ["Centro", "Camba Cuá", "Berón de Astrada", "Laguna Seca", "Galván", "Punta Taitalo", "Paso de la Patria"],
  categorias: ["Hogar", "Comida", "Deportes", "Ropa y calzado"],
  rubros: ["Electricista", "Plomero", "Flete", "Técnico de aires", "Mecánico"],

  productos: [
    { id: 1, titulo: "Sillón de 2 cuerpos", precio: 180000, zona: "Camba Cuá", estado: "Usado", categoria: "Hogar", fundador: false },
    { id: 2, titulo: "Torta de cumpleaños", precio: 25000, zona: "Centro", estado: "Nuevo", categoria: "Comida", fundador: true },
    { id: 3, titulo: "Bicicleta rodado 26", precio: 95000, zona: "Berón de Astrada", estado: "Usado", categoria: "Deportes", fundador: false },
    { id: 4, titulo: "Zapatillas urbanas", precio: 38000, zona: "Laguna Seca", estado: "Nuevo", categoria: "Ropa y calzado", fundador: false },
    { id: 5, titulo: "Mesa de comedor", precio: 120000, zona: "Galván", estado: "Usado", categoria: "Hogar", fundador: false },
    { id: 6, titulo: "Chipá por docena", precio: 6000, zona: "Centro", estado: "Nuevo", categoria: "Comida", fundador: true }
  ],

  servicios: [
    { id: 1, rubro: "Electricista", nombre: "Marcelo R.", zonas: ["Centro", "Camba Cuá", "Berón de Astrada"], disponible: "Disponible hoy", hoy: true, tarifa: "Desde $ 15.000", fundador: true },
    { id: 2, rubro: "Plomero", nombre: "Diego S.", zonas: ["Laguna Seca", "Galván", "Punta Taitalo"], disponible: "Disponible mañana", hoy: false, tarifa: "Presupuesto sin cargo", fundador: false },
    { id: 3, rubro: "Flete", nombre: "Gustavo L.", zonas: ["Centro", "Camba Cuá", "Laguna Seca", "Paso de la Patria"], disponible: "Disponible hoy", hoy: true, tarifa: "Desde $ 10.000", fundador: false },
    { id: 4, rubro: "Técnico de aires", nombre: "Romina P.", zonas: ["Centro", "Punta Taitalo"], disponible: "Disponible mañana", hoy: false, tarifa: "Desde $ 20.000", fundador: false }
  ]
};
