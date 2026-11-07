# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-07T16:54:28.784Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.68% | 3971.58 | 2.492 a | 2.314 | -2.28% | 2.35% | 06/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.77% | 4586.13 | 3.349 a | 3.107 | -3.04% | 3.17% | 06/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.83% | 4461.42 | 4.831 a | 4.48 | -4.35% | 4.61% | 06/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.86% | 3093.8 | 5.734 a | 5.316 | -5.15% | 5.48% | 06/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.84% | 4402.14 | 6.444 a | 5.976 | -5.73% | 6.22% | 06/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.87% | 2515.93 | 8.46 a | 7.843 | -7.5% | 8.19% | 06/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.75% | 4349.48 | 7.493 a | 6.954 | -6.62% | 7.29% | 06/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.61% | 4222.94 | 9.078 a | 8.436 | -7.94% | 8.94% | 06/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.54% | 1764.85 | 13.694 a | 12.734 | -11.86% | 13.6% | 06/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.53% | 4224.21 | 10.471 a | 9.738 | -9.02% | 10.45% | 06/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.43% | 1276.97 | 18.405 a | 17.132 | -15.58% | 18.68% | 06/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.53% | 4075.04 | 11.82 a | 10.993 | -10.04% | 11.95% | 06/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.44% | 876.6 | 23.623 a | 21.987 | -19.47% | 24.51% | 06/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.52% | 4103 | 12.301 a | 11.441 | -10.33% | 12.55% | 06/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.51% | 3998.21 | 13.039 a | 12.128 | -10.84% | 13.41% | 06/11/2026 |

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
