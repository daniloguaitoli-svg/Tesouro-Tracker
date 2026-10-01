# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-01T02:12:50.799Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.46% | 3937.55 | 2.622 a | 2.44 | -2.4% | 2.48% | 29/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.59% | 4548.55 | 3.482 a | 3.236 | -3.17% | 3.31% | 29/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.59% | 4447.84 | 4.973 a | 4.623 | -4.48% | 4.76% | 29/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.61% | 3092.16 | 5.877 a | 5.461 | -5.29% | 5.64% | 29/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.53% | 4423.4 | 6.615 a | 6.151 | -5.9% | 6.41% | 29/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.54% | 2546.66 | 8.625 a | 8.02 | -7.66% | 8.38% | 29/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.47% | 4374.93 | 7.681 a | 7.147 | -6.8% | 7.49% | 29/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.3% | 4277.09 | 9.3 a | 8.667 | -8.15% | 9.19% | 29/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.21% | 1816.1 | 13.882 a | 12.949 | -12.05% | 13.85% | 29/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.21% | 4300.72 | 10.764 a | 10.04 | -9.29% | 10.79% | 29/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.09% | 1335.74 | 18.633 a | 17.399 | -15.8% | 18.99% | 29/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.17% | 4184.92 | 12.207 a | 11.391 | -10.38% | 12.4% | 29/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.03% | 946.8 | 23.888 a | 22.319 | -19.72% | 24.91% | 29/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.1% | 4251.31 | 12.817 a | 11.967 | -10.78% | 13.16% | 29/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.07% | 4166.02 | 13.655 a | 12.754 | -11.36% | 14.14% | 29/09/2026 |

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
