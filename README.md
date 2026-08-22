# Tesouro Tracker

Acompanha títulos do **Tesouro Direto** a partir de fontes públicas e gratuitas.
PWA em React + Vite, instalável no celular, usável em qualquer navegador.

**Escopo: as três famílias clássicas do Tesouro Direto** — Tesouro IPCA+
(NTN-B, com e sem cupom), Tesouro Prefixado (LTN e NTN-F) e Tesouro Selic
(LFT) — com taxa, preço unitário e **duration** por vencimento, as curvas de
juros (real e nominal), as decisões de política monetária do Copom, do Fed e do
BCE, câmbio PTAX, CDI × Selic e manchetes de mercado por região.
(Tesouro RendA+ e Educa+ ficam fora: amortização mensal pede outra régua.)

Irmão do ETF Tracker, do Cana & Etanol Tracker, do Soja Tracker e do Café
Tracker — mesma arquitetura, mesma disciplina de fontes.

**Voz do design:** "caderneta do Tesouro" — azul-tinta profundo, um acento
azul-centáurea, todo número em monoespaçada tabular.

---

## A ponte: dados legíveis por máquina

Este é o motivo principal do repositório existir. O arquivo oficial do Tesouro
tem dezenas de MB e cresce todo dia — grande demais para muitas ferramentas
baixarem, e atrás de um domínio que nem sempre é alcançável. Um job agendado
lê esse arquivo uma vez por dia e destila o resultado em **dois arquivos
pequenos, versionados neste repositório**:

| Arquivo | Para quê |
|---|---|
| [`dados/painel.json`](dados/painel.json) | **o retrato da aba Painel**: destaques + moldura macro — comece por aqui |
| [`dados/painel.md`](dados/painel.md) | o mesmo, em tabela |
| [`dados/ntnb.json`](dados/ntnb.json) | NTN-B: retrato do dia com duration — consumo por máquina |
| [`dados/ntnb.md`](dados/ntnb.md) | o mesmo retrato em tabela — leitura humana |
| [`dados/prefixado.json`](dados/prefixado.json) | LTN e NTN-F: taxas **nominais**, com duration |
| [`dados/selic.json`](dados/selic.json) | LFT: ágio/deságio sobre a Selic (sem duration, por construção) |
| [`dados/global.json`](dados/global.json) | Fed e BCE: taxa vigente e última decisão |
| [`dados/historico.json`](dados/historico.json) | a série diária por vencimento, todas as famílias — o que o app usa |

O `ntnb.json` mantém o formato de sempre: cada família nova ganhou um arquivo
**irmão**, nunca uma mudança no que já era consumido.

Como o repositório é público, eles ficam legíveis **sem token nenhum**:

```
https://raw.githubusercontent.com/daniloguaitoli-svg/Tesouro-Tracker/main/dados/ntnb.json
https://raw.githubusercontent.com/daniloguaitoli-svg/Tesouro-Tracker/main/dados/ntnb.md
https://raw.githubusercontent.com/daniloguaitoli-svg/Tesouro-Tracker/main/dados/historico.json
```

> O trecho depois do nome do repositório é a **branch padrão**. As URLs acima
> supõem que ela se chame `main`. Se a padrão tiver outro nome, troque `main`
> por ele — ou renomeie a branch padrão para `main` (página *Branches* do
> repositório, ícone de lápis) e as URLs acima passam a valer como estão. O
> coletor não depende disso: ele grava na branch padrão, qualquer que seja o
> nome dela.

Formato de `ntnb.json` (um objeto por vencimento, dentro de `titulos`):

```json
{
  "slug": "ipca-juros-2032-08-15",
  "nome": "Tesouro IPCA+ 2032 (juros semestrais)",
  "vencimento": "2032-08-15",
  "comCupom": true,
  "destaque": true,
  "data": "2026-08-20",
  "taxa": 7.05, "taxaCompra": 7.05, "taxaVenda": 7.11,
  "pu": 4312.45, "puCompra": 4312.45, "puVenda": 4298.10,
  "duration": {
    "macaulayAnos": 5.128, "modificada": 4.841, "convexidade": 30.364,
    "variacaoPrecoMais1pp": -4.69, "variacaoPrecoMenos1pp": 4.99
  }
}
```

Números com **ponto decimal** e datas em **ISO** — é um arquivo de intercâmbio,
não uma tela. As taxas são **reais** (ao ano, acima do IPCA).

---

## Fontes

| Fonte | O que dá | Como |
|---|---|---|
| **Tesouro Transparente** | preço e taxa de compra e venda, por título e por dia, desde 2002 | CSV público, sem chave — lido pelo job agendado |
| **Banco Central (SGS)** | IPCA, Selic meta, CDI, PTAX USD e EUR — e a última decisão do Copom, derivada da série da meta | API pública, sem chave |
| **FRED (St. Louis Fed)** | meta dos Fed Funds (teto e piso) e a data de vigência da última decisão | CSV público `fredgraph.csv`, sem chave — lido pelo job agendado |
| **ECB Data Portal** | taxas de depósito e de refinanciamento do BCE | API pública em CSV, sem chave — lido pelo job agendado |
| **Google News (RSS)** | manchetes de mercado (Brasil, EUA, Europa), com link para a fonte original | RSS público, sem chave — melhor esforço |
| **Yahoo Finance** | Ibovespa (`^BVSP`), fechamento diário | endpoint público de gráficos, sem chave — melhor esforço |
| **ANBIMA** (mercado secundário) | taxa indicativa e bid/ask do secundário | arquivo diário público — enriquecimento, nunca requisito |

