# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-28T21:44:27.093Z.
Fonte: Tesouro Nacional (Tesouro Transparente) + ANBIMA (mercado secundário).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.71% | 3957.44 | 2.516 a | 2.336 | -2.3% | 2.37% | 27/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.76% | 4574.32 | 3.373 a | 3.13 | -3.06% | 3.2% | 27/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.81% | 4452.49 | 4.856 a | 4.504 | -4.37% | 4.64% | 27/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.84% | 3088.1 | 5.758 a | 5.339 | -5.17% | 5.51% | 27/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.87% | 4381.46 | 6.466 a | 5.994 | -5.75% | 6.24% | 27/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.9% | 2502.69 | 8.484 a | 7.863 | -7.52% | 8.21% | 27/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.92% | 4285.92 | 7.496 a | 6.946 | -6.61% | 7.28% | 27/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.8% | 4144 | 9.06 a | 8.404 | -7.91% | 8.9% | 27/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.78% | 1706.86 | 13.718 a | 12.728 | -11.86% | 13.6% | 27/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.55% | 4204.07 | 10.486 a | 9.75 | -9.03% | 10.47% | 27/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.38% | 1284.37 | 18.429 a | 17.162 | -15.61% | 18.71% | 27/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.42% | 4113.24 | 11.916 a | 11.092 | -10.12% | 12.06% | 27/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.16% | 929.79 | 23.647 a | 22.067 | -19.53% | 24.6% | 27/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.37% | 4162.82 | 12.456 a | 11.601 | -10.47% | 12.73% | 27/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.34% | 4070.81 | 13.245 a | 12.339 | -11.02% | 13.66% | 27/10/2026 |

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
