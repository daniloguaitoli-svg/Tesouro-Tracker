# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-06T00:59:33.545Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.8% | 3954.27 | 2.492 a | 2.312 | -2.27% | 2.35% | 30/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.84% | 4568.84 | 3.348 a | 3.105 | -3.04% | 3.17% | 30/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.86% | 4448.28 | 4.83 a | 4.478 | -4.35% | 4.61% | 30/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.89% | 3083.9 | 5.734 a | 5.315 | -5.15% | 5.48% | 30/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.86% | 4389.83 | 6.443 a | 5.973 | -5.73% | 6.21% | 30/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.88% | 2509.91 | 8.46 a | 7.842 | -7.5% | 8.19% | 30/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.76% | 4339.54 | 7.492 a | 6.953 | -6.62% | 7.29% | 30/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.63% | 4209.2 | 9.074 a | 8.431 | -7.93% | 8.93% | 30/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.56% | 1757.62 | 13.694 a | 12.732 | -11.86% | 13.6% | 30/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.47% | 4242.42 | 10.497 a | 9.767 | -9.05% | 10.49% | 30/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.32% | 1299.28 | 18.405 a | 17.149 | -15.6% | 18.7% | 30/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.43% | 4113.86 | 11.885 a | 11.063 | -10.1% | 12.03% | 30/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.27% | 908.63 | 23.623 a | 22.022 | -19.49% | 24.55% | 30/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.42% | 4144 | 12.388 a | 11.532 | -10.41% | 12.66% | 30/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.42% | 4036.03 | 13.135 a | 12.228 | -10.93% | 13.53% | 30/10/2026 |

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
