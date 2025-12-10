$(document).ready(function(){
    // Masks
    $('.phone-mask').mask('(00) 00000-0000');
    $('.cep-mask').mask('00000-000');
    $('.cpf-mask').mask('000.000.000-00');

    // Initial State
    const urlParams = new URLSearchParams(window.location.search);
    const productParam = urlParams.get('product');
    const priceParam = urlParams.get('price');

    // Mapeamento de produtos para suas imagens
    const productImages = {
        'King em Triplo': '/assets/checkout_king_triplo.jpg',
        'Combo Favorito + Combo Sanduíche': '/assets/checkout_combo_favorito.webp',
        'Sanduíche + Batata + Bebida + BK Mix': '/assets/checkout_combo_solo.jpg',
        '3 Combos Sandubas': '/assets/checkout_3_combos.png',
        'Dupla BK': '/assets/checkout_dupla_bk.png',
        'Combo Sanduba Solo': '/assets/checkout_combo_solo.jpg'
    };

    if (productParam) {
        // Atualizar o título do produto no resumo
        $('#summary-title').text(productParam);
        
        // Atualizar a imagem do produto se existir no mapeamento
        if (productImages[productParam]) {
            $('#summary-img').attr('src', productImages[productParam]);
        }
    }

    if (priceParam) {
        productPrice = parseFloat(priceParam);
    }
    
    updateSummary();
});

let currentStep = 1;
let productPrice = 39.90; // Default fallback
let quantity = 1;

