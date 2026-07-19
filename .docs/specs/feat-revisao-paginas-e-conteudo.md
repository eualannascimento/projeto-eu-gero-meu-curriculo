# Revisão de páginas e conteúdo

**Status:** Concluído  
**Data:** 2026-07-19

## Objetivo

Trocar a regra rígida de currículo em uma página por uma recomendação editorial. O produto deve orientar quando o conteúdo cabe em uma página, quando está denso e quando duas páginas são uma opção apropriada. A revisão deve explicar as escolhas e checar pontos básicos antes do PDF.

## Requisitos

- O ajuste de páginas tem dois modos: `compact` e `detailed`. O padrão é `compact`.
- Em `compact`, o alerta de excesso recomenda reduzir conteúdo ou trocar para o modo detalhado. Não reduz fonte nem margens automaticamente.
- Em `detailed`, o mesmo excesso deixa de limitar a pontuação geral por caber em duas páginas. Excesso extremo continua com alerta editorial.
- O estado do currículo persiste o modo de páginas em `pageMode`.
- A revisão mostra uma seção "Extensão do currículo" com uma mensagem coerente com modo e volume.
- A revisão mostra uma lista de checagem com contatos, links, aderência a ATS, conteúdo e extensão.
- As dicas de resumo, experiência e habilidades devem indicar conteúdo específico, verdadeiro e relacionado à vaga.
- No celular, o botão de prévia exibe o estado de extensão atual.

## Critérios de aceite

- Um currículo denso no modo `compact` retorna `warning` ou `overflow` e recomenda revisão para uma página.
- O mesmo currículo no modo `detailed` não sofre o teto de 45% apenas por ultrapassar uma página.
- Um currículo com volume extremo mantém alerta mesmo no modo `detailed`.
- O modo de páginas é salvo e restaurado com o rascunho.
- A revisão apresenta checagem de contato, ATS, conteúdo e páginas.

## Fora de escopo

- Alterar fonte, margem ou espaçamento automaticamente.
- Classificar a adequação de um currículo a uma vaga sem dados da vaga.
- Exportação DOCX.
