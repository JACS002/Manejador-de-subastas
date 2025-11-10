// Estado en memoria del servicio de postores
export const state = {
  order: [],            // ids en orden
  items: {},            // por id: { startingPrice, minIncrement, durationSeconds }
  catalog: {},          // por id: { title, artist, year, basePrice, imageUrl }
  idx: 0,               // índice actual
  currentPrice: 0,      // precio actual de la subasta en curso
  endTs: 0,             // timestamp (ms) cuando termina la subasta actual
  bids: []              // { id, bidder, amount, ts }
};
