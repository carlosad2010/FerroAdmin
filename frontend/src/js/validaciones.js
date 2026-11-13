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

export function validarClave(valor) {
  if (valor === '') return 'La clave es obligatoria.';
  if (valor.length < 8) return 'La clave debe tener al menos 8 caracteres.';
  if (valor.length > 72) return 'La clave no puede pasar de 72 caracteres.';
  return '';
}

export function validarConfirmacion(clave, confirmacion) {
  if (confirmacion === '') return 'Confirma tu clave.';
  if (clave !== confirmacion) return 'Las claves no coinciden.';
  return '';
}

// Muestra el mensaje bajo el campo. Devuelve true si el campo es válido.
export function marcarCampo(id, mensaje) {
  document.getElementById(`error-${id}`).textContent = mensaje;
  document.getElementById(id).setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  return mensaje === '';
}

export function activarValidacionRegistro(alValido)  {
  const form = document.getElementById('form-registro');
  const clave = document.getElementById('password');
  const confirmacion = document.getElementById('password2');

  // Cada campo con su regla. La confirmación necesita saber cuál es la clave.
  const campos = {
    name: (valor) => validarNombre(valor),
    email: (valor) => validarEmail(valor),
    password: (valor) => validarClave(valor),
    password2: (valor) => validarConfirmacion(clave.value, valor),
  };

  // Al salir de un campo, se valida ese campo
  Object.entries(campos).forEach(([id, validar]) => {
    const input = document.getElementById(id);
    input.addEventListener('blur', () => marcarCampo(id, validar(input.value)));
  });

  // Si cambias la clave después de confirmar, se vuelve a comprobar la confirmación
  clave.addEventListener('input', () => {
    if (confirmacion.value !== '') {
      marcarCampo('password2', campos.password2(confirmacion.value));
    }
  });

  // Al enviar, se validan todos
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    let todoValido = true;

    Object.entries(campos).forEach(([id, validar]) => {
      const input = document.getElementById(id);
      if (!marcarCampo(id, validar(input.value))) todoValido = false;
    });

        if (todoValido) {
      alValido({
        nombre: document.getElementById('name').value.trim().replace(/\s+/g, ' '),
        email: document.getElementById('email').value.trim(),
        password: clave.value,
      });
    }
  });
}