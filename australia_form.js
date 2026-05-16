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
const PDF_STORAGE_FOLDER = "gs://visaformulariostorage.firebasestorage.app/pdfs";

function text(value) {
    return String(value || "").trim();
}

function norm(value) {
    return text(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function valueOrDefault(formData, key) {
    return text(formData.get(key)) || "Nao informado";
}

function dateBr(value) {
    if (!value) return "Nao informado";
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
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

function toggleSection(id, show) {
    const section = document.getElementById(id);
    if (!section) return;
    section.classList.toggle("hidden-section", !show);
    if (!show) clearSection(section);
}

function shouldShowWorkInfo() {
    const situation = fieldValue("situacaoTrabalho");
    return situation === "trabalha" || situation === "estuda e trabalha";
}

function toggleConditionalBlocks() {
    toggleSection("outraNacionalidadeInfo", fieldValue("outraNacionalidade") === "sim");
    toggleSection("acompanhantesInfo", fieldValue("viajaAcompanhado") === "sim");
    toggleSection("historicoAustraliaInfo", fieldValue("jaEsteveAustralia") === "sim");
    toggleSection("custeioInfo", fieldValue("quemCusteiaViagem") !== "eu mesmo(a)" && fieldValue("quemCusteiaViagem") !== "");
    toggleSection("trabalhoInfo", shouldShowWorkInfo());
    toggleSection("familiaAustraliaInfo", fieldValue("temFamiliaAustralia") === "sim");
    toggleSection("vistoNegadoInfo", fieldValue("vistoNegadoAntes") === "sim");
    toggleSection("saudeInfo", fieldValue("problemaSaudeRelevante") === "sim");
    toggleSection("antecedentesInfo", fieldValue("antecedenteCriminal") === "sim");
}

function validateForm(form) {
    for (const field of form.querySelectorAll("[data-required='1']")) {
        if (!text(field.value)) {
            const label = form.querySelector(`label[for='${field.id}']`)?.textContent || "Campo obrigatorio";
            alert(`Preencha o campo obrigatorio: ${text(label)}`);
            field.focus();
            return false;
        }
    }

    if (fieldValue("outraNacionalidade") === "sim" && !text(document.getElementById("nacionalidadeSecundaria")?.value)) {
        alert("Informe a outra nacionalidade.");
        document.getElementById("nacionalidadeSecundaria")?.focus();
        return false;
    }

    if (fieldValue("viajaAcompanhado") === "sim" && !text(document.getElementById("nomesAcompanhantes")?.value)) {
        alert("Informe os acompanhantes.");
        document.getElementById("nomesAcompanhantes")?.focus();
        return false;
    }

    if (fieldValue("jaEsteveAustralia") === "sim") {
        if (!text(document.getElementById("dataUltimaIdaAustralia")?.value) || !text(document.getElementById("tipoVistoAnteriorAustralia")?.value)) {
            alert("Preencha data da ultima ida e tipo de visto anterior para Australia.");
            document.getElementById("dataUltimaIdaAustralia")?.focus();
            return false;
        }
    }

    if (fieldValue("quemCusteiaViagem") !== "eu mesmo(a)" && fieldValue("quemCusteiaViagem") !== "") {
        if (!text(document.getElementById("nomePatrocinador")?.value) || !text(document.getElementById("relacaoPatrocinador")?.value) || !text(document.getElementById("contatoPatrocinador")?.value)) {
            alert("Preencha os dados de patrocinador/custeio.");
            document.getElementById("nomePatrocinador")?.focus();
            return false;
        }
    }

    if (shouldShowWorkInfo()) {
        for (const field of form.querySelectorAll("[data-work-required='1']")) {
            if (!text(field.value)) {
                const label = form.querySelector(`label[for='${field.id}']`)?.textContent || "Campo de trabalho obrigatorio";
                alert(`Preencha o campo de trabalho: ${text(label)}`);
                field.focus();
                return false;
            }
        }
    }

    if (fieldValue("temFamiliaAustralia") === "sim" && !text(document.getElementById("detalhesFamiliaAustralia")?.value)) {
        alert("Descreva os dados do familiar na Australia.");
        document.getElementById("detalhesFamiliaAustralia")?.focus();
        return false;
    }

    if (fieldValue("vistoNegadoAntes") === "sim" && !text(document.getElementById("detalhesVistoNegado")?.value)) {
        alert("Descreva os detalhes da negativa de visto.");
        document.getElementById("detalhesVistoNegado")?.focus();
        return false;
    }

    if (fieldValue("problemaSaudeRelevante") === "sim" && !text(document.getElementById("detalhesSaude")?.value)) {
        alert("Descreva os detalhes de saude.");
        document.getElementById("detalhesSaude")?.focus();
        return false;
    }

    if (fieldValue("antecedenteCriminal") === "sim" && !text(document.getElementById("detalhesAntecedente")?.value)) {
        alert("Descreva os detalhes dos antecedentes/processos.");
        document.getElementById("detalhesAntecedente")?.focus();
        return false;
    }

    if (!document.getElementById("aceiteDeclaracao")?.checked) {
        alert("Confirme o aceite da declaracao para continuar.");
        document.getElementById("aceiteDeclaracao")?.focus();
        return false;
    }

    return true;
}

function drawTitle(doc, state) {
    const title = "Formulario de Solicitacao de Visto Australiano";
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const width = doc.getTextWidth(title);
    doc.text(title, (state.pageWidth - width) / 2, state.yPosition);
    state.yPosition += 6;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(state.margin, state.yPosition, state.pageWidth - state.margin, state.yPosition);
    state.yPosition += 8;
}

function ensurePage(doc, state, extra = 0) {
    if (state.yPosition + extra > state.pageHeight - state.bottomMargin) {
        doc.addPage();
        state.yPosition = state.topMargin;
    }
}

function addSectionTitle(doc, state, title) {
    ensurePage(doc, state, 12);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(title, state.margin, state.yPosition);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.15);
    doc.line(state.margin, state.yPosition + 2, state.pageWidth - state.margin, state.yPosition + 2);
    state.yPosition += 8;
}

function addLine(doc, state, label, value, bold = false) {
    const full = `${label}: ${value || "Nao informado"}`;
    const lines = doc.splitTextToSize(full, state.pageWidth - 2 * state.margin);
    doc.setFont("Helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    for (const line of lines) {
        ensurePage(doc, state, 6);
        doc.text(line, state.margin, state.yPosition);
        state.yPosition += 6;
    }
    state.yPosition += 2;
}

function appendSectionByKeys(doc, state, title, formData, items) {
    addSectionTitle(doc, state, title);
    for (const [label, key, kind] of items) {
        const value = kind === "date" ? dateBr(formData.get(key)) : valueOrDefault(formData, key);
        addLine(doc, state, label, value);
    }
}

function resetForm() {
    const form = document.getElementById("australiaVisaForm");
    if (!form) return;
    form.reset();
    document.getElementById("restartFormButton")?.classList.add("hidden-section");
    toggleConditionalBlocks();
    document.getElementById("nomeCompleto")?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function submitAustraliaForm(event) {
    event.preventDefault();
    const form = document.getElementById("australiaVisaForm");
    if (!form || !validateForm(form)) return;

    try {
        const formData = new FormData(form);
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const state = {
            margin: 10,
            topMargin: 15,
            bottomMargin: 15,
            pageWidth: doc.internal.pageSize.width,
            pageHeight: doc.internal.pageSize.height,
            yPosition: 15
        };

        drawTitle(doc, state);

        appendSectionByKeys(doc, state, "Dados Pessoais", formData, [
            ["Nome completo", "nomeCompleto"],
            ["Data de nascimento", "dataNascimento", "date"],
            ["Cidade e pais de nascimento", "paisNascimento"],
            ["Nacionalidade atual", "nacionalidadeAtual"],
            ["Sexo", "sexo"],
            ["Estado civil", "estadoCivil"],
            ["Possui outra nacionalidade", "outraNacionalidade"],
            ["Outra nacionalidade", "nacionalidadeSecundaria"]
        ]);

        appendSectionByKeys(doc, state, "Passaporte", formData, [
            ["Numero do passaporte", "numeroPassaporte"],
            ["Pais emissor", "paisEmissorPassaporte"],
            ["Data de emissao", "dataEmissaoPassaporte", "date"],
            ["Data de validade", "dataValidadePassaporte", "date"]
        ]);

        appendSectionByKeys(doc, state, "Contato e Endereco", formData, [
            ["Endereco completo", "enderecoCompleto"],
            ["Cidade", "cidadeResidencia"],
            ["Estado/Provincia", "estadoResidencia"],
            ["Pais", "paisResidencia"],
            ["Telefone", "telefoneContato"],
            ["E-mail", "emailContato"]
        ]);

        appendSectionByKeys(doc, state, "Viagem para Australia", formData, [
            ["Objetivo da viagem", "objetivoViagem"],
            ["Data prevista de chegada", "dataEntradaPrevista", "date"],
            ["Duracao de estadia", "duracaoEstadia"],
            ["Cidade principal", "cidadeDestinoAustralia"],
            ["Estado/Territorio", "estadoDestinoAustralia"],
            ["Endereco de hospedagem", "enderecoHospedagemAustralia"],
            ["Viaja acompanhado", "viajaAcompanhado"],
            ["Acompanhantes", "nomesAcompanhantes"],
            ["Ja esteve na Australia", "jaEsteveAustralia"],
            ["Data da ultima ida", "dataUltimaIdaAustralia", "date"],
            ["Tipo de visto anterior", "tipoVistoAnteriorAustralia"],
            ["Numero/referencia do visto anterior", "numeroVistoAnteriorAustralia"]
        ]);

        appendSectionByKeys(doc, state, "Financas e Custeio", formData, [
            ["Quem custeia", "quemCusteiaViagem"],
            ["Nome do patrocinador", "nomePatrocinador"],
            ["Relacao do patrocinador", "relacaoPatrocinador"],
            ["Contato do patrocinador", "contatoPatrocinador"],
            ["Fundos disponiveis", "fundosDisponiveis"]
        ]);

        addSectionTitle(doc, state, "Trabalho e Educacao");
        addLine(doc, state, "Situacao de trabalho", valueOrDefault(formData, "situacaoTrabalho"), true);
        if (shouldShowWorkInfo()) {
            addLine(doc, state, "Ocupacao atual", valueOrDefault(formData, "ocupacaoAtual"));
            addLine(doc, state, "Nome do empregador", valueOrDefault(formData, "nomeEmpregador"));
            addLine(doc, state, "Endereco do empregador", valueOrDefault(formData, "enderecoEmpregador"));
            addLine(doc, state, "Telefone do empregador", valueOrDefault(formData, "telefoneEmpregador"));
            addLine(doc, state, "Renda mensal", valueOrDefault(formData, "rendaMensal"));
        }
        addLine(doc, state, "Nivel de educacao", valueOrDefault(formData, "nivelEducacao"));
        addLine(doc, state, "Curso/area", valueOrDefault(formData, "cursoPrincipal"));
        addLine(doc, state, "Instituicao de ensino", valueOrDefault(formData, "instituicaoEnsino"));

        appendSectionByKeys(doc, state, "Familia, Saude e Carater", formData, [
            ["Possui familiar proximo na Australia", "temFamiliaAustralia"],
            ["Detalhes de familiar na Australia", "detalhesFamiliaAustralia"],
            ["Ja teve visto negado", "vistoNegadoAntes"],
            ["Detalhes de negativa", "detalhesVistoNegado"],
            ["Condicao de saude relevante", "problemaSaudeRelevante"],
            ["Detalhes de saude", "detalhesSaude"],
            ["Antecedente criminal/processo", "antecedenteCriminal"],
            ["Detalhes de antecedente/processo", "detalhesAntecedente"]
        ]);

        appendSectionByKeys(doc, state, "Declaracao", formData, [
            ["Nome do declarante", "declaracaoNome"],
            ["Local", "declaracaoLocal"],
            ["Data", "declaracaoData", "date"]
        ]);
        addLine(doc, state, "Aceite da declaracao", formData.get("aceiteDeclaracao") ? "Sim" : "Nao", true);

        const safeName = valueOrDefault(formData, "nomeCompleto").replace(/\s+/g, "_");
        const timestamp = Date.now();
        const localFileName = `Formulario_Visto_Australiano_${safeName}.pdf`;
        const pdfBlob = doc.output("blob");

        let downloadUrl = "";
        try {
            const storageRef = ref(storage, `${PDF_STORAGE_FOLDER}/formulario_visto_australia_${safeName}_${timestamp}.pdf`);
            await uploadBytes(storageRef, pdfBlob, { contentType: "application/pdf" });
            downloadUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
            console.warn("Upload Firebase nao concluido:", uploadError);
        }

        doc.save(localFileName);

        const message = downloadUrl
            ? `Formulario de Visto Australiano preenchido por ${valueOrDefault(formData, "nomeCompleto")}.\nPassaporte: ${valueOrDefault(formData, "numeroPassaporte")}\nPDF: ${downloadUrl}`
            : `Formulario de Visto Australiano preenchido por ${valueOrDefault(formData, "nomeCompleto")}.\nPassaporte: ${valueOrDefault(formData, "numeroPassaporte")}\nPDF gerado localmente no dispositivo do cliente.`;

        window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`, "_blank", "noopener");
        document.getElementById("restartFormButton")?.classList.remove("hidden-section");
        alert("Formulario processado com sucesso. PDF gerado.");
    } catch (error) {
        console.error("Erro ao processar formulario australiano:", error);
        alert("Erro ao processar formulario. Verifique o console para detalhes.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("outraNacionalidade")?.addEventListener("change", toggleConditionalBlocks);
    document.getElementById("viajaAcompanhado")?.addEventListener("change", toggleConditionalBlocks);
    document.getElementById("jaEsteveAustralia")?.addEventListener("change", toggleConditionalBlocks);
    document.getElementById("quemCusteiaViagem")?.addEventListener("change", toggleConditionalBlocks);
    document.getElementById("situacaoTrabalho")?.addEventListener("change", toggleConditionalBlocks);
    document.getElementById("temFamiliaAustralia")?.addEventListener("change", toggleConditionalBlocks);
    document.getElementById("vistoNegadoAntes")?.addEventListener("change", toggleConditionalBlocks);
    document.getElementById("problemaSaudeRelevante")?.addEventListener("change", toggleConditionalBlocks);
    document.getElementById("antecedenteCriminal")?.addEventListener("change", toggleConditionalBlocks);
    document.getElementById("australiaVisaForm")?.addEventListener("submit", submitAustraliaForm);
    document.getElementById("restartFormButton")?.addEventListener("click", resetForm);
    toggleConditionalBlocks();
});
