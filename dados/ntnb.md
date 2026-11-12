# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-12T18:59:29.176Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.46% | 3996.08 | 2.476 a | 2.304 | -2.27% | 2.34% | 11/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.55% | 4622.53 | 3.335 a | 3.101 | -3.03% | 3.17% | 11/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.64% | 4504.47 | 4.82 a | 4.478 | -4.35% | 4.61% | 11/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.68% | 3126.96 | 5.718 a | 5.31 | -5.14% | 5.48% | 11/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.67% | 4451.97 | 6.441 a | 5.982 | -5.74% | 6.22% | 11/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.7% | 2552.48 | 8.444 a | 7.841 | -7.5% | 8.18% | 11/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.62% | 4393.77 | 7.494 a | 6.963 | -6.63% | 7.3% | 11/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.49% | 4270.52 | 9.089 a | 8.456 | -7.96% | 8.96% | 11/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.44% | 1789.37 | 13.679 a | 12.731 | -11.86% | 13.6% | 11/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.48% | 4249.36 | 10.476 a | 9.747 | -9.03% | 10.47% | 11/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.44% | 1276.14 | 18.389 a | 17.115 | -15.57% | 18.66% | 11/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.48% | 4101.88 | 11.837 a | 11.013 | -10.05% | 11.97% | 11/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.44% | 877.53 | 23.607 a | 21.972 | -19.46% | 24.49% | 11/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.47% | 4130.96 | 12.329 a | 11.472 | -10.36% | 12.59% | 11/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.49% | 4012.19 | 13.045 a | 12.136 | -10.85% | 13.42% | 11/11/2026 |

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
