// Sistema de notificações de compra
let userCity = 'sua cidade'; // Será atualizado pelo location.js

// Lista de nomes aleatórios brasileiros
const randomNames = [
    'Ana', 'Maria', 'João', 'Pedro', 'Lucas', 'Juliana', 'Fernanda', 'Carlos',
    'Letícia', 'Rafael', 'Beatriz', 'Gabriel', 'Camila', 'Bruno', 'Mariana',
    'Felipe', 'Amanda', 'Rodrigo', 'Larissa', 'Thiago', 'Isabela', 'Matheus',
    'Gabriela', 'Vinícius', 'Carolina', 'Diego', 'Patrícia', 'Gustavo', 'Renata'
];

// Lista de combos com imagens
const combos = [
    { name: 'Combo Perfeito pra Galera!', image: '/images/6_burgers_batata.png' }
];

// Função para obter item aleatório de um array
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Função para criar e mostrar notificação
function showPurchaseNotification() {
    const name = getRandomItem(randomNames);
    const combo = getRandomItem(combos);
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'purchase-notification';
    
    notification.innerHTML = `
        <img src="${combo.image}" alt="${combo.name}" class="notification-image">
        <div class="notification-content">
            <p class="notification-text">
                Em <strong>${userCity}</strong>, <strong>${name}</strong> acabou de comprar
            </p>
            <p class="notification-product">${combo.name}</p>
        </div>
    `;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

// Iniciar notificações após a página carregar
function startNotifications() {
    // Primeira notificação após 3 segundos
    setTimeout(() => {
        showPurchaseNotification();
        
        // Notificações subsequentes a cada 8-15 segundos
        setInterval(() => {
            showPurchaseNotification();
        }, Math.random() * 7000 + 8000); // Entre 8 e 15 segundos
    }, 3000);
}

// Exportar função para atualizar cidade
window.updateNotificationCity = function(city) {
    userCity = city;
};

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startNotifications);
} else {
    startNotifications();
}
