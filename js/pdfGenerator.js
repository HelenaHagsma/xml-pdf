async function gerarPDF(notas, callbackProgresso) {

    if (!notas || notas.length === 0) {

        throw new Error(
            "Nenhuma NF-e válida para gerar o PDF."
        );

    }


    const { jsPDF } = window.jspdf;


    const pdf = new jsPDF({

        orientation: "portrait",

        unit: "mm",

        format: "a4"

    });


    for (let i = 0; i < notas.length; i++) {

        const nota = notas[i];


        if (i > 0) {

            pdf.addPage();

        }


        desenharDANFE(
            pdf,
            nota
        );


        // Atualiza o progresso
        if (callbackProgresso) {

            callbackProgresso(
                i + 1,
                notas.length
            );

        }


        /*
         * Permite que o navegador atualize
         * a interface antes de continuar.
         */
        await new Promise(
            resolve => requestAnimationFrame(resolve)
        );

    }


    pdf.save(
        "nfe-convertidas.pdf"
    );

}

function desenharDANFE(pdf, nota) {

    const largura = 210;
    const margem = 10;


    // =========================
    // TÍTULO
    // =========================

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);

    pdf.text(
        "DANFE",
        margem,
        18
    );


    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    pdf.text(
        "Documento Auxiliar da Nota Fiscal Eletrônica",
        margem,
        24
    );


    // =========================
    // IDENTIFICAÇÃO
    // =========================

    pdf.setDrawColor(0);
    pdf.rect(
        margem,
        30,
        largura - margem * 2,
        25
    );


    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    pdf.text(
        `NF-e nº ${nota.numero}`,
        margem + 5,
        39
    );


    pdf.text(
        `Série: ${nota.serie}`,
        margem + 70,
        39
    );


    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    pdf.text(
        "Chave de acesso:",
        margem + 5,
        47
    );


    pdf.text(
        formatarChave(nota.chave),
        margem + 5,
        52
    );


    // =========================
    // EMITENTE
    // =========================

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    pdf.text(
        "EMITENTE",
        margem,
        67
    );


    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);


    pdf.text(
        nota.emitente.nome,
        margem,
        74
    );


    pdf.text(
        `CNPJ: ${formatarDocumentoPDF(nota.emitente.cnpj)}`,
        margem,
        80
    );


    pdf.text(
        `${nota.emitente.endereco.logradouro}, ${nota.emitente.endereco.numero}`,
        margem,
        86
    );


    pdf.text(
        `${nota.emitente.endereco.bairro} - ${nota.emitente.endereco.municipio}/${nota.emitente.endereco.uf}`,
        margem,
        92
    );


    pdf.text(
        `CEP: ${nota.emitente.endereco.cep}`,
        margem,
        98
    );


    // =========================
    // DESTINATÁRIO
    // =========================

    pdf.setFont("helvetica", "bold");

    pdf.text(
        "DESTINATÁRIO",
        margem,
        112
    );


    pdf.setFont("helvetica", "normal");

    pdf.text(
        nota.destinatario.nome,
        margem,
        119
    );


    pdf.text(
        `CPF/CNPJ: ${formatarDocumentoPDF(nota.destinatario.cpfCnpj)}`,
        margem,
        125
    );


    pdf.text(
        `${nota.destinatario.endereco.logradouro}, ${nota.destinatario.endereco.numero}`,
        margem,
        131
    );


    pdf.text(
        `${nota.destinatario.endereco.bairro} - ${nota.destinatario.endereco.municipio}/${nota.destinatario.endereco.uf}`,
        margem,
        137
    );


    // =========================
    // PRODUTOS
    // =========================

    pdf.setFont("helvetica", "bold");

    pdf.text(
        "PRODUTOS",
        margem,
        152
    );


    const inicioTabela = 157;

    const colunas = [
        { x: 10, largura: 20, titulo: "Código" },
        { x: 30, largura: 70, titulo: "Descrição" },
        { x: 100, largura: 20, titulo: "Qtd." },
        { x: 120, largura: 35, titulo: "V. Unit." },
        { x: 155, largura: 45, titulo: "V. Total" }
    ];


    // Cabeçalho
    pdf.setFontSize(8);

    colunas.forEach(coluna => {

        pdf.rect(
            coluna.x,
            inicioTabela,
            coluna.largura,
            8
        );

        pdf.text(
            coluna.titulo,
            coluna.x + 2,
            inicioTabela + 5
        );

    });


    let y = inicioTabela + 8;


    pdf.setFont("helvetica", "normal");


    nota.produtos.forEach(produto => {

        const altura = 10;


        colunas.forEach(coluna => {

            pdf.rect(
                coluna.x,
                y,
                coluna.largura,
                altura
            );

        });


        pdf.text(
            produto.codigo,
            12,
            y + 6
        );


        const descricao =
            limitarTexto(
                produto.descricao,
                40
            );


        pdf.text(
            descricao,
            32,
            y + 6
        );


        pdf.text(
            String(produto.quantidade),
            102,
            y + 6
        );


        pdf.text(
            formatarMoedaPDF(
                produto.valorUnitario
            ),
            122,
            y + 6
        );


        pdf.text(
            formatarMoedaPDF(
                produto.valorTotal
            ),
            157,
            y + 6
        );


        y += altura;

    });


    // =========================
    // TOTAIS
    // =========================

    y += 10;


    pdf.setFont("helvetica", "normal");

    pdf.text(
        "Valor dos produtos:",
        125,
        y
    );


    pdf.text(
        formatarMoedaPDF(
            nota.totais.produtos
        ),
        170,
        y
    );


    y += 8;


    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);


    pdf.text(
        "VALOR TOTAL DA NF-e:",
        110,
        y
    );


    pdf.text(
        formatarMoedaPDF(
            nota.totais.nota
        ),
        170,
        y
    );


    // =========================
    // DATA
    // =========================

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);


    pdf.text(
        `Emissão: ${formatarData(nota.emissao)}`,
        margem,
        285
    );

}

function formatarMoedaPDF(valor) {

    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}

function formatarDocumentoPDF(documento) {

    if (!documento) {
        return "";
    }


    const valor = documento.replace(/\D/g, "");


    if (valor.length === 11) {

        return valor.replace(
            /(\d{3})(\d{3})(\d{3})(\d{2})/,
            "$1.$2.$3-$4"
        );

    }


    if (valor.length === 14) {

        return valor.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            "$1.$2.$3/$4-$5"
        );

    }


    return documento;

}

function formatarChave(chave) {

    if (!chave) {
        return "";
    }


    return chave.match(/.{1,4}/g)?.join(" ") || chave;

}

function limitarTexto(texto, tamanho) {

    if (!texto) {
        return "";
    }


    if (texto.length <= tamanho) {
        return texto;
    }


    return texto.substring(0, tamanho - 3) + "...";

}

function formatarData(data) {

    if (!data) {
        return "";
    }


    const dataObj = new Date(data);


    if (Number.isNaN(dataObj.getTime())) {
        return data;
    }


    return dataObj.toLocaleDateString(
        "pt-BR"
    );

}