// js/app.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar la Interfaz de Usuario
    window.chembitUI = new ChembitUI();

    // 2. Inicializar el Motor (Engine) y cargar guardado previo si existe
    // window.chembit ya fue instanciado al final de engine.js
    await window.chembit.init();

    // 3. Forzar una primera actualización visual para reflejar los datos cargados
    document.dispatchEvent(new CustomEvent('chembitUpdate'));

    // 4. Registrar el Service Worker para la PWA (Offline)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registrado con éxito con el alcance:', registration.scope);
                })
                .catch(err => {
                    console.error('El registro del ServiceWorker falló:', err);
                });
        });
    }
});
