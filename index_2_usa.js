import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getStorage, getDownloadURL, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAkBV0rHEghBOHl2mDOs6rMDHkUgYMxFr0",
    authDomain: "visaformulariostorage.firebaseapp.com",
    projectId: "visaformulariostorage",
    storageBucket: "visaformulariostorage.firebasestorage.app",
    messagingSenderId: "720170394408",
    appId: "1:720170394408:web:b1c294c39c489388f6261d"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const WHATSAPP_NUMBER = "5561999998165";

function fixText(value) {
    let text = String(value || "").trim();
    if (text.includes("Ã")) {
        try {
            text = decodeURIComponent(escape(text));
        } catch (error) {
            console.debug("Nao foi possivel normalizar texto:", error);
        }
    }
    return text;
}

function norm(value) {
    return fixText(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function formatCPF(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    input.value = value;
}

function formatCEP(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
    }
    input.value = value;
}

function formatDateBr(dateStr) {
    if (!dateStr) return "Nao informado";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
}

function valueOrDefault(formData, key) {
    return fixText(formData.get(key)) || "Nao informado";
}

function fieldValue(id) {
    return norm(document.getElementById(id)?.value);
}

function clearSection(section) {
    section.querySelectorAll("input, textarea, select").forEach((el) => {
        if (el.type === "checkbox") {
            el.checked = false;
        } else {
            el.value = "";
        }
    });
}

function toggleSection(sectionId, show) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.classList.toggle("hidden-section", !show);
    if (!show) clearSection(section);
}

function toggleSpouseInfo() {
    const estadoCivil = fieldValue("estadoCivil");
    const showSpouse = ["casado", "divorciado", "viuvo", "uniao estavel"].includes(estadoCivil);
    toggleSection("spouseInfo", showSpouse);
    const spouseDeathInfo = document.getElementById("spouseDeathInfo");
    if (spouseDeathInfo) {
        const showDeath = showSpouse && estadoCivil === "viuvo";
        spouseDeathInfo.classList.toggle("hidden-section", !showDeath);
        if (!showDeath) clearSection(spouseDeathInfo);
    }
}

function toggleParentsInfo() {
    const showParents = fieldValue("temPaisVivos") === "sim";
    toggleSection("parentsInfo", showParents);
    toggleParentsInUSInfo();
}

function toggleParentsInUSInfo() {
    const showParentsInUS = fieldValue("temPaisVivos") === "sim" && fieldValue("paisNosEUA") === "sim";
    toggleSection("parentsInUSInfo", showParentsInUS);
}

function toggleAcquaintancesInfo() {
    toggleSection("acquaintancesInfo", fieldValue("temConhecidosEUA") === "sim");
}

function togglePayerInfo() {
    const showPayer = fieldValue("quemPaga") === "outra pessoa";
    toggleSection("payerInfo", showPayer);
    togglePayerAddressInfo();
}

function togglePayerAddressInfo() {
    const showPayerAddress = fieldValue("quemPaga") === "outra pessoa" && fieldValue("payerSameAddress") === "nao";
    toggleSection("payerAddressInfo", showPayerAddress);
}

function toggleTravelCompanionsInfo() {
    toggleSection("travelCompanionsInfo", fieldValue("temCompanheiros") === "sim");
}

function toggleRenewalInfo() {
    toggleSection("renewalInfo", fieldValue("primeiroVisto") === "renovacao");
}

function togglePreviousUSVisaInfo() {
    toggleSection("previousUSVisaInfo", fieldValue("visitouEUA") === "sim");
}

function toggleVisaDeniedDetails() {
    const show = fieldValue("vistoNegado") === "sim" || fieldValue("entradaRecusada") === "sim";
    toggleSection("visaDeniedDetails", show);
}

function syncDeclarationName() {
    const nome = fixText(document.getElementById("nome")?.value);
    const sobrenome = fixText(document.getElementById("sobrenome")?.value);
    const declaracaoNome = document.getElementById("declaracaoNome");
    if (!declaracaoNome || declaracaoNome.dataset.locked === "1") return;
    declaracaoNome.value = `${nome} ${sobrenome}`.trim();
}

