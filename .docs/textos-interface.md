# Textos da interface — Eu Gero Meu Currículo

Todos os textos fixos da interface, sem incluir o conteúdo dos modelos de currículo
nem os dados de exemplo dos personagens. Organizados por tela e na ordem em que
aparecem no site.

> O arquivo de origem aparece entre parênteses para facilitar a aplicação no código.

---

## 1. Barra de navegação — `index.html`

- Logo: **Currículo**
- Subtítulo do logo: **por ClassificaVagas**
- Indicador de salvamento automático: **Rascunho salvo neste dispositivo**
- Texto do indicador ao salvar: **Salvo** (`app.js`)

---

## 2. Home (`/`) — `index.html`

### Introdução
- Selo: **Gratuito · Sem cadastro · Feito no seu navegador**
- Título: **Seu currículo pronto, sem complicação.**
- Subtítulo: **Preencha um campo de cada vez, com orientações simples. Inclua as experiências e atividades que fizerem sentido para você e crie um currículo claro e bem apresentado.**

### Cartão 1 — Criar do zero
- Selo: **Começar do zero**
- Título: **Criar meu currículo**
- Descrição: **Siga um passo a passo simples, com orientações em cada etapa.**
- Botão: **Começar agora**

### Cartão 2 — Continuar rascunho
- Selo: **Já tenho um rascunho**
- Título: **Continuar de onde parei**
- Descrição: **Carregue um rascunho salvo e continue a edição. Seus dados ficam no seu dispositivo.**
- Botão: **Carregar rascunho (.json)**

### Rodapé — “Como funciona?”
- Gatilho: **Como funciona?**
- Passo 1: **01 · Preencha com orientações.** Cada campo traz uma dica para ajudar você a escrever.
- Passo 2: **02 · Veja o resultado na hora.** O currículo é atualizado ao lado enquanto você preenche.
- Passo 3: **03 · Escolha o visual.** Compare os modelos, ajuste a página e baixe seu currículo.
- Privacidade: **Privacidade** — Os dados preenchidos no currículo permanecem neste dispositivo e não são enviados pelo site.

### Link de acessibilidade
- **Pular para o conteúdo**

---

## 3. Seleção de personagem (`/characters`) — `index.html` + `characters.js`

- Eyebrow: **Antes de começar**
- Título: **Escolha um ponto de partida**
- Subtítulo: **Use um exemplo pronto para entender como preencher ou comece com uma página em branco. Você poderá editar tudo depois.**

### Cartões de personagem

Cada cartão mostra: iniciais, selo (`tagline`), nome (`name`), papel (`role`) e botão **Escolher →**.

| id | iniciais | selo (tagline) | nome | papel (role) |
|---|---|---|---|---|
| blank | + | Página em branco | Em branco | Crie seu currículo do zero |
| sherlock | SH | Exemplo pronto | Sherlock Holmes | Análise, pesquisa e solução de problemas |
| mulan | HM | Exemplo pronto | Hua Mulan | Liderança, planejamento e trabalho em equipe |
| hercules | HC | Exemplo pronto | Hércules | Execução de projetos e resolução de desafios |
| chapeuzinho | CV | Exemplo pronto | Chapeuzinho Vermelho | Organização, comunicação e atendimento |

### Toasts ao escolher (`app.js`)
- Com exemplo: **Exemplo de {nome do personagem} carregado. Substitua o conteúdo pelas informações que se aplicam a você.**
- Em branco: **Página em branco pronta. Comece a montar seu currículo.**

---

## 4. Configuração inicial (`/start`) — `index.html`

### Coluna esquerda
- Eyebrow: **Antes de começar**
- Título: **Monte seu currículo do seu jeito**
- Subtítulo: **Escolha um modelo e marque as seções que deseja incluir. Você poderá alterar essas opções depois sem perder seus dados.**
- Rótulo da checklist: **Seções do currículo**
- Nota de rodapé: **Inclua somente as seções que fizerem sentido para você agora. É possível adicionar ou remover seções depois.**
- Botão: **Começar a preencher**
- Botão: **← Voltar**

### Checklist de seções (`app.js`)
- Seção sempre incluída: **Sempre incluída**
- Seção opcional: **Opcional**

### Coluna direita — Prévia
- Rótulo: **Prévia**
- Nome do modelo atual: **{nome do modelo}**
- Contador: **{n} de {total}**
- Seta anterior — `aria-label`: **Modelo anterior**
- Próxima seta — `aria-label`: **Próximo modelo**

