# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-15T20:17:38.559Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.55% | 3902.53 | 2.666 a | 2.479 | -2.44% | 2.52% | 14/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.61% | 4514.88 | 3.526 a | 3.276 | -3.2% | 3.35% | 14/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.61% | 4413.69 | 5.017 a | 4.662 | -4.52% | 4.8% | 14/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.62% | 3069.56 | 5.921 a | 5.501 | -5.32% | 5.68% | 14/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.58% | 4380.13 | 6.655 a | 6.186 | -5.93% | 6.44% | 14/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.58% | 2521.42 | 8.668 a | 8.058 | -7.7% | 8.42% | 14/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.5% | 4336.28 | 7.721 a | 7.182 | -6.83% | 7.53% | 14/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.4% | 4212.11 | 9.321 a | 8.679 | -8.16% | 9.2% | 14/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.34% | 1774.1 | 13.926 a | 12.974 | -12.07% | 13.88% | 14/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.39% | 4196.22 | 10.73 a | 9.992 | -9.25% | 10.74% | 14/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.34% | 1270.81 | 18.677 a | 17.4 | -15.8% | 18.99% | 14/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.37% | 4064.36 | 12.119 a | 11.287 | -10.29% | 12.28% | 14/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.3% | 885.94 | 23.932 a | 22.303 | -19.71% | 24.89% | 14/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.3% | 4124.33 | 12.683 a | 11.82 | -10.65% | 12.99% | 14/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.3% | 4020.28 | 13.446 a | 12.531 | -11.18% | 13.88% | 14/09/2026 |

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
