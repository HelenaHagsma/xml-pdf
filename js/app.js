const xmlInput = document.getElementById("xmlInput");
const fileList = document.getElementById("fileList");
const fileCount = document.getElementById("fileCount");
const convertButton = document.getElementById("convertButton");
const nfeDetails = document.getElementById("nfeDetails");

let arquivosNFe = [];


// ========================================
// SELEÇÃO DOS XMLs
// ========================================

xmlInput.addEventListener("change", async function () {

    const files = Array.from(xmlInput.files);

    if (files.length === 0) {
        return;
    }

    // Limpa a lista anterior
    arquivosNFe = [];

    fileList.innerHTML = "";

    nfeDetails.innerHTML = `
        <p class="empty-message">
            Processando arquivos...
        </p>
    `;

    convertButton.disabled = true;


    // Processa cada XML
    for (const file of files) {

        const resultado = await lerXML(file);

        console.log(file.name, resultado);


        if (resultado.valido) {

            arquivosNFe.push({
                arquivo: file,
                nota: resultado.nota
            });

        } else {

            console.warn(
                `Arquivo inválido: ${file.name}`,
                resultado.mensagem
            );

        }

    }


    atualizarInterface();

});


// ========================================
// ATUALIZAÇÃO DA INTERFACE
// ========================================

function atualizarInterface() {

    fileList.innerHTML = "";


    if (arquivosNFe.length === 0) {

        fileList.innerHTML = `
            <p class="empty-message">
                Nenhuma NF-e válida encontrada.
            </p>
        `;

        fileCount.textContent = "0 arquivos";

        convertButton.disabled = true;

        return;
    }


    fileCount.textContent =
        `${arquivosNFe.length} arquivo${arquivosNFe.length !== 1 ? "s" : ""}`;


    arquivosNFe.forEach((item, index) => {

        adicionarArquivoNaLista(
            item,
            index
        );

    });


    convertButton.disabled = false;


    // Mostra a primeira NF-e
    mostrarDetalhesNFe(
        arquivosNFe[0].nota
    );

}


// ========================================
// ADICIONAR ITEM NA LISTA
// ========================================

function adicionarArquivoNaLista(item, index) {

    const elemento = document.createElement("div");

    elemento.classList.add("file-item");


    const informacoes = document.createElement("div");

    informacoes.classList.add("file-information");


    const nome = document.createElement("strong");

    nome.textContent = item.arquivo.name;


    const detalhes = document.createElement("small");

    detalhes.textContent =
        `NF-e ${item.nota.numero} • Série ${item.nota.serie}`;


    informacoes.appendChild(nome);
    informacoes.appendChild(detalhes);


    // ========================================
    // BOTÃO VISUALIZAR
    // ========================================

    const visualizar = document.createElement("button");

    visualizar.textContent = "Visualizar";

    visualizar.classList.add("view-button");


    visualizar.addEventListener("click", function (event) {

        event.stopPropagation();

        selecionarNFe(
            index,
            elemento
        );

    });


    // ========================================
    // BOTÃO REMOVER
    // ========================================

    const remover = document.createElement("button");

    remover.textContent = "×";

    remover.classList.add("remove-button");

    remover.title = "Remover arquivo";


    remover.addEventListener("click", function (event) {

        event.stopPropagation();

        removerArquivo(index);

    });


    // ========================================
    // BOTÕES
    // ========================================

    const botoes = document.createElement("div");

    botoes.classList.add("file-actions");

    botoes.appendChild(visualizar);

    botoes.appendChild(remover);


    elemento.appendChild(informacoes);

    elemento.appendChild(botoes);


    // ========================================
    // CLICAR NA LINHA
    // ========================================

    elemento.addEventListener("click", function () {

        selecionarNFe(
            index,
            elemento
        );

    });


    fileList.appendChild(elemento);

}

function selecionarNFe(index, elemento) {

    // Remove seleção anterior
    document
        .querySelectorAll(".file-item")
        .forEach(item => {

            item.classList.remove("selected");

        });


    // Marca o arquivo atual
    elemento.classList.add("selected");


    // Mostra os detalhes
    mostrarDetalhesNFe(
        arquivosNFe[index].nota
    );

}


// ========================================
// REMOVER ARQUIVO
// ========================================

function removerArquivo(index) {

    arquivosNFe.splice(
        index,
        1
    );

    atualizarInterface();

}


// ========================================
// BOTÃO CONVERTER
// ========================================

