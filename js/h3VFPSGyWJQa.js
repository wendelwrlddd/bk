let totalSeconds = 5 * 3600 + 18 * 60 + 41;

const timer_horas = document.getElementById("timer_horas");
const timer_minutos = document.getElementById("timer_minutos");
const timer_segundos = document.getElementById("timer_segundos");

function atualizarTimer() {
    if (totalSeconds < 0) return;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    timer_horas.textContent = String(h).padStart(2, '0');
    timer_minutos.textContent = String(m).padStart(2, '0');
    timer_segundos.textContent = String(s).padStart(2, '0');
    totalSeconds--;
    if (totalSeconds >= 0) {
        setTimeout(atualizarTimer, 1000);
    }
}
atualizarTimer();