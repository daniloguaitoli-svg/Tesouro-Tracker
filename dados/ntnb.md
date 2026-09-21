# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-21T01:12:53.670Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.37% | 3928.6 | 2.649 a | 2.467 | -2.43% | 2.51% | 18/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.5% | 4541.32 | 3.51 a | 3.265 | -3.19% | 3.34% | 18/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.55% | 4436.04 | 5.002 a | 4.651 | -4.51% | 4.79% | 18/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.58% | 3083.29 | 5.904 a | 5.488 | -5.31% | 5.66% | 18/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.55% | 4398.19 | 6.641 a | 6.174 | -5.92% | 6.43% | 18/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.57% | 2529.18 | 8.652 a | 8.043 | -7.68% | 8.4% | 18/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.48% | 4352.31 | 7.707 a | 7.17 | -6.82% | 7.52% | 18/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.34% | 4243.5 | 9.318 a | 8.681 | -8.16% | 9.2% | 18/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.27% | 1794.19 | 13.91 a | 12.967 | -12.07% | 13.87% | 18/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.32% | 4235.04 | 10.744 a | 10.011 | -9.26% | 10.76% | 18/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.26% | 1291.38 | 18.66 a | 17.397 | -15.8% | 18.99% | 18/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.28% | 4114.97 | 12.162 a | 11.337 | -10.33% | 12.34% | 18/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.19% | 909.82 | 23.915 a | 22.311 | -19.72% | 24.9% | 18/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.21% | 4177.71 | 12.746 a | 11.889 | -10.71% | 13.07% | 18/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.19% | 4085.26 | 13.55 a | 12.641 | -11.27% | 14.01% | 18/09/2026 |

## Como ler

- **Taxa real** — juros ao ano *acima* do IPCA. É a taxa de compra (recompra do
  Tesouro); títulos fora de oferta deixam de publicar a taxa de venda, mas seguem
  publicando esta.
- **PU** — preço unitário em reais, do mesmo lado da taxa.
- **Duration** — prazo médio ponderado dos fluxos, em anos (Macaulay). Para o
  Tesouro IPCA+ sem cupom, é igual ao prazo; com juros semestrais é bem menor,
  porque parte do dinheiro volta antes.
- **Dur. mod.** — duration modificada: a variação percentual aproximada do preço
  para cada 1 ponto percentual de variação da taxa.
- **+1 p.p. / −1 p.p.** — quanto o preço se move hoje se a taxa real subir ou cair
  1 ponto percentual, já com o termo de convexidade (por isso não são simétricos).
- ⭐ marca os vencimentos acompanhados de perto.
- Os números usam **ponto decimal** e as datas dos arquivos .json usam **ISO
  (aaaa-mm-dd)**. É um arquivo de intercâmbio: o ponto decimal evita a ambiguidade
  do formato brasileiro para quem lê por máquina. Na tabela acima as datas
  aparecem em dd/mm/aaaa por legibilidade.

## Ressalvas

- Os dados têm defasagem de pelo menos um dia útil: o arquivo do Tesouro é de
  fechamento e este retrato é gerado uma vez por dia.
- Duration e sensibilidade usam dias corridos/365. A convenção oficial da ANBIMA
  para NTN-B é dias úteis/252 — a diferença é desprezível para duration, mas existe.
- A sensibilidade é uma aproximação de segunda ordem (duration + convexidade), não
  uma reprecificação exata.
- Uso informativo. Não é recomendação de investimento.