---

## 5. Formulário passo a passo (`/wizard`) — `index.html` + `app.js`

### Cabeçalho
- Botão: **← Voltar à configuração**
- Título da etapa: **{nome curto da seção}**
- Contador: **Etapa {n} de {total}**
- Descrição da etapa: texto definido na configuração da seção

### Coluna direita — Prévia ao vivo
- Rótulo: **Prévia ao vivo**
- Seta anterior — `aria-label`: **Modelo anterior**
- Próxima seta — `aria-label`: **Próximo modelo**
- Botão mobile: **Ampliar prévia**

### Ações por etapa
- Botão: **Precisa de ideias? Peça ajuda a uma IA →**
- Botão: **Limpar esta seção**
- Botão para seções opcionais: **Remover esta seção**

### Barra inferior fixa
- Botão: **Anterior**
- Na primeira etapa: **Configuração**
- Botão: **Próximo**
- Na última etapa: **Revisar →**
- Botão: **Concluir ✓**
- Título auxiliar: **Ir direto para a revisão**
- Progresso: **{n}% preenchido**

### Dicas de preenchimento nos campos de texto (`app.js` — `textQuality`)
- Vazio: **Dica: comece descrevendo uma ação que você realizou.**
- Curto: **Continue: conte o que você fez e acrescente contexto ou resultado, se houver.**
- Sem verbo nem número: **Comece com um verbo de ação e deixe clara a sua participação.**
- Somente com número: **Bom começo. Explique qual foi a sua participação nesse resultado.**
- Somente com verbo: **Bom começo. Acrescente o contexto, o impacto ou o resultado, se tiver essa informação.**
- Verbo + número: **Ótimo! O texto deixa clara a sua participação e apresenta um resultado concreto.**
- E-mail com formato estranho: **Este e-mail parece incompleto. Confira o “@” e o final do endereço.**

### Campo de habilidades (`app.js`)
- Placeholder: **Digite uma habilidade…**
- Rótulo: **Sugestões para adicionar**
- Sugestões fixas: **Trabalho em equipe · Comunicação clara · Atendimento ao cliente · Organização · Pacote Office · Iniciativa · Resolução de problemas · Liderança · Gestão do tempo · Vendas**

### Data — mês e ano (`app.js`)
- Opção vazia do mês: **Mês**
- Opção vazia do ano: **Ano**
- Checkbox: **Até hoje**
- Meses abreviados: **Jan, Fev, Mar, Abr, Mai, Jun, Jul, Ago, Set, Out, Nov, Dez**

### Listas de itens (`app.js`)
- Botão genérico: **+ Adicionar {tipo}**
- Tipos: **Experiência, Formação, Idioma, Certificação, Projeto**
- Numeração do cartão: **{Tipo} 01**, **{Tipo} 02**...
- Botão: **Remover**
- Botão compacto de idiomas: **×**
- Título e `aria-label`: **Remover idioma**
- Aba de item — `aria-label`: **{Tipo} {n}**
- Botão de nova aba — `title`: **Adicionar {tipo}**

### Toasts do formulário
- Ao limpar uma seção: **Seção “{nome curto}” limpa.**
- Ao remover uma seção: **Seção “{nome curto}” removida do currículo.**
- Ao remover um item: **Item removido.**
- Ação do toast: **Desfazer**
- Ao desfazer: **Item restaurado.**
- Erro de validação: **Revise os campos destacados antes de continuar.**
- Ao trocar de modelo: **Modelo alterado para {nome do modelo}.**

### Menu mobile (`index.html`)
- Título: **Opções**
- Botão: **Trocar modelo**
- Botão: **Salvar rascunho**
- Botão: **Carregar rascunho**
- Botão: **Pedir ajuda à IA**

---

## 6. Revisão (`/review`) — `index.html` + `app.js`

- Eyebrow: **Revisão**
- Título: **Quase pronto: revise e escolha o visual**

### Painel de preenchimento (`app.js` — `renderReview`)

- Texto de apoio: **Esta análise considera apenas o preenchimento do currículo. Ela não avalia seu perfil nem garante resultados em processos seletivos.**
- Rótulo do selo: **Nível de preenchimento**
- Abaixo de 55%: **Em andamento** — *Algumas seções ainda podem ser preenchidas ou revisadas.*
- De 55% a 79%: **Bem preenchido** — *O currículo está organizado. Revise os pontos indicados antes de finalizar.*
- A partir de 80%: **Muito bem preenchido** — *As principais seções estão preenchidas. Faça uma última revisão antes de enviar.*
- Rótulo da lista: **Preenchimento por seção**
- Selos por seção: **Bem preenchida** / **Parcialmente preenchida** / **Pouco preenchida** / **Sem conteúdo**

