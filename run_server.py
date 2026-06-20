import sys
import os

# Ensure the project root is always in sys.path regardless of how this script
# is invoked (double-click, bat file, shortcut, different cwd, etc.).
_project_root = os.path.dirname(os.path.abspath(__file__))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

import uvicorn

if __name__ == "__main__":
    print("=========================================")
    print(" LIGANDO O SERVIDOR DA CALCULADORA VESTAS")
    print("=========================================")
    # Change cwd to the project root so relative paths (front-end/, static/,
    # BOM_Reports_Generated/) are always resolved correctly.
    os.chdir(_project_root)
    try:
        from backend.backend import app
        # Render (and other cloud hosts) inject the port via $PORT and require
        # binding on 0.0.0.0. Locally we default to 127.0.0.1:8010.
        port = int(os.environ.get("PORT", "8010"))
        host = os.environ.get("HOST") or ("0.0.0.0" if "PORT" in os.environ else "127.0.0.1")
        uvicorn.run(app, host=host, port=port, log_level="info")
    except Exception as e:
        print(f"\n[ERRO CRITICO] O servidor falhou ao iniciar: {e}")
        input("\nPressione ENTER para fechar a janela...")