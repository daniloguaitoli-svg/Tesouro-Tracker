# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-17T05:07:42.666Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.47% | 3995.96 | 2.464 a | 2.293 | -2.26% | 2.33% | 13/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.59% | 4617.77 | 3.322 a | 3.088 | -3.02% | 3.15% | 13/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.69% | 4495.37 | 4.807 a | 4.464 | -4.33% | 4.6% | 13/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.73% | 3119.36 | 5.706 a | 5.297 | -5.13% | 5.46% | 13/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.73% | 4295.88 | 6.636 a | 6.16 | -5.91% | 6.41% | 13/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.77% | 2539.08 | 8.433 a | 7.825 | -7.48% | 8.17% | 13/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.67% | 4238.33 | 7.725 a | 7.175 | -6.83% | 7.52% | 13/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.54% | 4253.4 | 9.066 a | 8.431 | -7.93% | 8.93% | 13/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.49% | 1778.37 | 13.667 a | 12.714 | -11.85% | 13.58% | 13/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.53% | 4088.47 | 10.804 a | 10.048 | -9.31% | 10.79% | 13/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.49% | 1265.52 | 18.377 a | 17.096 | -15.56% | 18.64% | 13/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.54% | 4075.76 | 11.786 a | 10.96 | -10.01% | 11.91% | 13/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.51% | 864.32 | 23.595 a | 21.947 | -19.44% | 24.46% | 13/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.53% | 3962.41 | 12.702 a | 11.813 | -10.67% | 12.96% | 13/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.54% | 3988.8 | 12.98 a | 12.07 | -10.79% | 13.35% | 13/11/2026 |

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
