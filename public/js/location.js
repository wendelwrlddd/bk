document.addEventListener('DOMContentLoaded', async () => {
    const locationText = document.getElementById('location-text');
    
    // Show improved loading modal immediately
    const loadingModal = showImprovedLoadingModal();
    
    try {
        // Usar ipapi.co para geolocalização
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        console.log('Geolocation data:', data);
        
        if (data.city) {
            // Update header to show only city name
            locationText.textContent = data.city;
            
            // Update notification system with city
            if (window.updateNotificationCity) {
                window.updateNotificationCity(data.city);
            }
            
            // Show success message in modal
            showRestaurantFoundMessage(loadingModal, data.city);
            
            // Close modal after 3 seconds and show promotion
            setTimeout(() => {
                loadingModal.remove();
                showExclusivePromotion(data.city);
            }, 3000);
        } else {
            // Fallback if API fails
            loadingModal.remove();
            locationText.textContent = 'Perto de você';
        }
    } catch (error) {
        console.error('Error fetching location:', error);
        loadingModal.remove();
        locationText.textContent = 'Perto de você';
    }
});

function showImprovedLoadingModal() {
    // Create loading modal with improved aesthetics
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'location-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        animation: fadeIn 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'location-modal-content';
    modalContent.style.cssText = `
        background: linear-gradient(135deg, #502314 0%, #d92605 100%);
        border-radius: 20px;
        padding: 50px 40px;
        text-align: center;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 2px solid rgba(255, 130, 51, 0.3);
        position: relative;
        overflow: hidden;
    `;
    
    // Add glassmorphism effect overlay
    const glassOverlay = document.createElement('div');
    glassOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        pointer-events: none;
    `;
    modalContent.appendChild(glassOverlay);
    
    // Loading spinner with better animation
    const spinnerContainer = document.createElement('div');
    spinnerContainer.style.cssText = `
        position: relative;
        z-index: 1;
        margin: 0 auto 30px;
        width: 80px;
        height: 80px;
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 80px;
        height: 80px;
        border: 4px solid rgba(255, 255, 255, 0.2);
        border-top: 4px solid #ff8233;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `;
    
    const innerSpinner = document.createElement('div');
    innerSpinner.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        width: 60px;
        height: 60px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-bottom: 3px solid #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite reverse;
    `;
    
    spinnerContainer.appendChild(spinner);
    spinnerContainer.appendChild(innerSpinner);
    
    // Message
    const message = document.createElement('h2');
    message.id = 'location-modal-message';
    message.textContent = 'Procurando restaurantes próximos...';
    message.style.cssText = `
        color: #fff;
        font-size: 22px;
        font-weight: 700;
        margin: 0;
        position: relative;
        z-index: 1;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    `;
    
    // Add CSS animations
    if (!document.getElementById('location-modal-style')) {
        const style = document.createElement('style');
        style.id = 'location-modal-style';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    }
    
    modalContent.appendChild(spinnerContainer);
    modalContent.appendChild(message);
    modalOverlay.appendChild(modalContent);
    
    document.body.appendChild(modalOverlay);
    
    return modalOverlay;
}

function showRestaurantFoundMessage(modal, city) {
    const message = modal.querySelector('#location-modal-message');
    const spinnerContainer = modal.querySelector('div[style*="margin: 0 auto 30px"]');
    
    if (message && spinnerContainer) {
        // Remove spinner
        spinnerContainer.style.display = 'none';
        
        // Update message
        message.innerHTML = `
            <div style="animation: pulse 0.5s ease;">
                ✓ Achamos um restaurante a 6 km de <strong style="color: #ff8233;">${city}</strong>!
            </div>
        `;
        message.style.fontSize = '20px';
    }
}

function showExclusivePromotion(city) {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal_prod active';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.zIndex = '9999';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'center_modal';
    modalContent.style.height = 'auto';
    modalContent.style.padding = '20px';
    modalContent.style.textAlign = 'center';
    
    // Close button
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"></path></svg>';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => {
        modalOverlay.remove();
    };
    
    // Content
    const title = document.createElement('h2');
    title.textContent = `Oferta Exclusiva para ${city}!`;
    title.style.color = '#fff';
    title.style.marginBottom = '15px';
    
    const message = document.createElement('p');
    message.textContent = 'Aproveite descontos especiais na sua região hoje.';
    message.style.color = '#eee';
    message.style.marginBottom = '20px';
    
    const ctaBtn = document.createElement('div');
    ctaBtn.className = 'btn confirmar';
    ctaBtn.textContent = 'Ver Ofertas';
    ctaBtn.style.cursor = 'pointer';
    ctaBtn.onclick = () => {
        modalOverlay.remove();
        // Scroll to offers
        const offersSection = document.querySelector('.ctn_listagem_prods');
        if (offersSection) {
            offersSection.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    // Assemble
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(ctaBtn);
    modalOverlay.appendChild(modalContent);
    
    document.body.appendChild(modalOverlay);
}