function nextStep(step) {
    if (step === 2) {
        // Validate Step 1
        const name = $('input[name="name"]').val();
        const email = $('input[name="email"]').val();
        const phone = $('input[name="phone"]').val();
        const cpf = $('input[name="cpf"]').val();

        if (!name || !email || !phone || !cpf) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        if (phone.length < 14) {
             alert('Por favor, preencha um telefone válido.');
             return;
        }
        if (cpf.length < 14) {
             alert('Por favor, preencha um CPF válido.');
             return;
        }
    }

    if (step === 3) {
        // Validate Step 2
        const cep = $('input[name="cep"]').val();
        const address = $('input[name="address"]').val();
        const number = $('input[name="number"]').val();
        const neighborhood = $('input[name="neighborhood"]').val();
        const city = $('input[name="city"]').val();
        const state = $('select[name="state"]').val();

        if (!cep || !address || !number || !neighborhood || !city || !state) {
            alert('Por favor, preencha todos os campos do endereço.');
            return;
        }
    }

    // Hide current step
    $(`#step-${currentStep}`).addClass('hidden');
    $(`#indicator-step-${currentStep}`).removeClass('step-active').addClass('step-completed');
    
    // Show next step
    currentStep = step;
    $(`#step-${currentStep}`).removeClass('hidden');
    $(`#indicator-step-${currentStep}`).removeClass('step-inactive').addClass('step-active');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function prevStep(step) {
    // Hide current step
    $(`#step-${currentStep}`).addClass('hidden');
    $(`#indicator-step-${currentStep}`).removeClass('step-active').addClass('step-inactive');

    // Show prev step
    currentStep = step;
    $(`#step-${currentStep}`).removeClass('hidden');
    $(`#indicator-step-${currentStep}`).removeClass('step-completed').addClass('step-active');
}

function updateQuantity(change) {
    quantity += change;
    if (quantity < 1) quantity = 1;
    $('#summary-qty').text(quantity);
    updateSummary();
}

function updateSummary() {
    const total = quantity * productPrice;
    const formattedTotal = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    $('#summary-subtotal').text(formattedTotal);
    $('#summary-total').text(formattedTotal);
}

function buscarCep(cep) {
    cep = cep.replace(/\D/g, '');
    if (cep.length === 8) {
        $.getJSON(`https://viacep.com.br/ws/${cep}/json/`, function(data) {
            if (!("erro" in data)) {
                $('input[name="address"]').val(data.logradouro);
                $('input[name="neighborhood"]').val(data.bairro);
                $('input[name="city"]').val(data.localidade);
                $('select[name="state"]').val(data.uf);
                $('input[name="number"]').focus();
            } else {
                alert("CEP não encontrado.");
            }
        });
    }
}

// API Base URL
const API_BASE_URL = 'https://deliveryagora-backend.fly.dev';

async function finalizeOrder() {
    const btn = $('button[onclick="finalizeOrder()"]');
    const originalText = btn.text();
    btn.prop('disabled', true).text('Processando...');

    // Gather all data
    const orderData = {
        customer: {
            name: $('input[name="name"]').val(),
            email: $('input[name="email"]').val(),
            phone: $('input[name="phone"]').val().replace(/\D/g, ''),
            cpf: $('input[name="cpf"]').val().replace(/\D/g, '')
        },
        address: {
            cep: $('input[name="cep"]').val(),
            street: $('input[name="address"]').val(),
            number: $('input[name="number"]').val(),
            complement: $('input[name="complement"]').val(),
            neighborhood: $('input[name="neighborhood"]').val(),
            city: $('input[name="city"]').val(),
            state: $('select[name="state"]').val()
        },
        order: {
            product: new URLSearchParams(window.location.search).get('product') || "King em Triplo",
            quantity: quantity,
            total: quantity * productPrice,
            unit_price: productPrice
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/criar-pix`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        console.log('API Response:', data);

        if (data.success) {
            // Show QR Code
            if (typeof fbq === 'function') {
                fbq('track', 'Purchase', {
                    value: orderData.order.total,
                    currency: 'BRL',
                    content_name: orderData.order.product,
                    num_items: orderData.order.quantity
                });
            }

            const txid = data.transactionId;

            // Start Polling for Status
            if (txid) {
                const pollInterval = setInterval(async () => {
                    try {
                        const checkRes = await fetch(`${API_BASE_URL}/api/checar-status?txid=${txid}`);
                        const checkData = await checkRes.json();
                        
                        console.log('Status Check:', checkData.status);

                        if (['paid', 'PAID', 'CONCLUIDA', 'approved', 'APPROVED'].includes(checkData.status)) {
                            clearInterval(pollInterval);
                            window.location.href = '/obrigado.html';
                        }
                    } catch (e) {
                        console.error('Polling error:', e);
                    }
                }, 3000);
            }

            $('#step-3').html(`
                <div class="text-center">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Pagamento Pix Gerado!</h2>
                    <p class="text-gray-600 mb-4">Escaneie o QR Code abaixo para pagar:</p>
                    <img src="${data.qrCodeImage}" alt="QR Code Pix" class="mx-auto mb-4 border p-2 rounded-lg" style="max-width: 250px;">
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p class="text-sm text-gray-700 mb-1">Este QR Code expira em:</p>
                        <div id="qr-timer" class="text-2xl font-bold text-red-600"></div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg p-4 mb-4">
                        <p class="font-bold text-lg mb-1">🎁 Pague agora e ganhe 1000 pontos no Clube BK!</p>
                        <p class="text-sm">Esses pontos equivalem a um combo de graça!</p>
                    </div>
                    
                    <p class="text-sm text-gray-500 mb-2">Ou copie o código abaixo:</p>
                    <div class="relative mb-4">
                        <div class="bg-gray-100 p-3 rounded text-xs break-all mb-2 select-all h-24 overflow-y-auto" id="pix-code-text">
                            ${data.qrCodeText}
                        </div>
                        <button onclick="navigator.clipboard.writeText(document.getElementById('pix-code-text').innerText); this.innerText = 'Copiado! ✅'; setTimeout(() => this.innerText = 'Copiar Código Pix', 2000)" 
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                            Copiar Código Pix
                        </button>
                    </div>
                    
                    <div class="text-green-600 font-bold flex items-center justify-center animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        Aguardando confirmação automática...
                    </div>
                </div>
            `);
            
            // Iniciar timer de 10 minutos
            startQRTimer(10 * 60); // 10 minutos em segundos
            
            // Hide back button
            $('button[onclick="prevStep(2)"]').hide();
        } else {
            console.error('Erro ao gerar Pix:', data.message || 'Tente novamente.');
            console.error('Detalhes do erro:', data);
            
            alert('Erro ao gerar Pix: ' + (data.message || 'Verifique seus dados.'));
            
            btn.prop('disabled', false).text(originalText);
        }
    } catch (error) {
        console.error('Error:', error);
        console.error('Erro de conexão. Verifique se o servidor backend está rodando.');
        
        // Send log to terminal
        logToTerminal('error', 'Erro de conexão ou exceção no frontend', { error: error.toString() });
        
        btn.prop('disabled', false).text(originalText);
    }
}

function logToTerminal(type, message, data) {
    fetch(`${API_BASE_URL}/api/log`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, message, data })
    }).catch(err => console.error('Failed to send log to terminal', err));
}

function startQRTimer(seconds) {
    let timeLeft = seconds;
    const timerElement = document.getElementById('qr-timer');
    
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            timerElement.textContent = 'EXPIRADO';
            timerElement.classList.add('animate-pulse');
            return;
        }
        
        timeLeft--;
        setTimeout(updateTimer, 1000);
    }
    
    updateTimer();
}
