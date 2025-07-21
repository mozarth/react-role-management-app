// Función para inicializar el tema
export function initializeTheme() {
  // Verificar si hay un tema guardado en localStorage
  const savedTheme = localStorage.getItem('theme');
  
  // Verificar si el sistema está configurado en modo oscuro
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Aplicar tema oscuro si está guardado o si el sistema lo prefiere
  if (savedTheme === 'dark' || (savedTheme === null && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Función para cambiar el tema
export function setTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}