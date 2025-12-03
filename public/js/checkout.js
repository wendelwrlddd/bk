$(document).ready(function(){
    // Masks
    $('.phone-mask').mask('(00) 00000-0000');
    $('.cep-mask').mask('00000-000');
    $('.cpf-mask').mask('000.000.000-00');

    // Initial State
    const urlParams = new URLSearchParams(window.location.search);
    const productParam = urlParams.get('product');
    const priceParam = urlParams.get('price');

    if (productParam) {
        // Update product info if needed (e.g. title in summary)
        // For now, we just use it in the order data
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
        const response = await fetch('https://deliveryagora-backend.fly.dev/api/create-pix', {
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
            $('#step-3').html(`
                <div class="text-center">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Pagamento Pix Gerado!</h2>
                    <p class="text-gray-600 mb-4">Escaneie o QR Code abaixo para pagar:</p>
                    <img src="${data.qrCodeImage}" alt="QR Code Pix" class="mx-auto mb-4 border p-2 rounded-lg" style="max-width: 250px;">
                    
                    <p class="text-sm text-gray-500 mb-2">Ou copie o código abaixo:</p>
                    <div class="bg-gray-100 p-3 rounded text-xs break-all mb-4 select-all cursor-pointer" onclick="navigator.clipboard.writeText(this.innerText); alert('Código copiado!')">
                        ${data.qrCodeText}
                    </div>
                    
                    <div class="text-green-600 font-bold flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        Aguardando pagamento...
                    </div>
                </div>
            `);
            // Hide back button
            $('button[onclick="prevStep(2)"]').hide();
        } else {
            console.error('Erro ao gerar Pix:', data.message || 'Tente novamente.');
            console.error('Detalhes do erro:', data);
            
            // Send log to terminal
            logToTerminal('error', 'Erro ao gerar Pix: ' + (data.message || 'Tente novamente.'), data);
            
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
    fetch('https://deliveryagora-backend.fly.dev/api/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, message, data })
    }).catch(err => console.error('Failed to send log to terminal', err));
}