### Galeria de modelos
- Instrução: **Escolha um modelo. Use as setas para ver as opções.**
- Seta anterior — `aria-label`: **Modelo anterior**
- Próxima seta — `aria-label`: **Próximo modelo**
- Nome e contador: **{nome do modelo} · {n} de {total}**
- Selo de formato favorável: **Favorável a ATS**
- Selo de atenção: **Pode exigir atenção no ATS**

### Ações finais
- Botão: **Voltar a editar**
- Botão: **Salvar rascunho (.json)**
- Botão: **Ver guia do LinkedIn**
- Botão: **Baixar currículo em PDF**

### Ao exportar PDF (`app.js` — `printCv`)
- Toast: **Na janela de impressão, selecione “Salvar como PDF”.**

### Ao salvar rascunho
- Toast: **Rascunho salvo em arquivo.**

### Ao importar rascunho
- Erro de extensão: **Selecione um arquivo .json válido.**
- Sucesso: **Rascunho carregado com sucesso.**
- Arquivo corrompido: **Este arquivo está corrompido ou não é válido. Tente outro.**
- Formato não reconhecido: **Arquivo inválido: formato não reconhecido.**
- Dados pessoais ausentes: **Arquivo inválido: faltam os dados pessoais.**
- Versão incorreta: **Arquivo inválido: versão não compatível.**

---

## 7. Seções do currículo — `config.js`

### 7.1 Dados pessoais
- Descrição: **Comece pelas informações usadas para identificar seu currículo e entrar em contato com você.**
- **Nome para o currículo** — placeholder: *Digite o nome que deseja usar* — dica: *Use o nome pelo qual deseja ser apresentado. Não inclua números de documentos.*
- **Cargo ou área desejada** — placeholder: *Informe o cargo ou a área que busca* — dica: *Informe o cargo ou a área em que deseja trabalhar.*
- **E-mail** — placeholder: *Digite seu e-mail* — dica: *Use um e-mail que você acessa com frequência.*
- **Telefone** — placeholder: *Digite seu telefone com DDD* — dica: *Inclua o DDD e um número em que possa receber ligações ou mensagens.*
- **Cidade** — placeholder: *Digite sua cidade e estado* — dica: *Informe apenas a cidade e o estado. Não é necessário incluir o endereço completo.*
- **LinkedIn (opcional)** — placeholder: *Cole o link do seu perfil* — dica: *Adicione o endereço do seu perfil, caso queira incluí-lo.*

### 7.2 Resumo
- Descrição: **Escreva duas ou três frases sobre suas experiências, habilidades e o tipo de oportunidade que busca.**
- **Um parágrafo curto sobre você** — placeholder: *Escreva um breve resumo sobre seu perfil* — dica: *Fale sobre suas habilidades, experiências e seu objetivo de trabalho. Seja breve e direto.*

### 7.3 Experiência
- Descrição: **Conte onde realizou suas atividades e o que fazia. Inclua efeitos ou resultados quando essa informação existir. Trabalhos formais, informais, por conta própria ou voluntários também podem ser incluídos.**
- **Cargo ou função** — placeholder: *Informe seu cargo ou função* — dica: *Informe o nome da função que você exercia.*
- **Empresa, organização ou projeto** — placeholder: *Informe onde realizou essa atividade* — dica: *Informe o nome da empresa, organização ou projeto. Se foi por conta própria, escreva “Trabalho independente”.*
- **Período** — placeholder: *Mês e ano de início e fim* — dica: *Informe quando começou e quando terminou. Marque “Até hoje” se ainda trabalha no local.*
- **Atividades e resultados** — placeholder: *Descreva o que você fez* — dica: *Explique sua participação. Inclua efeitos, resultados ou números apenas quando essa informação existir e fizer sentido.*

### 7.4 Formação
- Descrição: **Inclua formações, cursos, oficinas ou outras atividades de aprendizagem relevantes. Comece pelo item mais recente.**
- **Curso ou formação** — placeholder: *Digite o nome da formação* — dica: *Informe o nome do curso, da formação ou da atividade de aprendizagem.*
- **Instituição** — placeholder: *Nome da instituição* — dica: *Informe o nome da escola, faculdade, plataforma ou instituição.*
- **Período** — placeholder: *Ano de conclusão ou período cursado* — dica: *Informe o ano de conclusão ou o período em que estudou.*