function drawHeader(doc, state) {
    doc.setFillColor(0, 48, 135);
    doc.rect(0, 0, state.pageWidth, 25, "F");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    const title = "Formulario de Solicitacao de Visto Americano";
    const titleWidth = doc.getTextWidth(title);
    const titleX = (state.pageWidth - titleWidth) / 2;
    doc.text(title, titleX, 15);
    doc.setFontSize(14);
    const starSpacing = 8;
    for (let i = 0; i < 3; i += 1) {
        doc.text("*", titleX - (i + 1) * starSpacing - 5, 15);
        doc.text("*", titleX + titleWidth + (i + 1) * starSpacing + 5, 15);
    }
}

function drawPageBorder(doc, state) {
    doc.setDrawColor(0, 48, 135);
    doc.setLineWidth(0.5);
    doc.rect(state.margin / 2, state.margin / 2, state.pageWidth - state.margin, state.pageHeight - state.margin);
}

function ensurePage(doc, state, extra = 0) {
    if (state.yPosition + extra > state.pageHeight - state.margin) {
        doc.addPage();
        state.yPosition = 30;
        drawHeader(doc, state);
        drawPageBorder(doc, state);
    }
}

function addSectionTitle(doc, state, title) {
    ensurePage(doc, state, 15);
    doc.setFillColor(200, 16, 46);
    doc.rect(state.margin, state.yPosition - 5, state.pageWidth - 2 * state.margin, 10, "F");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.text(title, state.margin + 5, state.yPosition + 2);
    state.yPosition += 15;
}

function addTextBlock(doc, state, text, bold = false) {
    const maxWidth = state.pageWidth - 2 * state.margin;
    const lineHeight = 7;
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.setFont("Helvetica", bold ? "bold" : "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    for (const line of lines) {
        ensurePage(doc, state, lineHeight);
        doc.text(line, state.margin, state.yPosition);
        state.yPosition += lineHeight;
    }
    state.yPosition += 2;
}

function addFormattedParagraph(doc, state, text) {
    const plain = text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/_(.*?)_/g, "$1");
    addTextBlock(doc, state, plain);
}

function addLine(doc, state, label, value, bold = false) {
    addTextBlock(doc, state, `${label}: ${value}`, bold);
}

