const apiStatus = document.querySelector("#api-status");

async function checkServer() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) {
      throw new Error(`El servidor respondió con estado ${response.status}`);
    }

    const result = await response.json();
    const conectado = result.status === "ok";
    apiStatus.dataset.estado = conectado ? "ok" : "error";
    apiStatus.textContent = conectado
      ? "Servidor conectado"
      : "El servidor respondió con un estado inesperado";
  } catch (error) {
    apiStatus.dataset.estado = "error";
    apiStatus.textContent = `No se pudo conectar con el servidor: ${error.message}`;
  }
}

checkServer();
