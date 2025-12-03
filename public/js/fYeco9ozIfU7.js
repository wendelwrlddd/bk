const btn_abrir_prod = document.getElementsByClassName('btn_abrir_prod');
const modal_prod = document.getElementsByClassName('modal_prod');
const btn_sair_modal_prod = document.getElementsByClassName('btn_sair_modal_prod');
const btn_cancelar_modal_prod = document.getElementsByClassName('btn_cancelar_modal_prod');

const btn_rem_prod_cat_1 = document.getElementsByClassName('btn_rem_prod_cat_1');
const box_quant_cat_1 = document.getElementsByClassName('box_quant_cat_1');
const btn_add_prod_cat_1 = document.getElementsByClassName('btn_add_prod_cat_1');
const btn_rem_prod_cat_2 = document.getElementsByClassName('btn_rem_prod_cat_2');
const box_quant_cat_2 = document.getElementsByClassName('box_quant_cat_2');
const btn_add_prod_cat_2 = document.getElementsByClassName('btn_add_prod_cat_2');

const box_quant_top_cat_1 = document.getElementsByClassName('box_quant_top_cat_1');
const limite_quant_cat_1 = document.getElementsByClassName('limite_quant_cat_1');
const box_quant_top_cat_2 = document.getElementsByClassName('box_quant_top_cat_2');
const limite_quant_cat_2 = document.getElementsByClassName('limite_quant_cat_2');

var quant_select_cat_1 = 0;
var quant_limite_cat_1 = 0;
var quant_select_cat_2 = 0;
var quant_limite_cat_2 = 0;
var produto_ativo = 0;

function atualizar_box_quant_top() {
    box_quant_top_cat_1[produto_ativo].innerHTML = quant_select_cat_1;
    box_quant_top_cat_2[produto_ativo].innerHTML = quant_select_cat_2;
}

function zerar_selecionados() {
    quant_select_cat_1 = 0;
    quant_select_cat_2 = 0;
    for (let i_zerar_quant_top = 0; i_zerar_quant_top < box_quant_top_cat_1.length; i_zerar_quant_top++) {
        box_quant_top_cat_1[i_zerar_quant_top].innerHTML = "0";
        box_quant_top_cat_2[i_zerar_quant_top].innerHTML = "0";
    }
    for (let i_zerar_box_quant_cat_1 = 0; i_zerar_box_quant_cat_1 < box_quant_cat_1.length; i_zerar_box_quant_cat_1++) {
        box_quant_cat_1[i_zerar_box_quant_cat_1].innerHTML = "0";
    }
    for (let i_zerar_box_quant_cat_2 = 0; i_zerar_box_quant_cat_2 < box_quant_cat_2.length; i_zerar_box_quant_cat_2++) {
        box_quant_cat_2[i_zerar_box_quant_cat_2].innerHTML = "0";
    }
}

for (let i_prod = 0; i_prod < btn_abrir_prod.length; i_prod++) {
    btn_abrir_prod[i_prod].addEventListener('click', () => {
        modal_prod[i_prod].classList.add('active');
        quant_limite_cat_1 = limite_quant_cat_1[i_prod].innerHTML;
        quant_limite_cat_1 = parseInt(quant_limite_cat_1);
        quant_limite_cat_2 = limite_quant_cat_2[i_prod].innerHTML;
        quant_limite_cat_2 = parseInt(quant_limite_cat_2);
        produto_ativo = i_prod;
    });

    btn_sair_modal_prod[i_prod].addEventListener('click', () => {
        modal_prod[i_prod].classList.remove('active');
        produto_ativo = 0;
        zerar_selecionados();
    });
    btn_cancelar_modal_prod[i_prod].addEventListener('click', () => {
        modal_prod[i_prod].classList.remove('active');
        produto_ativo = 0;
        zerar_selecionados();
    });
}

for (let i_quant_cat_1 = 0; i_quant_cat_1 < box_quant_cat_1.length; i_quant_cat_1++) {
    let quant_item_vez = 0;
    btn_rem_prod_cat_1[i_quant_cat_1].addEventListener('click', () => {
        if (quant_select_cat_1 == 0) {
            quant_item_vez = 0;
        }
        if (quant_item_vez > 0) {
            quant_item_vez = quant_item_vez - 1;
            quant_select_cat_1 = quant_select_cat_1 - 1;
            box_quant_cat_1[i_quant_cat_1].innerHTML = quant_item_vez;
            atualizar_box_quant_top();
        }
    });

    btn_add_prod_cat_1[i_quant_cat_1].addEventListener('click', () => {
        if (quant_select_cat_1 == 0) {
            quant_item_vez = 0;
        }
        if (quant_select_cat_1 < quant_limite_cat_1) {
            quant_item_vez = quant_item_vez + 1;
            quant_select_cat_1 = quant_select_cat_1 + 1;
            box_quant_cat_1[i_quant_cat_1].innerHTML = quant_item_vez;
            atualizar_box_quant_top();
        }

        if (quant_select_cat_1 == quant_limite_cat_1) {
            // Chegou no limite
        }
    });
}

for (let i_quant_cat_2 = 0; i_quant_cat_2 < box_quant_cat_2.length; i_quant_cat_2++) {
    let quant_item_vez = 0;
    btn_rem_prod_cat_2[i_quant_cat_2].addEventListener('click', () => {
        if (quant_select_cat_2 == 0) {
            quant_item_vez = 0;
        }
        if (quant_item_vez > 0) {
            quant_item_vez = quant_item_vez - 1;
            quant_select_cat_2 = quant_select_cat_2 - 1;
            box_quant_cat_2[i_quant_cat_2].innerHTML = quant_item_vez;
            atualizar_box_quant_top();
        }
    });

    btn_add_prod_cat_2[i_quant_cat_2].addEventListener('click', () => {
        if (quant_select_cat_2 == 0) {
            quant_item_vez = 0;
        }
        if (quant_select_cat_2 < quant_limite_cat_2) {
            quant_item_vez = quant_item_vez + 1;
            quant_select_cat_2 = quant_select_cat_2 + 1;
            box_quant_cat_2[i_quant_cat_2].innerHTML = quant_item_vez;
            atualizar_box_quant_top();
        }

        if (quant_select_cat_2 == quant_limite_cat_2) {
            // Chegou no limite
        }
    });
}