**Nenhuma chave de API é necessária.** Todas as fontes são gratuitas e abertas.

Duas variáveis opcionais, nenhuma delas segredo:

| Variável | Onde | Efeito |
|---|---|---|
| `TESOURO_DESDE` | coletor | data inicial da série (padrão `2019-01-01`) |
| `ANBIMA_MS_URL` | coletor | molde da URL do arquivo do secundário, com `{ddmmyy}` |

### Sobre a API do ANBIMA Feed

O `mercado-secundario-TPF` com OAuth2 (`client_credentials`) **não** é usado
aqui, e é uma decisão consciente: o ANBIMA Feed é um produto **contratado**,
gratuito apenas para associados da ANBIMA — não há `client_id`/`client_secret`
self-service para pessoa física. Este repositório é sem segredos por princípio,
como os irmãos. A via pública entrega o essencial (taxa indicativa, compra e
venda por título). Se um dia houver credencial, o lugar de plugar é
`server/providers/anbima.js` — a interface para o datalayer não muda.

> **Estado real da fonte ANBIMA (conferido em 21/08/2026):** o caminho histórico
> `/informacoes/merc-sec/arqs/ms{ddmmyy}.txt` responde **404**. As ferramentas de
> títulos públicos da ANBIMA migraram para a plataforma **ANBIMA Data**
> (`data.anbima.com.br`), e o arquivo diário antigo saiu do ar nesse formato.
>
> **Nenhuma URL nova foi chutada no lugar.** Em vez disso, o endereço é
> configurável: defina `ANBIMA_MS_URL` (com o marcador `{ddmmyy}`) no workflow
> quando souber o caminho certo, e o provider passa a funcionar sem mudança de
> código. O parser é tolerante — detecta separador, acha colunas por regex no
> cabeçalho e **devolve uma amostra do arquivo em vez de inventar número** —
> então uma execução basta para confirmar o formato de qualquer URL nova.
>
> **O app funciona inteiro sem essa fonte:** ela é enriquecimento (a taxa
> indicativa do secundário), nunca requisito.

---

## Consumindo estes dados de fora

Se outra ferramenta (um assistente, um script) precisa destes números todo dia,
o arquivo por onde começar é **`dados/painel.json`** — pequeno, sem chave, com
os títulos em destaque e a moldura macro num objeto só.

As instruções prontas para colar no projeto que vai consumir estão em
[`INSTRUCOES-ASSISTENTE.md`](INSTRUCOES-ASSISTENTE.md): o que cada campo
significa, quando o arquivo muda, e o que **não** concluir dele.

## Escolhendo o que aparece no Painel

A seção **Acompanhados de perto** mostra os vencimentos que *você* escolher: na
aba **Títulos**, toque na estrela (☆) de cada um. A escolha fica guardada só
naquele aparelho (`localStorage`) — nada disso sobe para o repositório, que é
público. Numa instalação nova, o Painel nasce com os vencimentos marcados no
catálogo, para não abrir vazio; a partir da primeira estrela, quem manda é você.

O aviso de "cotações desatualizadas" e o ⭐ da aba Curva seguem a mesma escolha.
Já o ⭐ do arquivo `dados/ntnb.json` continua vindo do catálogo — aquele arquivo
é público e não carrega preferência pessoal.

## Duration: por que ela está aqui

Duas NTN-B com a mesma taxa não são o mesmo investimento. A **duration** é o
prazo médio ponderado dos fluxos — e a régua de sensibilidade a juros:

- **Tesouro IPCA+** (sem cupom) — pagamento único no vencimento, então a
  duration **é igual ao prazo**. É o formato mais sensível a juros.
- **Tesouro IPCA+ com Juros Semestrais** — cupom de 6% a.a. em duas parcelas
  (15/02 e 15/08, ou 15/05 e 15/11, conforme o vencimento). Parte do dinheiro
  volta antes, então a duration é **bem menor que o prazo**.

O app mostra a duration de Macaulay (anos), a modificada (variação % do preço
por ponto percentual de taxa) e o efeito concreto de ±1 p.p., já com o termo de
convexidade — que é o que torna a subida e a descida assimétricas.

A tela **Calculadora** aplica isso a um valor: quanto uma mudança de taxa tira
(ou põe) na posição hoje, e o que ela entrega até o vencimento.

---

## Comandos

```bash
npm install
npm run dev         # Vite + a API de desenvolvimento; host exposto na LAN
npm run build       # build de produção
npm run verificar   # carrega server/ e confere os invariantes
npm run preview

node .github/scripts/coletar-tesouro.mjs --dry-run   # coleta e só relata
node .github/scripts/coletar-tesouro.mjs             # coleta e grava dados/
```