convertButton.addEventListener("click", async function () {

    if (arquivosNFe.length === 0) {

        alert("Nenhuma NF-e para converter.");

        return;
    }


    convertButton.disabled = true;

    convertButton.textContent =
        "Gerando PDF...";


    const notas = arquivosNFe.map(
        item => item.nota
    );


    try {

        await gerarPDF(
            notas,
            atualizarProgresso
        );

    } catch (erro) {

        console.error(erro);

        alert(
            "Ocorreu um erro ao gerar o PDF."
        );

    }


    convertButton.disabled = false;

    convertButton.textContent =
        "Converter para PDF";

});


// ========================================
// PROGRESSO
// ========================================

function atualizarProgresso(atual, total) {

    const porcentagem =
        Math.round(
            (atual / total) * 100
        );


    convertButton.textContent =
        `Gerando PDF... ${porcentagem}%`;

}

function mostrarDetalhesNFe(nota) {

    const emitente = nota.emitente || {};
    const destinatario = nota.destinatario || {};

    const enderecoEmitente = emitente.endereco || {};
    const enderecoDestinatario = destinatario.endereco || {};


    const produtosHTML = (nota.produtos || []).map(produto => {

        return `
            <tr>

                <td>
                    ${produto.codigo || ""}
                </td>

                <td>
                    ${produto.descricao || ""}
                </td>

                <td>
                    ${produto.quantidade || 0}
                </td>

                <td>
                    ${formatarMoeda(produto.valorUnitario)}
                </td>

                <td>
                    ${formatarMoeda(produto.valorTotal)}
                </td>

            </tr>
        `;

    }).join("");


    nfeDetails.innerHTML = `

        <div class="nfe-card">

            <div class="nfe-header">

                <h3>
                    NF-e nº ${nota.numero || ""}
                </h3>

                <span>
                    Série ${nota.serie || ""}
                </span>

            </div>


            <div class="info-section">

                <h4>Emitente</h4>

                <p>
                    <strong>
                        ${emitente.nome || ""}
                    </strong>
                </p>

                <p>
                    CNPJ:
                    ${formatarDocumento(emitente.cnpj)}
                </p>

                <p>
                    ${enderecoEmitente.logradouro || ""},
                    ${enderecoEmitente.numero || ""}
                    -
                    ${enderecoEmitente.bairro || ""}
                </p>

                <p>
                    ${enderecoEmitente.municipio || ""}
                    /
                    ${enderecoEmitente.uf || ""}
                    -
                    CEP ${enderecoEmitente.cep || ""}
                </p>

            </div>


            <div class="info-section">

                <h4>Destinatário</h4>

                <p>
                    <strong>
                        ${destinatario.nome || ""}
                    </strong>
                </p>

                <p>
                    CPF/CNPJ:
                    ${formatarDocumento(destinatario.cpfCnpj)}
                </p>

                <p>
                    ${enderecoDestinatario.logradouro || ""},
                    ${enderecoDestinatario.numero || ""}
                    -
                    ${enderecoDestinatario.bairro || ""}
                </p>

                <p>
                    ${enderecoDestinatario.municipio || ""}
                    /
                    ${enderecoDestinatario.uf || ""}
                </p>

            </div>


            <div class="info-section">

                <h4>Produtos</h4>

                <table class="products-table">

                    <thead>

                        <tr>

                            <th>Código</th>
                            <th>Descrição</th>
                            <th>Qtd.</th>
                            <th>Valor unit.</th>
                            <th>Total</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${produtosHTML}

                    </tbody>

                </table>

            </div>


            <div class="total-section">

                <p>

                    Valor dos produtos:

                    <strong>
                        ${formatarMoeda(nota.totais?.produtos || 0)}
                    </strong>

                </p>


                <p class="total">

                    VALOR TOTAL:

                    ${formatarMoeda(nota.totais?.nota || 0)}

                </p>

            </div>

        </div>

    `;
}
function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}

function formatarDocumento(documento) {

    if (!documento) {
        return "";
    }


    const valor = documento.replace(/\D/g, "");


    // CPF
    if (valor.length === 11) {

        return valor.replace(
            /(\d{3})(\d{3})(\d{3})(\d{2})/,
            "$1.$2.$3-$4"
        );

    }


    // CNPJ
    if (valor.length === 14) {

        return valor.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            "$1.$2.$3/$4-$5"
        );

    }


    return documento;

}