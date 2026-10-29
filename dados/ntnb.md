# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-29T23:59:57.269Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.8% | 3950.57 | 2.512 a | 2.33 | -2.29% | 2.37% | 28/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.81% | 4568.84 | 3.368 a | 3.124 | -3.06% | 3.19% | 28/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.85% | 4446.11 | 4.851 a | 4.497 | -4.36% | 4.63% | 28/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.87% | 3084.29 | 5.754 a | 5.334 | -5.17% | 5.5% | 28/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.81% | 4398.87 | 6.466 a | 5.998 | -5.75% | 6.24% | 28/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.82% | 2519.41 | 8.48 a | 7.865 | -7.52% | 8.21% | 28/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.72% | 4347.62 | 7.517 a | 6.978 | -6.64% | 7.31% | 28/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.59% | 4219.57 | 9.103 a | 8.461 | -7.96% | 8.96% | 28/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.52% | 1764.99 | 13.714 a | 12.755 | -11.88% | 13.63% | 28/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.41% | 4263.56 | 10.542 a | 9.815 | -9.09% | 10.54% | 28/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.24% | 1316.08 | 18.425 a | 17.181 | -15.62% | 18.74% | 28/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.35% | 4146.83 | 11.957 a | 11.138 | -10.16% | 12.11% | 28/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.16% | 930.11 | 23.643 a | 22.063 | -19.53% | 24.6% | 28/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.34% | 4178.81 | 12.478 a | 11.625 | -10.49% | 12.76% | 28/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.34% | 4072.22 | 13.241 a | 12.335 | -11.02% | 13.66% | 28/10/2026 |

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
