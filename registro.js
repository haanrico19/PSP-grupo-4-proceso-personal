document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    const loginForm = document.getElementById('loginForm');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Funcionalidad de pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Agregar clase active al botón y contenido seleccionado
            button.classList.add('active');
            if (tabName === 'login') {
                document.getElementById('loginTab').classList.add('active');
            } else {
                document.getElementById('registroTab').classList.add('active');
            }
        });
    });
    
    // FORMULARIO DE LOGIN
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const usernameOrEmail = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!usernameOrEmail || !password) {
            alert('Por favor, complete todos los campos');
            return;
        }
        
        // Obtener usuarios registrados
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        
        // Buscar usuario por username o email
        const usuario = usuarios.find(u => 
            (u.username === usernameOrEmail || u.email === usernameOrEmail)
        );
        
        if (!usuario) {
            alert('Usuario no encontrado. Por favor, regístrese primero.');
            return;
        }
        
        // NOTA: En una aplicación real, las contraseñas deberían estar hasheadas
        // Por ahora, solo validamos que el usuario exista
        
        // Guardar sesión
        sessionStorage.setItem('usuarioLogueado', usuario.username);
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        alert(`¡Bienvenido ${usuario.nombre}! Redirigiendo al inventario...`);
        
        // Redirigir a la página del inventario
        window.location.href = 'Proyecto MH/Index.html';
    });
    
    // FORMULARIO DE REGISTRO
    registroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Obtener valores del formulario
        const nombre = document.getElementById('name').value.trim();
        const apellidos = document.getElementById('lastname').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefono = document.getElementById('telefone').value.trim();
        const username = document.getElementById('username').value.trim();
        const rol = document.getElementById('rol').value;
        const password = document.getElementById('password').value;
        const confirmarPassword = document.getElementById('confirmpss').value;
        
        // Validaciones
        if (!nombre || !apellidos || !email || !telefono || !username || !rol || !password || !confirmarPassword) {
            alert('Por favor, complete todos los campos');
            return;
        }
        
        if (password !== confirmarPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        // Crear objeto de usuario
        const usuario = {
            nombre,
            apellidos,
            email,
            telefono,
            username,
            rol,
            fechaRegistro: new Date().toISOString()
        };
        
        // Guardar usuario en localStorage
        let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        
        // Verificar si el usuario ya existe
        const usuarioExiste = usuarios.some(u => u.username === username || u.email === email);
        if (usuarioExiste) {
            alert('El nombre de usuario o correo ya están registrados');
            return;
        }
        
        usuarios.push(usuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        
        // Guardar sesión
        sessionStorage.setItem('usuarioLogueado', username);
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        // Mensaje de éxito y redirección
        alert('¡Usuario registrado exitosamente! Redirigiendo al inventario...');
        
        // Redirigir a la página del inventario
        window.location.href = 'Proyecto MH/Index.html';
    });
});
