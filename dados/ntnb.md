# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-08-22T19:48:54.060Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.9% | 3861.91 | 2.732 a | 2.532 | -2.49% | 2.58% | 21/08/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.97% | 4453.88 | 3.589 a | 3.324 | -3.25% | 3.4% | 21/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.96% | 4334.52 | 5.074 a | 4.699 | -4.56% | 4.84% | 21/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.97% | 3005.66 | 5.986 a | 5.544 | -5.37% | 5.72% | 21/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.84% | 4302.87 | 6.7 a | 6.213 | -5.96% | 6.47% | 21/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.82% | 2468.95 | 8.734 a | 8.101 | -7.74% | 8.47% | 21/08/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.67% | 4276.52 | 7.765 a | 7.212 | -6.86% | 7.56% | 21/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.57% | 4143.81 | 9.348 a | 8.691 | -8.17% | 9.21% | 21/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.47% | 1741.74 | 13.992 a | 13.019 | -12.11% | 13.93% | 21/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.47% | 4156.12 | 10.761 a | 10.013 | -9.27% | 10.76% | 21/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.33% | 1270.99 | 18.742 a | 17.462 | -15.86% | 19.07% | 21/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.43% | 4030.46 | 12.145 a | 11.305 | -10.31% | 12.3% | 21/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.27% | 890.46 | 23.997 a | 22.371 | -19.76% | 24.98% | 21/08/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.34% | 4098.45 | 12.713 a | 11.844 | -10.68% | 13.01% | 21/08/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.34% | 3993.9 | 13.468 a | 12.547 | -11.2% | 13.9% | 21/08/2026 |

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
