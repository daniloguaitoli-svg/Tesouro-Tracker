# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-03T22:39:22.165Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.85% | 3871.62 | 2.699 a | 2.502 | -2.46% | 2.55% | 02/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.97% | 4459.67 | 3.556 a | 3.293 | -3.22% | 3.37% | 02/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.95% | 4342.14 | 5.041 a | 4.67 | -4.53% | 4.81% | 02/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.97% | 3009.56 | 5.953 a | 5.514 | -5.34% | 5.69% | 02/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.8% | 4318.87 | 6.671 a | 6.188 | -5.93% | 6.44% | 02/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.78% | 2479.97 | 8.701 a | 8.073 | -7.71% | 8.44% | 02/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.66% | 4284.75 | 7.733 a | 7.183 | -6.83% | 7.53% | 02/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.54% | 4159.43 | 9.322 a | 8.669 | -8.15% | 9.19% | 02/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.44% | 1750.5 | 13.959 a | 12.992 | -12.09% | 13.9% | 02/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.45% | 4169.18 | 10.737 a | 9.993 | -9.25% | 10.74% | 02/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.31% | 1276.81 | 18.71 a | 17.435 | -15.83% | 19.04% | 02/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.43% | 4035.05 | 12.113 a | 11.275 | -10.28% | 12.27% | 02/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.3% | 885.53 | 23.964 a | 22.334 | -19.74% | 24.93% | 02/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.34% | 4103 | 12.68 a | 11.813 | -10.65% | 12.98% | 02/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.33% | 4003.34 | 13.446 a | 12.528 | -11.18% | 13.88% | 02/09/2026 |

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