**Rode `build` e `verificar` — um não cobre o outro.** O `vite build` empacota
só o `src/`; o `verificar.mjs` carrega o `server/` de verdade e confere as
identidades da matemática do título, o parser do CSV contra o cabeçalho
documentado, a regra dos três lugares e as constantes duplicadas. A CI roda os
dois em todo pull request.

---

## Como os dados chegam ao ar

1. `.github/workflows/coletar-tesouro.yml` roda às 13:00 e 22:00 UTC (10h e 19h
   de Brasília), em dias úteis.
2. O coletor lê o CSV do Tesouro em streaming, destila e grava `dados/`.
3. O bot commita as mudanças — e esse commit dispara um deploy novo na Vercel.

Espere commits frequentes de `github-actions[bot]` com a mensagem
"Dados: coleta automatica das NTN-B". Não edite `dados/` à mão.

> O GitHub **suspende workflows agendados após 60 dias sem atividade** no
> repositório. Se a coleta parar sozinha, reative na aba Actions.

Numa branch `claude/**`, o mesmo workflow roda em **dry-run**: baixa, parseia e
relata, sem gravar nem commitar. É como se confere que os parsers ainda batem
com o formato real das fontes antes de o código chegar ao `main`.

---

## Ampliando o escopo

A ampliação para Prefixado e Selic seguiu os seams descritos desde o primeiro
commit — `classificarTitulo()` em `server/util.js` é o único lugar que conhece
os nomes das famílias, os slugs são prefixados por tipo, o catálogo só rotula e
os arquivos-ponte crescem por irmãos. Se um dia entrar outra família:

1. ensine `classificarTitulo()` a reconhecê-la (e decida se ela tem duration);
2. acrescente a categoria em `server/catalogo.js`;
3. dê a ela um arquivo-ponte irmão no coletor — nunca mude o formato de um
   arquivo que alguém já consome.

RendA+ e Educa+ continuam fora **de propósito**: são títulos com amortização
mensal, e mostrá-los na régua de duration destes seria régua errada com cara de
análise.

## Ressalvas honestas

Este app é deliberadamente explícito sobre o que **não** sabe:

- **Defasagem.** O arquivo do Tesouro é de fechamento e a coleta roda duas
  vezes por dia. Nada aqui é tempo real. Todo item carrega a data do preço, e
  os desatualizados são marcados.
- **Convenção de tempo.** Duration e sensibilidade usam dias corridos/365. A
  convenção oficial da ANBIMA para NTN-B é **dias úteis/252** — a diferença é
  desprezível para duration (que é uma razão ponderada, onde a convenção quase
  toda se cancela), mas existe. Não há calendário de feriados no repositório.
- **Sensibilidade é aproximação.** Duration + convexidade é uma expansão de
  segunda ordem, não uma reprecificação exata.
- **"Compra" e "venda" são do ponto de vista do Tesouro.** *Venda* é o Tesouro
  vendendo ao investidor; *compra* é a recompra antecipada. Títulos fora de
  oferta deixam de publicar os campos de venda e seguem publicando os de compra
  — por isso a taxa de referência do app é a de compra. Os dois vêm preservados
  no JSON, com o nome de origem, para quem consumir decidir.
- **Bruto de custos.** Nada aqui desconta imposto de renda nem taxa de custódia.
- **Valor no vencimento em poder de compra de hoje.** A correção pelo IPCA vem
  por cima; projetar em reais nominais exigiria adivinhar a inflação futura.
- **Alertas são por dispositivo** (`localStorage`), conferidos quando a tela
  abre. Não há notificação em segundo plano.
- **Vencimentos são descobertos do arquivo**, não de uma lista chutada. Um
  vencimento que não esteja no catálogo aparece com rótulo genérico — nunca com
  dado inventado.
- **Títulos já vencidos ficam fora das telas e do arquivo-ponte.** Eles
  continuam no arquivo do Tesouro e no histórico, mas cotar um título vencido
  não significa nada: a taxa é calculada sobre um prazo que tende a zero, o que
  produz números absurdos (a coleta real trouxe uma NTN-B 2026 a 13,32% e uma
  2019 a −0,94%). Num arquivo que outra ferramenta lê como verdade, isso é pior
  do que ausência.

- **Prefixado é nominal.** As taxas de LTN/NTN-F são cheias, sem correção pela
  inflação — não compare com as taxas reais das NTN-B; a diferença entre as
  duas curvas é a inflação implícita.
- **LFT não tem duration** por construção: é pós-fixada e a "taxa" cotada é
  ágio/deságio sobre a Selic (pode ser negativa).
- **"Vigente desde", não "decidido em".** As datas de Copom/Fed/BCE são o dia
  em que a taxa nova passou a valer, derivado das séries — não a data da
  reunião.
- **Manchetes são contexto, não dado.** Vêm por RSS (Google News), a seleção é
  do agregador, cada link leva à fonte original, e uma região fora do ar
  simplesmente aparece vazia.

**Uso informativo. Não é recomendação de investimento.**
