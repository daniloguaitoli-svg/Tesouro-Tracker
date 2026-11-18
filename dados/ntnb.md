# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-18T19:26:48.621Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.49% | 3997.43 | 2.46 a | 2.289 | -2.25% | 2.33% | 17/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.67% | 4610.24 | 3.318 a | 3.082 | -3.02% | 3.15% | 17/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.74% | 4489.13 | 4.802 a | 4.457 | -4.33% | 4.59% | 17/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.78% | 3113.73 | 5.702 a | 5.291 | -5.13% | 5.46% | 17/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.73% | 4299.51 | 6.632 a | 6.156 | -5.91% | 6.4% | 17/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.76% | 2543.22 | 8.429 a | 7.822 | -7.48% | 8.16% | 17/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.67% | 4241.89 | 7.721 a | 7.171 | -6.83% | 7.51% | 17/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.54% | 4256.92 | 9.062 a | 8.427 | -7.93% | 8.92% | 17/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.49% | 1779.85 | 13.663 a | 12.711 | -11.84% | 13.58% | 17/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.52% | 4095.98 | 10.804 a | 10.049 | -9.31% | 10.79% | 17/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.47% | 1270.9 | 18.373 a | 17.096 | -15.56% | 18.64% | 17/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.53% | 4083.62 | 11.789 a | 10.963 | -10.01% | 11.92% | 17/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.49% | 868.84 | 23.591 a | 21.947 | -19.44% | 24.46% | 17/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.51% | 3975.08 | 12.715 a | 11.827 | -10.68% | 12.97% | 17/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.51% | 4006.61 | 13.008 a | 12.099 | -10.82% | 13.38% | 17/11/2026 |

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
