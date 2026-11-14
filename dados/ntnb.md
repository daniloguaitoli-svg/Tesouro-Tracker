# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-14T00:55:21.403Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.42% | 3998.55 | 2.472 a | 2.301 | -2.26% | 2.34% | 12/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.53% | 4624.02 | 3.331 a | 3.098 | -3.03% | 3.16% | 12/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.63% | 4505.16 | 4.816 a | 4.475 | -4.34% | 4.61% | 12/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.67% | 3127.71 | 5.714 a | 5.307 | -5.14% | 5.47% | 12/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.68% | 4448 | 6.437 a | 5.977 | -5.74% | 6.22% | 12/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.72% | 2547.74 | 8.44 a | 7.836 | -7.49% | 8.18% | 12/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.63% | 4389.42 | 7.489 a | 6.958 | -6.62% | 7.29% | 12/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.5% | 4265.63 | 9.083 a | 8.449 | -7.95% | 8.95% | 12/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.46% | 1784.28 | 13.675 a | 12.725 | -11.86% | 13.59% | 12/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.49% | 4243.95 | 10.468 a | 9.739 | -9.02% | 10.46% | 12/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.45% | 1273.57 | 18.385 a | 17.11 | -15.57% | 18.65% | 12/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.5% | 4091.64 | 11.82 a | 10.995 | -10.04% | 11.95% | 12/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.48% | 869.6 | 23.603 a | 21.961 | -19.45% | 24.47% | 12/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.49% | 4120.27 | 12.308 a | 11.45 | -10.34% | 12.56% | 12/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.51% | 4001.28 | 13.02 a | 12.11 | -10.83% | 13.39% | 12/11/2026 |

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
- Prazo, duration e sensibilidade usam dias úteis/252, a convenção oficial do
  Tesouro e da ANBIMA. O calendário são os feriados nacionais.
- A sensibilidade é uma aproximação de segunda ordem (duration + convexidade), não
  uma reprecificação exata.
- Uso informativo. Não é recomendação de investimento.
