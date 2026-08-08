# Especificação do produto essencial de currículo

**Status:** aprovado em 2026-08-08

## Objetivo

Permitir que candidatos brasileiros em geral criem um currículo profissional em poucos minutos, com orientação clara, privacidade local e PDF real de uma ou duas páginas.

## Decisões de produto

- Público principal: candidatos brasileiros em geral.
- Fluxo: wizard guiado com prévia contínua.
- Seções: dados pessoais, resumo, experiências, formação, habilidades, idiomas, certificações e projetos.
- Página: uma página por padrão e no máximo duas quando o conteúdo justificar.
- IA: fora do escopo. Sugestões são determinísticas e locais.
- Modelos: cinco estruturas com variações controladas de cor.
- Modelo inicial: clássico, otimizado para ATS.
- Persistência: somente no dispositivo, com autosave local, JSON para backup e exclusão explícita.
- Conta, backend, analytics e sincronização: fora do escopo.

## Fluxo

1. A tela inicial oferece começar em branco, continuar um rascunho local ou importar JSON.
2. A configuração permite ativar, desativar e reordenar seções e escolher a estrutura visual.
3. O wizard coleta uma seção por etapa, mostra progresso e mantém a prévia atualizada.
4. A revisão mostra problemas, número de páginas, indicação estrutural de ATS e ações finais.
5. O PDF só é habilitado com dados mínimos válidos, sem placeholders, links seguros e até duas páginas.

## Experiência responsiva

No desktop, o formulário fica à esquerda e a prévia fixa à direita. No mobile, o formulário ocupa a tela e a prévia abre em painel modal. Ações críticas têm alvos de toque de pelo menos 44 CSS px.

## Validação

Próximo, Concluir, timeline, rotas diretas, revisão e exportação usam o mesmo gate. Ao encontrar erro, o sistema seleciona o item inválido, move o foco ao primeiro campo, mostra mensagem associada e oferece resumo acessível com links.

## Persistência e privacidade

O autosave local informa sucesso somente após gravação confirmada e mostra falha acionável. O usuário pode exportar JSON, importar JSON validado e apagar todos os dados deste dispositivo com confirmação.

## PDF

O PDF usa A4, texto selecionável, fontes locais e uma das cinco estruturas. O modo padrão cabe em uma página; a segunda página é permitida quando necessária; a exportação é bloqueada acima de duas páginas. URLs são normalizadas antes de serem exibidas ou anotadas.

## Acessibilidade e qualidade

O produto busca WCAG 2.2 AA para contraste, foco, teclado, mensagens e diálogos. A CI deve executar testes puros, sintaxe, jornadas E2E em desktop e 320 CSS px, geração real de PDF e verificação pós-deploy.

## Fora do escopo

Integração de IA, Word, TXT, QR Code, conta, backend, sincronização entre dispositivos, analytics e novas seções além das oito definidas.

