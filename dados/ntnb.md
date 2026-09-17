# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-17T22:56:00.656Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.47% | 3913.88 | 2.66 a | 2.475 | -2.43% | 2.52% | 16/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.6% | 4520.66 | 3.52 a | 3.272 | -3.2% | 3.34% | 16/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.64% | 4411.78 | 5.011 a | 4.655 | -4.51% | 4.8% | 16/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.66% | 3065.79 | 5.915 a | 5.494 | -5.32% | 5.67% | 16/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.59% | 4381.61 | 6.648 a | 6.179 | -5.92% | 6.43% | 16/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.6% | 2519.79 | 8.663 a | 8.051 | -7.69% | 8.41% | 16/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.5% | 4340.39 | 7.715 a | 7.177 | -6.83% | 7.53% | 16/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.37% | 4227 | 9.322 a | 8.683 | -8.16% | 9.2% | 16/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.3% | 1784.94 | 13.921 a | 12.973 | -12.07% | 13.88% | 16/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.35% | 4216.9 | 10.742 a | 10.006 | -9.26% | 10.75% | 16/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.28% | 1285.25 | 18.671 a | 17.404 | -15.81% | 19% | 16/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.32% | 4091.12 | 12.147 a | 11.318 | -10.32% | 12.32% | 16/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.23% | 900.63 | 23.926 a | 22.313 | -19.72% | 24.91% | 16/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.23% | 4162.43 | 12.74 a | 11.881 | -10.71% | 13.06% | 16/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.21% | 4069.7 | 13.539 a | 12.629 | -11.26% | 14% | 16/09/2026 |

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
