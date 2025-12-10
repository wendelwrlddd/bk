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

                        // Updated Status Check to include all variations
                        if (['paid', 'approved', 'completed', 'succeeded', 'confirmed', 'settled'].includes(checkData.status?.toLowerCase())) {
                            clearInterval(pollInterval);
                            window.location.href = '/obrigado.html';
                        }
                    } catch (e) {
                        console.error('Polling error:', e);
                    }
                }, 3000);
            }

            // --- UI UPDATE: NEW DESIGN ---
            $('#step-3').html(`
                <div class="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
                    <div class="text-center mb-6">
                        <h2 class="text-xl font-bold text-gray-900 mb-1">PIX gerado com sucesso!</h2>
                        <p class="text-sm text-gray-500">Copie o código ou use a câmera para ler o QR Code e realize o pagamento no app do seu banco.</p>
                    </div>

                    <div class="mb-6">
                        <div class="flex justify-between items-center mb-2 px-1">
                            <span class="text-gray-700 font-medium text-sm">Este código expirará em:</span>
                            <div id="qr-timer-container" class="flex gap-1 text-lg font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded">
                                <span id="qr-timer">10:00</span>
                            </div>
                        </div>
                        <div class="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                            <div id="timer-progress" class="bg-blue-600 h-full rounded-full transition-all duration-1000" style="width: 100%"></div>
                        </div>
                    </div>

                    <div class="flex justify-center mb-6">
                        <div class="border-2 border-dashed border-gray-300 rounded-xl p-2 inline-block">
                            <img src="${data.qrCodeImage}" alt="QR Code Pix" class="w-48 h-48 mx-auto">
                        </div>
                    </div>

                    <div class="flex items-center justify-center gap-2 text-gray-500 text-xs mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pague e será creditado em até 2 minutos.</span>
                    </div>

                    <div class="space-y-3 mb-8">
                        <div class="hidden" id="pix-code-text">${data.qrCodeText}</div>
                        <button onclick="navigator.clipboard.writeText(document.getElementById('pix-code-text').innerText); this.innerHTML = 'Copiado! ✅'; setTimeout(() => this.innerHTML = '<svg xmlns=\'http://www.w3.org/2000/svg\' class=\'h-5 w-5\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z\' /></svg> Copiar código', 2000)" 
                            class="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition border border-blue-100">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar código
                        </button>
                        <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition shadow-md shadow-blue-200" onclick="window.location.reload()">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Confirmar pagamento
                        </button>
                    </div>

                    <div class="text-left border-t border-gray-100 pt-6">
                        <h3 class="font-bold text-gray-800 mb-4 text-sm">Para realizar o pagamento:</h3>
                        <ul class="space-y-3 text-sm text-gray-600">
                            <li class="flex gap-3">
                                <span class="bg-blue-50 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">1</span> 
                                <span>Abra o app do seu banco e entre na opção Pix;</span>
                            </li>
                            <li class="flex gap-3">
                                <span class="bg-blue-50 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">2</span> 
                                <span>Copie e cole o código ou use a câmera do celular para pagar com QR Code;</span>
                            </li>
                            <li class="flex gap-3">
                                <span class="bg-blue-50 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">3</span> 
                                <span>Confirme as informações e finalize o pagamento.</span>
                            </li>
                        </ul>
                    </div>

                    <div class="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo%E2%80%94Pix_powered_by_Banco_Central_%28Brazil%2C_2020%29.svg" class="h-5 opacity-60 grayscale">
                        <div class="flex gap-4 text-[10px] text-gray-400 font-medium">
                            <span class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                                </svg> 
                                Compra Segura
                            </span>
                            <span class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg> 
                                Dados 100% Protegidos
                            </span>
                        </div>
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
    const totalTime = seconds;
    const timerElement = document.getElementById('qr-timer');
    const progressElement = document.getElementById('timer-progress');
    
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        
        if (timerElement) { // Check if element exists before updating
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        if (progressElement) {
             const percentage = (timeLeft / totalTime) * 100;
             progressElement.style.width = `${percentage}%`;
        }
        
        if (timeLeft <= 0) {
            if (timerElement) {
                timerElement.textContent = 'EXPIRADO';
                timerElement.classList.add('animate-pulse');
            }
            return;
        }
        
        timeLeft--;
        setTimeout(updateTimer, 1000);
    }
    
    updateTimer();
}
