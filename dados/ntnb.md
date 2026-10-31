# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-31T09:19:42.960Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.76% | 3955.7 | 2.508 a | 2.327 | -2.29% | 2.37% | 29/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.8% | 4571.94 | 3.364 a | 3.121 | -3.05% | 3.19% | 29/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.82% | 4453.74 | 4.847 a | 4.496 | -4.36% | 4.63% | 29/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.84% | 3090.37 | 5.75 a | 5.332 | -5.17% | 5.5% | 29/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.77% | 4411.05 | 6.465 a | 5.999 | -5.76% | 6.24% | 29/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.78% | 2528.27 | 8.476 a | 7.864 | -7.52% | 8.21% | 29/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.67% | 4364.4 | 7.519 a | 6.984 | -6.65% | 7.32% | 29/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.53% | 4242.58 | 9.112 a | 8.474 | -7.97% | 8.98% | 29/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.45% | 1781.45 | 13.71 a | 12.76 | -11.89% | 13.63% | 29/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.36% | 4286.06 | 10.559 a | 9.835 | -9.11% | 10.56% | 29/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.2% | 1325.61 | 18.421 a | 17.183 | -15.63% | 18.74% | 29/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.31% | 4166.82 | 11.979 a | 11.163 | -10.18% | 12.14% | 29/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.13% | 936.61 | 23.639 a | 22.066 | -19.53% | 24.6% | 29/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.31% | 4194.89 | 12.5 a | 11.648 | -10.51% | 12.79% | 29/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.31% | 4088.76 | 13.269 a | 12.365 | -11.04% | 13.69% | 29/10/2026 |

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
