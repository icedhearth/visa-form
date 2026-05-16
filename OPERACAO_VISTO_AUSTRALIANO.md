# Operação - Visto Australiano (Checklist Prático)

## 1) Acesso ao formulário

1. Publicar os arquivos no host.
2. Abrir a rota:
   - `https://SEU-DOMINIO/australia`

## 2) Coleta com cliente (ordem recomendada)

1. Confirmar passaporte válido (número, emissão, validade e país emissor).
2. Coletar dados pessoais e contato.
3. Coletar plano de viagem (objetivo, chegada, duração, cidade/estado na Austrália, hospedagem).
4. Definir custeio financeiro e fundos disponíveis.
5. Definir situação de trabalho:
   - `Trabalha`
   - `Estuda e trabalha`
   - `Apenas estuda / não trabalha`
6. Preencher histórico migratório, saúde e caráter.
7. Revisar declaração final e confirmar aceite.

## 3) Gatilhos automáticos do formulário

1. `Outra nacionalidade = Sim`:
   - abre campo para segunda nacionalidade.
2. `Viaja acompanhado = Sim`:
   - abre campo para acompanhantes.
3. `Já esteve na Austrália = Sim`:
   - abre histórico de visto/entrada anterior.
4. `Quem custeia` diferente de `Eu mesmo(a)`:
   - abre dados de patrocinador.
5. `Situação de trabalho`:
   - `Trabalha` ou `Estuda e trabalha`: exige ocupação e empregador.
   - `Apenas estuda / não trabalha`: oculta e desconsidera bloco de trabalho.
6. `Familiar na Austrália = Sim`:
   - abre bloco de detalhes.
7. `Visto negado`, `Saúde relevante` ou `Antecedente criminal = Sim`:
   - abre blocos de detalhamento obrigatório.

## 4) Saída e envio

1. Ao enviar:
   - gera PDF local automaticamente;
   - tenta upload no Firebase Storage;
   - abre WhatsApp com resumo e link (quando upload estiver disponível).
2. Se o upload falhar:
   - operação não trava;
   - o PDF local ainda é gerado.

## 5) Conferência obrigatória antes de protocolar

1. Nome e passaporte exatamente como documento.
2. Objetivo, datas e hospedagem coerentes.
3. Custeio e fundos compatíveis com duração da viagem.
4. Bloco de trabalho correto para menores/estudantes.
5. Histórico de negativa/saúde/caráter sem campos pendentes.
6. Declaração final com nome, local, data e aceite.

## 6) Boas práticas para evitar retrabalho

1. Solicitar comprovantes em paralelo ao preenchimento:
   - passaporte;
   - comprovantes financeiros;
   - vínculo (trabalho/estudo);
   - histórico migratório (se houver).
2. Fazer revisão final em tela com o cliente antes de clicar em enviar.
3. Armazenar PDF e comprovantes no mesmo dossiê do cliente.
