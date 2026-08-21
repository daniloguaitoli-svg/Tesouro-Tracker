# Tesouro Tracker

Acompanha títulos do **Tesouro Direto** a partir de fontes públicas e gratuitas.
PWA em React + Vite, instalável no celular, usável em qualquer navegador.

**Escopo de hoje: NTN-B (Tesouro IPCA+)** — taxa real, preço unitário e
**duration** por vencimento, a curva de juros reais e a moldura macro. O nome é
guarda-chuva de propósito: o Prefixado (LTN/NTN-F) e o Selic (LFT) cabem na
mesma arquitetura sem reescrita — veja [Ampliando o escopo](#ampliando-o-escopo).

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
| [`dados/ntnb.json`](dados/ntnb.json) | retrato do dia, com duration — consumo por máquina |
| [`dados/ntnb.md`](dados/ntnb.md) | o mesmo retrato em tabela — leitura humana |
| [`dados/historico.json`](dados/historico.json) | a série diária por vencimento — o que o app usa |

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
| **ANBIMA** (mercado secundário) | taxa indicativa e bid/ask do secundário | arquivo diário público — enriquecimento, nunca requisito |
| **Banco Central (SGS)** | IPCA, Selic meta, PTAX USD e EUR | API pública, sem chave |

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

O repositório já está montado para crescer, e o caminho é curto porque nada
depende de "ser NTN-B":

1. **`server/util.js` → `classificarTitulo()`** — hoje devolve `null` para tudo
   que não é IPCA+. Ensine-a a reconhecer "Tesouro Prefixado" (LTN),
   "Tesouro Prefixado com Juros Semestrais" (NTN-F) e "Tesouro Selic" (LFT),
   devolvendo novos `tipo`s. Os slugs já são prefixados por tipo
   (`ipca-`, `ipca-juros-`), então `prefixado-2031-01-01` entra sem colisão e
   sem quebrar histórico.
2. **`server/catalogo.js` → `CATEGORIAS`** — uma entrada por família nova. A
   lista de vencimentos continua sendo *descoberta* do arquivo; o catálogo só
   rotula.
3. **A matemática** — LTN e NTN-F são as mesmas contas com outro fluxo (a LTN é
   zero-cupom com valor de face 1.000; a NTN-F paga cupom de 10% a.a.). A LFT é
   diferente e merece tratamento próprio: é pós-fixada, com duration
   efetivamente nula, e a "taxa" é ágio/deságio sobre a Selic — **não** taxa
   real. Não force a régua da NTN-B nela.
4. **Os arquivos-ponte** — `dados/ntnb.json` fica como está. Uma família nova
   ganha um arquivo irmão (`dados/prefixado.json`, `dados/selic.json`), para que
   quem já consome a URL da NTN-B não seja quebrado por uma mudança de formato.

O coletor, o parser tolerante, o cache versionado, a moldura macro e as telas
não precisam mudar de forma para nada disso.

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

**Uso informativo. Não é recomendação de investimento.**
