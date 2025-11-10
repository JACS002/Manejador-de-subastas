import app from "./app.js";

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`✅ Bidders-service running on http://localhost:${PORT}`);
  console.log(`   POST /api/start  → cargar config del manager`);
  console.log(`   GET  /api/state  → estado en tiempo real`);
  console.log(`   POST /api/bid    → realizar puja`);
});
