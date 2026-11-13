export function validarNombre(valor) {
  const nombre = valor.trim().replace(/\s+/g, ' ');

  if (nombre === '') return 'El nombre es obligatorio.';
  if (nombre.length > 100) return 'El nombre no puede pasar de 100 caracteres.';
  if (!/^\p{L}+(?:[ '’-]\p{L}+)*$/u.test(nombre)) {
    return 'El nombre solo puede tener letras, espacios, guiones y apóstrofes.';
  }

  const palabras = nombre.split(' ');
  if (palabras.length < 2) return 'Escribe tu nombre y tu apellido.';
  if (palabras.length > 5) return 'Escribe como máximo 5 palabras.';
  if (palabras.some((palabra) => palabra.length < 2)) {
    return 'Cada nombre o apellido debe tener al menos 2 letras.';
  }
  return '';
}

export function validarEmail(valor) {
  const email = valor.trim();

  if (email === '') return 'El correo es obligatorio.';
  if (email.length > 150) return 'El correo no puede pasar de 150 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  }
  return '';
}

// Muestra el mensaje bajo el campo. Devuelve true si el campo es válido.
export function marcarCampo(id, mensaje) {
  document.getElementById(`error-${id}`).textContent = mensaje;
  document.getElementById(id).setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  return mensaje === '';
}

// alEnviar(todoValido) se llama en cada envío, después de validar nombre y correo.
export function activarValidacionRegistro(alEnviar) {
  const form = document.getElementById('form-registro');
  const campos = { name: validarNombre, email: validarEmail };

  // Al salir de un campo, se valida ese campo
  Object.entries(campos).forEach(([id, validar]) => {
    const input = document.getElementById(id);
    input.addEventListener('blur', () => marcarCampo(id, validar(input.value)));
  });

  // Al enviar, se validan todos
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    let todoValido = true;

    Object.entries(campos).forEach(([id, validar]) => {
      const input = document.getElementById(id);
      if (!marcarCampo(id, validar(input.value))) todoValido = false;
    });

    if (alEnviar) alEnviar(todoValido);
  });
}