### 7.5 Habilidades
- Descrição: **Liste conhecimentos e formas de trabalhar que sejam relevantes para a oportunidade desejada.**
- **Digite uma habilidade** — placeholder: *Digite uma habilidade…* — dica: *Digite e confirme para adicionar. Inclua conhecimentos técnicos e habilidades de organização, colaboração ou atendimento que sejam relevantes.*

### 7.6 Idiomas
- Descrição: **Informe os idiomas que conhece e seu nível em cada um.**
- **Idioma** — placeholder: *Digite o idioma* — dica: *Inclua os idiomas que deseja apresentar e escolha o nível que melhor representa seu uso atual.*
- **Nível** — opções: **Básico, Intermediário, Avançado, Fluente**

### 7.7 Certificações
- Descrição: **Inclua cursos, certificações e treinamentos que você concluiu. Cursos online também contam.**
- **Nome do curso ou certificação** — placeholder: *Nome do curso ou da certificação* — dica: *Informe o nome do curso, treinamento ou certificação.*
- **Instituição** — placeholder: *Instituição responsável* — dica: *Informe o nome da instituição ou plataforma responsável pelo curso.*
- **Ano** — placeholder: *Ano de conclusão* — dica: *Informe o ano em que concluiu.*

### 7.8 Projetos
- Descrição: **Inclua projetos de estudo, da comunidade, do trabalho ou feitos por iniciativa própria.**
- **Nome do projeto** — placeholder: *Nome do projeto ou da iniciativa* — dica: *Informe o nome do projeto ou da iniciativa.*
- **Sua participação** — placeholder: *Descreva o que você fez no projeto* — dica: *Explique sua participação. Inclua efeitos, resultados ou números apenas quando essa informação existir e fizer sentido.*
- **Link (opcional)** — placeholder: *Link para o projeto* — dica: *Adicione um link para o projeto, caso ele possa ser visto online.*

### 7.9 Nota abaixo da checklist
- **Inclua somente as seções que fizerem sentido para você agora. É possível adicionar ou remover seções depois.**

---

## 8. Controles de página — `app.js`

- Rótulo: **Margens**
- Opções: **Estreitas, Padrão, Confortáveis**
- Rótulo: **Espaçamento**
- Opções: **Normal, Condensado**

---

## 9. Catálogo de modelos — `config.js`

| Modelo | Descrição |
|---|---|
| Clássico | Limpo, discreto e profissional |
| Minimalista | Simples, leve e alinhado à esquerda |
| Serifado | Tradicional, com letras serifadas |
| Elegante | Centralizado, leve e bem espaçado |
| Linha | Títulos com linhas finas e visual discreto |
| Pilar | Títulos com uma barra lateral de destaque |
| Grafite | Tons de grafite e títulos mais marcantes |
| Esmeralda | Centralizado, com detalhes em verde-esmeralda |
| Petróleo | Barra lateral em azul-petróleo |
| Marinho | Faixa superior em azul-marinho |
| Bordô | Centralizado, com tom bordô e estilo tradicional |
| Âmbar | Alinhado à esquerda, com detalhes em âmbar |
| Oliva | Barra lateral em verde-oliva |
| Moderno | Barra lateral clara, com detalhes em azul |
| Executivo | Faixa superior escura e visual formal |
| Carvão | Faixa superior em preto-carvão |
| Faixa Clara | Faixa superior suave em azul-claro |
| Violeta | Centralizado, com detalhes em violeta |
| Criativo | Coluna única, com selo de iniciais |
| Rosado | Selo de iniciais em tom rosé, indicado para portfólios |

### Selos e avisos de ATS

- Texto de apoio: **ATS são sistemas usados por algumas empresas para organizar candidaturas. A leitura pode variar entre plataformas.**
- Formato favorável: **Favorável a ATS**
- Requer atenção: **Pode exigir atenção no ATS**
- Modelos com barra lateral: **Alguns sistemas ATS podem ler melhor currículos com uma única coluna. A leitura varia conforme o sistema.**
- Modelos com selo: **Alguns sistemas ATS podem ter dificuldade com elementos gráficos no topo. A leitura varia conforme o sistema.**
- Nota no modal para modelos favoráveis: **Formato favorável a ATS**

