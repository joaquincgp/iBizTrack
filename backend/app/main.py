from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routes import products, orders
from backend.app.database import init_db

app = FastAPI(title="iBizTrack - Sistema de Gestión de Importaciones", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar base de datos
@app.on_event("startup")
async def startup_event():
    await init_db()

# Incluir rutas
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])

@app.get("/")
async def root():
    return {"message": "iBizTrack API - iBusiness Ecuador"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)