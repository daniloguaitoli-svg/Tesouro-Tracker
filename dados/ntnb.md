# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-24T06:59:11.523Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.46% | 4004.99 | 2.448 a | 2.278 | -2.24% | 2.31% | 19/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.65% | 4618.7 | 3.306 a | 3.071 | -3.01% | 3.14% | 19/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.77% | 4488.63 | 4.789 a | 4.444 | -4.31% | 4.57% | 19/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.82% | 3110.97 | 5.69 a | 5.278 | -5.11% | 5.44% | 19/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.81% | 4283.66 | 6.615 a | 6.136 | -5.89% | 6.38% | 19/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.86% | 2526.53 | 8.417 a | 7.803 | -7.46% | 8.14% | 19/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.72% | 4231.88 | 7.704 a | 7.151 | -6.81% | 7.49% | 19/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.59% | 4244.18 | 9.039 a | 8.402 | -7.91% | 8.9% | 19/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.54% | 1770.71 | 13.651 a | 12.694 | -11.83% | 13.56% | 19/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.59% | 4072.24 | 10.764 a | 10.005 | -9.27% | 10.74% | 19/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.55% | 1255.17 | 18.361 a | 17.072 | -15.54% | 18.61% | 19/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.59% | 4061.81 | 11.738 a | 10.91 | -9.96% | 11.86% | 19/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.56% | 856.64 | 23.579 a | 21.922 | -19.42% | 24.43% | 19/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.58% | 3947.17 | 12.644 a | 11.753 | -10.62% | 12.89% | 19/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.58% | 3977.74 | 12.922 a | 12.011 | -10.74% | 13.28% | 19/11/2026 |

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