> Recomenda-se revisar a configuração do modelo **Marinho**. Se ele usa apenas uma faixa superior e mantém o conteúdo em uma única coluna, pode continuar marcado como formato favorável a ATS.

### Modal de troca de modelo
- Título: **Trocar modelo**

---

## 10. Guia do LinkedIn (`/guide`) — `index.html` + `linkedin-guide.js`

- Eyebrow: **Depois do currículo**
- Título: **Leve o mesmo cuidado para o LinkedIn**
- Subtítulo: **O LinkedIn pode complementar seu currículo. Use estas orientações para manter as informações claras e consistentes nos dois lugares.**
- Botão: **← Voltar à revisão**
- Botão: **Traduzir para o inglês com IA**

### Cartões do guia

Cada cartão tem número, título, botão **Copiar**, rótulo **Onde** e rótulo **Dica**.

1. **Foto e capa**
   - Onde: *Seu perfil → selecione a foto → Adicionar foto*
   - Dica: *A foto e a capa são opcionais. Caso use uma foto, escolha uma imagem nítida. Não é necessário usar roupa formal nem um cenário profissional. A capa pode ter uma imagem simples relacionada à sua área.*
2. **Título do perfil**
   - Onde: *Seu perfil → lápis (✎) no topo → campo “Título”*
   - Dica: *Além do cargo, você pode informar sua área ou o tipo de oportunidade que busca.*
3. **Sobre**
   - Onde: *Seu perfil → seção “Sobre” → lápis (✎)*
   - Dica: *Escreva em primeira pessoa e fale brevemente sobre suas experiências, habilidades e o que busca.*
4. **Experiência**
   - Onde: *Seu perfil → seção “Experiência” → botão + → Adicionar cargo*
   - Dica: *Use o espaço para explicar melhor suas atividades, seus resultados e o que aprendeu.*
5. **Formação**
   - Onde: *Seu perfil → seção “Formação acadêmica” → botão +*
   - Dica: *Inclua também cursos técnicos e outras formações importantes para sua área.*
6. **Competências**
   - Onde: *Seu perfil → seção “Competências” → botão +*
   - Dica: *Destaque até três competências relevantes. Você pode pedir validações a pessoas que conhecem suas atividades.*
7. **Idiomas**
   - Onde: *Seu perfil → “Adicionar seção do perfil” → Idiomas*
   - Dica: *Escolha o nível que melhor representa seu uso atual do idioma.*
8. **URL personalizada**
   - Onde: *Seu perfil → “Editar perfil público e URL”*
   - Dica: *Uma URL curta e personalizada é mais fácil de ler e fica melhor no currículo.*
9. **Recomendações**
   - Onde: *Perfil de um contato → botão “Mais” → Solicitar recomendação*
   - Dica: *Peça uma recomendação a alguém que tenha acompanhado suas atividades em trabalho, estudo, projetos ou ações voluntárias.*

### Feedback de cópia
- **Copiado.**

---

## 11. Modal: ajuda de uma IA — `index.html` + `prompts.js`

- Título: **Peça ajuda a uma IA**
- Aviso: **Esta ferramenta não possui uma IA integrada e não envia seus dados por conta própria. O texto só é compartilhado quando você o copia e cola em outra ferramenta.**
- Checkbox: **Incluir meus dados no prompt**
- Aviso de privacidade: **Atenção: o prompt pode incluir dados pessoais, como e-mail e telefone. Antes de copiar, revise e remova o que não deseja compartilhar. Consulte também as regras de privacidade da ferramenta escolhida.**
- Botão: **Copiar prompt**

### Toasts
- Sucesso: **Prompt copiado.**
- Falha: **Não foi possível copiar. Selecione o texto e copie manualmente.**

### Textos-base dos prompts (`prompts.js`)

#### Introdução geral

> Atue como especialista em recrutamento e melhoria de currículos para o mercado brasileiro.
>
> Ajude a revisar e melhorar meu currículo e meu perfil no LinkedIn.
>
> Siga estas orientações:
> - use verbos de ação em português;
> - inclua números e resultados apenas quando houver informações suficientes;
> - escreva de forma clara, curta e profissional;
> - adapte o conteúdo ao cargo ou à área de interesse;
> - organize a resposta pelas seções do currículo;
> - não invente experiências, resultados ou qualificações;
> - use linguagem respeitosa e inclusiva;
> - avalie somente informações relacionadas à oportunidade e não faça suposições sobre gênero, identidade de gênero, idade, raça ou cor, origem, religião, deficiência, aparência, orientação sexual, estado civil, situação familiar ou outras características pessoais.

