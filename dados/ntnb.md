# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-29T02:30:31.642Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.71% | 3957.44 | 2.512 a | 2.332 | -2.29% | 2.37% | 27/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.76% | 4574.32 | 3.369 a | 3.126 | -3.06% | 3.19% | 27/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.81% | 4452.49 | 4.852 a | 4.5 | -4.37% | 4.63% | 27/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.84% | 3088.1 | 5.754 a | 5.336 | -5.17% | 5.5% | 27/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.87% | 4381.46 | 6.462 a | 5.99 | -5.75% | 6.23% | 27/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.9% | 2502.69 | 8.48 a | 7.859 | -7.51% | 8.2% | 27/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.92% | 4285.92 | 7.492 a | 6.942 | -6.61% | 7.27% | 27/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.8% | 4144 | 9.056 a | 8.4 | -7.9% | 8.9% | 27/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.78% | 1706.86 | 13.714 a | 12.724 | -11.86% | 13.59% | 27/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.55% | 4204.07 | 10.482 a | 9.747 | -9.03% | 10.46% | 27/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.38% | 1284.37 | 18.425 a | 17.158 | -15.61% | 18.71% | 27/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.42% | 4113.24 | 11.912 a | 11.089 | -10.12% | 12.06% | 27/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.16% | 929.79 | 23.643 a | 22.063 | -19.53% | 24.6% | 27/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.37% | 4162.82 | 12.452 a | 11.597 | -10.46% | 12.73% | 27/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.34% | 4070.81 | 13.241 a | 12.335 | -11.02% | 13.66% | 27/10/2026 |

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