async function generatePDF(event) {
    event.preventDefault();

    try {
        const { jsPDF } = window.jspdf;
        const form = document.getElementById("visaForm");
        const formData = new FormData(form);
        const solicitanteNome = valueOrDefault(formData, "nome") !== "Nao informado" ? valueOrDefault(formData, "nome") : valueOrDefault(formData, "declaracaoNome");

        const doc = new jsPDF();
        const state = {
            margin: 10,
            pageWidth: doc.internal.pageSize.width,
            pageHeight: doc.internal.pageSize.height,
            yPosition: 30
        };

        drawHeader(doc, state);
        drawPageBorder(doc, state);

        addSectionTitle(doc, state, "Informacoes Pessoais");
        addLine(doc, state, "Nome", valueOrDefault(formData, "nome"), true);
        addLine(doc, state, "Sobrenome", valueOrDefault(formData, "sobrenome"));
        addLine(doc, state, "Outros nomes", valueOrDefault(formData, "outrosNomes"));
        addLine(doc, state, "CPF", valueOrDefault(formData, "cpf"));
        addLine(doc, state, "Data de nascimento", formatDateBr(formData.get("nascimento")));
        addLine(doc, state, "Local de nascimento", valueOrDefault(formData, "localNascimento"));
        addLine(doc, state, "Sexo", valueOrDefault(formData, "sexo"));
        addLine(doc, state, "Estado civil", valueOrDefault(formData, "estadoCivil"));

        if (["casado", "divorciado", "viuvo", "uniao estavel"].includes(norm(formData.get("estadoCivil")))) {
            addSectionTitle(doc, state, "Dados do Conjuge");
            addLine(doc, state, "Nome do conjuge", valueOrDefault(formData, "spouseNome"));
            addLine(doc, state, "Data de nascimento do conjuge", formatDateBr(formData.get("spouseNascimento")));
            addLine(doc, state, "Local de nascimento do conjuge", valueOrDefault(formData, "spouseLocalNascimento"));
            if (norm(formData.get("estadoCivil")) === "viuvo") {
                addLine(doc, state, "Data de falecimento do conjuge", formatDateBr(formData.get("spouseFalecimento")));
            }
        }

        addSectionTitle(doc, state, "Dados do Passaporte Pessoal");
        addLine(doc, state, "Nacionalidade", valueOrDefault(formData, "nacionalidade"));
        addLine(doc, state, "Outras nacionalidades", valueOrDefault(formData, "outrasNacionalidades"));
        addLine(doc, state, "Numero do passaporte", valueOrDefault(formData, "passaporte"));
        addLine(doc, state, "Data de emissao do passaporte", formatDateBr(formData.get("dataEmissaoPassaporte")));
        addLine(doc, state, "Data de validade do passaporte", formatDateBr(formData.get("dataValidadePassaporte")));
        addLine(doc, state, "Local de emissao do passaporte", valueOrDefault(formData, "localEmissaoPassaporte"));

        addSectionTitle(doc, state, "Informacoes de Contato");
        addLine(doc, state, "CEP", valueOrDefault(formData, "cep"));
        addLine(doc, state, "Endereco", valueOrDefault(formData, "endereco"));
        addLine(doc, state, "Cidade", valueOrDefault(formData, "cidade"));
        addLine(doc, state, "Estado", valueOrDefault(formData, "estado"));
        addLine(doc, state, "Pais", valueOrDefault(formData, "pais"));
        addLine(doc, state, "Telefone", valueOrDefault(formData, "telefone"));
        addLine(doc, state, "E-mail", valueOrDefault(formData, "email"));

        addSectionTitle(doc, state, "Informacoes Familiares");
        addLine(doc, state, "Pais vivos", valueOrDefault(formData, "temPaisVivos"));
        if (norm(formData.get("temPaisVivos")) === "sim") {
            addLine(doc, state, "Nome do pai", valueOrDefault(formData, "nomePai"));
            addLine(doc, state, "Data de nascimento do pai", formatDateBr(formData.get("nascimentoPai")));
            addLine(doc, state, "Nome da mae", valueOrDefault(formData, "nomeMae"));
            addLine(doc, state, "Data de nascimento da mae", formatDateBr(formData.get("nascimentoMae")));
            addLine(doc, state, "Pais nos EUA", valueOrDefault(formData, "paisNosEUA"));
            if (norm(formData.get("paisNosEUA")) === "sim") {
                addLine(doc, state, "Explicacao sobre pais nos EUA", valueOrDefault(formData, "explicacaoPaisEUA"));
            }
        }
        addLine(doc, state, "Conhecidos nos EUA", valueOrDefault(formData, "temConhecidosEUA"));
        if (norm(formData.get("temConhecidosEUA")) === "sim") {
            addLine(doc, state, "Nome do conhecido", valueOrDefault(formData, "nomeConhecido"));
            addLine(doc, state, "Telefone do conhecido", valueOrDefault(formData, "telefoneConhecido"));
            addLine(doc, state, "E-mail do conhecido", valueOrDefault(formData, "emailConhecido"));
            addLine(doc, state, "Vinculo com o conhecido", valueOrDefault(formData, "vinculoConhecido"));
        }

        addSectionTitle(doc, state, "Detalhes da Viagem");
        addLine(doc, state, "Objetivo da viagem", valueOrDefault(formData, "objetivo"));
        addLine(doc, state, "Data de chegada", formatDateBr(formData.get("chegada")));
        addLine(doc, state, "Tempo de estadia", valueOrDefault(formData, "tempo"));
        addLine(doc, state, "Endereco nos EUA", valueOrDefault(formData, "enderecoEUA"));
        addLine(doc, state, "Quem paga a viagem", valueOrDefault(formData, "quemPaga"));
        if (norm(formData.get("quemPaga")) === "outra pessoa") {
            addLine(doc, state, "Nome do pagante", valueOrDefault(formData, "payerNome"));
            addLine(doc, state, "Endereco igual ao solicitante", valueOrDefault(formData, "payerSameAddress"));
            if (norm(formData.get("payerSameAddress")) === "nao") {
                addLine(doc, state, "CEP do pagante", valueOrDefault(formData, "payerCEP"));
                addLine(doc, state, "Endereco do pagante", valueOrDefault(formData, "payerEndereco"));
                addLine(doc, state, "Cidade do pagante", valueOrDefault(formData, "payerCidade"));
                addLine(doc, state, "Estado do pagante", valueOrDefault(formData, "payerEstado"));
                addLine(doc, state, "Pais do pagante", valueOrDefault(formData, "payerPais"));
            }
            addLine(doc, state, "E-mail do pagante", valueOrDefault(formData, "payerEmail"));
            addLine(doc, state, "Telefone do pagante", valueOrDefault(formData, "payerTelefone"));
            addLine(doc, state, "Vinculo com o pagante", valueOrDefault(formData, "payerVinculo"));
        }
        addLine(doc, state, "Companheiros de viagem", valueOrDefault(formData, "temCompanheiros"));
        if (norm(formData.get("temCompanheiros")) === "sim") {
            addLine(doc, state, "Nome do(s) companheiro(s)", valueOrDefault(formData, "nomeCompanheiro"));
            addLine(doc, state, "Relacao com o(s) companheiro(s)", valueOrDefault(formData, "relacaoCompanheiro"));
        }

        addSectionTitle(doc, state, "Informacoes de Trabalho");
        addLine(doc, state, "Ocupacao", valueOrDefault(formData, "ocupacao"));
        addLine(doc, state, "Empregador", valueOrDefault(formData, "empregador"));
        addLine(doc, state, "Endereco do empregador", valueOrDefault(formData, "enderecoEmpregador"));
        addLine(doc, state, "Telefone do empregador", valueOrDefault(formData, "telefoneEmpregador"));
        addLine(doc, state, "Data de inicio no trabalho", formatDateBr(formData.get("dataInicioTrabalho")));
        addLine(doc, state, "Renda mensal", valueOrDefault(formData, "rendaMensal"));

        addSectionTitle(doc, state, "Informacoes de Educacao");
        addLine(doc, state, "Nivel de educacao", valueOrDefault(formData, "nivelEducacao"));
        addLine(doc, state, "Nome do curso", valueOrDefault(formData, "curso"));
        addLine(doc, state, "Instituicao", valueOrDefault(formData, "instituicao"));
        addLine(doc, state, "CEP da instituicao", valueOrDefault(formData, "cepInstituicao"));
        addLine(doc, state, "Endereco da instituicao", valueOrDefault(formData, "enderecoInstituicao"));
        addLine(doc, state, "Data de inicio do curso", formatDateBr(formData.get("dataInicioEducacao")));
        addLine(doc, state, "Data de conclusao do curso", formatDateBr(formData.get("dataFimEducacao")));

        addSectionTitle(doc, state, "Historico de Viagens");
        addLine(doc, state, "Primeiro visto ou renovacao", valueOrDefault(formData, "primeiroVisto"));
        if (norm(formData.get("primeiroVisto")) === "renovacao") {
            addLine(doc, state, "Numero do visto anterior", valueOrDefault(formData, "numeroVistoAnteriorRenovacao"));
            addLine(doc, state, "Data de emissao do visto anterior", formatDateBr(formData.get("dataEmissaoVistoAnterior")));
            addLine(doc, state, "Data de validade do visto anterior", formatDateBr(formData.get("dataValidadeVistoAnterior")));
            addLine(doc, state, "Local de emissao do visto anterior", valueOrDefault(formData, "localEmissaoVistoAnterior"));
        }
        addLine(doc, state, "Ja visitou os EUA", valueOrDefault(formData, "visitouEUA"));
        if (norm(formData.get("visitouEUA")) === "sim") {
            addLine(doc, state, "Data da ultima visita", formatDateBr(formData.get("dataUltimaVisita")));
            addLine(doc, state, "Tempo da ultima visita", valueOrDefault(formData, "tempoUltimaVisita"));
            addLine(doc, state, "Numero do visto anterior", valueOrDefault(formData, "numeroVistoAnterior"));
        }
        addLine(doc, state, "Impressao digital coletada", valueOrDefault(formData, "impressaoDigital"));
        addLine(doc, state, "Paises visitados nos ultimos 5 anos", valueOrDefault(formData, "outrosPaises"));
        addLine(doc, state, "Visto negado", valueOrDefault(formData, "vistoNegado"));
        addLine(doc, state, "Entrada recusada nos EUA", valueOrDefault(formData, "entradaRecusada"));
        if (norm(formData.get("vistoNegado")) === "sim" || norm(formData.get("entradaRecusada")) === "sim") {
            addLine(doc, state, "Detalhes da negativa", valueOrDefault(formData, "detalhesVistoNegado"));
        }

        addSectionTitle(doc, state, "Declaracao");
        addLine(doc, state, "Nome", solicitanteNome, true);
        addLine(doc, state, "Local", valueOrDefault(formData, "declaracaoLocal"));
        addLine(doc, state, "Data", formatDateBr(formData.get("declaracaoData")));
        addLine(doc, state, "Aceite dos termos", formData.get("aceiteDeclaracao") ? "Sim" : "Nao");

        addFormattedParagraph(doc, state, `Eu, ${solicitanteNome}, declaro, sob as penas da lei, que li e compreendi integralmente todas as questoes contidas nesta solicitacao de visto e afirmo que as respostas por mim fornecidas sao verdadeiras, completas e corretas, conforme o meu melhor conhecimento e conviccao.`);
        addFormattedParagraph(doc, state, "Declaro estar ciente de que:");
        addFormattedParagraph(doc, state, "1. Qualquer declaracao falsa, incompleta ou enganosa podera resultar na recusa permanente do visto ou na negativa de admissao nos Estados Unidos, conforme disposto na legislacao aplicavel.");
        addFormattedParagraph(doc, state, "2. Todas as informacoes prestadas nesta solicitacao constituem declaracoes juramentadas, realizadas sob pena de perjurio, nos termos do disposto no 28 U.S.C. § 1746.");
        addFormattedParagraph(doc, state, "3. Informacoes adicionais poderao ser requisitadas pelas autoridades competentes apos a analise desta solicitacao, sendo minha responsabilidade fornece-las tempestivamente.");
        addFormattedParagraph(doc, state, "4. As informacoes contidas nesta solicitacao poderao ser compartilhadas com outras agencias governamentais dos Estados Unidos, que possuem autoridade legal para utiliza-las para fins de aplicacao da lei ou para propositos imigratorios, conforme permitido pela legislacao vigente.");
        addFormattedParagraph(doc, state, "5. A fotografia fornecida com esta solicitacao podera ser utilizada pelas autoridades americanas para fins de verificacao de identidade, empregabilidade ou outros objetivos legais previstos na legislacao dos Estados Unidos.");
        addFormattedParagraph(doc, state, "Declaro ainda:");
        addFormattedParagraph(doc, state, "6. Que sou exclusivamente responsavel pela autenticidade e exatidao dos documentos apresentados e das informacoes prestadas nesta solicitacao.");
        addFormattedParagraph(doc, state, "7. Que tenho pleno conhecimento de que a concessao ou negativa do visto e prerrogativa exclusiva da Autoridade Consular Americana, nao cabendo a terceiros qualquer ingerencia sobre tal decisao.");
        addFormattedParagraph(doc, state, "8. Que estou ciente de que, em processos de renovacao de visto, entrevistas presenciais poderao ser exigidas a criterio exclusivo da Autoridade Consular Americana.");
        addFormattedParagraph(doc, state, "9. Que reconheco que o servico contratado constitui assessoria relacionada ao processo de preenchimento de documentacao, agendamento de biometria e entrevista, nao abrangendo servicos de entrega ou retirada de documentos no Centro de Atendimento ao Solicitante de Visto (CASV), sendo necessaria a contratacao de um agente colaborador, caso eu deseje tais servicos adicionais.");
        addFormattedParagraph(doc, state, "10. Que a aposicao de minha assinatura eletronica neste documento possui validade juridica, conforme a legislacao aplicavel, e representa meu reconhecimento expresso dos servicos contratados.");
        addFormattedParagraph(doc, state, "Autorizacao:");
        addFormattedParagraph(doc, state, "Declaro, por fim, ter revisado e conferido todos os dados por mim apresentados, autorizando expressamente a empresa Objetivo Turismo Ltda., contratada diretamente por mim ou por intermedio de minha agencia, a proceder com o envio eletronico do Formulario DS-160 ao Consulado Americano, bem como a realizar o pagamento das taxas e o agendamento necessarios a tramitacao do meu pedido de visto.");

        const fileName = `Formulario_Visto_Americano_${solicitanteNome.replace(/\s+/g, "_")}.pdf`;
        doc.save(fileName);

        const pdfBlob = doc.output("blob");
        const timestamp = Date.now();
        const baseName = (fixText(formData.get("nome")) || "sem_nome").replace(/\s+/g, "_");
        const storageRef = ref(storage, `pdfs/formulario_visto_${baseName}_${timestamp}.pdf`);
        await uploadBytes(storageRef, pdfBlob);
        const downloadUrl = await getDownloadURL(storageRef);

        const whatsappMessage = `Formulario de Visto Americano preenchido por ${valueOrDefault(formData, "nome")}.\nPassaporte: ${valueOrDefault(formData, "passaporte")}\nClique no link para visualizar e baixar o PDF: ${downloadUrl}`;
        window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noopener");

        alert("Formulario enviado com sucesso. O PDF foi gerado e o link foi aberto no WhatsApp.");
    } catch (error) {
        console.error("Erro ao gerar PDF ou enviar para o WhatsApp:", error);
        alert("Erro ao processar o formulario. Verifique o console para mais detalhes.");
    }
}