#### Introdução de tradução

> Traduza meu currículo do português para um inglês profissional e natural.
>
> Mantenha a organização por seções, adapte os termos técnicos e preserve os nomes de empresas e instituições.
>
> Use verbos de ação adequados ao contexto e não acrescente informações que não estejam no texto original. Quando o idioma permitir, não presuma gênero nem outras características pessoais que não tenham sido informadas.
>
> Apresente a tradução seção por seção.

#### Instruções por seção

- Dados pessoais: *Revise os dados que escolhi incluir no currículo e no LinkedIn. Sugira um título profissional claro, uma forma simples de apresentar os contatos e melhorias para a URL do LinkedIn. Não sugira informações pessoais que não sejam necessárias.*
- Resumo: *Ajude a escrever um resumo profissional curto, com duas ou três frases, destacando experiência, habilidades e objetivo. Não invente informações.*
- Experiência: *Ajude a melhorar as descrições das minhas experiências. Use verbos de ação, deixe claras as responsabilidades e inclua resultados apenas quando houver dados suficientes.*
- Formação: *Ajude a organizar minha formação, incluindo curso, instituição, período e outras informações relevantes que eu já tenha fornecido.*
- Habilidades: *Sugira habilidades técnicas e formas de trabalhar coerentes com as informações fornecidas e com o cargo ou a área de interesse. Separe o que já está confirmado do que preciso validar.*
- Idiomas: *Ajude a apresentar meus idiomas e níveis de forma clara e adequada ao currículo e ao LinkedIn.*
- Certificações: *Ajude a organizar minhas certificações e meus cursos, com nome, instituição e ano de conclusão.*
- Projetos: *Ajude a descrever meus projetos, destacando objetivo, participação, tecnologias e resultados já informados.*

#### Frase-guia para prompts de seção

> Estou preenchendo a seção “{nome da seção}” do meu currículo.
>
> {instrução da seção}
>
> Revise o conteúdo para deixá-lo claro, curto e profissional. Use verbos de ação e destaque resultados quando houver dados suficientes e isso fizer sentido. Não invente informações. Evite estereótipos, termos discriminatórios e suposições sobre características pessoais. Caso falte algo importante, faça perguntas objetivas antes de sugerir a versão final. Apresente textos prontos para copiar e colar.

---

## 12. Prévia mobile — `index.html`

- Botão flutuante: **Ver prévia**
- Título do overlay: **Prévia do currículo**
- Fechar — `aria-label`: **Fechar prévia**

---

## 13. Toasts gerais — `app.js`

- Ao trocar de modelo: **Modelo alterado para {nome}.**
- Ao salvar automaticamente: **Salvo**
- Erros diversos: usar mensagens específicas, curtas e com orientação para corrigir o problema.

---

## 14. Acessibilidade e rótulos técnicos

- **Pular para o conteúdo**
- **Fechar**
- **Fechar prévia**
- **Modelo anterior**
- **Próximo modelo**
- **Ver prévia do currículo**
- **Prévia do currículo**
- **Etapa {n}: {nome da seção}**
- **Ver dica do campo**
- **Remover {nome da habilidade}**
---

## 15. Observações da auditoria — não exibir na interface

- A pontuação da revisão deve representar somente o nível de preenchimento. Ela não deve ser apresentada como avaliação da pessoa candidata ou como previsão de contratação.
- A opção **Nativo** foi removida dos níveis de idioma para evitar inferências sobre nacionalidade, origem ou identidade.
- A foto do LinkedIn foi tratada como opcional, sem recomendações sobre aparência, idade, gênero, roupa ou padrão estético.
- Os avisos sobre ATS usam **favorável** em vez de **compatível**, pois nenhum modelo pode garantir a leitura correta em todos os sistemas.
- Resultados e números devem ser sugeridos apenas quando existirem e fizerem sentido para a atividade. A ausência de métricas não deve reduzir automaticamente a avaliação do texto.
- Dados como endereço completo, documentos, estado civil, idade, foto, gênero e outras informações pessoais não devem ser solicitados como requisito do currículo.
- Sempre que possível, ações como “clicar”, “tocar” ou “pressionar Enter” devem ter alternativas acessíveis por teclado, toque e tecnologias assistivas.
