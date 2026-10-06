# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-06T17:17:07.306Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.84% | 4006.98 | 2.608 a | 2.441 | -2.4% | 2.48% | 05/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.06% | 4638.41 | 3.473 a | 3.244 | -3.17% | 3.31% | 05/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.91% | 4601.06 | 4.977 a | 4.655 | -4.51% | 4.8% | 05/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.91% | 3220.25 | 5.863 a | 5.484 | -5.31% | 5.66% | 05/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.87% | 4618.13 | 6.651 a | 6.224 | -5.97% | 6.48% | 05/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.86% | 2695.45 | 8.611 a | 8.058 | -7.7% | 8.42% | 05/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.86% | 4581.5 | 7.744 a | 7.247 | -6.89% | 7.6% | 05/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.61% | 4553.41 | 9.441 a | 8.856 | -8.32% | 9.39% | 05/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.5% | 1995.27 | 13.868 a | 13.022 | -12.11% | 13.93% | 05/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.56% | 4605.22 | 11.03 a | 10.351 | -9.56% | 11.14% | 05/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.45% | 1496.05 | 18.619 a | 17.491 | -15.88% | 19.1% | 05/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.48% | 4544.4 | 12.654 a | 11.884 | -10.81% | 12.96% | 05/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.32% | 1111.41 | 23.874 a | 22.455 | -19.83% | 25.08% | 05/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.39% | 4649.24 | 13.449 a | 12.642 | -11.35% | 13.93% | 05/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.39% | 4565.57 | 14.416 a | 13.55 | -12.02% | 15.08% | 05/10/2026 |

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
