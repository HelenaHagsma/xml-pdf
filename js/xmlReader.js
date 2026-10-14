const NFE_NAMESPACE = "http://www.portalfiscal.inf.br/nfe";


async function lerXML(file) {

    try {

        // Lê o conteúdo do arquivo
        const conteudo = await file.text();

        // Converte o texto em um documento XML
        const parser = new DOMParser();

        const xml = parser.parseFromString(
            conteudo,
            "application/xml"
        );


        // Verifica erro de leitura
        const erro = xml.querySelector("parsererror");

        if (erro) {

            return {
                valido: false,
                mensagem: "XML inválido."
            };

        }


        // Procura a estrutura principal da NF-e
        const infNFe = xml.getElementsByTagNameNS(
            NFE_NAMESPACE,
            "infNFe"
        )[0];


        if (!infNFe) {

            return {
                valido: false,
                mensagem: "O arquivo não possui uma estrutura de NF-e válida."
            };

        }


        // Cria o objeto completo da NF-e
        const nota = {

            numero: obterValor(infNFe, "nNF"),

            serie: obterValor(infNFe, "serie"),

            emissao: obterValor(infNFe, "dhEmi"),

            chave: infNFe
                .getAttribute("Id")
                ?.replace("NFe", "") || "",


            emitente: obterEmitente(infNFe),


            destinatario: obterDestinatario(infNFe),


            produtos: obterProdutos(infNFe),


            totais: obterTotais(infNFe)

        };


        return {

            valido: true,

            nota: nota

        };


    } catch (erro) {

        console.error(erro);

        return {

            valido: false,

            mensagem: "Erro ao processar o arquivo."

        };

    }

}

function obterEmitente(infNFe) {

    const emit = obterElemento(
        infNFe,
        "emit"
    );


    if (!emit) {
        return {};
    }


    const endereco = obterElemento(
        emit,
        "enderEmit"
    );


    return {

        nome: obterValor(emit, "xNome"),

        cnpj: obterValor(emit, "CNPJ"),

        ie: obterValor(emit, "IE"),


        endereco: {

            logradouro: obterValor(
                endereco,
                "xLgr"
            ),

            numero: obterValor(
                endereco,
                "nro"
            ),

            bairro: obterValor(
                endereco,
                "xBairro"
            ),

            municipio: obterValor(
                endereco,
                "xMun"
            ),

            uf: obterValor(
                endereco,
                "UF"
            ),

            cep: obterValor(
                endereco,
                "CEP"
            )

        }

    };

}

function obterDestinatario(infNFe) {

    const dest = obterElemento(
        infNFe,
        "dest"
    );


    if (!dest) {
        return {};
    }


    const endereco = obterElemento(
        dest,
        "enderDest"
    );


    const cpf = obterValor(
        dest,
        "CPF"
    );


    const cnpj = obterValor(
        dest,
        "CNPJ"
    );


    return {

        nome: obterValor(
            dest,
            "xNome"
        ),

        cpfCnpj: cpf || cnpj,


        endereco: {

            logradouro: obterValor(
                endereco,
                "xLgr"
            ),

            numero: obterValor(
                endereco,
                "nro"
            ),

            bairro: obterValor(
                endereco,
                "xBairro"
            ),

            municipio: obterValor(
                endereco,
                "xMun"
            ),

            uf: obterValor(
                endereco,
                "UF"
            ),

            cep: obterValor(
                endereco,
                "CEP"
            )

        }

    };

}

function obterProdutos(infNFe) {

    const detalhes = infNFe.getElementsByTagNameNS(
        NFE_NAMESPACE,
        "det"
    );


    const produtos = [];


    for (const detalhe of detalhes) {

        const produto = obterElemento(
            detalhe,
            "prod"
        );


        if (!produto) {
            continue;
        }


        produtos.push({

            codigo: obterValor(
                produto,
                "cProd"
            ),

            descricao: obterValor(
                produto,
                "xProd"
            ),

            ncm: obterValor(
                produto,
                "NCM"
            ),

            cfop: obterValor(
                produto,
                "CFOP"
            ),

            unidade: obterValor(
                produto,
                "uCom"
            ),

            quantidade: converterNumero(
                obterValor(
                    produto,
                    "qCom"
                )
            ),

            valorUnitario: converterNumero(
                obterValor(
                    produto,
                    "vUnCom"
                )
            ),

            valorTotal: converterNumero(
                obterValor(
                    produto,
                    "vProd"
                )
            )

        });

    }


    return produtos;

}

function obterTotais(infNFe) {

    const total = obterElemento(
        infNFe,
        "total"
    );


    if (!total) {
        return {};
    }


    const icmsTot = obterElemento(
        total,
        "ICMSTot"
    );


    if (!icmsTot) {
        return {};
    }


    return {

        produtos: converterNumero(
            obterValor(
                icmsTot,
                "vProd"
            )
        ),

        nota: converterNumero(
            obterValor(
                icmsTot,
                "vNF"
            )
        )

    };

}

function obterElemento(elementoPai, nome) {

    if (!elementoPai) {
        return null;
    }


    const elementos =
        elementoPai.getElementsByTagNameNS(
            NFE_NAMESPACE,
            nome
        );


    if (!elementos.length) {
        return null;
    }


    return elementos[0];

}

function obterValor(elementoPai, nome) {

    const elemento = obterElemento(
        elementoPai,
        nome
    );


    if (!elemento) {
        return "";
    }


    return elemento.textContent.trim();

}

function converterNumero(valor) {

    if (!valor) {
        return 0;
    }


    const numero = Number(valor);


    if (Number.isNaN(numero)) {
        return 0;
    }


    return numero;

}