# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-18T02:28:31.961Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.44% | 4000.36 | 2.46 a | 2.29 | -2.25% | 2.33% | 16/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.59% | 4619.7 | 3.318 a | 3.084 | -3.02% | 3.15% | 16/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.71% | 4493.25 | 4.803 a | 4.459 | -4.33% | 4.59% | 16/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.75% | 3117.36 | 5.702 a | 5.292 | -5.13% | 5.46% | 16/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.74% | 4295.05 | 6.632 a | 6.155 | -5.91% | 6.4% | 16/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.78% | 2538.17 | 8.429 a | 7.82 | -7.48% | 8.16% | 16/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.68% | 4237.07 | 7.72 a | 7.169 | -6.83% | 7.51% | 16/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.54% | 4255.16 | 9.062 a | 8.427 | -7.93% | 8.92% | 16/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.49% | 1779.11 | 13.663 a | 12.711 | -11.84% | 13.58% | 16/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.54% | 4086.06 | 10.796 a | 10.039 | -9.3% | 10.78% | 16/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.5% | 1263.88 | 18.373 a | 17.091 | -15.55% | 18.63% | 16/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.53% | 4081.93 | 11.789 a | 10.963 | -10.01% | 11.92% | 16/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.49% | 868.48 | 23.591 a | 21.947 | -19.44% | 24.46% | 16/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.53% | 3964.05 | 12.698 a | 11.809 | -10.66% | 12.95% | 16/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.54% | 3990.45 | 12.976 a | 12.066 | -10.79% | 13.34% | 16/11/2026 |

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
