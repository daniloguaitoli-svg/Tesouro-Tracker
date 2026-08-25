# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-08-25T22:16:17.068Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.9% | 3861.91 | 2.723 a | 2.524 | -2.48% | 2.57% | 21/08/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.97% | 4453.88 | 3.58 a | 3.316 | -3.24% | 3.39% | 21/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.96% | 4334.52 | 5.065 a | 4.692 | -4.55% | 4.84% | 21/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.97% | 3005.66 | 5.978 a | 5.537 | -5.36% | 5.72% | 21/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.84% | 4302.87 | 6.692 a | 6.206 | -5.95% | 6.46% | 21/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.82% | 2468.95 | 8.726 a | 8.093 | -7.73% | 8.46% | 21/08/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.67% | 4276.52 | 7.756 a | 7.204 | -6.85% | 7.56% | 21/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.57% | 4143.81 | 9.34 a | 8.683 | -8.16% | 9.21% | 21/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.47% | 1741.74 | 13.984 a | 13.012 | -12.1% | 13.92% | 21/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.47% | 4156.12 | 10.753 a | 10.006 | -9.26% | 10.75% | 21/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.33% | 1270.99 | 18.734 a | 17.455 | -15.85% | 19.06% | 21/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.43% | 4030.46 | 12.137 a | 11.298 | -10.3% | 12.29% | 21/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.27% | 890.46 | 23.989 a | 22.363 | -19.76% | 24.97% | 21/08/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.34% | 4098.45 | 12.705 a | 11.836 | -10.67% | 13% | 21/08/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.34% | 3993.9 | 13.46 a | 12.54 | -11.19% | 13.89% | 21/08/2026 |

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
