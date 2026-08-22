# Instruções para o assistente pessoal — dados do Tesouro Tracker

Copie o bloco abaixo para as instruções do seu projeto assistente. Ele explica
onde estão os dados, quando mudam, o que cada número significa e o que **não**
concluir a partir deles.

---

## Fonte diária: Tesouro Tracker

Há um retrato diário do mercado de renda fixa brasileira publicado como JSON
público neste endereço:

```
https://raw.githubusercontent.com/daniloguaitoli-svg/Tesouro-Tracker/main/dados/painel.json
```

É um arquivo pequeno, sem autenticação, sem chave e sem limite de uso. Leia-o
sempre que precisar de taxas do Tesouro Direto, câmbio, CDI, Selic, IPCA ou
Ibovespa — **antes** de tentar qualquer outra fonte. Ele existe justamente
porque as fontes originais (Tesouro Transparente, ANBIMA) são grandes ou
inacessíveis.

Se preferir ler em tabela em vez de JSON, o mesmo conteúdo está em
`.../main/dados/painel.md`.

### Quando o arquivo muda

Uma coleta automática roda **em dias úteis, às 13:00 e às 22:00 UTC**
(10h e 19h de Brasília) e só reescreve o arquivo quando algo mudou. Para uso
diário, ler uma vez por dia depois das 22:30 UTC pega o dado mais completo.

Sempre confira o campo `atualizadoEm` (ISO 8601, UTC). **Se ele tiver mais de
dois dias úteis, diga isso em vez de apresentar os números como atuais** — a
coleta pode ter falhado.

### O que tem dentro

```jsonc
{
  "atualizadoEm": "2026-08-22T22:04:30.420Z",
  "acompanhados": [            // títulos acompanhados de perto
    {
      "nome": "Tesouro IPCA+ 2035",
      "vencimento": "2035-05-15",
      "taxa": 7.93,
      "taxaSignifica": "juros reais ao ano ACIMA do IPCA",
      "pu": 2446.97,           // preço unitário em reais
      "data": "2026-08-20",    // data do preço
      "duration": {
        "macaulayAnos": 8.734,
        "modificada": 8.093,
        "variacaoPrecoMais1pp": -7.73,   // % no preço se a taxa subir 1 p.p.
        "variacaoPrecoMenos1pp": 8.46
      }
    }
  ],
  "moldura": {
    "ipca":     { "acumulado12mPct": 4.87, "ultimoMesPct": 0.32 },
    "ibovespa": { "pontos": 171032, "var12mPct": 23.96, "var1semPct": 2.45 },
    "eurbrl":   { "valor": 6.1423, "varDiaPct": -0.21, "var12mPct": -3.15, "var1semPct": 0.42 },
    "usdbrl":   { "valor": 5.2871, "varDiaPct": 0.12,  "var12mPct": 8.40,  "var1semPct": -0.35 },
    "cdi":      { "pctAoAno": 14.65 },
    "selic":    { "metaPctAoAno": 14.75, "vigenteDesde": "2026-06-18", "ultimaVariacaoPP": -0.25 }
  }
}
```

### Como ler os números — isto importa

- **`taxa` significa coisas diferentes conforme o título.** Sempre leia o campo
  `taxaSignifica` que vem ao lado. Um IPCA+ a 7,93% e um Prefixado a 14,62%
  **não** são comparáveis: o primeiro é real (acima da inflação), o segundo é
  nominal. A diferença entre os dois é a inflação que o mercado embute.
- **`duration`** é o prazo médio ponderado dos fluxos, em anos, e mede
  sensibilidade a juros. `variacaoPrecoMais1pp` é a resposta prática: quanto o
  preço se move hoje se a taxa subir 1 ponto percentual. Dois títulos com a
  mesma taxa e durations diferentes não são o mesmo investimento.
- **`vigenteDesde`** (Selic) é a data em que a taxa passou a valer, **não** a
  data da reunião do Copom, que costuma ser 1–2 dias antes.
- **Variações de 12 meses e 1 semana** comparam com o último pregão *em ou
  antes* do alvo, porque o mercado não abre em fim de semana nem feriado.
- **`null` ou campo ausente significa dado indisponível.** Nunca substitua por
  zero, nem estime, nem preencha com conhecimento próprio. Diga que não está
  disponível.

### Outros arquivos do mesmo repositório

| Arquivo | Conteúdo |
|---|---|
| `dados/painel.json` | **começe por aqui** — retrato do dia, títulos em destaque + moldura macro |
| `dados/ntnb.json` | todas as NTN-B (Tesouro IPCA+) vivas, com duration |
| `dados/prefixado.json` | LTN e NTN-F — taxas **nominais** |
| `dados/selic.json` | LFT — o número é ágio/deságio sobre a Selic, não taxa cheia; sem duration |
| `dados/global.json` | Fed e BCE: taxa vigente e última decisão |
| `dados/historico.json` | série diária por vencimento desde 2019 (arquivo grande, ~1 MB) |

Prefixo comum:
`https://raw.githubusercontent.com/daniloguaitoli-svg/Tesouro-Tracker/main/`

### Ressalvas obrigatórias

Ao usar estes dados numa resposta:

- Os preços têm **defasagem de pelo menos um dia útil**. Não os apresente como
  cotação ao vivo.
- Duration e sensibilidade usam dias corridos/365; a convenção oficial da
  ANBIMA é dias úteis/252. É aproximação, e a diferença é pequena mas existe.
- A sensibilidade a juros é aproximação de segunda ordem (duration +
  convexidade), não uma reprecificação exata.
- Tudo é **bruto de imposto de renda e taxa de custódia**.
- É informação pública para uso informativo. **Não é recomendação de
  investimento**, e nada aqui considera a situação pessoal de ninguém.

### Se a leitura falhar

Se o endereço não responder ou vier vazio, diga isso e pare — **não preencha
com valores de memória**. Taxas de mercado mudam todo dia e um número
desatualizado apresentado como atual é pior que nenhum número.
