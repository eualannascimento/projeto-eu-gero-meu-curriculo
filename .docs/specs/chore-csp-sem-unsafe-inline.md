# CSP sem 'unsafe-inline' no style-src

**Status:** Aprovado
**Data:** 2026-07-26

## 1. Resumo e Objetivo

A CSP do gerador declarava `style-src 'self' 'unsafe-inline'` porque a interface tinha 163 atributos `style=`, 100 no `index.html` e 63 montados em JavaScript. Enquanto o `unsafe-inline` estiver ligado, a diretiva `style-src` nao defende de praticamente nada: qualquer marcacao injetada pode trazer estilo junto. Esta entrega move todo estilo inline para CSS e fecha a diretiva.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como dono do produto, quero que a CSP do gerador nao aceite estilo inline, para que uma injecao de marcacao nao consiga alterar a aparencia da pagina (sobreposicao falsa, campo escondido, botao disfarcado).
* **US02:** Como candidato, quero que nenhuma tela mude de aparencia por causa desta mudanca, porque ela e tecnica e nao de produto.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)

* **Regra 01:** Uma classe por conjunto de declaracoes, sem heranca entre elas. A primeira tentativa usou classe base com variante e, onde a variante era SUBCONJUNTO da base, o elemento passou a receber declaracao que nao tinha.
* **Regra 02:** `css/screens.css` entra depois de `print-preview.css` e antes de `responsive.css`. Fora dessa posicao, regras de componente que ja existiam vencem as novas por ordem, e as telas de revisao e guia perdem o estilo.
* **Regra 03:** Valor calculado em tempo de execucao (cor de destaque da miniatura, cor do avatar, largura da barra de progresso) sai do markup para um `data-*` e e aplicado por `elemento.style` depois da insercao. A CSP barra o ATRIBUTO `style`, inclusive vindo de `innerHTML`, e nao barra `elemento.style`.
* **Regra 04:** Onde a parte dinamica ja tinha classe correspondente no elemento (linha do checklist de secoes: ativa e obrigatoria), ela vira regra de CSS em vez de `data-*`.
* **Falha 01:** A previa nao pode receber a regra por classe: `preview.js` e `review.js` reescrevem o `className` inteiro a cada redesenho. A ancora e o atributo `data-preview` e o id, que sobrevivem.
* **Limite 01:** A equivalencia foi medida nas quatro telas em 1.280 px de largura. Regras de `responsive.css` continuam depois no arquivo, entao a ordem no celular nao muda.

## 4. Estrutura de Dados e Componentes

* **Criado:** `css/screens.css` (111 regras).
* **Alterado:** `index.html` (100 atributos, mais a ordem das folhas e a diretiva), `js/screens/start.js`, `js/screens/wizard.js`, `js/screens/review.js`, `js/linkedin-guide.js`.
* **Sem alteracao:** os 20 modelos de curriculo. O estilo do documento vive em `templates.css` e nao passava por atributo.

## 5. Criterios de Aceite (verificaveis por teste)

* [x] CA01: Dado o `index.html` e todo o JS, quando forem lidos, entao nao existe nenhum atributo `style=`.
* [x] CA02: Dada a CSP da pagina, quando for lida, entao `style-src` e `'self'` sem `'unsafe-inline'`.
* [x] CA03: Dadas as quatro telas, quando o estilo computado de todos os elementos for comparado antes e depois, entao a diferenca e zero. Medido: 1.883 elementos, 30 propriedades cada, 0 diferencas.
* [x] CA04: Dadas as quatro telas em uso, quando o console for lido, entao nao ha nenhuma violacao de CSP.

## 6. Fora de Escopo

* Fechar `script-src` alem do que ja esta (`'self'`).
* `frame-ancestors`, que via `<meta>` nao e aplicado pelo navegador e depende de cabecalho HTTP, indisponivel no GitHub Pages.
* Remover o seletor de modelos em grade (`cardHtml` e `getThumbMarkup` em `start.js`), que ficou sem uso quando a escolha virou galeria com anterior e proximo: `#template-grid-start` nao existe mais no HTML. O codigo foi migrado junto para nao deixar estilo inline para tras, mas a remocao e decisao separada.
