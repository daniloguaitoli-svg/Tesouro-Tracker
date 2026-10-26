# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-26T17:26:59.931Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.74% | 4046.76 | 2.524 a | 2.364 | -2.33% | 2.4% | 23/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 6.75% | 4720.03 | 3.388 a | 3.174 | -3.11% | 3.24% | 23/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.75% | 4670 | 4.89 a | 4.581 | -4.44% | 4.72% | 23/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.76% | 3271.04 | 5.766 a | 5.401 | -5.23% | 5.57% | 23/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.75% | 4687.43 | 6.558 a | 6.144 | -5.89% | 6.4% | 23/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.76% | 2737.48 | 8.492 a | 7.954 | -7.6% | 8.31% | 23/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.73% | 4659.26 | 7.653 a | 7.17 | -6.82% | 7.52% | 23/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.62% | 4583.22 | 9.33 a | 8.751 | -8.22% | 9.28% | 23/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.58% | 1989.37 | 13.726 a | 12.879 | -11.99% | 13.77% | 23/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.58% | 4629.84 | 10.907 a | 10.233 | -9.46% | 11% | 23/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.52% | 1488.89 | 18.437 a | 17.308 | -15.73% | 18.89% | 23/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.55% | 4540.37 | 12.495 a | 11.727 | -10.67% | 12.78% | 23/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.48% | 1080.38 | 23.655 a | 22.215 | -19.64% | 24.79% | 23/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.51% | 4613.66 | 13.23 a | 12.421 | -11.16% | 13.68% | 23/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.5% | 4531.78 | 14.186 a | 13.32 | -11.83% | 14.81% | 23/10/2026 |

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
