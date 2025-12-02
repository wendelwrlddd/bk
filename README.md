# Delivery Agora - Burger King Checkout

Sistema de checkout completo para delivery com integração IronPay.

## 🚀 Funcionalidades

- ✅ Checkout em 3 etapas (Identificação, Endereço, Pagamento)
- ✅ Integração com API IronPay para pagamentos via Pix
- ✅ Backend Node.js/Express
- ✅ Máscaras de input (CPF, telefone, CEP)
- ✅ Busca automática de endereço via ViaCEP
- ✅ Validação de formulários
- ✅ Suporte a múltiplos produtos

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar o servidor backend
node server.js

# Iniciar o frontend (em outro terminal)
npx vite --port=4000
```

## 🔧 Configuração

### IronPay
Edite `server.js` e configure:
- `API_TOKEN`: Seu token da IronPay
- `OFFER_HASH`: Hash da oferta
- `PRODUCT_HASH`: Hash do produto

**Importante:** Certifique-se de que o `offer_hash` e `product_hash` correspondem à mesma conta que gerou o token de API.

## 📁 Estrutura

```
├── checkout.html          # Página de checkout
├── js/
│   └── checkout.js       # Lógica do checkout
├── server.js             # Backend API
├── index.html            # Página principal
└── images/               # Assets
```

## 🌐 Endpoints

### Backend
- `POST /api/create-pix` - Cria transação Pix via IronPay

## 🛠️ Tecnologias

- **Frontend**: HTML, CSS (Tailwind), JavaScript (jQuery)
- **Backend**: Node.js, Express, Axios
- **APIs**: IronPay, ViaCEP
- **Dev**: Vite

## 📝 Notas

- Valores são enviados em centavos para a API (ex: R$ 39,90 = 3990)
- `operation_type: 1` indica operação de venda/pagamento
- O checkout é dinâmico e recebe produto/preço via URL params
