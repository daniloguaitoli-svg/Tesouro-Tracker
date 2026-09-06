# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-06T14:14:08.549Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.8% | 3876.96 | 2.69 a | 2.496 | -2.45% | 2.54% | 04/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.93% | 4466.17 | 3.548 a | 3.287 | -3.21% | 3.36% | 04/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.89% | 4354.89 | 5.034 a | 4.666 | -4.52% | 4.81% | 04/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.9% | 3021.57 | 5.945 a | 5.51 | -5.33% | 5.69% | 04/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.69% | 4348.77 | 6.671 a | 6.194 | -5.94% | 6.45% | 04/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.66% | 2504.27 | 8.693 a | 8.075 | -7.71% | 8.44% | 04/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.57% | 4312.91 | 7.736 a | 7.192 | -6.84% | 7.54% | 04/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.45% | 4192.35 | 9.335 a | 8.687 | -8.16% | 9.21% | 04/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.34% | 1773.44 | 13.951 a | 12.997 | -12.09% | 13.9% | 04/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.42% | 4182.12 | 10.742 a | 10 | -9.25% | 10.75% | 04/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.32% | 1274.74 | 18.701 a | 17.426 | -15.83% | 19.03% | 04/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.39% | 4053.69 | 12.131 a | 11.296 | -10.3% | 12.29% | 04/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.28% | 889.56 | 23.956 a | 22.331 | -19.73% | 24.93% | 04/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.35% | 4098.63 | 12.663 a | 11.796 | -10.63% | 12.96% | 04/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.34% | 3998.79 | 13.427 a | 12.509 | -11.16% | 13.86% | 04/09/2026 |

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
