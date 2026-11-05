const status = document.querySelector("#api-status");

async function checkServer() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) {
      throw new Error(`El servidor respondió con estado ${response.status}`);
    }

    const result = await response.json();
    status.textContent =
      result.status === "ok"
        ? "Servidor conectado"
        : "El servidor respondió con un estado inesperado";
  } catch (error) {
    status.textContent = `No se pudo conectar con el servidor: ${error.message}`;
  }
}

checkServer();
