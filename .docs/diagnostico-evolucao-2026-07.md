# Diagnostico e Proposta de Evolucao - Eu Gero Meu Curriculo

**Status:** proposta para revisao
**Data:** 2026-07-18
**Escopo:** desktop, mobile, conteudo profissional, compatibilidade com ATS, geracao de PDF e customizacao

Este documento nao segue o formato de spec de feature unica (`.docs/specs/_TEMPLATE.md`). E um diagnostico amplo que orienta a priorizacao do trabalho; cada item aprovado deve virar uma spec propria em `.docs/specs/` antes de qualquer implementacao, conforme `.rules/global.md`.

## Sintese executiva

O produto ja tem base conceitual solida (gratuito, sem cadastro, dados locais, previa em tempo real, multiplos modelos, avisos de ATS e privacidade). Os problemas identificados estao na implementacao de regras especificas, nao na proposta do produto:

1. Validacao pode ser ignorada pelo proprio fluxo.
2. Calculo de 1 ou 2 paginas e aproximado (por contagem de caracteres), nao mede o documento real.
3. Tipografia da impressao diverge da previa (9px/8px na tela vira ~14,5pt/12,9pt no print).
4. PDF pode incluir secoes vazias com skeletons de preenchimento.
5. Vinte modelos representam apenas cinco estruturas reais.
6. Avaliacao de qualidade pode ser manipulada com verbos/numeros sem melhorar o conteudo de fato.
7. Fluxo nao parte da vaga-alvo.
8. Mobile tem areas compactadas demais e acoes concorrentes.

Decisao principal: o site deixa de ser so um gerador visual e passa a ser um assistente de construcao de curriculo para uma vaga especifica, separando conteudo profissional, relevancia para a vaga, estrutura do documento, aparencia, compatibilidade com ATS e ajuste de paginas.

## Priorizacao

### P0 - corrigir antes de ampliar o produto
| Item | Motivo | Local no codigo |
|---|---|---|
| Bloquear avanco quando a validacao falhar | Evita revisao e PDF incompletos | `js/app.js` `nextStep()` |
| Corrigir navegacao duplicada (`btn-back-start`) | Elimina comportamento imprevisivel | `js/app.js` (dois listeners no mesmo id) |
| Remover skeletons do arquivo exportado | Evita PDF invalido ou amador | `js/preview.js` render de secao vazia |
| Medir paginas pelo DOM real | Resolve a duvida de 1 ou 2 paginas | `js/scoring.js` (`PAGE_CHAR_SOFT_LIMIT`/`HARD_LIMIT`) |
| Unificar tipografia entre previa e PDF | Garante previsibilidade | `css/style.css` / previa vs impressao |
| Aplicar limite minimo de legibilidade (10pt) | Evita curriculos comprimidos | idem acima |
| Corrigir progresso de preenchimento | Evita indicacao incorreta de conclusao | `js/scoring.js` `calculateProgress` |
| Testar impressao nos principais navegadores | Reduz diferencas de exportacao | manual/QA |

### P1 - melhorar resultado profissional
Etapa de cargo/vaga-alvo; modo compativel com ATS; datas estruturadas; revisao em quatro dimensoes (preenchimento, clareza, relevancia para a vaga, documento); assistente de ajuste de paginas; redesenho da home mobile; barra inferior simplificada; estrutura+tema separados nos templates; resumo/habilidades recomendados (nao obrigatorios).

### P2 - versatilidade
Perfil-base e versoes por vaga; exportacao DOCX/TXT; reordenacao de secoes; PT-BR e inglês nativos; comparacao entre versoes; portfolio/GitHub estruturados; QR Code so no modo visual; historico e restauracao.

## Regra de paginas (sintese)

Nao existe regra universal de 1 pagina. Uma pagina e preferencial quando o conteudo relevante cabe com boa legibilidade; duas paginas sao adequadas quando a trajetoria relevante justifica o espaco adicional. O sistema nao deve reduzir fonte indefinidamente, comprimir espacamento a ponto de prejudicar leitura, remover conteudo sem consentimento, nem afirmar que duas paginas reduzem as chances do candidato.

Guardrails minimos: texto principal >= 10pt (preferencial 10,5-11pt); titulos de secao 11,5-14pt; nome 18-24pt; entrelinha >= 1,2; margens >= 12mm.

## Principios editoriais de conteudo

O assistente orienta sem inventar numeros, exagerar responsabilidades, alterar cargos reais, criar experiencias, recomendar palavras-chave inexistentes ou afirmar que o curriculo "passara" em um ATS. Mensagem correta: a ferramenta ajuda a organizar e adaptar o curriculo, mas nao garante classificacao ou contratacao.

## Notas de escopo

O documento completo entregue pelo usuario cobre 16 areas (home, wizard desktop/mobile, revisao, dados pessoais, experiencia, habilidades, formacao, certificacoes, projetos, idiomas, modo ATS, modelos e customizacao, versoes por vaga, assistente de ajuste de espaco, paginacao tecnica CSS, arquitetura de estado com `schemaVersion`) e criterios de aceite gerais (funcionais, mobile, desktop, navegadores, cenarios de conteudo). O texto integral foi fornecido pelo usuario em 2026-07-18 e serve de referencia; consultar o autor do pedido caso o conteudo completo seja necessario para uma spec especifica, pois este resumo prioriza os itens P0 que serao trabalhados primeiro.

## Ordem de trabalho acordada

Seguir a fila P0.1 a P0.5 nesta ordem, cada item com spec propria em `.docs/specs/`, teste falhando antes do codigo (TDD) e micro-commits separados:

1. P0.1 - bloquear avanco com validacao falha
2. P0.2 - navegacao duplicada do botao voltar
3. P0.3 - remover skeletons do PDF exportado
4. P0.4 - medicao real de paginas (DOM) + unificacao de tipografia previa/PDF
5. P0.5 - corrigir calculo de progresso de preenchimento
