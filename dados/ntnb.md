# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-04T19:40:57.218Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.8% | 3877.21 | 2.696 a | 2.501 | -2.46% | 2.54% | 03/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.94% | 4464.98 | 3.553 a | 3.292 | -3.22% | 3.36% | 03/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.93% | 4347.09 | 5.039 a | 4.668 | -4.53% | 4.81% | 03/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.95% | 3013.5 | 5.951 a | 5.512 | -5.33% | 5.69% | 03/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.73% | 4338.38 | 6.673 a | 6.194 | -5.94% | 6.45% | 03/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.7% | 2496.42 | 8.699 a | 8.077 | -7.71% | 8.44% | 03/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.6% | 4304 | 7.738 a | 7.191 | -6.84% | 7.54% | 03/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.48% | 4181.83 | 9.333 a | 8.684 | -8.16% | 9.21% | 03/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.37% | 1766.73 | 13.956 a | 12.998 | -12.09% | 13.9% | 03/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.42% | 4182.44 | 10.747 a | 10.005 | -9.26% | 10.75% | 03/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.3% | 1279.27 | 18.707 a | 17.434 | -15.83% | 19.04% | 03/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.4% | 4049.46 | 12.13 a | 11.294 | -10.3% | 12.29% | 03/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.28% | 889.63 | 23.962 a | 22.336 | -19.74% | 24.93% | 03/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.33% | 4108.62 | 12.687 a | 11.82 | -10.65% | 12.99% | 03/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.32% | 4009.11 | 13.455 a | 12.537 | -11.19% | 13.89% | 03/09/2026 |

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