window.formatCPF = formatCPF;
window.formatCEP = formatCEP;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("estadoCivil")?.addEventListener("change", toggleSpouseInfo);
    document.getElementById("temPaisVivos")?.addEventListener("change", toggleParentsInfo);
    document.getElementById("paisNosEUA")?.addEventListener("change", toggleParentsInUSInfo);
    document.getElementById("temConhecidosEUA")?.addEventListener("change", toggleAcquaintancesInfo);
    document.getElementById("quemPaga")?.addEventListener("change", togglePayerInfo);
    document.getElementById("payerSameAddress")?.addEventListener("change", togglePayerAddressInfo);
    document.getElementById("temCompanheiros")?.addEventListener("change", toggleTravelCompanionsInfo);
    document.getElementById("primeiroVisto")?.addEventListener("change", toggleRenewalInfo);
    document.getElementById("visitouEUA")?.addEventListener("change", togglePreviousUSVisaInfo);
    document.getElementById("vistoNegado")?.addEventListener("change", toggleVisaDeniedDetails);
    document.getElementById("entradaRecusada")?.addEventListener("change", toggleVisaDeniedDetails);
    document.getElementById("visaForm")?.addEventListener("submit", generatePDF);
    document.getElementById("nome")?.addEventListener("input", syncDeclarationName);
    document.getElementById("sobrenome")?.addEventListener("input", syncDeclarationName);
    document.getElementById("declaracaoNome")?.addEventListener("input", (event) => {
        event.target.dataset.locked = event.target.value.trim() ? "1" : "";
    });

    toggleSpouseInfo();
    toggleParentsInfo();
    toggleAcquaintancesInfo();
    togglePayerInfo();
    toggleTravelCompanionsInfo();
    toggleRenewalInfo();
    togglePreviousUSVisaInfo();
    toggleVisaDeniedDetails();
    syncDeclarationName();
});
